#!/usr/bin/env bash
#
# LSevin production deploy — confirmed procedure for 202.133.90.50 (appmain.lsevin.com)
# Stack: docker compose -> Caddy(:80/:443) -> Next webapp(:3000) + .NET API(:8080) -> postgres/redis/eventstore
#
# NO SECRETS IN THIS FILE. Auth to the server is handled by your ssh setup:
#   - Preferred: an ssh key / ssh-agent so `ssh root@HOST` works passwordless.
#   - Password-only (macOS has no sshpass): drive ssh/rsync with `expect` (see deploy memory).
#
# Idempotent and safe to re-run. Aborts on the first failure. Never overwrites the server .env.
#
set -euo pipefail

HOST="${LSEVIN_HOST:-202.133.90.50}"
SSH_USER="${LSEVIN_SSH_USER:-root}"
REMOTE="${SSH_USER}@${HOST}"
APPDIR="/opt/lsevin/app"
DOCKERDIR="${APPDIR}/deployments/docker"
COMPOSE="docker compose -f ${DOCKERDIR}/docker-compose.server.yml --env-file ${DOCKERDIR}/.env"
LOCAL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"

# Files that must never ship to prod (prod secrets, local dev env, build artifacts, migrations).
EXCLUDES=(
  --exclude=.git --exclude=node_modules --exclude=.next
  --exclude='bin/' --exclude='obj/' --exclude=UploadFiles
  --exclude='*.log' --exclude='*.sql' --exclude=.DS_Store
  --exclude='deployments/docker/.env'   # prod secrets — keep server copy
  --exclude='.env.local' --exclude='.env.*.local'
  --exclude=.turbo --exclude=auto_backups
)

say(){ printf '\n=== %s ===\n' "$*"; }
rexec(){ ssh $SSH_OPTS "$REMOTE" "$@"; }

say "0/6  Preflight (read-only)"
rexec "hostname && docker ps --format '{{.Names}}: {{.Status}}'"

say "1/6  DB backup (pg_dump before any migration)"
rexec 'set -o pipefail; OUT=/opt/lsevin/backups/predeploy-$(date +%Y%m%d-%H%M%S).sql.gz; mkdir -p /opt/lsevin/backups; \
  docker exec docker-postgres-1 sh -c "pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" --no-owner --no-privileges" | gzip > "$OUT"; \
  SZ=$(stat -c %s "$OUT"); [ "$SZ" -ge 10240 ] || { echo BACKUP_TOO_SMALL; exit 1; }; echo "backup=$OUT bytes=$SZ"'

say "2/6  Apply idempotent SQL migrations (webapp-direct schema; NOT EF/Prisma)"
rexec 'mkdir -p /opt/lsevin/predeploy-sql'
rsync -az -e "ssh $SSH_OPTS" "${LOCAL_ROOT}/scripts/sql/" "${REMOTE}:/opt/lsevin/predeploy-sql/"
rexec 'for f in /opt/lsevin/predeploy-sql/*.sql; do echo "-- $f"; \
  docker exec -i docker-postgres-1 sh -c "psql -q -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\"" < "$f" || exit 1; done; echo MIGRATIONS_OK'

say "3/6  Sync working tree (incremental; no --delete)"
rsync -az --stats "${EXCLUDES[@]}" -e "ssh $SSH_OPTS" "${LOCAL_ROOT}/" "${REMOTE}:${APPDIR}/"
# Remove files deleted on this branch (rsync ran without --delete). Add paths here as needed.
rexec "rm -f ${APPDIR}/frontend/webapp/src/app/api/location/client-ip-geo.ts 2>/dev/null; true"

say "4/6  Build images (old containers keep serving during build)"
rexec "cd ${DOCKERDIR} && ${COMPOSE} build lsevin-api lsevin-webapp"

say "5/6  Recreate api/webapp/caddy (seconds of downtime; db/redis/eventstore untouched)"
rexec "cd ${DOCKERDIR} && ${COMPOSE} up -d && sleep 8 && docker ps --format '{{.Names}}: {{.Status}}'"

say "6/6  Health checks"
for p in "/fa" "/fa/n/app/mobile/home?countryCode=IR&cityCode=TEHRAN" "/fa/n/app/mobile/packages" "/fa/n/app/mobile/notifications"; do
  code=$(rexec "curl -sS -o /dev/null -w '%{http_code}' -L --max-time 25 'https://appmain.lsevin.com${p}'")
  echo "  ${code}  ${p}"
  [ "$code" = "200" ] || echo "  !! expected 200 for ${p}"
done
echo
echo "Deploy finished. Rollback: docker tag lsevin-{api,webapp}:rollback-<ts> back to the running image name and re-run 'up -d'; restore DB from /opt/lsevin/backups if a migration must be undone."
