@echo off
title Iniciar KDS Lucchese - Impressao Automatica
chcp 65001 >nul
cls
echo ===================================================================
echo     PEDIDO FEITO 2.0 - KDS COM IMPRESSAO AUTOMATICA (KIOSK PRINTING)
echo ===================================================================
echo.
echo [INFO] As comandas e contas serao impressas DIRETAMENTE na impressora termica,
echo        sem abrir popups ou telas de confirmacao do navegador.
echo.

:: Localiza o executavel do Google Chrome
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not exist %CHROME_PATH% (
    echo [ERRO] Google Chrome nao foi encontrado nos caminhos padroes.
    echo Instale o Google Chrome ou configure o caminho manualmente neste arquivo.
    pause
    exit /b 1
)

:: Perfil isolado do Chrome (evita que o Chrome normal anule o parametro kiosk-printing)
set PROFILE_DIR="%LOCALAPPDATA%\PedidoFeito-KDS-Profile"

:: URL do KDS (Altere para seu dominio no servidor/VPS quando subir para producao)
set KDS_URL=http://localhost:8000/kds

echo [OK] Abrindo KDS no Chrome com Kiosk Printing isolado...
echo URL: %KDS_URL%
echo.

start "" %CHROME_PATH% --user-data-dir=%PROFILE_DIR% --kiosk-printing --disable-print-preview --app=%KDS_URL%
exit
