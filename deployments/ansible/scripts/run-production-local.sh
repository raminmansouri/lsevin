#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
LOG_DIR="/var/log/lsevin-ansible"
export ANSIBLE_CONFIG="$ROOT_DIR/ansible.cfg"

if [[ ${EUID} -ne 0 ]]; then
  echo "ERROR: run as root: sudo -i" >&2
  exit 1
fi

cd "$ROOT_DIR"
mkdir -p "$LOG_DIR"
log_file="$LOG_DIR/deploy-$(date -u +%Y%m%dT%H%M%SZ).log"
exec > >(tee -a "$log_file") 2>&1

echo "LSevin production infrastructure deployment"
echo "Log: $log_file"

# Idempotently rebuild the localhost inventory and database variables from the
# existing production Docker .env. Plaintext root-only variables are the default;
# set LSEVIN_ANSIBLE_SECRETS_MODE=vault to opt in to Ansible Vault.
"$ROOT_DIR/scripts/prepare-production-inventory.sh"
"$ROOT_DIR/scripts/preflight-local.sh"

ansible-playbook --syntax-check playbooks/provision.yml
ansible-playbook --syntax-check playbooks/database.yml
ansible-playbook --syntax-check playbooks/verify.yml

cat <<'NOTICE'
This operation can restart Docker and PostgreSQL and will cause a short maintenance window.
It preserves the Compose project name "docker" and the existing docker_postgres_data volume.
Type DEPLOY to continue.
NOTICE
read -r confirmation
[[ "$confirmation" == "DEPLOY" ]] || { echo "Cancelled."; exit 1; }

ansible-playbook playbooks/provision.yml
"$ROOT_DIR/scripts/preflight-local.sh"
ansible-playbook playbooks/database.yml
ansible-playbook playbooks/verify.yml

echo "Deployment and verification completed successfully."
echo "Review timers with: systemctl list-timers --all | grep lsevin"
echo "Review services with: cd $PROJECT_ROOT/deployments/docker && docker compose -p docker --env-file .env -f docker-compose.server.yml ps"
