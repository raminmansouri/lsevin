#!/usr/bin/env bash
set -Eeuo pipefail

# Runs on the production server as the Jenkins service user.
# It deploys only the repository revision already checked out by Jenkins.

SOURCE_DIR="${WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
APP_DIR="${APP_DIR:-/opt/lsevin/app}"
DOCKER_DIR="${APP_DIR}/deployments/docker"
ENV_FILE="${DOCKER_DIR}/.env"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-docker}"
BACKUP_DIR="${LSEVIN_BACKUP_DIR:-/opt/lsevin/backups}/predeploy"
LOCK_FILE="${LSEVIN_DEPLOY_LOCK:-/opt/lsevin/jenkins/deploy.lock}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-Lsevin-New}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_ROOT="${LSEVIN_RELEASE_ROOT:-/opt/lsevin/releases}"

say() { printf '\n=== %s ===\n' "$*"; }
fail() { echo "ERROR: $*" >&2; exit 1; }

command -v git >/dev/null || fail 'git is required.'
command -v rsync >/dev/null || fail 'rsync is required.'
command -v docker >/dev/null || fail 'docker is required.'
command -v flock >/dev/null || fail 'flock is required.'
command -v curl >/dev/null || fail 'curl is required.'
docker compose version >/dev/null || fail 'Docker Compose plugin is required.'

CURRENT_BRANCH="${BRANCH_NAME:-${GIT_BRANCH:-}}"
CURRENT_BRANCH="${CURRENT_BRANCH#origin/}"
CURRENT_BRANCH="${CURRENT_BRANCH#remotes/origin/}"
if [[ -z "${CURRENT_BRANCH}" || "${CURRENT_BRANCH}" == "HEAD" ]]; then
  CURRENT_BRANCH="$(git -C "${SOURCE_DIR}" branch --show-current)"
fi
[[ "${CURRENT_BRANCH}" == "${DEPLOY_BRANCH}" ]] || fail "Refusing deployment from ${CURRENT_BRANCH:-unknown}; expected ${DEPLOY_BRANCH}."

mkdir -p "$(dirname "${LOCK_FILE}")" "${APP_DIR}" "${BACKUP_DIR}"
exec 9>"${LOCK_FILE}"
flock -n 9 || fail 'Another LSevin deployment is already running.'

# The live secret file is never copied from Git/Jenkins workspace.
[[ -f "${ENV_FILE}" ]] || fail "Missing production secrets file: ${ENV_FILE}. Copy .env.example once and fill it manually."

env_value() {
  local key="$1"
  awk -F= -v key="${key}" '$1 == key {sub(/^[^=]*=/, ""); value=$0} END {print value}' "${ENV_FILE}"
}

