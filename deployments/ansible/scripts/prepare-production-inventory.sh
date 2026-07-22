#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
TARGET="$ROOT_DIR/inventory/production"
GROUP_VARS_DIR="$TARGET/group_vars/all"
MAIN_VARS="$GROUP_VARS_DIR/main.yml"
SECRETS_FILE="$GROUP_VARS_DIR/secrets.yml"
VAULT_FILE="$GROUP_VARS_DIR/vault.yml"
ENV_FILE="${LSEVIN_ENV_FILE:-$PROJECT_ROOT/deployments/docker/.env}"
SECRETS_MODE="${LSEVIN_ANSIBLE_SECRETS_MODE:-plain}"
VAULT_PASSWORD_FILE="${LSEVIN_VAULT_PASSWORD_FILE:-/root/.config/lsevin/ansible-vault-password}"
DISABLED_DIR="$TARGET/disabled"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "INFO: $*"; }

[[ ${EUID} -eq 0 ]] || fail "run as root: sudo -i"
[[ "$SECRETS_MODE" == "plain" || "$SECRETS_MODE" == "vault" ]] \
  || fail "LSEVIN_ANSIBLE_SECRETS_MODE must be 'plain' or 'vault'"

for command_name in python3 ansible ansible-playbook ansible-inventory; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is not installed"
done
if [[ "$SECRETS_MODE" == "vault" ]]; then
  for command_name in ansible-vault openssl; do
    command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required for Vault mode"
  done
fi

[[ -f "$ENV_FILE" ]] || fail "production environment file not found: $ENV_FILE"
[[ -x "$ROOT_DIR/scripts/validate-production-env.sh" ]] \
  || fail "validate-production-env.sh is missing or not executable"
"$ROOT_DIR/scripts/validate-production-env.sh" "$ENV_FILE"

mkdir -p "$GROUP_VARS_DIR" "$DISABLED_DIR"
chmod 0700 "$TARGET" "$TARGET/group_vars" "$GROUP_VARS_DIR" "$DISABLED_DIR"

cat > "$TARGET/hosts.yml" <<'YAML'
all:
  children:
    lsevin_production:
      hosts:
        localhost:
          ansible_connection: local
          ansible_python_interpreter: /usr/bin/python3
YAML
chmod 0600 "$TARGET/hosts.yml"

legacy_main="$TARGET/group_vars/all.yml"
if [[ ! -f "$MAIN_VARS" && -f "$legacy_main" ]]; then
  mv "$legacy_main" "$MAIN_VARS"
  info "migrated legacy group_vars/all.yml to group_vars/all/main.yml"
elif [[ -f "$legacy_main" ]]; then
  mv "$legacy_main" "$DISABLED_DIR/all.yml.$TIMESTAMP"
  info "disabled duplicate legacy group_vars/all.yml"
fi

if [[ ! -f "$MAIN_VARS" ]]; then
  [[ -f "$ROOT_DIR/inventory/example/group_vars/all.yml" ]] \
    || fail "example variables are missing: inventory/example/group_vars/all.yml"
  cp "$ROOT_DIR/inventory/example/group_vars/all.yml" "$MAIN_VARS"
fi
chmod 0600 "$MAIN_VARS"

ssh_port="22"
if command -v sshd >/dev/null 2>&1; then
  detected_port="$(sshd -T 2>/dev/null | awk '$1 == "port" {print $2; exit}' || true)"
  if [[ "$detected_port" =~ ^[0-9]+$ ]]; then
    ssh_port="$detected_port"
  fi
fi

python3 - "$MAIN_VARS" "$ssh_port" "$PROJECT_ROOT" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
ssh_port = sys.argv[2]
project_root = sys.argv[3]
text = path.read_text()

replacements = {
    "lsevin_ssh_port": ssh_port,
    "lsevin_app_dir": project_root,
}
for key, value in replacements.items():
    pattern = rf"(?m)^{re.escape(key)}:\s*.*$"
    line = f"{key}: {value}"
    if re.search(pattern, text):
        text = re.sub(pattern, line, text, count=1)
    else:
        text += f"\n{line}\n"

path.write_text(text)
PY

plain_secrets="$(mktemp)"
check_playbook="$(mktemp --suffix=.yml)"
cleanup() {
  rm -f "$plain_secrets" "$check_playbook"
}
trap cleanup EXIT
chmod 0600 "$plain_secrets" "$check_playbook"

python3 - "$ENV_FILE" "$plain_secrets" <<'PY'
from pathlib import Path
import re
import sys

env_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])

values: dict[str, str] = {}
for line_number, raw in enumerate(env_path.read_text().splitlines(), 1):
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    if "=" not in line:
        raise SystemExit(f"ERROR: invalid .env line {line_number}: missing '='")
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    values[key] = value

required = [
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_MONITOR_USER",
    "POSTGRES_MONITOR_PASSWORD",
]
missing = [key for key in required if not values.get(key)]
if missing:
    raise SystemExit("ERROR: missing .env values: " + ", ".join(missing))

identifier = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
password = re.compile(r"^[A-Za-z0-9._~@%+=,:!?-]+$")
for key in ("POSTGRES_DB", "POSTGRES_USER", "POSTGRES_MONITOR_USER"):
    if not identifier.fullmatch(values[key]):
        raise SystemExit(f"ERROR: {key} is not a safe PostgreSQL identifier")
for key, minimum in (("POSTGRES_PASSWORD", 12), ("POSTGRES_MONITOR_PASSWORD", 24)):
    if len(values[key]) < minimum or not password.fullmatch(values[key]):
        raise SystemExit(f"ERROR: {key} is invalid")

