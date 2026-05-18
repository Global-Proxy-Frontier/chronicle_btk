@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Lutfen Node.js kurup tekrar deneyin.
  echo Indirme: https://nodejs.org/
  pause
  exit /b 1
)

set "DATASET_VIEWER_PORT=4080"
echo Viewer baslatiliyor... http://localhost:%DATASET_VIEWER_PORT%
echo Kapatmak icin bu pencereye donup Ctrl+C yapabilirsiniz.
start "" "http://localhost:%DATASET_VIEWER_PORT%"
node viewer_app.js

endlocal
