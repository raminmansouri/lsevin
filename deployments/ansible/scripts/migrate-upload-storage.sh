#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

# Move/copy uploaded media out of every Git checkout into stable host storage.
# The source is never deleted automatically.

EXPLICIT_SOURCE="${1:-}"
VERIFY_RELATIVE_PATH="${2:-}"
DESTINATION="${LSEVIN_UPLOADS_DIR:-/var/lib/lsevin/uploads}"
BACKUP_DIR="${LSEVIN_UPLOAD_BACKUP_DIR:-/var/backups/lsevin/uploads}"
PROJECT="${COMPOSE_PROJECT_NAME:-docker}"

fail() { echo "ERROR: $*" >&2; exit 1; }
say() { printf '\n=== %s ===\n' "$*"; }
[[ "${EUID}" -eq 0 ]] || fail 'run this migration as root'
for command_name in rsync find realpath docker awk; do
  command -v "${command_name}" >/dev/null 2>&1 || fail "${command_name} is required"
done
docker compose version >/dev/null 2>&1 || fail 'Docker Compose plugin is required'

file_count() {
  find "$1" -xdev -type f -printf '.' 2>/dev/null | wc -c
}

candidates=()
if [[ -n "${EXPLICIT_SOURCE}" ]]; then
  candidates+=("${EXPLICIT_SOURCE}")
else
  candidates+=(
    /opt/lsevin-new/app/uploads
    /opt/lsevin-new/app/UploadFiles
    /opt/lsevin-new/uploads
    /opt/lsevin-new/UploadFiles
    /opt/lsevin/app/uploads
    /opt/lsevin/app/UploadFiles
    /var/lsevin/uploads
    /opt/lsevin/uploads
  )
  while IFS= read -r path; do
    candidates+=("${path}")
  done < <(find /opt/lsevin-new /opt/lsevin/app -maxdepth 6 -type d \
    \( -iname uploads -o -iname UploadFiles \) 2>/dev/null | sort -u)
fi

best_source=''
best_count=0
printf '%-70s %12s\n' 'Candidate upload location' 'files'
printf '%-70s %12s\n' '----------------------------------------------------------------------' '------------'
for candidate in "${candidates[@]}"; do
  [[ -d "${candidate}" ]] || continue
  count="$(file_count "${candidate}")"
  printf '%-70s %12s\n' "${candidate}" "${count}"
  if (( count > best_count )); then
    best_source="${candidate}"
    best_count="${count}"
  fi
done

[[ -n "${best_source}" && "${best_count}" -gt 0 ]] \
  || fail 'no non-empty upload directory was found; pass the exact source path as argument 1'

SOURCE_REAL="$(realpath "${best_source}")"
install -d -m 0775 "${DESTINATION}"
DEST_REAL="$(realpath "${DESTINATION}")"
for unsafe_root in /opt/lsevin-new /opt/lsevin/app /var/lib/jenkins; do
  case "${DEST_REAL}/" in
    "${unsafe_root}/"*) fail "stable upload destination must be outside ${unsafe_root}: ${DEST_REAL}" ;;
  esac
done
[[ "${SOURCE_REAL}" != "${DEST_REAL}" ]] || fail 'source and destination are the same directory'
case "${DEST_REAL}/" in
  "${SOURCE_REAL}/"*) fail 'destination cannot be inside source' ;;
esac
case "${SOURCE_REAL}/" in
  "${DEST_REAL}/"*) fail 'source cannot be inside destination' ;;
esac

say "Copy uploads to stable storage"
echo "Source:      ${SOURCE_REAL}"
echo "Destination: ${DEST_REAL}"
rsync -aHAX --numeric-ids --info=stats2 "${SOURCE_REAL}/" "${DEST_REAL}/"
# Preserve the working directory ownership/mode that the application already used.
chown --reference="${SOURCE_REAL}" "${DEST_REAL}"
chmod --reference="${SOURCE_REAL}" "${DEST_REAL}"

source_count="$(file_count "${SOURCE_REAL}")"
dest_count="$(file_count "${DEST_REAL}")"
[[ "${dest_count}" -ge "${source_count}" ]] \
  || fail "copy verification failed: source=${source_count}, destination=${dest_count}"
