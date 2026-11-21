@echo off
title Instalar Agente de Impressao na Inicializacao do Windows
chcp 65001 >nul
cd /d "%~dp0"

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_VBS=%TEMP%\CreateShortcut.vbs

echo Criando atalho na pasta Inicializar do Windows...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_VBS%"
echo sLinkFile = "%STARTUP_DIR%\PedidoFeito-PrintAgent.lnk" >> "%SHORTCUT_VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_VBS%"
echo oLink.TargetPath = "%~dp0iniciar-agente-impressao.bat" >> "%SHORTCUT_VBS%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SHORTCUT_VBS%"
echo oLink.Description = "Agente de Impressao Pedido Feito 2.0" >> "%SHORTCUT_VBS%"
echo oLink.Save >> "%SHORTCUT_VBS%"

cscript /nologo "%SHORTCUT_VBS%"
del "%SHORTCUT_VBS%"

echo.
echo [SUCESSO] O Agente de Impressao foi adicionado a inicializacao do Windows!
echo Ele iniciara automaticamente toda vez que este computador for ligado.
echo.
pause
