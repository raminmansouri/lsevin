# Run the full platform stack locally with laptop-friendly overrides.
# Run from any PowerShell window — does not depend on a previous session's
# environment variables.

Set-Location (Join-Path $PSScriptRoot "..")

$env:LSEVIN_CONFIG_DIR = "./local-config"
$env:LSEVIN_BACKUP_DIR = "./local-config/backups"
$env:POSTGRES_HOST_PORT = "55432"
$env:PGBOUNCER_HOST_PORT = "56432"
$env:POSTGRES_SHM_SIZE = "256m"

Write-Host "Using LSEVIN_CONFIG_DIR=$env:LSEVIN_CONFIG_DIR"
Write-Host "Using POSTGRES_HOST_PORT=$env:POSTGRES_HOST_PORT  PGBOUNCER_HOST_PORT=$env:PGBOUNCER_HOST_PORT"
Write-Host "App will be reachable at http://localhost:3000  (API at :8080)"
Write-Host ""

docker compose -f docker-compose.server.yml -f docker-compose.local-ports.yml --env-file .env up -d

Write-Host ""
Write-Host "If this is the first run, or the previous one crashed, and you still see"
Write-Host "errors, see local-config\README.md (`"Port already allocated?`" /"
Write-Host "`"database system is in recovery mode`" sections)."