GIT_SHA="$(git -C "${SOURCE_DIR}" rev-parse HEAD)"
SHORT_SHA="$(git -C "${SOURCE_DIR}" rev-parse --short=12 HEAD)"
UPLOADS_DIR="${LSEVIN_UPLOADS_DIR:-$(env_value LSEVIN_UPLOADS_DIR)}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/lsevin/uploads}"
UPLOAD_BACKUP_DIR="${LSEVIN_UPLOAD_BACKUP_DIR:-$(env_value LSEVIN_UPLOAD_BACKUP_DIR)}"
UPLOAD_BACKUP_DIR="${UPLOAD_BACKUP_DIR:-/var/backups/lsevin/uploads}"
UPLOADS_REAL="$(realpath -m "${UPLOADS_DIR}")"
APP_REAL="$(realpath -m "${APP_DIR}")"
SOURCE_REAL="$(realpath -m "${SOURCE_DIR}")"
case "${UPLOADS_REAL}/" in
  "${APP_REAL}/"*|"${SOURCE_REAL}/"*|/var/lib/jenkins/*)
    fail "LSEVIN_UPLOADS_DIR must be outside all Git/Jenkins directories: ${UPLOADS_REAL}"
    ;;
esac
[[ -d "${UPLOADS_REAL}" ]] || fail "Stable upload directory is missing: ${UPLOADS_REAL}. Run migrate-upload-storage.sh first."
mkdir -p "${RELEASE_ROOT}"

compose() {
  docker compose \
    --project-name "${COMPOSE_PROJECT_NAME}" \
    --env-file "${ENV_FILE}" \
    -f "${DOCKER_DIR}/docker-compose.server.yml" \
    "$@"
}

rollback_tag() {
  local service="$1" image_name="$2" container_id image_id
  container_id="$(compose ps -q "${service}" 2>/dev/null || true)"
  [[ -n "${container_id}" ]] || return 0
  image_id="$(docker inspect --format '{{.Image}}' "${container_id}")"
  docker image tag "${image_id}" "${image_name}:rollback-${TIMESTAMP}"
  echo "Saved rollback image ${image_name}:rollback-${TIMESTAMP}"
}

say 'Preflight'
docker info >/dev/null
compose config --quiet
printf 'Commit: %s\n' "${GIT_SHA}"
printf 'Branch: %s\n' "${CURRENT_BRANCH}"
printf 'Stable uploads: %s\n' "${UPLOADS_REAL}"

say 'Snapshot uploaded media before deployment'
[[ -x /usr/local/sbin/lsevin-upload-backup ]] \
  || fail 'Upload backup command is missing. Run the Ansible media playbook first.'
MEDIA_BACKUP_OUTPUT="$(sudo -n /usr/local/sbin/lsevin-upload-backup "predeploy-${SHORT_SHA}")"
printf '%s\n' "${MEDIA_BACKUP_OUTPUT}"
MEDIA_SNAPSHOT="$(awk -F= '$1 == "SNAPSHOT" {print $2}' <<<"${MEDIA_BACKUP_OUTPUT}" | tail -1)"
[[ -n "${MEDIA_SNAPSHOT}" && -d "${MEDIA_SNAPSHOT}" ]] \
  || fail 'Media backup did not return a verified snapshot path.'

say 'Synchronize repository to the stable production directory'
# Running containers continue using their current images during this file sync.
# The live .env and GeoIP database are intentionally preserved on the server.
rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='bin/' \
  --exclude='obj/' \
  --exclude='/app/uploads/' \
  --exclude='/app/UploadFiles/' \
  --exclude='UploadFiles/' \
  --exclude='*.log' \
  --exclude='*.sql' \
  --exclude='auto_backups/' \
  --exclude='deployments/docker/.env' \
  --exclude='deployments/docker/geoip/' \
  --exclude='.env.local' \
  --exclude='.env.*.local' \
  "${SOURCE_DIR}/" "${APP_DIR}/"

[[ -f "${ENV_FILE}" ]] || fail 'Production .env disappeared after synchronization; deployment stopped.'
compose config --quiet

say 'Build production images while current containers continue serving traffic'
# A failed build stops here before any database migration or container replacement.
compose build --pull lsevin-api lsevin-webapp caddy

say 'Tag immutable images for commit rollback'
docker image tag lsevin-api:server "lsevin-api:release-${SHORT_SHA}"
docker image tag lsevin-webapp:server "lsevin-webapp:release-${SHORT_SHA}"
docker image tag lsevin-caddy:geoip "lsevin-caddy:release-${SHORT_SHA}"

say 'Verify Ansible-managed stateful dependencies'
# Never let an application commit recreate PostgreSQL/PgBouncer. Ansible owns
# their image, config, host tuning, and backup lifecycle. --no-recreate starts a
# missing service but leaves a running stateful container unchanged.
compose up -d --no-recreate postgres pgbouncer redis eventstore postgres-exporter pgbouncer-exporter
for service in postgres pgbouncer; do
  container_id="$(compose ps -q "${service}")"
  [[ -n "${container_id}" ]] || fail "${service} is not running. Run the Ansible database playbook first."
done

say 'Database backup before migration/deployment'
BACKUP_FILE="${BACKUP_DIR}/predeploy-${TIMESTAMP}.sql.gz"
compose exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "${BACKUP_FILE}"
BACKUP_SIZE="$(stat -c '%s' "${BACKUP_FILE}")"
[[ "${BACKUP_SIZE}" -ge 10240 ]] || fail "Database backup is unexpectedly small (${BACKUP_SIZE} bytes): ${BACKUP_FILE}"
gzip -t "${BACKUP_FILE}"
echo "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"

say 'Save rollback image tags'
rollback_tag lsevin-api lsevin-api
rollback_tag lsevin-webapp lsevin-webapp
rollback_tag caddy lsevin-caddy

say 'Apply idempotent SQL migrations'
if compgen -G "${SOURCE_DIR}/scripts/sql/*.sql" >/dev/null; then
  for migration in "${SOURCE_DIR}"/scripts/sql/*.sql; do
    echo "Applying $(basename "${migration}")"
    compose exec -T postgres sh -lc \
      'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
      < "${migration}"
  done
else
  echo 'No scripts/sql/*.sql files found; skipping SQL migration stage.'
fi

say 'Recreate application containers'
compose up -d --no-deps lsevin-api
compose up -d --no-deps lsevin-webapp
compose up -d --no-deps caddy

say 'Wait for backend readiness'
for attempt in $(seq 1 30); do
  if compose exec -T caddy wget -qO- http://lsevin-api:8080/readiness >/dev/null 2>&1; then
    echo 'API is ready.'
    break
  fi
  if [[ "${attempt}" -eq 30 ]]; then
    compose ps
    compose logs --tail=150 lsevin-api
    fail 'API readiness check did not pass.'
  fi
  sleep 2
done

say 'Public health checks'
APP_DOMAIN="$(grep -E '^APP_DOMAIN=' "${ENV_FILE}" | tail -1 | cut -d= -f2- || true)"
API_DOMAIN="$(grep -E '^API_DOMAIN=' "${ENV_FILE}" | tail -1 | cut -d= -f2- || true)"
APP_DOMAIN="${APP_DOMAIN:-appmain.lsevin.com}"
API_DOMAIN="${API_DOMAIN:-api.lsevin.com}"

check_url() {
  local url="$1" expected_pattern="$2" code
  code="$(curl --silent --show-error --location --max-time 30 --output /dev/null --write-out '%{http_code}' "${url}")"
  echo "${code}  ${url}"
  [[ "${code}" =~ ${expected_pattern} ]] || fail "Unexpected HTTP status ${code} for ${url}"
}

check_url "https://${API_DOMAIN}/readiness" '^(200)$'
check_url "https://${APP_DOMAIN}/fa" '^(200|301|302|307|308)$'

say 'Record stable release'
RELEASE_DIR="${RELEASE_ROOT}/${TIMESTAMP}-${SHORT_SHA}"
install -d -m 2775 "${RELEASE_DIR}"
git -C "${SOURCE_DIR}" archive --format=tar "${GIT_SHA}" | gzip -9 > "${RELEASE_DIR}/source.tar.gz"
cat > "${RELEASE_DIR}/release.env" <<RELEASE
STATUS=stable
COMMIT=${GIT_SHA}
SHORT_COMMIT=${SHORT_SHA}
BRANCH=${CURRENT_BRANCH}
DEPLOYED_UTC=${TIMESTAMP}
API_IMAGE=lsevin-api:release-${SHORT_SHA}
WEBAPP_IMAGE=lsevin-webapp:release-${SHORT_SHA}
CADDY_IMAGE=lsevin-caddy:release-${SHORT_SHA}
DATABASE_BACKUP=${BACKUP_FILE}
MEDIA_SNAPSHOT=${MEDIA_SNAPSHOT}
RELEASE
ln -sfn "$(basename "${RELEASE_DIR}")" "${RELEASE_ROOT}/current"

say 'Deployment complete'
compose ps
printf 'Rollback images use tag suffix: rollback-%s\n' "${TIMESTAMP}"
printf 'Database backup: %s\n' "${BACKUP_FILE}"
printf 'Media snapshot: %s\n' "${MEDIA_SNAPSHOT}"
printf 'Stable release: %s\n' "${RELEASE_DIR}"

# Keep a practical rolling history without allowing unattended backups to fill disk.
find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'predeploy-*.sql.gz' -mtime +30 -delete
