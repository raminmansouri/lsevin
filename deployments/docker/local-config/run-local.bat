@echo off
REM Run the full platform stack locally with laptop-friendly overrides.
REM Double-click this, or run it from any cmd.exe/PowerShell window —
REM it does not depend on env vars set in a previous session.

cd /d "%~dp0.."

set LSEVIN_CONFIG_DIR=./local-config
set LSEVIN_BACKUP_DIR=./local-config/backups
set POSTGRES_HOST_PORT=55432
set PGBOUNCER_HOST_PORT=56432
set POSTGRES_SHM_SIZE=256m

echo Using LSEVIN_CONFIG_DIR=%LSEVIN_CONFIG_DIR%
echo Using POSTGRES_HOST_PORT=%POSTGRES_HOST_PORT%  PGBOUNCER_HOST_PORT=%PGBOUNCER_HOST_PORT%
echo App will be reachable at http://localhost:3000  (API at :8080)
echo.

docker compose -f docker-compose.server.yml -f docker-compose.local-ports.yml --env-file .env up -d
echo.
echo If this is the first run, or the previous one crashed, and you still see
echo errors, see local-config\README.md ("Port already allocated?" /
echo "database system is in recovery mode" sections).
pause
