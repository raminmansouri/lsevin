#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${LSEVIN_APP_DIR:-/opt/lsevin/app}"
DOCKER_DIR="$APP_DIR/deployments/docker"
ENV_FILE="$DOCKER_DIR/.env"
VALIDATOR="$APP_DIR/deployments/ansible/scripts/validate-production-env.sh"

fail() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "INFO: $*"; }
warn() { echo "WARNING: $*" >&2; }

[[ ${EUID} -eq 0 ]] || fail "run as root: sudo -i"
command -v python3 >/dev/null 2>&1 || fail "python3 is required"
command -v openssl >/dev/null 2>&1 || fail "openssl is required"
[[ -d "$DOCKER_DIR" ]] || fail "$DOCKER_DIR does not exist"
[[ -f "$DOCKER_DIR/docker-compose.server.yml" ]] || fail "docker-compose.server.yml is missing"
[[ -x "$VALIDATOR" ]] || fail "$VALIDATOR is missing or not executable"

mkdir -p "$DOCKER_DIR"
umask 077

existing_env=""
if [[ -f "$ENV_FILE" ]]; then
  existing_env="$ENV_FILE"
  backup="$ENV_FILE.before-generator-$(date -u +%Y%m%dT%H%M%SZ)"
  cp -a "$ENV_FILE" "$backup"
  chmod 0600 "$backup"
  info "Existing .env backed up to $backup"
fi

postgres_container=""
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  postgres_container="$(
    docker ps -a \
      --filter label=com.docker.compose.project=docker \
      --filter label=com.docker.compose.service=postgres \
      --format '{{.Names}}' | head -n1
  )"
  if [[ -z "$postgres_container" ]] && docker inspect docker-postgres-1 >/dev/null 2>&1; then
    postgres_container="docker-postgres-1"
  fi
fi

container_env="$(mktemp)"
trap 'rm -f "$container_env"' EXIT
if [[ -n "$postgres_container" ]]; then
  docker inspect "$postgres_container" --format '{{range .Config.Env}}{{println .}}{{end}}' > "$container_env"
  info "Detected existing PostgreSQL container: $postgres_container"
else
  : > "$container_env"
  warn "No existing PostgreSQL container was detected. Fresh database credentials will be generated if no prior .env values exist."
fi

python3 - "$existing_env" "$container_env" "$ENV_FILE" <<'PY'
from pathlib import Path
from urllib.parse import quote
import os
import re
import secrets
import string
import sys

existing_path = Path(sys.argv[1]) if sys.argv[1] else None
container_path = Path(sys.argv[2])
out_path = Path(sys.argv[3])


def parse_env(path: Path | None) -> dict[str, str]:
    values: dict[str, str] = {}
    if path is None or not path.exists():
        return values
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key] = value
    return values


def generated(length: int = 64) -> str:
    alphabet = string.ascii_letters + string.digits + '._~-'
    return ''.join(secrets.choice(alphabet) for _ in range(length))


old = parse_env(existing_path)
container = parse_env(container_path)

# The running container is authoritative for database identity. Preserve its
# password when available so other database clients are not unexpectedly broken.
postgres_db = container.get('POSTGRES_DB') or old.get('POSTGRES_DB') or 'lsevin'
postgres_user = container.get('POSTGRES_USER') or old.get('POSTGRES_USER') or 'lsevin'
postgres_password = container.get('POSTGRES_PASSWORD') or old.get('POSTGRES_PASSWORD')
if not postgres_password or 'CHANGE_ME' in postgres_password or 'REPLACE_ME' in postgres_password:
    postgres_password = generated(40)

monitor_user = old.get('POSTGRES_MONITOR_USER') or 'lsevin_monitor'
monitor_password = old.get('POSTGRES_MONITOR_PASSWORD')
if not monitor_password or 'CHANGE_ME' in monitor_password or len(monitor_password) < 24:
    monitor_password = generated(40)

webhook_key = old.get('WEBHOOK_KEY')
webapp_api_key = old.get('WEBAPP_API_KEY')
if not webhook_key or 'CHANGE_ME' in webhook_key or len(webhook_key) < 32:
    # Preserve an existing API key as the shared key when it is the only one present.
    webhook_key = webapp_api_key if webapp_api_key and 'CHANGE_ME' not in webapp_api_key and len(webapp_api_key) >= 32 else generated(64)
# These two values protect the same API-to-webapp X-WEBHOOK-KEY exchange.
webapp_api_key = webhook_key


def keep_or_generate(key: str, length: int = 64) -> str:
    value = old.get(key, '')
    if not value or 'CHANGE_ME' in value or 'REPLACE_ME' in value or len(value) < 32:
        return generated(length)
    return value

