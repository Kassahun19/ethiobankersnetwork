@echo off
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
cd /d "c:\Users\kas\Desktop\EthioBankers\ethiobankers-network"
npm run dev
pause