def yaml_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"

content = "\n".join(
    [
        "---",
        f"vault_postgres_db: {yaml_quote(values['POSTGRES_DB'])}",
        f"vault_postgres_user: {yaml_quote(values['POSTGRES_USER'])}",
        f"vault_postgres_password: {yaml_quote(values['POSTGRES_PASSWORD'])}",
        f"vault_postgres_monitor_user: {yaml_quote(values['POSTGRES_MONITOR_USER'])}",
        f"vault_postgres_monitor_password: {yaml_quote(values['POSTGRES_MONITOR_PASSWORD'])}",
        f"vault_pgbackrest_s3_bucket: {yaml_quote(values.get('PGBACKREST_S3_BUCKET', ''))}",
        f"vault_pgbackrest_s3_endpoint: {yaml_quote(values.get('PGBACKREST_S3_ENDPOINT', ''))}",
        f"vault_pgbackrest_s3_region: {yaml_quote(values.get('PGBACKREST_S3_REGION', ''))}",
        f"vault_pgbackrest_s3_key: {yaml_quote(values.get('PGBACKREST_S3_KEY', ''))}",
        f"vault_pgbackrest_s3_key_secret: {yaml_quote(values.get('PGBACKREST_S3_KEY_SECRET', ''))}",
        f"vault_pgbackrest_s3_uri_style: {yaml_quote(values.get('PGBACKREST_S3_URI_STYLE', 'host'))}",
        "",
    ]
)
out_path.write_text(content)
PY

legacy_vault="$TARGET/group_vars/vault.yml"
if [[ -f "$legacy_vault" ]]; then
  mv "$legacy_vault" "$DISABLED_DIR/vault.yml.legacy.$TIMESTAMP"
  info "disabled invalid legacy group_vars/vault.yml"
fi

if [[ "$SECRETS_MODE" == "plain" ]]; then
  if [[ -f "$VAULT_FILE" ]]; then
    mv "$VAULT_FILE" "$DISABLED_DIR/vault.yml.$TIMESTAMP"
    info "disabled the old encrypted Vault; Docker .env is now the source of truth"
  fi
  install -m 0600 "$plain_secrets" "$SECRETS_FILE"
  info "generated root-only plaintext Ansible variables from the production .env"
else
  rm -f "$SECRETS_FILE"
  mkdir -p "$(dirname "$VAULT_PASSWORD_FILE")"
  chmod 0700 "$(dirname "$VAULT_PASSWORD_FILE")"
  if [[ ! -s "$VAULT_PASSWORD_FILE" ]]; then
    openssl rand -hex 32 > "$VAULT_PASSWORD_FILE"
  fi
  chmod 0600 "$VAULT_PASSWORD_FILE"
  install -m 0600 "$plain_secrets" "$VAULT_FILE"
  ansible-vault encrypt --vault-password-file "$VAULT_PASSWORD_FILE" "$VAULT_FILE" >/dev/null
  info "generated encrypted Ansible Vault from the production .env"
fi

python3 - "$ROOT_DIR/ansible.cfg" "$SECRETS_MODE" "$VAULT_PASSWORD_FILE" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
mode = sys.argv[2]
password_file = sys.argv[3]
text = path.read_text() if path.exists() else "[defaults]\n"
if not re.search(r"(?m)^\[defaults\]\s*$", text):
    text = "[defaults]\n" + text

settings = {
    "inventory": "inventory/production/hosts.yml",
    "roles_path": "roles",
}
for key, value in settings.items():
    pattern = rf"(?m)^{re.escape(key)}\s*=.*$"
    line = f"{key} = {value}"
    if re.search(pattern, text):
        text = re.sub(pattern, line, text, count=1)
    else:
        text = re.sub(r"(?m)^\[defaults\]\s*$", lambda m: m.group(0) + "\n" + line, text, count=1)

vault_pattern = r"(?m)^vault_password_file\s*=.*\n?"
text = re.sub(vault_pattern, "", text)
if mode == "vault":
    line = f"vault_password_file = {password_file}"
    text = re.sub(r"(?m)^\[defaults\]\s*$", lambda m: m.group(0) + "\n" + line, text, count=1)

path.write_text(text.rstrip() + "\n")
PY
chmod 0600 "$ROOT_DIR/ansible.cfg"

cat > "$check_playbook" <<'YAML'
---
- name: Verify LSevin inventory variables
  hosts: lsevin_production
  gather_facts: false
  tasks:
    - name: Confirm required database variables are loaded
      ansible.builtin.assert:
        that:
          - vault_postgres_db is defined
          - vault_postgres_user is defined
          - vault_postgres_password is defined
          - vault_postgres_monitor_user is defined
          - vault_postgres_monitor_password is defined
          - vault_postgres_db | length > 0
          - vault_postgres_user | length > 0
          - vault_postgres_password | length >= 12
          - vault_postgres_monitor_password | length >= 24
        fail_msg: Production database variables were not loaded from group_vars/all.
      no_log: true
YAML

cd "$ROOT_DIR"
ansible-inventory --graph
ansible lsevin_production -m ansible.builtin.ping
ansible-playbook "$check_playbook" >/dev/null

printf '\nProduction inventory is ready.\n'
printf 'Project root: %s\n' "$PROJECT_ROOT"
printf 'Inventory: %s\n' "$TARGET/hosts.yml"
printf 'Variables: %s\n' "$([[ "$SECRETS_MODE" == "plain" ]] && echo "$SECRETS_FILE" || echo "$VAULT_FILE")"
printf 'Secrets mode: %s\n' "$SECRETS_MODE"
