#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${LSEVIN_APP_DIR:-/opt/lsevin/app}"
ENV_FILE="${1:-$APP_DIR/deployments/docker/.env}"

fail() { echo "ERROR: $*" >&2; exit 1; }
warn() { echo "WARNING: $*" >&2; }

[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE does not exist"
[[ -r "$ENV_FILE" ]] || fail "$ENV_FILE is not readable"

if grep -q $'\r' "$ENV_FILE"; then
  fail "$ENV_FILE uses Windows CRLF line endings; run: sed -i 's/\\r$//' '$ENV_FILE'"
fi

python3 - "$ENV_FILE" <<'PY'
from pathlib import Path
from urllib.parse import quote
import re
import sys

path = Path(sys.argv[1])
values: dict[str, str] = {}
duplicates: list[str] = []

for line_number, raw in enumerate(path.read_text().splitlines(), 1):
    line = raw.strip()
    if not line or line.startswith('#'):
        continue
    if '=' not in line:
        raise SystemExit(f"ERROR: invalid .env line {line_number}: missing '='")
    key, value = line.split('=', 1)
    key = key.strip()
    value = value.strip()
    if not re.fullmatch(r'[A-Z][A-Z0-9_]*', key):
        raise SystemExit(f"ERROR: invalid variable name on line {line_number}: {key!r}")
    if key in values:
        duplicates.append(key)
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1]
    values[key] = value

if duplicates:
    raise SystemExit('ERROR: duplicate .env keys: ' + ', '.join(sorted(set(duplicates))))

required_nonempty = [
    'CADDY_ACME_EMAIL', 'APP_DOMAIN', 'API_DOMAIN', 'PROVIDERS_DOMAIN',
    'SHOP_DOMAIN', 'CRM_DOMAIN', 'JENKINS_DOMAIN', 'NEXT_PUBLIC_URL',
    'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_FILES_URL', 'NEXT_PUBLIC_SOCKET_URL',
    'AUTH_URL', 'AUTH_SECRET', 'INTERNAL_API_URL', 'WEBHOOK_KEY',
    'WEBAPP_API_KEY', 'DATABASE_URL', 'DATABASE_URL_DIRECT', 'POSTGRES_DB',
    'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_MONITOR_USER',
    'POSTGRES_MONITOR_PASSWORD', 'JWT_ISSUER', 'JWT_AUDIENCE', 'JWT_SECRET',
    'CORS_ORIGIN_1', 'CORS_ORIGIN_2', 'CORS_ORIGIN_3', 'CORS_ORIGIN_4',
    'LSEVIN_UPLOADS_DIR',
]
missing = [key for key in required_nonempty if not values.get(key)]
if missing:
    raise SystemExit('ERROR: missing or empty required .env keys: ' + ', '.join(missing))

placeholder_keys = [key for key, value in values.items() if 'CHANGE_ME' in value or 'REPLACE_ME' in value]
if placeholder_keys:
    raise SystemExit('ERROR: placeholder values remain in: ' + ', '.join(sorted(placeholder_keys)))


uploads_dir = values['LSEVIN_UPLOADS_DIR']
if not uploads_dir.startswith('/'):
    raise SystemExit('ERROR: LSEVIN_UPLOADS_DIR must be an absolute host path')
if uploads_dir in {'/', '/var', '/opt', '/var/lib/docker'}:
    raise SystemExit('ERROR: LSEVIN_UPLOADS_DIR is too broad and unsafe')

identifier = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')
for key in ('POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_MONITOR_USER'):
    if not identifier.fullmatch(values[key]):
        raise SystemExit(f'ERROR: {key} must be a simple PostgreSQL identifier')

