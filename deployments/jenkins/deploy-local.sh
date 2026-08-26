#!/usr/bin/env bash
set -Eeuo pipefail

# Runs on the production server as the Jenkins service user.
# It deploys only the repository revision already checked out by Jenkins.

SOURCE_DIR="${WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
APP_DIR="${APP_DIR:-/opt/lsevin/app}"
# Matches rollback.sh's DOCKER_DIR/.env convention and DEVOPS_GUIDE.md/FIRST-RUN.md.
# (Providers/shop/crm are separate deployments that use /etc/lsevin/projects/*.env;
# the main platform app has always used the repo-relative .env instead.)
PROD_ENV_FILE="${PROD_ENV_FILE:-${APP_DIR}/deployments/docker/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-deployments/docker/docker-compose.server.yml}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-docker}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-Lsevin-New}"

SOURCE_COMPOSE_FILE="${SOURCE_DIR}/${COMPOSE_FILE}"
LIVE_COMPOSE_FILE="${APP_DIR}/${COMPOSE_FILE}"
ENV_FILE="${PROD_ENV_FILE}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT}"

BACKUP_DIR="${LSEVIN_BACKUP_DIR:-/opt/lsevin/backups}/predeploy"
LOCK_FILE="${LSEVIN_DEPLOY_LOCK:-/opt/lsevin/jenkins/deploy.lock}"
RELEASE_ROOT="${LSEVIN_RELEASE_ROOT:-/opt/lsevin/releases}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

