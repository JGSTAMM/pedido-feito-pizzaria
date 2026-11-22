<?php

namespace App\Application\Printing;

use App\Models\Printer;
use App\Models\PrinterSetting;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

class PrintAgentPackageBuilder
{
    private const AGENT_CONFIG_KEY = 'print_agent_config';

    private const PACKAGE_DIR = 'PedidoFeito-Agente-Impressao';

    public function __construct(
        private readonly PrintQueueService $printQueueService,
    ) {}

    /**
     * Load persisted agent printer/connection config with smart defaults from registered printers.
     *
     * @return array<string, mixed>
     */
    public function getConfig(): array
    {
        $printers = Printer::orderBy('name')->get();
        $kitchenDefault = $printers->firstWhere('target', 'kitchen')?->name ?: 'POS-58';
        $cashierDefault = $printers->firstWhere('target', 'cash_register')?->name ?: $kitchenDefault;

        $defaults = [
            'mode' => 'auto',
            'kitchen_printer' => $kitchenDefault,
            'kitchen_paper_width' => '58mm',
            'cashier_printer' => $cashierDefault,
            'cashier_paper_width' => '58mm',
            'default_printer' => $kitchenDefault,
            'fallback_printer' => $cashierDefault,
            'tcp_ip' => '',
            'tcp_port' => 9100,
            'poll_interval_ms' => 1500,
        ];

        $savedRaw = PrinterSetting::where('key', self::AGENT_CONFIG_KEY)->value('value');
        if (! $savedRaw) {
            return $defaults;
        }

        $decoded = json_decode((string) $savedRaw, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        return array_merge($defaults, $decoded);
    }

    /**
     * Persist validated agent printer/connection config.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function saveConfig(array $input): array
    {
        $current = $this->getConfig();
        $merged = array_merge($current, [
            'mode' => in_array($input['mode'] ?? 'auto', ['auto', 'tcp'], true) ? $input['mode'] : 'auto',
            'kitchen_printer' => trim((string) ($input['kitchen_printer'] ?? $current['kitchen_printer'])) ?: 'POS-58',
            'kitchen_paper_width' => ($input['kitchen_paper_width'] ?? '58mm') === '80mm' ? '80mm' : '58mm',
            'cashier_printer' => trim((string) ($input['cashier_printer'] ?? $current['cashier_printer'])) ?: 'POS-58',
            'cashier_paper_width' => ($input['cashier_paper_width'] ?? '58mm') === '80mm' ? '80mm' : '58mm',
            'default_printer' => trim((string) ($input['default_printer'] ?? $current['default_printer'])) ?: 'POS-58',
            'fallback_printer' => trim((string) ($input['fallback_printer'] ?? $current['fallback_printer'])),
            'tcp_ip' => trim((string) ($input['tcp_ip'] ?? '')),
            'tcp_port' => max(1, min(65535, (int) ($input['tcp_port'] ?? 9100))),
            'poll_interval_ms' => max(500, min(10000, (int) ($input['poll_interval_ms'] ?? 1500))),
        ]);

        PrinterSetting::updateOrCreate(
            ['key' => self::AGENT_CONFIG_KEY],
            ['value' => json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]
        );

        return $merged;
    }

    /**
     * Build the exact config.json payload expected by print-agent/agent.mjs.
     *
     * @return array<string, mixed>
     */
    public function buildClientConfigPayload(string $serverUrl): array
    {
        $config = $this->getConfig();

        return [
            'server_url' => rtrim($serverUrl, '/'),
            'token' => $this->printQueueService->getOrCreateAgentToken(),
            'poll_interval_ms' => (int) $config['poll_interval_ms'],
            'mode' => (string) $config['mode'],
            'default_printer' => (string) $config['default_printer'],
            'kitchen_printer' => (string) $config['kitchen_printer'],
            'kitchen_paper_width' => (string) $config['kitchen_paper_width'],
            'cashier_printer' => (string) $config['cashier_printer'],
            'cashier_paper_width' => (string) $config['cashier_paper_width'],
            'fallback_printer' => (string) $config['fallback_printer'],
            'tcp_ip' => (string) $config['tcp_ip'],
            'tcp_port' => (int) $config['tcp_port'],
        ];
    }

    /**
     * Build a ready-to-run cross-platform (Windows & Linux) ZIP package containing the pre-configured print agent.
     */
    public function createZipArchive(string $serverUrl): string
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('Extensão PHP zip (ZipArchive) não disponível no servidor.');
        }

        $privateDir = storage_path('app/private/print-agent-packages');
        if (! File::isDirectory($privateDir)) {
            File::makeDirectory($privateDir, 0700, true);
        }

