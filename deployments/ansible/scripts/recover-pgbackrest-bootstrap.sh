#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ ${EUID} -eq 0 ]] || fail 'Run this script as root.'

ANSIBLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ANSIBLE_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/deployments/docker"
ENV_FILE="$DOCKER_DIR/.env"

[[ -f "$ENV_FILE" ]] || fail "Missing production environment: $ENV_FILE"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is missing from .env}"
: "${POSTGRES_DB:?POSTGRES_DB is missing from .env}"

CONFIG_DIR="${LSEVIN_CONFIG_DIR:-/opt/lsevin/config}"
POSTGRES_CONF="$CONFIG_DIR/postgres/postgresql.conf"
PGBACKREST_CONF="$CONFIG_DIR/postgres/pgbackrest.conf"

[[ -f "$POSTGRES_CONF" ]] || fail "Missing PostgreSQL configuration: $POSTGRES_CONF"
[[ -f "$PGBACKREST_CONF" ]] || fail "Missing pgBackRest configuration: $PGBACKREST_CONF"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
cp -a "$POSTGRES_CONF" "${POSTGRES_CONF}.before-pgbackrest-recovery-${stamp}"
cp -a "$PGBACKREST_CONF" "${PGBACKREST_CONF}.before-pgbackrest-recovery-${stamp}"

# pgBackRest compression is global in 2.58, not repository-numbered.
sed -i \
  -e 's/^repo1-compress-type=/compress-type=/' \
  -e 's/^repo1-compress-level=/compress-level=/' \
  "$PGBACKREST_CONF"

grep -q '^compress-type=zst$' "$PGBACKREST_CONF" \
  || printf '%s\n' 'compress-type=zst' >> "$PGBACKREST_CONF"
grep -q '^compress-level=3$' "$PGBACKREST_CONF" \
  || printf '%s\n' 'compress-level=3' >> "$PGBACKREST_CONF"

if grep -Eq '^repo[0-9]+-compress-(type|level)=' "$PGBACKREST_CONF"; then
  fail 'Invalid repository-numbered compression options remain in pgbackrest.conf.'
fi

# Normalize pgBackRest rich error codes to a normal retryable archive failure.
python3 - "$POSTGRES_CONF" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()

archive = "archive_command = 'pgbackrest --stanza=lsevin archive-push %p || exit 1'"
restore = "restore_command = 'pgbackrest --stanza=lsevin archive-get %f \"%p\" || exit 1'"

text, archive_count = re.subn(r"^archive_command\s*=.*$", archive, text, count=1, flags=re.MULTILINE)
text, restore_count = re.subn(r"^restore_command\s*=.*$", restore, text, count=1, flags=re.MULTILINE)

if archive_count != 1:
    raise SystemExit('ERROR: archive_command was not found exactly once.')
if restore_count != 1:
    raise SystemExit('ERROR: restore_command was not found exactly once.')

path.write_text(text)
PY

cd "$DOCKER_DIR"
compose=(
  docker compose
  --project-name docker
  --env-file .env
  -f docker-compose.server.yml
)

"${compose[@]}" config --quiet

printf '%s\n' 'Restarting PostgreSQL with safe archiving configuration...'
"${compose[@]}" restart postgres

ready=0
for _ in $(seq 1 60); do
  if "${compose[@]}" exec -T postgres \
    pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1
  then
    ready=1
    break
  fi
  sleep 2
done
[[ "$ready" == 1 ]] || fail 'PostgreSQL did not become ready after restart.'

"${compose[@]}" exec -T postgres \
  sh -ec 'command -v pgbackrest >/dev/null 2>&1' \
  || fail 'The current PostgreSQL image does not contain pgBackRest.'

printf '%s\n' 'Clearing stale pgBackRest asynchronous spool state...'
"${compose[@]}" exec -T --user postgres postgres \
  sh -ec 'find /var/spool/pgbackrest -mindepth 1 -depth -delete'

printf '%s\n' 'Creating or confirming the pgBackRest stanza...'
stanza_output="$("${compose[@]}" exec -T --user postgres postgres \
  pgbackrest --stanza=lsevin stanza-create 2>&1)" \
printf '%s\n' "$stanza_output"
if grep -qi 'invalid option' <<<"$stanza_output"; then
  fail 'pgBackRest still reports an invalid configuration option.'
fi

"${compose[@]}" exec -T --user postgres postgres \
  sh -ec 'find /var/spool/pgbackrest -mindepth 1 -depth -delete'

printf '%s\n' 'Checking WAL archiving...'
check_output="$("${compose[@]}" exec -T --user postgres postgres \
  pgbackrest --stanza=lsevin check 2>&1)" \
printf '%s\n' "$check_output"
if grep -qi 'invalid option' <<<"$check_output"; then
  fail 'pgBackRest check reports an invalid configuration option.'
fi

"${compose[@]}" exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atqc \
  "SELECT current_setting('archive_mode'), current_setting('archive_command'), pg_is_in_recovery();"

printf '%s\n' 'pgBackRest bootstrap recovery completed successfully.'