say() {
  printf '\n=== %s ===\n' "$*"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

for required_command in git rsync docker flock curl realpath gzip stat awk; do
  command -v "${required_command}" >/dev/null \
    || fail "${required_command} is required."
done

docker compose version >/dev/null \
  || fail 'Docker Compose plugin is required.'

[[ -d "${SOURCE_DIR}/.git" ]] \
  || fail "Jenkins checkout is missing: ${SOURCE_DIR}"

[[ -r "${ENV_FILE}" ]] \
  || fail "Production environment file is missing or unreadable: ${ENV_FILE}"

[[ -f "${SOURCE_COMPOSE_FILE}" ]] \
  || fail "Compose file is missing from Jenkins checkout: ${SOURCE_COMPOSE_FILE}"

GIT_SHA="$(git -C "${SOURCE_DIR}" rev-parse HEAD)"
SHORT_SHA="$(git -C "${SOURCE_DIR}" rev-parse --short=12 HEAD)"
EXPECTED_SHA="$(git -C "${SOURCE_DIR}" rev-parse "origin/${DEPLOY_BRANCH}")"

printf 'Checked-out commit: %s\n' "${GIT_SHA}"
printf 'Expected commit:    %s\n' "${EXPECTED_SHA}"
printf 'Deployment branch:  %s\n' "${DEPLOY_BRANCH}"

[[ "${GIT_SHA}" == "${EXPECTED_SHA}" ]] \
  || fail "HEAD does not match origin/${DEPLOY_BRANCH}."

mkdir -p "$(dirname "${LOCK_FILE}")" "${APP_DIR}" "${BACKUP_DIR}" "${RELEASE_ROOT}"
exec 9>"${LOCK_FILE}"
flock -n 9 || fail 'Another LSevin deployment is already running.'

env_value() {
  local key="$1"

  awk -F= -v key="${key}" '
    $1 == key {
      sub(/^[^=]*=/, "")
      value=$0
    }
    END {
      print value
    }
  ' "${ENV_FILE}"
}

UPLOADS_DIR="${LSEVIN_UPLOADS_DIR:-$(env_value LSEVIN_UPLOADS_DIR)}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/lsevin/uploads}"
UPLOAD_BACKUP_DIR="${LSEVIN_UPLOAD_BACKUP_DIR:-$(env_value LSEVIN_UPLOAD_BACKUP_DIR)}"
UPLOAD_BACKUP_DIR="${UPLOAD_BACKUP_DIR:-/var/backups/lsevin/uploads}"

UPLOADS_REAL="$(realpath -m "${UPLOADS_DIR}")"
APP_REAL="$(realpath -m "${APP_DIR}")"
SOURCE_REAL="$(realpath -m "${SOURCE_DIR}")"

case "${UPLOADS_REAL}/" in
  "${APP_REAL}/"*|"${SOURCE_REAL}/"*|/var/lib/jenkins/*|/var/jenkins_home/*)
    fail "LSEVIN_UPLOADS_DIR must be outside all Git/Jenkins directories: ${UPLOADS_REAL}"
    ;;
esac

[[ -d "${UPLOADS_REAL}" ]] \
  || fail "Stable upload directory is missing: ${UPLOADS_REAL}. Run migrate-upload-storage.sh first."

source_compose() {
  docker compose \
    --project-name "${COMPOSE_PROJECT_NAME}" \
    --env-file "${ENV_FILE}" \
    --file "${SOURCE_COMPOSE_FILE}" \
    "$@"
}

compose() {
  docker compose \
    --project-name "${COMPOSE_PROJECT_NAME}" \
    --env-file "${ENV_FILE}" \
    --file "${LIVE_COMPOSE_FILE}" \
    "$@"
}

save_rollback_image() {
  local service="$1"
  local image_name="$2"
  local container_id
  local image_id
  local rollback_image="${image_name}:rollback-${TIMESTAMP}"
  local entrypoint_json
  local cmd_json
  local container_user
  local working_dir
  local stop_signal
  local exposed_port
  local -a import_args

  container_id="$(compose ps -q "${service}" 2>/dev/null || true)"

  if [[ -z "${container_id}" ]]; then
    echo "No running ${service} container exists; rollback image not created."
    return 0
  fi

  image_id="$(docker inspect --format '{{.Image}}' "${container_id}")"

  # First try the normal zero-copy image tag. Test the tag operation itself;
  # docker image inspect can succeed even when BuildKit/containerd metadata
  # references a missing content digest.
  if docker image tag "${image_id}" "${rollback_image}"; then
    echo "Saved rollback image ${rollback_image} from image ${image_id}"
    return 0
  fi

  echo "WARNING: Direct rollback tag failed for ${service}; trying docker commit." >&2
  docker image rm -f "${rollback_image}" >/dev/null 2>&1 || true

  # docker commit preserves the current container configuration and writable
  # layer, and normally succeeds when only the original image metadata is stale.
  if docker commit --pause=true "${container_id}" "${rollback_image}" >/dev/null; then
    echo "Saved rollback image ${rollback_image} from running container ${container_id}"
    return 0
  fi

  echo "WARNING: docker commit failed for ${service}; exporting the running root filesystem." >&2
  docker image rm -f "${rollback_image}" >/dev/null 2>&1 || true

  # Last-resort recovery for a running container whose backing image content
  # store is incomplete. docker export reads the mounted container filesystem;
  # docker import creates a fresh image and restores the runtime command fields
  # needed when Compose recreates the service with the production environment.
  entrypoint_json="$(docker inspect --format '{{json .Config.Entrypoint}}' "${container_id}")"
  cmd_json="$(docker inspect --format '{{json .Config.Cmd}}' "${container_id}")"
  container_user="$(docker inspect --format '{{.Config.User}}' "${container_id}")"
  working_dir="$(docker inspect --format '{{.Config.WorkingDir}}' "${container_id}")"
  stop_signal="$(docker inspect --format '{{.Config.StopSignal}}' "${container_id}")"

  import_args=(image import)

  if [[ -n "${entrypoint_json}" && "${entrypoint_json}" != 'null' && "${entrypoint_json}" != '[]' ]]; then
    import_args+=(--change "ENTRYPOINT ${entrypoint_json}")
  fi

  if [[ -n "${cmd_json}" && "${cmd_json}" != 'null' && "${cmd_json}" != '[]' ]]; then
    import_args+=(--change "CMD ${cmd_json}")
  fi

  if [[ -n "${container_user}" ]]; then
    import_args+=(--change "USER ${container_user}")
  fi

  if [[ -n "${working_dir}" ]]; then
    import_args+=(--change "WORKDIR ${working_dir}")
  fi

  if [[ -n "${stop_signal}" && "${stop_signal}" != '<no value>' ]]; then
    import_args+=(--change "STOPSIGNAL ${stop_signal}")
  fi

  while IFS= read -r exposed_port; do
    [[ -n "${exposed_port}" ]] && import_args+=(--change "EXPOSE ${exposed_port}")
  done < <(
    docker inspect \
      --format '{{range $port, $_ := .Config.ExposedPorts}}{{println $port}}{{end}}' \
      "${container_id}"
  )

  if docker container export "${container_id}" \
    | docker "${import_args[@]}" - "${rollback_image}" >/dev/null; then
    echo "Saved rollback image ${rollback_image} by exporting container ${container_id}"
    return 0
  fi

  fail "Unable to preserve rollback image for ${service}. The running container was left unchanged."
}

say 'Preflight'
docker info >/dev/null
source_compose config --quiet
printf 'Commit: %s\n' "${GIT_SHA}"
printf 'Branch: %s\n' "${DEPLOY_BRANCH}"
printf 'Environment file: %s\n' "${ENV_FILE}"
printf 'Compose file: %s\n' "${SOURCE_COMPOSE_FILE}"
printf 'Stable uploads: %s\n' "${UPLOADS_REAL}"
printf 'Upload backups: %s\n' "${UPLOAD_BACKUP_DIR}"

say 'Snapshot uploaded media before deployment'
[[ -x /usr/local/sbin/lsevin-upload-backup ]] \
  || fail 'Upload backup command is missing. Run the Ansible media playbook first.'

MEDIA_BACKUP_OUTPUT="$(
  sudo -n /usr/local/sbin/lsevin-upload-backup "predeploy-${SHORT_SHA}"
)"
printf '%s\n' "${MEDIA_BACKUP_OUTPUT}"

MEDIA_SNAPSHOT="$(
  awk -F= '$1 == "SNAPSHOT" {print $2}' <<<"${MEDIA_BACKUP_OUTPUT}" | tail -1
)"

[[ -n "${MEDIA_SNAPSHOT}" && -d "${MEDIA_SNAPSHOT}" ]] \
  || fail 'Media backup did not return a verified snapshot path.'

say 'Synchronize repository to the stable production directory'
# Running containers continue using their current images during this file sync.
# Production secrets and GeoIP data are intentionally kept outside Git changes.
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
  --exclude='deployments.before-*' \
  --exclude='.env.local' \
  --exclude='.env.*.local' \
  "${SOURCE_DIR}/" "${APP_DIR}/"

[[ -r "${ENV_FILE}" ]] \
  || fail "Production environment file disappeared or became unreadable: ${ENV_FILE}"

[[ -f "${LIVE_COMPOSE_FILE}" ]] \
  || fail "Live Compose file was not synchronized: ${LIVE_COMPOSE_FILE}"

compose config --quiet

say 'Save rollback images from currently running application containers'
save_rollback_image lsevin-api lsevin-api
save_rollback_image lsevin-webapp lsevin-webapp
save_rollback_image caddy lsevin-caddy

say 'Build production images while current containers continue serving traffic'
# Do not use --pull or --no-cache here. Normal source changes should reuse Docker cache.
compose build lsevin-api lsevin-webapp caddy

say 'Tag immutable images for commit rollback'
docker image tag lsevin-api:server "lsevin-api:release-${SHORT_SHA}"
docker image tag lsevin-webapp:server "lsevin-webapp:release-${SHORT_SHA}"
docker image tag lsevin-caddy:geoip "lsevin-caddy:release-${SHORT_SHA}"

say 'Verify externally managed stateful dependencies'
# PostgreSQL, PgBouncer, Redis, and EventStore may be defined by a different
# Compose file, but they share the same production Compose project. Jenkins must
# verify them without trying to recreate or manage them through this app file.
find_service_container() {
  local service="$1"
  local container_id

  container_id="$(
    docker ps -q \
      --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" \
      --filter "label=com.docker.compose.service=${service}" \
      | head -n 1
  )"

  # Fallback for the standard Compose-generated container name.
  if [[ -z "${container_id}" ]] \
    && docker container inspect "${COMPOSE_PROJECT_NAME}-${service}-1" >/dev/null 2>&1; then
    container_id="${COMPOSE_PROJECT_NAME}-${service}-1"
  fi

  printf '%s' "${container_id}"
}

wait_for_service_container() {
  local service="$1"
  local container_id="$2"
  local status
  local health

  [[ -n "${container_id}" ]] \
    || fail "Required external service is missing: ${service}"

  for _ in $(seq 1 30); do
    status="$(docker inspect --format '{{.State.Status}}' "${container_id}")"
    health="$(
      docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
        "${container_id}"
    )"

    echo "${service}: status=${status}, health=${health}, container=${container_id}"

    if [[ "${status}" == 'running' ]] \
      && [[ "${health}" == 'healthy' || "${health}" == 'none' ]]; then
      return 0
    fi

    if [[ "${status}" == 'exited' || "${status}" == 'dead' || "${health}" == 'unhealthy' ]]; then
      docker logs --tail=100 "${container_id}" || true
      fail "Required external service is not healthy: ${service}"
    fi

    sleep 2
  done

  docker logs --tail=100 "${container_id}" || true
  fail "Timed out waiting for external service: ${service}"
}

POSTGRES_CONTAINER_ID="$(find_service_container postgres)"
PGBOUNCER_CONTAINER_ID="$(find_service_container pgbouncer)"
REDIS_CONTAINER_ID="$(find_service_container redis)"
EVENTSTORE_CONTAINER_ID="$(find_service_container eventstore)"

wait_for_service_container postgres "${POSTGRES_CONTAINER_ID}"
wait_for_service_container pgbouncer "${PGBOUNCER_CONTAINER_ID}"
wait_for_service_container redis "${REDIS_CONTAINER_ID}"
wait_for_service_container eventstore "${EVENTSTORE_CONTAINER_ID}"

say 'Database backup before migration/deployment'
BACKUP_FILE="${BACKUP_DIR}/predeploy-${TIMESTAMP}.sql.gz"

docker exec -i "${POSTGRES_CONTAINER_ID}" sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "${BACKUP_FILE}"

BACKUP_SIZE="$(stat -c '%s' "${BACKUP_FILE}")"
[[ "${BACKUP_SIZE}" -ge 10240 ]] \
  || fail "Database backup is unexpectedly small (${BACKUP_SIZE} bytes): ${BACKUP_FILE}"

gzip -t "${BACKUP_FILE}"
echo "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"

say 'Apply idempotent SQL migrations'
if compgen -G "${SOURCE_DIR}/scripts/sql/*.sql" >/dev/null; then
  for migration in "${SOURCE_DIR}"/scripts/sql/*.sql; do
    echo "Applying $(basename "${migration}")"

    docker exec -i "${POSTGRES_CONTAINER_ID}" sh -lc \
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
  if compose exec -T caddy \
    wget -qO- http://lsevin-api:8080/readiness >/dev/null 2>&1; then
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
APP_DOMAIN="$(env_value APP_DOMAIN)"
API_DOMAIN="$(env_value API_DOMAIN)"
APP_DOMAIN="${APP_DOMAIN:-appmain.lsevin.com}"
API_DOMAIN="${API_DOMAIN:-api.lsevin.com}"

check_url() {
  local url="$1"
  local expected_pattern="$2"
  local code

  code="$(
    curl \
      --silent \
      --show-error \
      --location \
      --max-time 30 \
      --output /dev/null \
      --write-out '%{http_code}' \
      "${url}"
  )"

  echo "${code}  ${url}"
  [[ "${code}" =~ ${expected_pattern} ]] \
    || fail "Unexpected HTTP status ${code} for ${url}"
}

check_url "https://${API_DOMAIN}/readiness" '^(200)$'
check_url "https://${APP_DOMAIN}/fa" '^(200|301|302|307|308)$'

say 'Record stable release'
RELEASE_DIR="${RELEASE_ROOT}/${TIMESTAMP}-${SHORT_SHA}"
install -d -m 2775 "${RELEASE_DIR}"

git -C "${SOURCE_DIR}" archive --format=tar "${GIT_SHA}" \
  | gzip -9 > "${RELEASE_DIR}/source.tar.gz"

cat > "${RELEASE_DIR}/release.env" <<RELEASE
STATUS=stable
COMMIT=${GIT_SHA}
SHORT_COMMIT=${SHORT_SHA}
BRANCH=${DEPLOY_BRANCH}
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

# Keep a practical rolling history without allowing backups to fill the disk.
find "${BACKUP_DIR}" \
  -maxdepth 1 \
  -type f \
  -name 'predeploy-*.sql.gz' \
  -mtime +30 \
  -delete