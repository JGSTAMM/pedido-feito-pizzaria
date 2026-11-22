@echo off
title Iniciar Pedido Feito 2.0 - Rede Local (Celular) e Impressao
chcp 65001 >nul

:: 0. Auto-elevacao para Administrador (essencial para iniciar servicos do Windows como MySQL)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permissao de Administrador para iniciar o banco de dados...
    set "PF_SELF_SCRIPT=%~f0"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath cmd.exe -ArgumentList @('/c', ('\"' + $env:PF_SELF_SCRIPT + '\"')) -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ===================================================================
echo     PEDIDO FEITO 2.0 - INICIALIZANDO SERVIDOR E IMPRESSAO AUTOMATICA
echo ===================================================================
echo.

:: 1. Detectar o IP local da maquina (Ethernet ou Wi-Fi)
set LOCAL_IP=127.0.0.1
for /f "tokens=4" %%a in ('route print ^| findstr "\<0.0.0.0\>" ^| findstr /v "127.0.0.1"') do (
    set LOCAL_IP=%%a
)

:: Fallback se route print nao pegou
if "%LOCAL_IP%"=="127.0.0.1" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
        for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
    )
)

echo [OK] IP da sua maquina na rede local: %LOCAL_IP%
echo.

:: 2. Iniciar e configurar o servico do MySQL
sc query MySQL80 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [INFO] Iniciando servico do Banco de Dados MySQL (MySQL80)...
    sc config MySQL80 start= auto >nul 2>&1
    net start MySQL80
    if %errorlevel% neq 0 (
        echo [ERRO] Nao foi possivel iniciar o MySQL80 automaticamente.
        echo Abra o 'services.msc' e inicie o servico 'MySQL80' manualmente.
    ) else (
        echo [OK] Banco de Dados MySQL iniciado com sucesso!
    )
) else (
    echo [OK] Banco de Dados MySQL ja esta conectado e rodando.
)
echo.

:: 3. Iniciar o Servidor Laravel escutando em toda a rede (0.0.0.0:8000)
if exist "public\hot" del /f /q "public\hot" >nul 2>&1
echo [INFO] Iniciando Servidor Web Laravel (0.0.0.0:8000)...
start "Pedido Feito - Servidor Web (IP %LOCAL_IP%)" cmd /k "php artisan serve --host=0.0.0.0 --port=8000"

:: 3.5. Iniciar Servidor WebSocket Reverb (Tempo real para KDS e Salao)
echo [INFO] Iniciando Servidor WebSocket Reverb (0.0.0.0:8080)...
start "Pedido Feito - WebSocket Reverb" cmd /k "php artisan reverb:start --host=0.0.0.0 --port=8080"

:: 4. Iniciar o Agente de Impressao Automatica
echo [INFO] Iniciando Agente de Impressao Termica...
start "Pedido Feito - Agente de Impressao Termica" cmd /k "node print-agent/agent.mjs"

:: 5. Aguardar 3 segundos para estabilizar
timeout /t 3 >nul

:: 6. Abrir o KDS da Cozinha no Chrome
echo [INFO] Abrindo o KDS no Google Chrome...
call iniciar-kds-impressao-automatica.bat

cls
echo ===================================================================
echo             PEDIDO FEITO 2.0 - SISTEMA ONLINE NA REDE!
echo ===================================================================
echo.
echo  ACESSO NO CELULAR DO GARCOM (Conecte no mesmo Wi-Fi):
echo  -------------------------------------------------------------
echo  URL Garcom:     http://%LOCAL_IP%:8000/waiter
echo  Cardapio/Mesa:  http://%LOCAL_IP%:8000
echo.
echo  ACESSO NO COMPUTADOR (KDS / PDV / CAIXA):
echo  -------------------------------------------------------------
echo  Cozinha (KDS):  http://localhost:8000/kds
echo  PDV Balcao:     http://localhost:8000/pos
echo  Mapa do Salao:  http://localhost:8000/floor
echo.
echo  STATUS DAS IMPRESSORAS:
echo  -------------------------------------------------------------
echo  Agente ESC/POS rodando com envio direto sem janelas do Chrome.
echo.
echo ===================================================================
echo Deixe as janelas abertas enquanto estiver utilizando o sistema.
echo ===================================================================
echo.
pause
