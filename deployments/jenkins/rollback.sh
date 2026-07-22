#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

SELECTION="${1:-}"
[[ -n "${SELECTION}" ]] || {
  echo "Usage: $0 <commit-prefix|release-directory>" >&2
  echo "Example: $0 a1b2c3d4" >&2
  exit 1
}

APP_DIR="${APP_DIR:-/opt/lsevin/app}"
RELEASE_ROOT="${LSEVIN_RELEASE_ROOT:-/opt/lsevin/releases}"
DOCKER_DIR="${APP_DIR}/deployments/docker"
ENV_FILE="${DOCKER_DIR}/.env"
PROJECT="${COMPOSE_PROJECT_NAME:-docker}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOCK_FILE="${LSEVIN_DEPLOY_LOCK:-/opt/lsevin/jenkins/deploy.lock}"

fail() { echo "ERROR: $*" >&2; exit 1; }
say() { printf '\n=== %s ===\n' "$*"; }
for command_name in docker rsync gzip tar flock curl; do
  command -v "${command_name}" >/dev/null 2>&1 || fail "${command_name} is required"
done
docker compose version >/dev/null || fail 'Docker Compose plugin is required'
[[ -f "${ENV_FILE}" ]] || fail "missing production environment: ${ENV_FILE}"

mkdir -p "$(dirname "${LOCK_FILE}")"
exec 9>"${LOCK_FILE}"
flock -n 9 || fail 'another deployment or rollback is already running'

resolve_release() {
  local selection="$1" candidate matches=()
  if [[ -d "${selection}" && -f "${selection}/release.env" ]]; then
    realpath "${selection}"
    return
  fi
  if [[ -d "${RELEASE_ROOT}/${selection}" && -f "${RELEASE_ROOT}/${selection}/release.env" ]]; then
    realpath "${RELEASE_ROOT}/${selection}"
    return
  fi
  while IFS= read -r candidate; do
    # shellcheck disable=SC1090
    source "${candidate}/release.env"
    if [[ "${candidate##*/}" == *"${selection}"* || "${COMMIT:-}" == "${selection}"* || "${SHORT_COMMIT:-}" == "${selection}"* ]]; then
      matches+=("${candidate}")
    fi
  done < <(find "${RELEASE_ROOT}" -mindepth 1 -maxdepth 1 -type d -name '*-*' | sort -r)
  [[ "${#matches[@]}" -eq 1 ]] || {
    echo "Release selector matched ${#matches[@]} releases:" >&2
    printf '  %s\n' "${matches[@]:-}" >&2
    return 1
  }
  realpath "${matches[0]}"
}

TARGET_RELEASE="$(resolve_release "${SELECTION}")" || fail 'use a unique commit prefix or exact release directory'
# shellcheck disable=SC1090
source "${TARGET_RELEASE}/release.env"
[[ "${STATUS:-}" == stable ]] || fail "release is not marked stable: ${TARGET_RELEASE}"
[[ -s "${TARGET_RELEASE}/source.tar.gz" ]] || fail 'release source archive is missing'
for image in "${API_IMAGE}" "${WEBAPP_IMAGE}" "${CADDY_IMAGE}"; do
  docker image inspect "${image}" >/dev/null || fail "rollback image is missing: ${image}"
done

compose() {
  docker compose --project-name "${PROJECT}" --env-file "${ENV_FILE}" \
    -f "${DOCKER_DIR}/docker-compose.server.yml" "$@"
}

PREVIOUS_RELEASE="$(readlink -f "${RELEASE_ROOT}/current" 2>/dev/null || true)"
RESCUE_API_ID="$(docker image inspect --format '{{.Id}}' lsevin-api:server)"
RESCUE_WEBAPP_ID="$(docker image inspect --format '{{.Id}}' lsevin-webapp:server)"
RESCUE_CADDY_ID="$(docker image inspect --format '{{.Id}}' lsevin-caddy:geoip)"
docker image tag "${RESCUE_API_ID}" "lsevin-api:rollback-rescue-${TIMESTAMP}"
docker image tag "${RESCUE_WEBAPP_ID}" "lsevin-webapp:rollback-rescue-${TIMESTAMP}"
docker image tag "${RESCUE_CADDY_ID}" "lsevin-caddy:rollback-rescue-${TIMESTAMP}"

