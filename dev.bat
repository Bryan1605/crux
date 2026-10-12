@echo off
setlocal EnableExtensions
title Crux - Servidor de desarrollo
cd /d "%~dp0"

echo ============================================
echo   Crux - Servidor de desarrollo
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Node.js.
  echo         Instala Node 20 o superior desde https://nodejs.org
  echo         y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencias no encontradas. Ejecutando "npm install"...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] "npm install" fallo. Revisa el mensaje de arriba.
    pause
    exit /b 1
  )
  echo.
)

REM Pasa "noopen" como argumento para no abrir el navegador:
REM   dev.bat noopen
if /i not "%~1"=="noopen" (
  echo Abriendo el panel de edicion en el navegador...
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5173/admin'"
)

echo.
echo   Web:   http://localhost:5173/
echo   Panel: http://localhost:5173/admin   (solo disponible en desarrollo)
echo.
echo   Pulsa Ctrl+C para detener el servidor.
echo.

call npm run dev

echo.
echo El servidor se ha detenido.
pause
