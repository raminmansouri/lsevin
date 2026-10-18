# install-watchdog.ps1 - registers a Windows scheduled task that runs watchdog.ps1 every 5 minutes (while you are logged on).
# Run once:  powershell -ExecutionPolicy Bypass -File install-watchdog.ps1      Remove:  schtasks /Delete /TN LSevinWatchdog /F
$kit = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$kit\watchdog.ps1`""
schtasks /Create /TN "LSevinWatchdog" /TR $cmd /SC MINUTE /MO 5 /F | Out-Host
schtasks /Query /TN "LSevinWatchdog" | Out-Host
