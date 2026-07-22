#!/usr/bin/env bash
# Deploy one LSevin subdomain with a blue-green traffic switch.
#
# Usage:
#   deploy-blue-green.sh crm lsevin-crm-webapp:release-a1b2c3d4
#   deploy-blue-green.sh providers lsevin-providers-webapp:release-a1b2c3d4
#   deploy-blue-green.sh shop lsevin-shop-webapp:release-a1b2c3d4
#
# The currently active slot continues serving traffic while the inactive slot is
# recreated. Caddy is reloaded only after Docker reports the new slot healthy.
set -Eeuo pipefail
umask 027

# Read the two required command-line arguments.
APP_NAME="${1:-}"
APP_IMAGE="${2:-}"

# Resolve paths relative to this script so it works from Jenkins or a terminal.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Server directories are outside Git so a checkout cannot delete runtime state.
STATE_ROOT="${LSEVIN_SUBDOMAIN_STATE_ROOT:-/var/lib/lsevin/subdomains}"
CADDY_RUNTIME_DIR="${LSEVIN_CADDY_RUNTIME_DIR:-/var/lib/lsevin/caddy/runtime}"
PROJECT_ENV_ROOT="${LSEVIN_PROJECT_ENV_ROOT:-/etc/lsevin/projects}"
DOCKER_NETWORK="${LSEVIN_DOCKER_NETWORK:-lsevin-network}"

# Time allowed for the application and public endpoint to become ready.
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-180}"
PUBLIC_CHECK_ATTEMPTS="${PUBLIC_CHECK_ATTEMPTS:-30}"
PUBLIC_CHECK_DELAY_SECONDS="${PUBLIC_CHECK_DELAY_SECONDS:-2}"
DRAIN_SECONDS="${DRAIN_SECONDS:-30}"
KEEP_PREVIOUS_SLOT="${KEEP_PREVIOUS_SLOT:-false}"

# Print a clearly separated deployment step.
say() { printf '\n=== %s ===\n' "$*"; }

# Return a failure without hiding the original message. Because `set -e` is on,
# the ERR trap below performs automatic route restoration when needed.
fail() { echo "ERROR: $*" >&2; return 1; }

# Confirm required programs before touching the running application.
for command_name in docker curl flock awk sed date mktemp; do
  command -v "${command_name}" >/dev/null 2>&1 \
    || fail "Required command is missing: ${command_name}"
done
docker compose version >/dev/null 2>&1 \
  || fail 'Docker Compose v2 plugin is required.'

# Convert the friendly app name to its domain, container prefix, and compose file.
case "${APP_NAME}" in
  crm)
    APP_DOMAIN="crm.lsevin.com"
    CONTAINER_PREFIX="lsevin-crm"
    COMPOSE_FILE="${SCRIPT_DIR}/crm/docker-compose.yml"
    ;;
  providers)
    APP_DOMAIN="providers.lsevin.com"
    CONTAINER_PREFIX="lsevin-providers"
    COMPOSE_FILE="${SCRIPT_DIR}/providers/docker-compose.yml"
    ;;
  shop)
    APP_DOMAIN="shop.lsevin.com"
    CONTAINER_PREFIX="lsevin-shop"
    COMPOSE_FILE="${SCRIPT_DIR}/shop/docker-compose.yml"
    ;;
  *)
    fail 'Usage: deploy-blue-green.sh crm|providers|shop IMAGE:TAG'
    ;;
esac

# An explicit immutable image tag is mandatory. Deploying :latest would make a
# rollback ambiguous because :latest can point to different image contents later.
[[ -n "${APP_IMAGE}" ]] || fail 'An IMAGE:TAG argument is required.'
[[ "${APP_IMAGE}" != *':latest' ]] \
  || fail 'Refusing the mutable :latest tag; use release-<commit> instead.'
[[ -f "${COMPOSE_FILE}" ]] || fail "Compose file is missing: ${COMPOSE_FILE}"
docker image inspect "${APP_IMAGE}" >/dev/null 2>&1 \
  || fail "Docker image does not exist locally: ${APP_IMAGE}"