if [[ -n "${VERIFY_RELATIVE_PATH}" ]]; then
  [[ -f "${DEST_REAL}/${VERIFY_RELATIVE_PATH}" ]] \
    || fail "requested verification file is absent after migration: ${VERIFY_RELATIVE_PATH}"
fi

update_env_file() {
  local env_file="$1" temp
  [[ -f "${env_file}" ]] || return 0
  temp="$(mktemp)"
  awk -v value="${DEST_REAL}" '
    BEGIN {written=0}
    /^LSEVIN_UPLOADS_DIR=/ {
      if (!written) {print "LSEVIN_UPLOADS_DIR=" value; written=1}
      next
    }
    {print}
    END {if (!written) print "LSEVIN_UPLOADS_DIR=" value}
  ' "${env_file}" > "${temp}"
  cat "${temp}" > "${env_file}"
  rm -f "${temp}"
  chmod 600 "${env_file}"
  echo "Updated ${env_file}"
}

say 'Persist the stable path in production environment files'
update_env_file /opt/lsevin-new/deployments/docker/.env
update_env_file /opt/lsevin/app/deployments/docker/.env

COMPOSE_DIR=''
for candidate in /opt/lsevin-new/deployments/docker /opt/lsevin/app/deployments/docker; do
  if [[ -f "${candidate}/docker-compose.server.yml" && -f "${candidate}/.env" ]]; then
    COMPOSE_DIR="${candidate}"
    break
  fi
done
[[ -n "${COMPOSE_DIR}" ]] || fail 'could not locate docker-compose.server.yml and its .env'
compose=(docker compose --project-name "${PROJECT}" --env-file "${COMPOSE_DIR}/.env" \
  -f "${COMPOSE_DIR}/docker-compose.server.yml")

# Avoid an invalid registry pull when only the old container image ID exists.
if ! docker image inspect lsevin-api:server >/dev/null 2>&1; then
  api_container="$("${compose[@]}" ps -aq lsevin-api 2>/dev/null || true)"
  if [[ -n "${api_container}" ]]; then
    image_id="$(docker inspect --format '{{.Image}}' "${api_container}")"
    docker image tag "${image_id}" lsevin-api:server
    echo "Recovered local tag lsevin-api:server from ${api_container}."
  fi
fi

docker image inspect lsevin-api:server >/dev/null 2>&1 \
  || fail 'lsevin-api:server image is unavailable; build it before recreating the API'

say 'Recreate only the API with stable upload mounts'
"${compose[@]}" config --quiet
"${compose[@]}" up -d --no-deps --no-build --force-recreate lsevin-api
api_container="$("${compose[@]}" ps -q lsevin-api)"
[[ -n "${api_container}" ]] || fail 'API container was not created'

mounts="$(docker inspect --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}' "${api_container}")"
echo "${mounts}"
grep -F "${DEST_REAL} -> /app/uploads" <<<"${mounts}" >/dev/null \
  || fail 'API does not have the expected /app/uploads mount'
grep -F "${DEST_REAL} -> /app/UploadFiles" <<<"${mounts}" >/dev/null \
  || fail 'API does not have the expected /app/UploadFiles compatibility mount'

if [[ -n "${VERIFY_RELATIVE_PATH}" ]]; then
  docker exec "${api_container}" test -f "/app/uploads/${VERIFY_RELATIVE_PATH}" \
    || fail 'verification file is not visible inside /app/uploads'
  docker exec "${api_container}" test -f "/app/UploadFiles/${VERIFY_RELATIVE_PATH}" \
    || fail 'verification file is not visible inside /app/UploadFiles'
fi

say 'Create an initial off-tree backup'
if [[ -x /usr/local/sbin/lsevin-upload-backup ]]; then
  LSEVIN_UPLOADS_DIR="${DEST_REAL}" LSEVIN_UPLOAD_BACKUP_DIR="${BACKUP_DIR}" \
    /usr/local/sbin/lsevin-upload-backup migration
else
  echo 'Backup command is not installed yet; run the Ansible media playbook next.'
fi

cat <<SUMMARY

Migration completed safely.
Live uploads: ${DEST_REAL}
Original source retained: ${SOURCE_REAL}

Do not delete the original source until public image URLs and a backup snapshot
have both been verified.
SUMMARY
