/**
 * Pedido Feito 2.0 - Cross-Platform Local Print Agent Daemon (Windows & Linux)
 * Communicates with Laravel backend (localhost or Cloud VPS)
 * Dispatches RAW ESC/POS jobs directly to Windows Spooler, Linux CUPS/USB, or Network TCP (9100)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import net from 'node:net';
import { formatKitchenTicket, formatBillTicket, formatTestTicket } from './escpos-formatter.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'agent.log');
const PS_SCRIPT_PATH = path.join(__dirname, 'raw-printer.ps1');
const MAX_LOG_BYTES = 1_048_576; // 1 MB
const PRINTER_REFRESH_INTERVAL_MS = 30_000;
const ALLOWED_LINUX_DEV_PRINTER_RE = /^\/dev\/(usb\/lp\d+|lp\d+|ttyUSB\d+|ttyACM\d+|rfcomm\d+)$/;
const SAFE_PRINTER_QUEUE_NAME_RE = /^[A-Za-z0-9_.\- ()/]+$/;

function createTempBinPath() {
    return path.join(__dirname, `.temp_ticket_${process.pid}_${crypto.randomUUID()}.bin`);
}

function validateSafeQueuePrinterName(printerName) {
    const clean = String(printerName || '').trim();
    if (!clean || clean.length > 128) {
        throw new Error('Nome de impressora inválido ou vazio.');
    }
    if (clean.startsWith('\\\\') || clean.startsWith('//') || clean.startsWith('-') || clean.includes('..') || /[\r\n\0]/.test(clean)) {
        throw new Error(`Nome de impressora bloqueado por política de segurança: ${clean}`);
    }
    if (!SAFE_PRINTER_QUEUE_NAME_RE.test(clean)) {
        throw new Error(`Caracteres não permitidos no nome da impressora: ${clean}`);
    }
    return clean;
}

function rotateLogIfNeeded() {
    try {
        if (fs.existsSync(LOG_PATH) && fs.statSync(LOG_PATH).size >= MAX_LOG_BYTES) {
            const backupPath = `${LOG_PATH}.old`;
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            fs.renameSync(LOG_PATH, backupPath);
        }
    } catch {
        // Ignore rotation errors
    }
}

function log(msg, type = 'INFO') {
    const time = new Date().toLocaleTimeString('pt-BR');
    const line = `[${time}] [${type}] ${msg}`;
    console.log(line);
    try {
        rotateLogIfNeeded();
        fs.appendFileSync(LOG_PATH, `${line}\n`);
    } catch {
        // Ignore log file write errors
    }
}

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        log(`Arquivo de configuração não encontrado: ${CONFIG_PATH}`, 'ERROR');
        process.exit(1);
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        if (!parsed.server_url || String(parsed.server_url).includes('suapizzaria.com.br')) {
            log('AVISO: Configure server_url com a URL real da sua VPS em config.json.', 'WARN');
        }
        if (!parsed.token || String(parsed.token).includes('COLE_O_TOKEN')) {
            log('AVISO: Token padrão detectado em config.json. Baixe o config.json nas Configurações do painel.', 'WARN');
        }
        return parsed;
    } catch (err) {
        log(`Erro ao ler config.json: ${err.message}`, 'ERROR');
        process.exit(1);
    }
}

async function discoverWindowsPrinters() {
    try {
        const { stdout } = await execFileAsync('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command', 'Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name',
        ]);
        return stdout.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
    } catch (err) {
        log(`Aviso: Não foi possível listar impressoras no Windows: ${err.message}`, 'WARN');
        return [];
    }
}

async function discoverLinuxPrinters() {
    const printers = new Set();

    try {
        const { stdout } = await execFileAsync('lpstat', ['-a']);
        for (const rawLine of stdout.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line) continue;
            const queueName = line.split(/\s+/)[0];
            if (queueName) {
                printers.add(queueName);
            }
        }
    } catch {
        // CUPS may not be installed when using /dev/usb/lp* or TCP mode
    }

    try {
        const usbDir = '/dev/usb';
        if (fs.existsSync(usbDir)) {
            for (const entry of fs.readdirSync(usbDir)) {
                if (/^lp\d+$/.test(entry)) {
                    printers.add(`/dev/usb/${entry}`);
                }
            }
        }
    } catch {
        // Ignore device scan failure
    }

    return Array.from(printers);
}

async function discoverSystemPrinters() {
    if (process.platform === 'win32') {
        return discoverWindowsPrinters();
    }

    if (process.platform === 'linux') {
        return discoverLinuxPrinters();
    }

    return [];
}

async function printViaWindowsSpooler(printerName, buffer) {
    const safePrinter = validateSafeQueuePrinterName(printerName);
    const tempBinPath = createTempBinPath();
    fs.writeFileSync(tempBinPath, buffer, { mode: 0o600 });

    try {
        const { stderr } = await execFileAsync('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', PS_SCRIPT_PATH,
            '-PrinterName', safePrinter,
            '-InputFile', tempBinPath,
        ]);

        if (stderr && stderr.trim()) {
            throw new Error(stderr.trim());
        }
        return true;
    } finally {
        try {
            if (fs.existsSync(tempBinPath)) fs.unlinkSync(tempBinPath);
        } catch {
            // Ignore cleanup failure
        }
    }
}

async function printViaLinuxRaw(printerName, buffer) {
    const rawName = String(printerName || '').trim();
    if (rawName.startsWith('/dev/')) {
        const resolvedDev = path.posix.resolve(rawName);
        if (resolvedDev !== rawName || !ALLOWED_LINUX_DEV_PRINTER_RE.test(resolvedDev)) {
            throw new Error(`Dispositivo /dev/ não permitido para impressão direta: ${rawName}`);
        }
        const stat = fs.statSync(resolvedDev);
        if (!stat.isCharacterDevice()) {
            throw new Error(`Caminho ${resolvedDev} não é um dispositivo de caractere válido.`);
        }
        fs.writeFileSync(resolvedDev, buffer);
        return true;
    }

    const safeQueue = validateSafeQueuePrinterName(rawName);
    const tempBinPath = createTempBinPath();
    fs.writeFileSync(tempBinPath, buffer, { mode: 0o600 });

    try {
        try {
            await execFileAsync('lp', ['-d', safeQueue, '-o', 'raw', tempBinPath]);
            return true;
        } catch (lpErr) {
            if (lpErr?.code !== 'ENOENT') {
                throw lpErr;
            }
            await execFileAsync('lpr', ['-P', safeQueue, '-l', tempBinPath]);
            return true;
        }
    } finally {
        try {
            if (fs.existsSync(tempBinPath)) fs.unlinkSync(tempBinPath);
        } catch {
            // Ignore cleanup failure
        }
    }
}

async function printViaSystemQueue(printerName, buffer) {
    if (process.platform === 'win32') {
        return printViaWindowsSpooler(printerName, buffer);
    }

    if (process.platform === 'linux') {
        return printViaLinuxRaw(printerName, buffer);
    }

    throw new Error(`Sistema operacional não suportado para impressão local direta: ${process.platform}`);
}

function printViaTcp(ip, port, buffer) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.setTimeout(4000);

        client.connect(port || 9100, ip, () => {
            client.write(buffer, () => {
                client.end();
                resolve(true);
            });
        });

        client.on('error', (err) => {
            client.destroy();
            reject(err);
        });

        client.on('timeout', () => {
            client.destroy();
            reject(new Error(`Timeout ao conectar na impressora de rede ${ip}:${port || 9100}`));
        });
    });
}

async function dispatchPrint(job, config, installedPrinters) {
    const isKitchen = job.target === 'kitchen';
    const paperWidth = (isKitchen ? config.kitchen_paper_width : config.cashier_paper_width) || config.paper_width || '58mm';

    let buffer;
    if (job.type === 'kitchen') {
        buffer = formatKitchenTicket(job.payload, paperWidth);
    } else if (job.type === 'bill') {
        buffer = formatBillTicket(job.payload, paperWidth);
    } else {
        buffer = formatTestTicket(job.payload, paperWidth);
    }

    let primaryPrinter = isKitchen ? config.kitchen_printer : config.cashier_printer;
    if (!primaryPrinter) {
        primaryPrinter = config.default_printer || installedPrinters[0] || 'POS-58';
    }

    const fallbackPrinter = config.fallback_printer;
    const mode = String(config.mode || 'auto').toLowerCase();

    let success = false;
    let usedPrinter = primaryPrinter;
    let lastError = null;

    try {
        if (mode === 'tcp' && config.tcp_ip) {
            usedPrinter = `${config.tcp_ip}:${config.tcp_port || 9100}`;
            log(`Imprimindo Job #${job.id} via TCP (${usedPrinter})...`);
            await printViaTcp(config.tcp_ip, config.tcp_port || 9100, buffer);
        } else {
            log(`Imprimindo Job #${job.id} (${job.type}) em [${primaryPrinter}] (${paperWidth}, ${process.platform})...`);
            await printViaSystemQueue(primaryPrinter, buffer);
        }
        success = true;
    } catch (err) {
        lastError = err.message;
        log(`Falha na impressora principal [${usedPrinter}]: ${err.message}`, 'WARN');

        if (fallbackPrinter && fallbackPrinter !== primaryPrinter) {
            try {
                log(`Tentando impressora de contingência [${fallbackPrinter}]...`, 'INFO');
                await printViaSystemQueue(fallbackPrinter, buffer);
                success = true;
                usedPrinter = fallbackPrinter;
                lastError = null;
            } catch (fallbackErr) {
                lastError = `Principal: ${err.message} | Contingência: ${fallbackErr.message}`;
                log(`Falha também na contingência [${fallbackPrinter}]: ${fallbackErr.message}`, 'ERROR');
            }
        }
    }

    return { success, printer_name: usedPrinter, error: lastError };
}

async function pollOnce(config, installedPrinters) {
    const serverUrl = config.server_url.replace(/\/$/, '');
    const pollUrl = `${serverUrl}/api/print-agent/poll`;

    const headers = {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    const body = JSON.stringify({
        version: '2.1.0',
        platform: process.platform,
        printers: installedPrinters,
        active_printer: config.kitchen_printer || config.default_printer || installedPrinters[0] || 'POS-58',
    });

    const response = await fetch(pollUrl, {
        method: 'POST',
        headers,
        body,
    }).catch((err) => {
        throw new Error(`Falha de conexão com servidor (${pollUrl}): ${err.message}`);
    });

    if (response.status === 401) {
        log('ERRO DE AUTENTICAÇÃO: Token do Agente inválido ou rejeitado pelo servidor.', 'ERROR');
        return;
    }

    if (!response.ok) {
        log(`Servidor retornou status HTTP ${response.status}`, 'WARN');
        return;
    }

    const data = await response.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];

    for (const job of jobs) {
        log(`Processando Job #${job.id} [${job.type}]...`);
        const result = await dispatchPrint(job, config, installedPrinters);

        const ackUrl = `${serverUrl}/api/print-agent/jobs/${job.id}/ack`;
        try {
            await fetch(ackUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    success: result.success,
                    printer_name: result.printer_name,
                    error: result.error,
                }),
            });
            log(`Job #${job.id} finalizado: ${result.success ? 'IMPRESSO COM SUCESSO' : 'FALHOU'}`);
        } catch (ackErr) {
            log(`Erro ao enviar ACK do job #${job.id}: ${ackErr.message}`, 'ERROR');
        }
    }
}

async function main() {
    console.log('==========================================================');
    console.log('  PEDIDO FEITO 2.0 - AGENTE DE IMPRESSÃO (WINDOWS/LINUX)  ');
    console.log('==========================================================');

    const config = loadConfig();
    log(`Sistema operacional: ${process.platform}`);
    log(`Servidor configurado: ${config.server_url}`);
    log(`Modo de envio: ${config.mode || 'auto'}`);

    let installedPrinters = await discoverSystemPrinters();
    log(`Impressoras detectadas: ${installedPrinters.join(', ') || 'Nenhuma detectada'}`);
    log('Agente de Impressão iniciado. Aguardando novos pedidos na fila...');

    setInterval(async () => {
        installedPrinters = await discoverSystemPrinters();
    }, PRINTER_REFRESH_INTERVAL_MS);

    let isPolling = false;
    const intervalMs = config.poll_interval_ms || 1500;

    setInterval(async () => {
        if (isPolling) return;
        isPolling = true;
        try {
            await pollOnce(config, installedPrinters);
        } catch (err) {
            log(err.message, 'ERROR');
        } finally {
            isPolling = false;
        }
    }, intervalMs);
}

main().catch((err) => {
    log(`Erro fatal no agente: ${err.message}`, 'FATAL');
    process.exit(1);
});