# Each app has one server-owned runtime environment file.
APP_ENV_FILE="${APP_ENV_FILE:-${PROJECT_ENV_ROOT}/${APP_NAME}.env}"
[[ -f "${APP_ENV_FILE}" ]] \
  || fail "Runtime environment file is missing: ${APP_ENV_FILE}"

# Read one exact KEY=value entry without executing the file as shell code.
env_value() {
  local key="$1"
  awk -F= -v wanted="${key}" '
    $0 !~ /^[[:space:]]*#/ && $1 == wanted {
      sub(/^[^=]*=/, ""); value=$0
    }
    END { print value }
  ' "${APP_ENV_FILE}"
}

# Use the configured URL, or fall back to the app's canonical HTTPS domain.
PUBLIC_HEALTHCHECK_URL="$(env_value PUBLIC_HEALTHCHECK_URL)"
PUBLIC_HEALTHCHECK_URL="${PUBLIC_HEALTHCHECK_URL:-https://${APP_DOMAIN}/}"

# Keep deployment state and locks separate for CRM, Providers, and Shop so the
# three Jenkins jobs can deploy independently.
APP_STATE_DIR="${STATE_ROOT}/${APP_NAME}"
ACTIVE_SLOT_FILE="${APP_STATE_DIR}/active-slot"
ACTIVE_IMAGE_FILE="${APP_STATE_DIR}/active-image"
RELEASE_HISTORY_FILE="${APP_STATE_DIR}/releases.tsv"
LOCK_FILE="${APP_STATE_DIR}/deploy.lock"
ROUTE_FILE="${CADDY_RUNTIME_DIR}/${APP_NAME}-upstream.caddy"
mkdir -p "${APP_STATE_DIR}" "${CADDY_RUNTIME_DIR}"

# Only one deployment of the same application may run at a time.
exec 9>"${LOCK_FILE}"
flock -n 9 || fail "Another ${APP_NAME} deployment is already running."

# Determine which slot is active, then choose the other slot as the target.
CURRENT_SLOT=""
if [[ -f "${ACTIVE_SLOT_FILE}" ]]; then
  CURRENT_SLOT="$(tr -d '[:space:]' < "${ACTIVE_SLOT_FILE}")"
fi
case "${CURRENT_SLOT}" in
  blue) TARGET_SLOT='green' ;;
  green) TARGET_SLOT='blue' ;;
  '') TARGET_SLOT='blue' ;;
  *) fail "Invalid active slot in ${ACTIVE_SLOT_FILE}: ${CURRENT_SLOT}" ;;
esac

TARGET_CONTAINER="${CONTAINER_PREFIX}-${TARGET_SLOT}"
CURRENT_CONTAINER="${CONTAINER_PREFIX}-${CURRENT_SLOT:-blue}"
TARGET_PROJECT="lsevin-${APP_NAME}-${TARGET_SLOT}"
CURRENT_PROJECT="lsevin-${APP_NAME}-${CURRENT_SLOT:-blue}"
APP_VERSION="${APP_VERSION:-${APP_IMAGE##*:}}"

# Compose needs these exported values for ${...} interpolation.
export APP_IMAGE APP_ENV_FILE APP_VERSION DEPLOY_SLOT="${TARGET_SLOT}"
export LSEVIN_DOCKER_NETWORK="${DOCKER_NETWORK}"

# Run Docker Compose for a specific slot. The image argument is still exported
# when `down` is called because Compose parses the entire file before acting.
compose_for_slot() {
  local slot="$1"
  shift
  DEPLOY_SLOT="${slot}" docker compose \
    --project-name "lsevin-${APP_NAME}-${slot}" \
    --env-file "${APP_ENV_FILE}" \
    -f "${COMPOSE_FILE}" \
    "$@"
}