app_domain = old.get('APP_DOMAIN') or 'appmain.lsevin.com'
api_domain = old.get('API_DOMAIN') or 'api.lsevin.com'
providers_domain = old.get('PROVIDERS_DOMAIN') or 'providers.lsevin.com'
shop_domain = old.get('SHOP_DOMAIN') or 'shop.lsevin.com'
crm_domain = old.get('CRM_DOMAIN') or 'crm.lsevin.com'
jenkins_domain = old.get('JENKINS_DOMAIN') or 'devops.lsevin.com'

encoded_user = quote(postgres_user, safe='')
encoded_password = quote(postgres_password, safe='')
encoded_db = quote(postgres_db, safe='')

values = {
    'CADDY_ACME_EMAIL': old.get('CADDY_ACME_EMAIL') or 'admin@lsevin.com',
    'APP_DOMAIN': app_domain,
    'API_DOMAIN': api_domain,
    'PROVIDERS_DOMAIN': providers_domain,
    'SHOP_DOMAIN': shop_domain,
    'CRM_DOMAIN': crm_domain,
    'JENKINS_DOMAIN': jenkins_domain,
    'NEXT_PUBLIC_URL': f'https://{app_domain}',
    'NEXT_PUBLIC_API_URL': f'https://{api_domain}/api/v1',
    'NEXT_PUBLIC_FILES_URL': f'https://{api_domain}/files',
    'NEXT_PUBLIC_SOCKET_URL': f'https://{api_domain}/hubs',
    'NEXT_PUBLIC_MAPBOX_TOKEN': old.get('NEXT_PUBLIC_MAPBOX_TOKEN', ''),
    'NEXT_PUBLIC_NESHAN_MAP_KEY': old.get('NEXT_PUBLIC_NESHAN_MAP_KEY', ''),
    'AUTH_URL': f'https://{app_domain}',
    'AUTH_SECRET': keep_or_generate('AUTH_SECRET'),
    'INTERNAL_API_URL': 'http://lsevin-api:8080/api/v1',
    'WEBHOOK_KEY': webhook_key,
    'WEBAPP_API_KEY': webapp_api_key,
    'DATABASE_URL': f'postgresql://{encoded_user}:{encoded_password}@pgbouncer:6432/{encoded_db}',
    'DATABASE_URL_DIRECT': f'postgresql://{encoded_user}:{encoded_password}@postgres:5432/{encoded_db}',
    'POSTGRES_DB': postgres_db,
    'POSTGRES_USER': postgres_user,
    'POSTGRES_PASSWORD': postgres_password,
    'POSTGRES_MONITOR_USER': monitor_user,
    'POSTGRES_MONITOR_PASSWORD': monitor_password,
    'POSTGRES_IMAGE_TAG': old.get('POSTGRES_IMAGE_TAG') or '17.10-alpine',
    'POSTGRES_SHM_SIZE': old.get('POSTGRES_SHM_SIZE') or '1g',
    'PGBOUNCER_VERSION': old.get('PGBOUNCER_VERSION') or '1.25.2',
    'PGBOUNCER_MAX_CLIENT_CONN': old.get('PGBOUNCER_MAX_CLIENT_CONN') or '1000',
    'PGBOUNCER_DEFAULT_POOL_SIZE': old.get('PGBOUNCER_DEFAULT_POOL_SIZE') or '50',
    'PGBOUNCER_MIN_POOL_SIZE': old.get('PGBOUNCER_MIN_POOL_SIZE') or '5',
    'PGBOUNCER_RESERVE_POOL_SIZE': old.get('PGBOUNCER_RESERVE_POOL_SIZE') or '10',
    'PGBOUNCER_MAX_DB_CONNECTIONS': old.get('PGBOUNCER_MAX_DB_CONNECTIONS') or '90',
    'PGBOUNCER_MAX_USER_CONNECTIONS': old.get('PGBOUNCER_MAX_USER_CONNECTIONS') or '90',
    'PGBOUNCER_MAX_PREPARED_STATEMENTS': old.get('PGBOUNCER_MAX_PREPARED_STATEMENTS') or '200',
    'LSEVIN_CONFIG_DIR': old.get('LSEVIN_CONFIG_DIR') or '/opt/lsevin/config',
    'LSEVIN_BACKUP_DIR': old.get('LSEVIN_BACKUP_DIR') or '/opt/lsevin/backups',
    'LSEVIN_UPLOADS_DIR': old.get('LSEVIN_UPLOADS_DIR') or '/var/lsevin/uploads',
    'JWT_ISSUER': f'https://{api_domain}',
    'JWT_AUDIENCE': old.get('JWT_AUDIENCE') or 'lsevin-api',
    'JWT_SECRET': keep_or_generate('JWT_SECRET'),
    'CORS_ORIGIN_1': f'https://{app_domain}',
    'CORS_ORIGIN_2': f'https://{providers_domain}',
    'CORS_ORIGIN_3': f'https://{shop_domain}',
    'CORS_ORIGIN_4': f'https://{crm_domain}',
    'WHATSIPLUS_API_KEY': old.get('WHATSIPLUS_API_KEY', ''),
    'SEQ_URL': old.get('SEQ_URL', ''),
}

