@echo off
title Pedido Feito 2.0 - Agente de Impressao Automatica
chcp 65001 >nul
cd /d "%~dp0"

echo ===================================================================
echo     PEDIDO FEITO 2.0 - AGENTE DE IMPRESSAO AUTOMATICA (NUVEM)
echo ===================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado neste computador Windows.
    echo.
    echo Instale o Node.js LTS usando um dos metodos abaixo:
    echo   1. Baixe em: https://nodejs.org/
    echo   2. Ou execute no PowerShell/CMD: winget install -e --id OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)

set "AGENT_SCRIPT=%~dp0agent.mjs"
if not exist "%AGENT_SCRIPT%" set "AGENT_SCRIPT=%~dp0print-agent\agent.mjs"

if not exist "%AGENT_SCRIPT%" (
    echo [ERRO] Arquivo agent.mjs nao encontrado nesta pasta.
    pause
    exit /b 1
)

echo [INFO] As comandas e contas serao impressas DIRETAMENTE na impressora termica,
echo        sem abrir nenhuma janela no navegador.
echo.

:loop
node "%AGENT_SCRIPT%"
echo.
echo [AVISO] O agente encerrou ou reiniciou. Reiniciando em 5 segundos... (Pressione Ctrl+C para parar)
timeout /t 5 >nul
goto loop
