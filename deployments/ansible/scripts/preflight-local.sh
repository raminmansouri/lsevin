#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$(cd "$ROOT_DIR/../.." && pwd)"
DOCKER_DIR="$APP_DIR/deployments/docker"
INVENTORY_DIR="$ROOT_DIR/inventory/production"
MAIN_VARS="$INVENTORY_DIR/group_vars/all/main.yml"
SECRETS_FILE="$INVENTORY_DIR/group_vars/all/secrets.yml"
VAULT_FILE="$INVENTORY_DIR/group_vars/all/vault.yml"
VAULT_PASSWORD_FILE="${LSEVIN_VAULT_PASSWORD_FILE:-/root/.config/lsevin/ansible-vault-password}"

fail() { echo "ERROR: $*" >&2; exit 1; }
warn() { echo "WARNING: $*" >&2; }

[[ ${EUID} -eq 0 ]] || fail "run as root: sudo -i"
[[ -f /etc/os-release ]] || fail "/etc/os-release is missing"
# shellcheck disable=SC1091
source /etc/os-release
[[ ${ID:-} == ubuntu ]] || fail "Ubuntu is required; detected ${PRETTY_NAME:-unknown}"

for command_name in ansible ansible-playbook ansible-inventory python3; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is not installed"
done

[[ -f "$INVENTORY_DIR/hosts.yml" ]] \
  || fail "production inventory is missing; run prepare-production-inventory.sh"
[[ -f "$MAIN_VARS" ]] \
  || fail "group_vars/all/main.yml is missing; run prepare-production-inventory.sh"
[[ ! -f "$INVENTORY_DIR/group_vars/all.yml" ]] \
  || fail "legacy group_vars/all.yml conflicts with group_vars/all/main.yml; rerun prepare-production-inventory.sh"
[[ ! -f "$INVENTORY_DIR/group_vars/vault.yml" ]] \
  || fail "legacy group_vars/vault.yml is in the wrong group; rerun prepare-production-inventory.sh"

if [[ -f "$SECRETS_FILE" && -f "$VAULT_FILE" ]]; then
  fail "both secrets.yml and vault.yml exist; rerun prepare-production-inventory.sh to select one secrets mode"
elif [[ -f "$SECRETS_FILE" ]]; then
  grep -q '^\$ANSIBLE_VAULT' "$SECRETS_FILE" \
    && fail "secrets.yml is encrypted but is configured as plaintext"
  [[ ! -L "$SECRETS_FILE" ]] || fail "secrets.yml must not be a symbolic link"
  secrets_mode="$(stat -c '%a' "$SECRETS_FILE")"
  secrets_owner="$(stat -c '%u' "$SECRETS_FILE")"
  [[ "$secrets_mode" == "600" ]] || fail "secrets.yml permissions must be 600; found $secrets_mode"
  [[ "$secrets_owner" == "0" ]] || fail "secrets.yml must be owned by root"
  secrets_source="$SECRETS_FILE"
  echo "Ansible secrets mode: root-only plaintext variables"
elif [[ -f "$VAULT_FILE" ]]; then
  command -v ansible-vault >/dev/null 2>&1 || fail "ansible-vault is not installed"
  grep -q '^\$ANSIBLE_VAULT' "$VAULT_FILE" || fail "vault.yml is not encrypted"
  [[ -s "$VAULT_PASSWORD_FILE" ]] || fail "Vault password file is missing: $VAULT_PASSWORD_FILE"
  [[ "$(stat -c '%a' "$VAULT_PASSWORD_FILE")" == "600" ]] \
    || fail "Vault password file permissions must be 600"
  ansible-vault view --vault-password-file "$VAULT_PASSWORD_FILE" "$VAULT_FILE" >/dev/null \
    || fail "Vault cannot be decrypted with $VAULT_PASSWORD_FILE"
  secrets_source="$VAULT_FILE"
  echo "Ansible secrets mode: encrypted Vault"
else
  fail "database variables are missing; run prepare-production-inventory.sh"
fi

[[ -f "$DOCKER_DIR/.env" ]] || fail "$DOCKER_DIR/.env is missing"
[[ -f "$DOCKER_DIR/docker-compose.server.yml" ]] || fail "docker-compose.server.yml is missing"
[[ -f "$DOCKER_DIR/postgres/Dockerfile" ]] || fail "PostgreSQL Dockerfile is missing"
[[ -f "$DOCKER_DIR/pgbouncer/Dockerfile" ]] || fail "PgBouncer Dockerfile is missing"
[[ -x "$ROOT_DIR/scripts/validate-production-env.sh" ]] \
  || fail "validate-production-env.sh is missing or not executable"