restore_source_archive() {
  local release_dir="$1" temp
  [[ -s "${release_dir}/source.tar.gz" ]] || return 1
  temp="$(mktemp -d)"
  gzip -dc "${release_dir}/source.tar.gz" | tar -xf - -C "${temp}"
  rsync -a --delete \
    --exclude='deployments/docker/.env' \
    --exclude='deployments/docker/geoip/' \
    --exclude='/app/uploads/' \
    --exclude='/app/UploadFiles/' \
    "${temp}/" "${APP_DIR}/"
  rm -rf "${temp}"
}

rollback_rescue() {
  rc=$?
  trap - ERR
  echo 'Rollback failed; restoring the previously running application images.' >&2
  if [[ -n "${PREVIOUS_RELEASE}" && -d "${PREVIOUS_RELEASE}" ]]; then
    restore_source_archive "${PREVIOUS_RELEASE}" || true
  fi
  docker image tag "${RESCUE_API_ID}" lsevin-api:server || true
  docker image tag "${RESCUE_WEBAPP_ID}" lsevin-webapp:server || true
  docker image tag "${RESCUE_CADDY_ID}" lsevin-caddy:geoip || true
  compose up -d --no-deps --no-build --force-recreate lsevin-api lsevin-webapp caddy || true
  exit "${rc}"
}
trap rollback_rescue ERR

say 'Create safety backups before rollback'
if [[ -x /usr/local/sbin/lsevin-upload-backup ]]; then
  sudo -n /usr/local/sbin/lsevin-upload-backup "pre-rollback-${TIMESTAMP}"
fi
ROLLBACK_DB_BACKUP="/opt/lsevin/backups/predeploy/pre-rollback-${TIMESTAMP}.sql.gz"
compose exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "${ROLLBACK_DB_BACKUP}"
gzip -t "${ROLLBACK_DB_BACKUP}"

say "Restore tracked files for commit ${COMMIT}"
restore_source_archive "${TARGET_RELEASE}"
[[ -f "${ENV_FILE}" ]] || fail 'production .env was not preserved'

say 'Select immutable release images'
docker image tag "${API_IMAGE}" lsevin-api:server
docker image tag "${WEBAPP_IMAGE}" lsevin-webapp:server
docker image tag "${CADDY_IMAGE}" lsevin-caddy:geoip
compose config --quiet
compose up -d --no-deps --no-build --force-recreate lsevin-api lsevin-webapp caddy

say 'Verify rollback health'
for attempt in $(seq 1 30); do
  if compose exec -T caddy wget -qO- http://lsevin-api:8080/readiness >/dev/null 2>&1; then
    break
  fi
  [[ "${attempt}" -lt 30 ]] || fail 'API readiness failed after rollback'
  sleep 2
done
API_DOMAIN="$(awk -F= '$1 == "API_DOMAIN" {print $2}' "${ENV_FILE}" | tail -1)"
API_DOMAIN="${API_DOMAIN:-api.lsevin.com}"
curl --fail --silent --show-error --location --max-time 30 \
  "https://${API_DOMAIN}/readiness" >/dev/null

ln -sfn "$(basename "${TARGET_RELEASE}")" "${RELEASE_ROOT}/current"
trap - ERR

cat <<SUMMARY
Rollback completed.
Release: ${TARGET_RELEASE}
Commit: ${COMMIT}
Database was not rolled back automatically.
Pre-rollback database backup: ${ROLLBACK_DB_BACKUP}
Uploaded media remained in external stable storage.
SUMMARY