# Locate the production Caddy service on the shared Docker network without
# depending on a fragile generated container name such as docker-caddy-1.
find_caddy_container() {
  local candidate address
  while IFS= read -r candidate; do
    [[ -n "${candidate}" ]] || continue
    address="$(docker inspect --format \
      "{{with index .NetworkSettings.Networks \"${DOCKER_NETWORK}\"}}{{.IPAddress}}{{end}}" \
      "${candidate}" 2>/dev/null || true)"
    if [[ -n "${address}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done < <(docker ps --filter 'label=com.docker.compose.service=caddy' --format '{{.ID}}')
  return 1
}

# Wait until Docker's health check marks the target slot healthy.
wait_for_container_health() {
  local deadline status
  deadline=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
  while (( SECONDS < deadline )); do
    status="$(docker inspect --format \
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      "${TARGET_CONTAINER}" 2>/dev/null || true)"
    case "${status}" in
      healthy|running)
        echo "Target container status: ${status}"
        return 0
        ;;
      unhealthy|exited|dead)
        docker logs --tail=200 "${TARGET_CONTAINER}" >&2 || true
        fail "Target container entered terminal state: ${status}"
        ;;
    esac
    sleep 2
  done
  docker logs --tail=200 "${TARGET_CONTAINER}" >&2 || true
  fail "Timed out waiting for ${TARGET_CONTAINER} to become healthy."
}

# Caddy reloads are graceful: the listener remains open while the new routing
# configuration replaces the old one.
reload_caddy() {
  docker exec "${CADDY_CONTAINER}" \
    caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  docker exec "${CADDY_CONTAINER}" \
    caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
}

# Verify the public HTTPS route after the switch. Redirects are healthy; 4xx/5xx
# responses are not accepted because they can hide a broken application route.
wait_for_public_health() {
  local attempt code
  for attempt in $(seq 1 "${PUBLIC_CHECK_ATTEMPTS}"); do
    code="$(curl --silent --show-error --location --max-time 20 \
      --output /dev/null --write-out '%{http_code}' \
      "${PUBLIC_HEALTHCHECK_URL}" || true)"
    echo "Public check ${attempt}/${PUBLIC_CHECK_ATTEMPTS}: HTTP ${code:-000} ${PUBLIC_HEALTHCHECK_URL}"
    if [[ "${code}" =~ ^[23][0-9][0-9]$ ]]; then
      return 0
    fi
    sleep "${PUBLIC_CHECK_DELAY_SECONDS}"
  done
  fail "Public health check failed: ${PUBLIC_HEALTHCHECK_URL}"
}

# Save the old route before changing the runtime file. The ERR trap uses this
# backup to put public traffic back on the previous slot if any later step fails.
ROUTE_BACKUP="$(mktemp)"
ROUTE_EXISTED=false
if [[ -f "${ROUTE_FILE}" ]]; then
  cp "${ROUTE_FILE}" "${ROUTE_BACKUP}"
  ROUTE_EXISTED=true
fi
ROUTE_SWITCHED=false

# Record the currently active image for audit and rollback history.
CURRENT_IMAGE=""
if [[ -n "${CURRENT_SLOT}" ]] && docker container inspect "${CURRENT_CONTAINER}" >/dev/null 2>&1; then
  CURRENT_IMAGE="$(docker inspect --format '{{.Config.Image}}' "${CURRENT_CONTAINER}")"
elif [[ -f "${ACTIVE_IMAGE_FILE}" ]]; then
  CURRENT_IMAGE="$(tr -d '[:space:]' < "${ACTIVE_IMAGE_FILE}")"
fi

# Automatically restore the previous route and remove the failed target slot.
on_error() {
  local exit_code=$?
  trap - ERR
  echo "Deployment failed; restoring the previous ${APP_NAME} route." >&2
  if [[ "${ROUTE_SWITCHED}" == true ]]; then
    if [[ "${ROUTE_EXISTED}" == true ]]; then
      cp "${ROUTE_BACKUP}" "${ROUTE_FILE}"
    else
      rm -f "${ROUTE_FILE}"
    fi
    reload_caddy || true
  fi
  compose_for_slot "${TARGET_SLOT}" logs --tail=200 web >&2 || true
  compose_for_slot "${TARGET_SLOT}" down --remove-orphans || true
  rm -f "${ROUTE_BACKUP}"
  exit "${exit_code}"
}
trap on_error ERR

say "Preflight for ${APP_NAME}"
docker info >/dev/null
docker network inspect "${DOCKER_NETWORK}" >/dev/null
CADDY_CONTAINER="$(find_caddy_container)" \
  || fail "No running Caddy container was found on ${DOCKER_NETWORK}."
printf 'Current slot: %s\n' "${CURRENT_SLOT:-none}"
printf 'Target slot:  %s\n' "${TARGET_SLOT}"
printf 'Image:        %s\n' "${APP_IMAGE}"
printf 'Caddy:        %s\n' "${CADDY_CONTAINER}"

say "Start inactive ${TARGET_SLOT} slot"
compose_for_slot "${TARGET_SLOT}" config --quiet
compose_for_slot "${TARGET_SLOT}" up -d --no-build --force-recreate web
wait_for_container_health

say 'Create and validate the new Caddy route'
ROUTE_CANDIDATE="$(mktemp "${CADDY_RUNTIME_DIR}/.${APP_NAME}-upstream.XXXXXX")"
cat > "${ROUTE_CANDIDATE}" <<ROUTE
# Managed automatically by deployments/subdomains/deploy-blue-green.sh.
# Active application: ${APP_NAME}; slot: ${TARGET_SLOT}; image: ${APP_IMAGE}
reverse_proxy ${CONTAINER_PREFIX}-${TARGET_SLOT}:3000 {
	lb_try_duration 5s
	fail_duration 30s
}
ROUTE
chmod 0644 "${ROUTE_CANDIDATE}"
mv -f "${ROUTE_CANDIDATE}" "${ROUTE_FILE}"
ROUTE_SWITCHED=true
reload_caddy

say 'Verify public traffic on the new slot'
wait_for_public_health

# The route and public check succeeded, so this release becomes the active state.
printf '%s\n' "${TARGET_SLOT}" > "${ACTIVE_SLOT_FILE}.tmp"
mv -f "${ACTIVE_SLOT_FILE}.tmp" "${ACTIVE_SLOT_FILE}"
printf '%s\n' "${APP_IMAGE}" > "${ACTIVE_IMAGE_FILE}.tmp"
mv -f "${ACTIVE_IMAGE_FILE}.tmp" "${ACTIVE_IMAGE_FILE}"
printf '%s\t%s\t%s\t%s\t%s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${TARGET_SLOT}" "${APP_IMAGE}" "${CURRENT_SLOT:-none}" "${CURRENT_IMAGE:-none}" \
  >> "${RELEASE_HISTORY_FILE}"

# At this point rollback restoration is no longer needed.
ROUTE_SWITCHED=false
trap - ERR
rm -f "${ROUTE_BACKUP}"

# Caddy's graceful reload lets existing requests finish. Keep the previous slot
# for the drain interval, or indefinitely when fast rollback is preferred.
if [[ -n "${CURRENT_SLOT}" && "${CURRENT_SLOT}" != "${TARGET_SLOT}" ]]; then
  if [[ "${KEEP_PREVIOUS_SLOT}" == true ]]; then
    echo "Previous ${CURRENT_SLOT} slot remains running for instant rollback."
  else
    say "Drain the previous ${CURRENT_SLOT} slot for ${DRAIN_SECONDS}s"
    sleep "${DRAIN_SECONDS}"
    compose_for_slot "${CURRENT_SLOT}" down --remove-orphans
  fi
fi

say "${APP_NAME} deployment completed"
printf 'Domain:      https://%s\n' "${APP_DOMAIN}"
printf 'Active slot: %s\n' "${TARGET_SLOT}"
printf 'Image:       %s\n' "${APP_IMAGE}"
printf 'History:     %s\n' "${RELEASE_HISTORY_FILE}"
