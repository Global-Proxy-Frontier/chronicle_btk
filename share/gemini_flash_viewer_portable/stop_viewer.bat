@echo off
setlocal
set "PORT=4080"

echo Port %PORT% dinleyen process aranıyor...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
  echo PID %%p kapatiliyor...
  taskkill /PID %%p /F >nul 2>nul
)

echo Tamamlandi.
pause
endlocal
