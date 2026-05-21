@echo off
cd /d "%~dp0"
start /min cmd /k "npm run dev"
timeout /t 3 >nul
start "" "http://localhost:5173"
exit