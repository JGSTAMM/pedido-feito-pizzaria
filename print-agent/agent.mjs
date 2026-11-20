/**
 * Pedido Feito 2.0 - Local Print Agent Daemon
 * Communicates with Laravel backend (localhost or Cloud VPS)
 * Dispatches RAW ESC/POS jobs directly to Windows Thermal Printers
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import net from 'node:net';
import { formatKitchenTicket, formatBillTicket, formatTestTicket } from './escpos-formatter.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'agent.log');
const TEMP_BIN_PATH = path.join(__dirname, 'temp_ticket.bin');
const PS_SCRIPT_PATH = path.join(__dirname, 'raw-printer.ps1');

function log(msg, type = 'INFO') {
    const time = new Date().toLocaleTimeString('pt-BR');
    const line = `[${time}] [${type}] ${msg}`;
    console.log(line);
    try {
        fs.appendFileSync(LOG_PATH, line + '\n');
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
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (err) {
        log(`Erro ao ler config.json: ${err.message}`, 'ERROR');
        process.exit(1);
    }
}

// Discover Windows installed printers using powershell
async function getWindowsPrinters() {
    try {
        const { stdout } = await execFileAsync('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command', 'Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name'
        ]);
        return stdout.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
    } catch (err) {
        log(`Aviso: Não foi possível listar impressoras via WMI: ${err.message}`, 'WARN');
        return [];
    }
}

// Send buffer to Windows Spooler via raw-printer.ps1
async function printViaWindowsSpooler(printerName, buffer) {
    fs.writeFileSync(TEMP_BIN_PATH, buffer);

    try {
        const { stdout, stderr } = await execFileAsync('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', PS_SCRIPT_PATH,
            '-PrinterName', printerName,
            '-InputFile', TEMP_BIN_PATH,
        ]);

        if (stderr && stderr.trim()) {
            throw new Error(stderr.trim());
        }
        return true;
    } finally {
        try {
            if (fs.existsSync(TEMP_BIN_PATH)) fs.unlinkSync(TEMP_BIN_PATH);
        } catch {
            // Ignore
        }
    }
}

// Send buffer via Direct TCP Socket (port 9100)
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

    // Format binary buffer
    let buffer;
    if (job.type === 'kitchen') {
        buffer = formatKitchenTicket(job.payload, paperWidth);
    } else if (job.type === 'bill') {
        buffer = formatBillTicket(job.payload, paperWidth);
    } else {
        buffer = formatTestTicket(job.payload, paperWidth);
    }

    // Determine target printer
    let primaryPrinter = isKitchen ? config.kitchen_printer : config.cashier_printer;
    if (!primaryPrinter) {
        primaryPrinter = config.default_printer || (installedPrinters[0] || 'POS-58');
    }

    const fallbackPrinter = config.fallback_printer;
    const mode = config.mode || 'windows'; // 'windows' or 'tcp'

    let success = false;
    let usedPrinter = primaryPrinter;
    let lastError = null;

    try {
        if (mode === 'tcp' && config.tcp_ip) {
            log(`Imprimindo Job #${job.id} via TCP (${config.tcp_ip}:${config.tcp_port || 9100})...`);
            await printViaTcp(config.tcp_ip, config.tcp_port || 9100, buffer);
        } else {
            log(`Imprimindo Job #${job.id} (${job.type}) em [${primaryPrinter}] (${paperWidth})...`);
            await printViaWindowsSpooler(primaryPrinter, buffer);
        }
        success = true;
    } catch (err) {
        lastError = err.message;
        log(`Falha na impressora principal [${primaryPrinter}]: ${err.message}`, 'WARN');

        // Fallback attempt
        if (fallbackPrinter && fallbackPrinter !== primaryPrinter) {
            try {
                log(`Tentando impressora de contingência [${fallbackPrinter}]...`, 'INFO');
                await printViaWindowsSpooler(fallbackPrinter, buffer);
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
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const body = JSON.stringify({
        version: '2.0.0',
        printers: installedPrinters,
        active_printer: config.kitchen_printer || config.default_printer || 'POS-58',
    });

    const response = await fetch(pollUrl, {
        method: 'POST',
        headers,
        body,
    }).catch(err => {
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

        // Send ACK
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
    console.log('====================================================');
    console.log('   PEDIDO FEITO 2.0 - AGENTE DE IMPRESSÃO LOCAL     ');
    console.log('====================================================');

    const config = loadConfig();
    log(`Servidor configurado: ${config.server_url}`);
    log(`Modo de envio: ${config.mode || 'windows'}`);

    const installedPrinters = await getWindowsPrinters();
    log(`Impressoras Windows detectadas: ${installedPrinters.join(', ') || 'Nenhuma detectada'}`);

    log('Agente de Impressão iniciado. Aguardando novos pedidos na fila...');

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

main().catch(err => {
    log(`Erro fatal no agente: ${err.message}`, 'FATAL');
    process.exit(1);
});