"$ROOT_DIR/scripts/validate-production-env.sh" "$DOCKER_DIR/.env"

check_playbook="$(mktemp --suffix=.yml)"
trap 'rm -f "$check_playbook"' EXIT
chmod 0600 "$check_playbook"
cat > "$check_playbook" <<'YAML'
---
- name: Verify production variables are loadable
  hosts: lsevin_production
  gather_facts: false
  tasks:
    - name: Assert required database variables
      ansible.builtin.assert:
        that:
          - vault_postgres_db is defined
          - vault_postgres_user is defined
          - vault_postgres_password is defined
          - vault_postgres_monitor_user is defined
          - vault_postgres_monitor_password is defined
          - vault_postgres_password | length >= 12
          - vault_postgres_monitor_password | length >= 24
        fail_msg: Database variables were not loaded from group_vars/all.
      no_log: true
YAML

cd "$ROOT_DIR"
ansible-playbook "$check_playbook" >/dev/null \
  || fail "Ansible could not load production variables from $secrets_source"

ram_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
cpu_count="$(nproc)"
free_kb="$(df -Pk "$APP_DIR" | awk 'NR==2 {print $4}')"
(( ram_mb >= 3072 )) || fail "at least 3 GB RAM is required; detected ${ram_mb} MB"
(( cpu_count >= 2 )) || fail "at least 2 CPUs are required; detected ${cpu_count}"
(( free_kb >= 10 * 1024 * 1024 )) || fail "at least 10 GB free disk is required under $APP_DIR"
(( ram_mb >= 8192 )) || warn "less than 8 GB RAM detected; Jenkins builds and PostgreSQL may compete for memory"

if command -v docker >/dev/null 2>&1; then
  docker info >/dev/null 2>&1 || fail "Docker exists but the daemon is not healthy"
  if docker compose version >/dev/null 2>&1; then
    compose_version="$(docker compose version --short 2>/dev/null | sed 's/^v//' || true)"
    minimum_compose="2.20.0"
    if [[ -n "$compose_version" ]] \
      && [[ "$(printf '%s\n%s\n' "$minimum_compose" "$compose_version" | sort -V | head -n1)" != "$minimum_compose" ]]; then
      fail "Docker Compose $compose_version is too old; $minimum_compose or newer is required"
    fi
    echo "Docker Compose: ${compose_version:-detected}"
  else
    fail "Docker exists but the Docker Compose v2 plugin is missing"
  fi

  (cd "$DOCKER_DIR" && docker compose --project-name docker --env-file .env -f docker-compose.server.yml config --quiet) \
    || fail "Docker Compose configuration is invalid"

  existing_postgres="$(docker ps -a \
    --filter label=com.docker.compose.project=docker \
    --filter label=com.docker.compose.service=postgres \
    --format '{{.Names}}' | head -n1)"
  if [[ -n "$existing_postgres" ]]; then
    echo "Existing PostgreSQL container detected: $existing_postgres"
    volume_name="$(docker inspect "$existing_postgres" \
      --format '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}')"
    [[ -n "$volume_name" ]] || fail "could not identify the existing PostgreSQL data volume"
    echo "Existing PostgreSQL volume: $volume_name"
    [[ "$volume_name" == "docker_postgres_data" ]] \
      || warn "expected docker_postgres_data but found $volume_name; verify lsevin_compose_project before deployment"
  elif docker volume inspect docker_postgres_data >/dev/null 2>&1; then
    fail "docker_postgres_data exists without a postgres Compose container; restore the old container and take a verified backup before continuing"
  fi

  for port in 5432 6432 9187 9127; do
    owner="$(docker ps --format '{{.Names}} {{.Ports}}' | awk -v p=":${port}->" 'index($0,p){print $1; exit}')"
    if ss -ltnH "sport = :$port" 2>/dev/null | grep -q . && [[ -z "$owner" ]]; then
      fail "host port $port is already used by a non-Docker process"
    fi
  done
else
  echo "Docker is not installed yet; provision.yml will install it from Docker's official repository."
fi

if grep -Eq '^(POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD)=.*CHANGE_ME' "$DOCKER_DIR/.env"; then
  fail "database values in .env still contain CHANGE_ME"
fi

echo "Preflight checks passed: Ubuntu=${VERSION_ID:-unknown}, RAM=${ram_mb}MB, CPUs=${cpu_count}."
