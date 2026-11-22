@echo off
title Instalar Agente de Impressao na Inicializacao do Windows
chcp 65001 >nul
cd /d "%~dp0"

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_BAT=%~dp0iniciar-agente-impressao.bat"
set "WORK_DIR=%~dp0"

echo Criando atalho na pasta Inicializar do Windows...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $lnk = $ws.CreateShortcut((Join-Path $env:STARTUP_DIR 'PedidoFeito-PrintAgent.lnk')); $lnk.TargetPath = $env:TARGET_BAT; $lnk.WorkingDirectory = $env:WORK_DIR; $lnk.Description = 'Agente de Impressao Pedido Feito 2.0'; $lnk.Save()"

echo.
echo [SUCESSO] O Agente de Impressao foi adicionado a inicializacao do Windows!
echo Ele iniciara automaticamente toda vez que este computador for ligado.
echo.
pause
