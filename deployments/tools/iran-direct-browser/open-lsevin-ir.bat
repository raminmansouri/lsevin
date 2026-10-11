@echo off
rem Opens https://lsevin.ir in a separate Chrome window that connects over your Ethernet adapter directly
rem (bypassing v2rayN / sing-box). Close the black window to stop the helper.
cd /d "%~dp0"
start "direct-proxy" /min cmd /c "node proxy.mjs"
timeout /t 2 >nul
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
start "" "%CHROME%" --user-data-dir="%TEMP%\lsevin-direct-profile" --proxy-server="http://127.0.0.1:8899" --no-first-run --new-window https://lsevin.ir
