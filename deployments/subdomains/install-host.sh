#!/usr/bin/env bash
# Prepare one production server for LSevin blue-green subdomain deployments.
# Run once as root after copying this repository to the server:
#   sudo bash deployments/subdomains/install-host.sh
set -Eeuo pipefail
umask 027

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ENV_ROOT="${LSEVIN_PROJECT_ENV_ROOT:-/etc/lsevin/projects}"
STATE_ROOT="${LSEVIN_SUBDOMAIN_STATE_ROOT:-/var/lib/lsevin/subdomains}"
CADDY_RUNTIME_DIR="${LSEVIN_CADDY_RUNTIME_DIR:-/var/lib/lsevin/caddy/runtime}"

[[ "${EUID}" -eq 0 ]] || {
  echo 'Run this installer as root: sudo bash deployments/subdomains/install-host.sh' >&2
  exit 1
}

getent group docker >/dev/null 2>&1 || groupadd docker

# Secret environment files live in /etc; state and Caddy route fragments live in
# /var/lib. None of these directories is inside a Git checkout.
install -d -o root -g docker -m 2750 "${PROJECT_ENV_ROOT}"
install -d -o root -g docker -m 2775 "${STATE_ROOT}"
install -d -o root -g docker -m 2775 "${CADDY_RUNTIME_DIR}"

for app in crm providers shop; do
  install -d -o root -g docker -m 2775 "${STATE_ROOT}/${app}"

  source_example="${SCRIPT_DIR}/${app}/.env.example"
  destination_env="${PROJECT_ENV_ROOT}/${app}.env"
  if [[ ! -f "${destination_env}" ]]; then
    install -o root -g docker -m 0640 "${source_example}" "${destination_env}"
    echo "Created ${destination_env}; replace CHANGE_ME values before deployment."
  else
    echo "Preserved existing ${destination_env}."
  fi
done

# These initial route fragments preserve compatibility with the original
# single-container Compose files. The first successful blue-green deployment
# replaces each fragment atomically with its blue or green upstream.
create_route_if_missing() {
  local app="$1" legacy_upstream="$2" route_file
  route_file="${CADDY_RUNTIME_DIR}/${app}-upstream.caddy"
  if [[ ! -f "${route_file}" ]]; then
    cat > "${route_file}" <<ROUTE
# Bootstrap route created by deployments/subdomains/install-host.sh.
# It preserves the original single-container service until the first blue-green release.
reverse_proxy ${legacy_upstream}:3000 {
	lb_try_duration 5s
	fail_duration 30s
}
ROUTE
    chown root:docker "${route_file}"
    chmod 0644 "${route_file}"
    echo "Created ${route_file}."
  else
    echo "Preserved existing ${route_file}."
  fi
}

create_route_if_missing crm lsevin-crm-webapp
create_route_if_missing providers lsevin-providers-webapp
create_route_if_missing shop lsevin-shop-webapp

cat <<'NEXT'

Host preparation completed.

Next steps:
  1. Edit /etc/lsevin/projects/crm.env
  2. Edit /etc/lsevin/projects/providers.env
  3. Edit /etc/lsevin/projects/shop.env
  4. Update/recreate the main Caddy service once so it mounts
     /var/lib/lsevin/caddy/runtime and imports the three route fragments.
  5. Configure the three GitHub webhooks shown in BEGINNER_GUIDE.md.
  6. Rebuild/restart the Jenkins controller so JCasC creates all three jobs.
NEXT
