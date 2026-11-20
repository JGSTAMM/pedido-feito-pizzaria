@echo off
title Pedido Feito 2.0 - Agente de Impressao Automatica
chcp 65001 >nul
cd /d "%~dp0"

echo ===================================================================
echo     PEDIDO FEITO 2.0 - AGENTE DE IMPRESSAO AUTOMATICA (LOCAL/NUVEM)
echo ===================================================================
echo.
echo [INFO] As comandas e contas serao impressas DIRETAMENTE na impressora termica,
echo        sem abrir nenhuma janela no navegador.
echo.

:loop
node print-agent/agent.mjs
echo.
echo [AVISO] O agente encerrou ou reiniciou. Reiniciando em 5 segundos... (Pressione Ctrl+C para parar)
timeout /t 5 >nul
goto loop
