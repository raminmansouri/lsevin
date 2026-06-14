#!/usr/bin/env bash
set -euo pipefail

CONTAINER="docker-postgres-1"     # <-- your container name
DB="${DB:-postgres}"              # set DB in cron or keep as postgres
USER_NAME="${USER_NAME:-postgres}"# set user in cron or keep as postgres
BACKUP_DIR="/var/backups/postgres"
TS="$(date +'%Y-%m-%d_%H-%M-%S')"

mkdir -p "$BACKUP_DIR"

# Create compressed custom-format dump
docker exec -e PGPASSWORD="${PGPASSWORD:-}" "$CONTAINER" \
  pg_dump -U "$USER_NAME" -d "$DB" -Fc \
  > "$BACKUP_DIR/${DB}_${TS}.dump"

# (Optional) quick integrity check that dump is readable by pg_restore
pg_restore -l "$BACKUP_DIR/${DB}_${TS}.dump" >/dev/null

# Keep only last 2 days
find "$BACKUP_DIR" -type f -name "${DB}_*.dump" -mmin +$((60*48)) -delete