        $zipPath = $privateDir.'/pf_agent_'.Str::uuid()->toString().'.zip';

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::EXCL) !== true) {
            throw new RuntimeException('Falha ao criar arquivo ZIP do agente de impressão.');
        }
        @chmod($zipPath, 0600);

        try {
            $prefix = self::PACKAGE_DIR.'/';

            foreach (['agent.mjs', 'escpos-formatter.mjs', 'raw-printer.ps1'] as $runtimeFile) {
                $fullPath = base_path("print-agent/{$runtimeFile}");
                if (! File::exists($fullPath)) {
                    throw new RuntimeException("Arquivo essencial ausente: print-agent/{$runtimeFile}");
                }
                $zip->addFile($fullPath, $prefix.$runtimeFile);
            }

            $configJson = json_encode(
                $this->buildClientConfigPayload($serverUrl),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            )."\n";
            $zip->addFromString($prefix.'config.json', $configJson);

            // Windows scripts (CRLF)
            $zip->addFromString($prefix.'iniciar-agente-impressao.bat', $this->toCrlf($this->windowsStartScript()));
            $zip->addFromString($prefix.'instalar-inicializacao-windows.bat', $this->toCrlf(File::get(base_path('instalar-inicializacao-windows.bat'))));
            $zip->addFromString($prefix.'listar-impressoras-windows.bat', $this->toCrlf($this->windowsListPrintersScript()));

            // Linux scripts (LF + executable POSIX 0755 permissions)
            $linuxFiles = [
                'iniciar-agente-impressao.sh' => $this->linuxStartScript(),
                'instalar-inicializacao-linux.sh' => $this->linuxInstallStartupScript(),
                'listar-impressoras-linux.sh' => $this->linuxListPrintersScript(),
            ];

            foreach ($linuxFiles as $filename => $content) {
                $entryName = $prefix.$filename;
                $zip->addFromString($entryName, $this->toLf($content));
                $zip->setExternalAttributesName($entryName, ZipArchive::OPSYS_UNIX, (0100755 << 16));
            }

            $zip->addFromString($prefix.'LEIA-ME.txt', $this->toLf($this->readmeContent($serverUrl)));
        } finally {
            $zip->close();
        }

        return $zipPath;
    }

    private function toCrlf(string $content): string
    {
        return str_replace("\n", "\r\n", str_replace("\r\n", "\n", $content));
    }

    private function toLf(string $content): string
    {
        return str_replace("\r\n", "\n", $content);
    }

    private function windowsStartScript(): string
    {
        if (File::exists(base_path('iniciar-agente-impressao.bat'))) {
            return File::get(base_path('iniciar-agente-impressao.bat'));
        }

        return <<<'BAT'
@echo off
title Pedido Feito 2.0 - Agente de Impressao Automatica
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org/
    pause
    exit /b 1
)
:loop
node "%~dp0agent.mjs"
timeout /t 5 >nul
goto loop
BAT;
    }

    private function windowsListPrintersScript(): string
    {
        return <<<'BAT'
@echo off
title Listar Impressoras do Windows - Pedido Feito 2.0
chcp 65001 >nul
echo ===================================================================
echo   IMPRESSORAS INSTALADAS NESTE WINDOWS (COPIE O NOME EXATO)
echo ===================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Printer | Select-Object Name, DriverName, PortName | Format-Table -AutoSize"
echo.
echo Use exatamente o nome da coluna "Name" nas Configuracoes -> Impressoras do sistema.
pause
BAT;
    }

    private function linuxStartScript(): string
    {
        return <<<'SH'
#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "  PEDIDO FEITO 2.0 - AGENTE DE IMPRESSAO AUTOMATICA (LINUX/NUVEM)  "
echo "==================================================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[ERRO] Node.js nao encontrado neste sistema Linux."
    echo "Instale o Node.js LTS (ex.: Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs)"
    exit 1
fi

STOP_AGENT=0
trap 'STOP_AGENT=1; exit 0' INT TERM

while [ "$STOP_AGENT" -eq 0 ]; do
    node "$SCRIPT_DIR/agent.mjs"
    echo ""
    echo "[AVISO] O agente encerrou. Reiniciando em 5 segundos... (Ctrl+C para sair)"
    sleep 5
done
SH;
    }

    private function linuxListPrintersScript(): string
    {
        return <<<'SH'
#!/usr/bin/env bash
set -u

echo "==================================================================="
echo "  IMPRESSORAS DETECTADAS NO LINUX (CUPS / USB RAW)                 "
echo "==================================================================="
echo ""

if command -v lpstat >/dev/null 2>&1; then
    echo "--- Filas CUPS (lpstat -a) ---"
    lpstat -a || true
    echo ""
else
    echo "[INFO] Comando 'lpstat' (CUPS) nao instalado."
    echo ""
fi

echo "--- Portas USB Diretas (/dev/usb/lp*) ---"
ls -la /dev/usb/lp* 2>/dev/null || echo "Nenhuma porta /dev/usb/lp* detectada."
echo ""
echo "Dica: se usar /dev/usb/lp0, adicione o usuario ao grupo 'lp': sudo usermod -aG lp \$USER"
SH;
    }

    private function linuxInstallStartupScript(): string
    {
        return <<<'SH'
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "$SCRIPT_DIR" in
    *\"*|*\'*|*$'\n'*|*$'\r'*|*";"*)
        echo "[ERRO] O caminho da pasta ($SCRIPT_DIR) contem caracteres especiais nao permitidos. Extraia em um caminho simples como ~/PedidoFeito-Impressora."
        exit 1
        ;;
esac

START_SCRIPT="$SCRIPT_DIR/iniciar-agente-impressao.sh"
chmod +x "$START_SCRIPT" "$SCRIPT_DIR/listar-impressoras-linux.sh"

NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
    echo "[ERRO] Node.js nao encontrado. Instale o Node.js LTS antes de registrar a inicializacao automatica."
    exit 1
fi

if command -v systemctl >/dev/null 2>&1 && systemctl --user status >/dev/null 2>&1; then
    UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
    mkdir -p "$UNIT_DIR"
    cat > "$UNIT_DIR/pedidofeito-print-agent.service" <<EOF
[Unit]
Description=Pedido Feito 2.0 - Agente de Impressao Automatica
After=network-online.target

[Service]
Type=simple
WorkingDirectory="$SCRIPT_DIR"
ExecStart="$NODE_BIN" "$SCRIPT_DIR/agent.mjs"
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload
    systemctl --user enable --now pedidofeito-print-agent.service
    echo "[SUCESSO] Servico systemd do usuario instalado e iniciado (pedidofeito-print-agent.service)."
    echo "Ver logs: journalctl --user -u pedidofeito-print-agent.service -f"
    exit 0
fi

AUTOSTART_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/autostart"
mkdir -p "$AUTOSTART_DIR"
cat > "$AUTOSTART_DIR/pedidofeito-print-agent.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Pedido Feito Print Agent
Exec="$START_SCRIPT"
Path=$SCRIPT_DIR
Terminal=true
X-GNOME-Autostart-enabled=true
EOF

echo "[SUCESSO] Atalho de inicializacao criado em $AUTOSTART_DIR/pedidofeito-print-agent.desktop"
SH;
    }

    private function readmeContent(string $serverUrl): string
    {
        return <<<TXT
========================================================================
PEDIDO FEITO 2.0 - AGENTE DE IMPRESSAO AUTOMATICA (WINDOWS & LINUX)
========================================================================
Servidor conectado: {$serverUrl}

Este pacote ja vem com o arquivo config.json pre-configurado com a URL
da sua VPS e o token de autenticacao da pizzaria.

PRE-REQUISITO:
- Ter o Node.js LTS instalado no computador onde a impressora esta ligada.
  * Windows: https://nodejs.org/ ou "winget install OpenJS.NodeJS.LTS"
  * Linux (Ubuntu/Debian): sudo apt update && sudo apt install -y nodejs

COMO USAR NO WINDOWS:
1. Extraia toda esta pasta (ex.: C:\\PedidoFeito-Impressora\\).
2. (Opcional) Execute "listar-impressoras-windows.bat" para confirmar o
   nome exato da sua impressora termica no Windows.
3. De dois cliques em "iniciar-agente-impressao.bat".
4. Para iniciar automaticamente ao ligar o Windows, execute uma vez:
   "instalar-inicializacao-windows.bat".

COMO USAR NO LINUX:
1. Extraia esta pasta (ex.: ~/PedidoFeito-Impressora/).
2. No terminal dentro da pasta, confira suas impressoras:
   ./listar-impressoras-linux.sh
   (Se usar impressora USB via CUPS em modo RAW, adicione como "Raw Queue"
   no CUPS ou use diretamente /dev/usb/lp0 com permissao no grupo "lp").
3. Para iniciar o agente:
   ./iniciar-agente-impressao.sh
4. Para iniciar automaticamente no login/boot:
   ./instalar-inicializacao-linux.sh

IMPRESSORAS EM REDE (TCP/IP PORTA 9100):
- Funciona igualmente no Windows e Linux selecionando o modo "TCP" e o
  IP da impressora em Configuracoes -> Impressoras no sistema.
TXT;
    }
}