# Exclude whitespace, quotes, backslashes, dollar signs, hashes, semicolons and
# ampersands because those are error-prone in Compose .env files and shell/URI contexts.
password_re = re.compile(r'^[A-Za-z0-9._~@%+=,:!?-]+$')
for key, minimum in (('POSTGRES_PASSWORD', 12), ('POSTGRES_MONITOR_PASSWORD', 24)):
    value = values[key]
    if len(value) < minimum:
        raise SystemExit(f'ERROR: {key} must contain at least {minimum} characters')
    if not password_re.fullmatch(value):
        raise SystemExit(
            f'ERROR: {key} contains unsupported characters. Use letters, numbers, '
            'dot, underscore, tilde, @, %, +, =, comma, colon, !, ?, or hyphen.'
        )

for key, minimum in (
    ('AUTH_SECRET', 32), ('WEBHOOK_KEY', 32), ('WEBAPP_API_KEY', 32), ('JWT_SECRET', 32)
):
    if len(values[key]) < minimum:
        raise SystemExit(f'ERROR: {key} must contain at least {minimum} characters')

if values['WEBAPP_API_KEY'] != values['WEBHOOK_KEY']:
    raise SystemExit('ERROR: WEBAPP_API_KEY must equal WEBHOOK_KEY for API-to-webapp webhook authentication')

expected = {
    'NEXT_PUBLIC_URL': f"https://{values['APP_DOMAIN']}",
    'AUTH_URL': f"https://{values['APP_DOMAIN']}",
    'JWT_ISSUER': f"https://{values['API_DOMAIN']}",
    'CORS_ORIGIN_1': f"https://{values['APP_DOMAIN']}",
    'CORS_ORIGIN_2': f"https://{values['PROVIDERS_DOMAIN']}",
    'CORS_ORIGIN_3': f"https://{values['SHOP_DOMAIN']}",
    'CORS_ORIGIN_4': f"https://{values['CRM_DOMAIN']}",
}
for key, expected_value in expected.items():
    if values[key] != expected_value:
        raise SystemExit(f'ERROR: {key} should be {expected_value!r}, found {values[key]!r}')

# Caddy intentionally exposes API, file and hub routes on both APP_DOMAIN and
# API_DOMAIN. Accept either supported public routing mode so preflight does not
# force a working production webapp to change origin during a later rebuild.
public_route_suffixes = {
    'NEXT_PUBLIC_API_URL': '/api/v1',
    'NEXT_PUBLIC_FILES_URL': '/files',
    'NEXT_PUBLIC_SOCKET_URL': '/hubs',
}
for key, suffix in public_route_suffixes.items():
    allowed_values = {
        f"https://{values['APP_DOMAIN']}{suffix}",
        f"https://{values['API_DOMAIN']}{suffix}",
    }
    if values[key] not in allowed_values:
        allowed_display = ', '.join(repr(value) for value in sorted(allowed_values))
        raise SystemExit(
            f'ERROR: {key} must use a Caddy-supported public route '
            f'({allowed_display}), found {values[key]!r}'
        )

encoded_user = quote(values['POSTGRES_USER'], safe='')
encoded_password = quote(values['POSTGRES_PASSWORD'], safe='')
encoded_db = quote(values['POSTGRES_DB'], safe='')
expected_runtime = f'postgresql://{encoded_user}:{encoded_password}@pgbouncer:6432/{encoded_db}'
expected_direct = f'postgresql://{encoded_user}:{encoded_password}@postgres:5432/{encoded_db}'
if values['DATABASE_URL'] != expected_runtime:
    raise SystemExit('ERROR: DATABASE_URL does not match POSTGRES_DB/USER/PASSWORD and PgBouncer')
if values['DATABASE_URL_DIRECT'] != expected_direct:
    raise SystemExit('ERROR: DATABASE_URL_DIRECT does not match POSTGRES_DB/USER/PASSWORD and PostgreSQL')

print(f'Production environment is valid: {path}')
print('Database credentials are present and URLs are internally consistent.')
print('Secrets were validated without printing their values.')
PY

mode="$(stat -c '%a' "$ENV_FILE" 2>/dev/null || true)"
if [[ -n "$mode" && "$mode" != "600" ]]; then
  warn "$ENV_FILE permissions are $mode; changing to 600"
  chmod 0600 "$ENV_FILE"
fi