sections = [
    ('Public domains', ['CADDY_ACME_EMAIL', 'APP_DOMAIN', 'API_DOMAIN', 'PROVIDERS_DOMAIN', 'SHOP_DOMAIN', 'CRM_DOMAIN', 'JENKINS_DOMAIN']),
    ('Frontend public configuration', ['NEXT_PUBLIC_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_FILES_URL', 'NEXT_PUBLIC_SOCKET_URL', 'NEXT_PUBLIC_MAPBOX_TOKEN', 'NEXT_PUBLIC_NESHAN_MAP_KEY']),
    ('Frontend/server authentication', ['AUTH_URL', 'AUTH_SECRET', 'INTERNAL_API_URL', 'WEBHOOK_KEY', 'WEBAPP_API_KEY']),
    ('PostgreSQL and PgBouncer', ['DATABASE_URL', 'DATABASE_URL_DIRECT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_MONITOR_USER', 'POSTGRES_MONITOR_PASSWORD', 'POSTGRES_IMAGE_TAG', 'POSTGRES_SHM_SIZE', 'PGBOUNCER_VERSION', 'PGBOUNCER_MAX_CLIENT_CONN', 'PGBOUNCER_DEFAULT_POOL_SIZE', 'PGBOUNCER_MIN_POOL_SIZE', 'PGBOUNCER_RESERVE_POOL_SIZE', 'PGBOUNCER_MAX_DB_CONNECTIONS', 'PGBOUNCER_MAX_USER_CONNECTIONS', 'PGBOUNCER_MAX_PREPARED_STATEMENTS', 'LSEVIN_CONFIG_DIR', 'LSEVIN_BACKUP_DIR', 'LSEVIN_UPLOADS_DIR']),
    ('API security and CORS', ['JWT_ISSUER', 'JWT_AUDIENCE', 'JWT_SECRET', 'CORS_ORIGIN_1', 'CORS_ORIGIN_2', 'CORS_ORIGIN_3', 'CORS_ORIGIN_4']),
    ('Optional integrations', ['WHATSIPLUS_API_KEY', 'SEQ_URL']),
]

lines = [
    '# LSevin production environment',
    '# Generated on the production server. Do not commit this file.',
    '# Database traffic uses PgBouncer; maintenance uses PostgreSQL directly.',
    '',
]
for title, keys in sections:
    lines.append(f'# {title}')
    for key in keys:
        lines.append(f'{key}={values[key]}')
    lines.append('')

out_path.write_text('\n'.join(lines).rstrip() + '\n')
os.chmod(out_path, 0o600)
PY

chmod 0600 "$ENV_FILE"
"$VALIDATOR" "$ENV_FILE"

if [[ -n "$postgres_container" ]] && [[ "$(docker inspect -f '{{.State.Running}}' "$postgres_container")" == "true" ]]; then
  db="$(awk -F= '$1=="POSTGRES_DB" {print substr($0,index($0,"=")+1)}' "$ENV_FILE")"
  user="$(awk -F= '$1=="POSTGRES_USER" {print substr($0,index($0,"=")+1)}' "$ENV_FILE")"
  password="$(awk -F= '$1=="POSTGRES_PASSWORD" {print substr($0,index($0,"=")+1)}' "$ENV_FILE")"
  if docker exec -e PGPASSWORD="$password" "$postgres_container" \
      psql -h 127.0.0.1 -U "$user" -d "$db" -Atqc 'select 1' >/dev/null 2>&1; then
    info "The generated PostgreSQL credentials successfully authenticate to the current container."
  else
    warn "The current container did not accept the password over TCP."
    warn "This can mean the stored container password is stale or PostgreSQL TCP authentication differs."
    warn "The Ansible migration can still rotate the role through the trusted local socket, but verify that no external application still uses the old password."
  fi
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  (cd "$DOCKER_DIR" && docker compose --project-name docker --env-file .env -f docker-compose.server.yml config --quiet)
  info "Docker Compose configuration is valid."
fi

cat <<EOF2

Production .env created successfully:
  $ENV_FILE

The secret values were not printed.
Next run:
  cd $APP_DIR/deployments/ansible
  ./scripts/prepare-production-inventory.sh
  ./scripts/preflight-local.sh
EOF2
