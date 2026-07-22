#!/usr/bin/env bash
set -Eeuo pipefail

if [[ -f /opt/lsevin/app/deployments/docker/.env ]]; then
  DOCKER_DIR=/opt/lsevin/app/deployments/docker
elif [[ -f /opt/lsevin-new/deployments/docker/.env ]]; then
  DOCKER_DIR=/opt/lsevin-new/deployments/docker
else
  echo 'ERROR: production Docker environment was not found' >&2
  exit 1
fi

compose=(
  docker compose
  --project-name docker
  --env-file "${DOCKER_DIR}/.env"
  -f "${DOCKER_DIR}/docker-compose.server.yml"
)

"${compose[@]}" ps postgres pgbouncer postgres-exporter pgbouncer-exporter
"${compose[@]}" exec -T postgres sh -ec '
  : "${POSTGRES_USER:?POSTGRES_USER is required}"
  : "${POSTGRES_DB:?POSTGRES_DB is required}"
  exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
    -c "SELECT version(), current_setting('\''shared_buffers'\''), current_setting('\''max_connections'\''), current_setting('\''archive_mode'\''), current_setting('\''data_checksums'\''), pg_is_in_recovery();"
'
"${compose[@]}" exec -T pgbouncer sh -ec '
  : "${PGBOUNCER_MONITOR_USER:?PGBOUNCER_MONITOR_USER is required}"
  : "${PGBOUNCER_MONITOR_PASSWORD:?PGBOUNCER_MONITOR_PASSWORD is required}"
  export PGPASSWORD="$PGBOUNCER_MONITOR_PASSWORD"
  exec psql -h 127.0.0.1 -p 6432 -U "$PGBOUNCER_MONITOR_USER" \
    -d pgbouncer -v ON_ERROR_STOP=1 -c "SHOW POOLS;"
'
"${compose[@]}" exec -T --user postgres postgres pgbackrest --stanza=lsevin info
curl --fail --silent --show-error http://postgres-exporter:9187/metrics >/dev/null
curl --fail --silent --show-error http://pgbouncer-exporter:9127/metrics >/dev/null
echo 'Database, PgBouncer, pgBackRest, and metric exporters are healthy.'
