#!/usr/bin/env bash
# Validate committed deployment files without reading production secrets.
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_DIR="${ROOT_DIR}/deployments/docker"
SUBDOMAIN_DIR="${ROOT_DIR}/deployments/subdomains"
REPORT_DIR="${ROOT_DIR}/deployments/jenkins/reports"
mkdir -p "${REPORT_DIR}"

required_files=(
  "${ROOT_DIR}/Jenkinsfile"
  "${DOCKER_DIR}/docker-compose.server.yml"
  "${DOCKER_DIR}/Caddyfile.server"
  "${ROOT_DIR}/frontend/webapp/Dockerfile"
  "${ROOT_DIR}/src/API/LSevin.Api/Dockerfile"
  "${DOCKER_DIR}/postgres/Dockerfile"
  "${ROOT_DIR}/deployments/ansible/playbooks/site.yml"
  "${ROOT_DIR}/deployments/ansible/requirements.yml"
  "${SUBDOMAIN_DIR}/shop/docker-compose.yml"
  "${SUBDOMAIN_DIR}/shop/Dockerfile"
  "${SUBDOMAIN_DIR}/shop/Jenkinsfile"
  "${SUBDOMAIN_DIR}/shop/health-route.ts"
  "${SUBDOMAIN_DIR}/crm/docker-compose.yml"
  "${SUBDOMAIN_DIR}/crm/Dockerfile"
  "${SUBDOMAIN_DIR}/crm/Jenkinsfile"
  "${SUBDOMAIN_DIR}/crm/health-route.ts"
)

for file in "${required_files[@]}"; do
  [[ -f "${file}" ]] || { echo "Missing required file: ${file}" >&2; exit 1; }
done

command -v docker >/dev/null 2>&1 || { echo 'docker is required on the Jenkins agent.' >&2; exit 1; }
docker compose version >/dev/null
command -v jq >/dev/null 2>&1 || { echo 'jq is required on the Jenkins agent.' >&2; exit 1; }

# The production .env remains only on the server. Compose validation uses example
# values and never prints or reads live secrets.
docker compose \
  --project-name docker \
  --env-file "${DOCKER_DIR}/.env.example" \
  -f "${DOCKER_DIR}/docker-compose.server.yml" \
  config --quiet

# Validate the two remaining contract-only two-replica Compose files (crm, shop)
# with harmless example values. Providers is superseded — see
# deployments/subdomains/providers/README.md — and validated by its own repo.
for app in crm shop; do
  IMAGE_TAG="validation" \
  docker compose \
    --project-name "lsevin-${app}-validation" \
    --env-file "${SUBDOMAIN_DIR}/${app}/.env.example" \
    -f "${SUBDOMAIN_DIR}/${app}/docker-compose.yml" \
    config --quiet
done

# Build only database infrastructure services that actually exist in this
# compose revision. Some branches contain PgBouncer; older branches contain only
# PostgreSQL. Validation follows the file instead of assuming either layout.
mapfile -t compose_services < <(
  docker compose \
    --project-name docker-validation \
    --env-file "${DOCKER_DIR}/.env.example" \
    -f "${DOCKER_DIR}/docker-compose.server.yml" \
    config --services
)
for service in postgres pgbouncer; do
  if printf '%s\n' "${compose_services[@]}" | grep -Fxq "${service}"; then
    docker compose \
      --project-name docker-validation \
      --env-file "${DOCKER_DIR}/.env.example" \
      -f "${DOCKER_DIR}/docker-compose.server.yml" \
      build "${service}"
  fi
done

# Caddy points directly to two fixed container names; no runtime fragments are required.

docker build \
  --quiet \
  --file "${DOCKER_DIR}/caddy.Dockerfile" \
  --tag lsevin-caddy:jenkins-validation \
  "${DOCKER_DIR}" > "${REPORT_DIR}/caddy-image-id.txt"

docker run --rm \
  --env CADDY_ACME_EMAIL=admin@lsevin.com \
  --env APP_DOMAIN=appmain.lsevin.com \
  --env API_DOMAIN=api.lsevin.com \
  --env PROVIDERS_DOMAIN=providers.lsevin.com \
  --env SHOP_DOMAIN=shop.lsevin.com \
  --env CRM_DOMAIN=crm.lsevin.com \
  --env JENKINS_DOMAIN=devops.lsevin.com \
  lsevin-caddy:jenkins-validation \
  caddy adapt --config /etc/caddy/Caddyfile --adapter caddyfile --pretty \
  > "${REPORT_DIR}/caddy-adapted.json"

jq empty "${REPORT_DIR}/caddy-adapted.json"

# Parse every shell script before a commit can be deployed.
while IFS= read -r -d '' script; do
  case "$(head -n 1 "${script}")" in
    *'/sh') sh -n "${script}" ;;
    *) bash -n "${script}" ;;
  esac
done < <(find "${ROOT_DIR}/deployments" -type f -name '*.sh' -print0)

# Production media must be on a stable host directory, never a named volume or a
# path inside a Git checkout. FileUploadOptions:UploadDirectory is UploadFiles, so
# only that mount is expected; the old /app/uploads mount was dead weight and was
# removed deliberately (see the comment above the lsevin-api volumes: key).
grep -F '${LSEVIN_UPLOADS_DIR:-/var/lib/lsevin/uploads}:/app/UploadFiles' \
  "${DOCKER_DIR}/docker-compose.server.yml" >/dev/null
if grep -Eq '(/opt/lsevin/(app|new).*(uploads|UploadFiles)|uploads:/app/UploadFiles)' \
  "${DOCKER_DIR}/docker-compose.server.yml"; then
  echo 'Production uploads are still coupled to a checkout or named volume.' >&2
  exit 1
fi

if command -v ansible-playbook >/dev/null 2>&1; then
  ANSIBLE_CONFIG="${ROOT_DIR}/deployments/ansible/ansible.cfg" \
    ansible-playbook --syntax-check \
    -i "${ROOT_DIR}/deployments/ansible/inventory/example/hosts.yml" \
    "${ROOT_DIR}/deployments/ansible/playbooks/site.yml"
else
  echo 'ansible-playbook not installed on Jenkins agent; syntax check skipped.'
fi

if command -v ansible-lint >/dev/null 2>&1; then
  (
    cd "${ROOT_DIR}/deployments/ansible"
    ANSIBLE_CONFIG="$PWD/ansible.cfg" ansible-lint playbooks roles
  )
fi

echo 'Configuration validation passed.'
