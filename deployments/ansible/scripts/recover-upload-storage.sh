#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${LSEVIN_APP_DIR:-/opt/lsevin-new}"
DOCKER_DIR="$APP_DIR/deployments/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.server.yml"
ENV_FILE="$DOCKER_DIR/.env"
TARGET_DIR="${LSEVIN_UPLOADS_TARGET:-/var/lsevin/uploads}"
EXPECTED_RELATIVE_PATH="${1:-}"

fail() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "INFO: $*"; }
warn() { echo "WARNING: $*" >&2; }

[[ ${EUID} -eq 0 ]] || fail "run as root: sudo -i"
command -v docker >/dev/null 2>&1 || fail "docker is required"
command -v python3 >/dev/null 2>&1 || fail "python3 is required"
[[ -f "$COMPOSE_FILE" ]] || fail "$COMPOSE_FILE is missing"
[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE is missing"

docker info >/dev/null 2>&1 || fail "Docker daemon is unavailable"

declare -a candidates=()
add_candidate() {
  local path="${1:-}"
  [[ -n "$path" && -d "$path" ]] || return 0
  path="$(readlink -f "$path" 2>/dev/null || printf '%s' "$path")"
  local existing
  for existing in "${candidates[@]:-}"; do
    [[ "$existing" == "$path" ]] && return 0
  done
  candidates+=("$path")
}

count_files() {
  find "$1" -xdev -type f -printf '.' 2>/dev/null | wc -c | tr -d ' '
}

count_media_files() {
  find "$1" -xdev -type f \( \
    -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o \
    -iname '*.webp' -o -iname '*.gif' -o -iname '*.svg' -o \
    -iname '*.avif' -o -iname '*.mp4' -o -iname '*.pdf' \
  \) -printf '.' 2>/dev/null | wc -c | tr -d ' '
}

# Known historical locations used by the LSevin Compose files.
add_candidate "$TARGET_DIR"
add_candidate "/var/lsevin/uploads"
add_candidate "/opt/lsevin/uploads"
add_candidate "/opt/lsevin/app/uploads"
add_candidate "/opt/lsevin-new/uploads"
add_candidate "$APP_DIR/uploads"

# Discover upload mounts from all current or stopped API containers.
while IFS= read -r container; do
  [[ -n "$container" ]] || continue
  while IFS= read -r source; do
    add_candidate "$source"
  done < <(
    docker inspect "$container" \
      --format '{{range .Mounts}}{{if eq .Destination "/app/UploadFiles"}}{{println .Source}}{{end}}{{end}}' \
      2>/dev/null || true
  )
done < <(
  docker ps -a \
    --filter label=com.docker.compose.service=lsevin-api \
    --format '{{.ID}}'
)

# Discover named volumes that were previously called uploads/docker_uploads.
while IFS= read -r volume; do
  [[ -n "$volume" ]] || continue
  case "$volume" in
    *upload*|*Upload*)
      add_candidate "$(docker volume inspect "$volume" --format '{{.Mountpoint}}' 2>/dev/null || true)"
      ;;
  esac
done < <(docker volume ls --format '{{.Name}}')

best_source=""
best_media=-1
best_total=-1

printf '%-68s %12s %12s\n' 'Candidate upload location' 'media files' 'all files'
printf '%-68s %12s %12s\n' '--------------------------------------------------------------------' '-----------' '---------'
for candidate in "${candidates[@]}"; do
  media_count="$(count_media_files "$candidate")"
  total_count="$(count_files "$candidate")"
  printf '%-68s %12s %12s\n' "$candidate" "$media_count" "$total_count"
  if (( media_count > best_media )) || { (( media_count == best_media )) && (( total_count > best_total )); }; then
    best_source="$candidate"
    best_media="$media_count"
    best_total="$total_count"
  fi
done

(( best_total > 0 )) || fail "no existing upload files were found in host paths or Docker upload volumes"

mkdir -p "$TARGET_DIR"
if [[ "$(readlink -f "$best_source")" != "$(readlink -f "$TARGET_DIR")" ]]; then
  backup_dir="${TARGET_DIR}.before-recovery-$(date -u +%Y%m%dT%H%M%SZ)"
  if find "$TARGET_DIR" -mindepth 1 -print -quit | grep -q .; then
    mkdir -p "$backup_dir"
    cp -a "$TARGET_DIR"/. "$backup_dir"/
    info "Existing target contents backed up to $backup_dir"
  fi

  info "Restoring $best_total files ($best_media media files) from $best_source"
  cp -a "$best_source"/. "$TARGET_DIR"/
else
  info "The best upload source is already the canonical target."
fi

# Match ownership to the runtime API user so future uploads remain writable.
api_container="$( (cd "$DOCKER_DIR" && docker compose --project-name docker --env-file .env -f docker-compose.server.yml ps -q lsevin-api) 2>/dev/null || true )"
if [[ -n "$api_container" ]]; then
  api_uid="$(docker exec "$api_container" id -u 2>/dev/null || true)"
  api_gid="$(docker exec "$api_container" id -g 2>/dev/null || true)"
  if [[ "$api_uid" =~ ^[0-9]+$ && "$api_gid" =~ ^[0-9]+$ ]]; then
    chown -R "$api_uid:$api_gid" "$TARGET_DIR"
    info "Upload ownership set to API runtime UID:GID $api_uid:$api_gid"
  else
    warn "Could not determine API runtime UID/GID; existing ownership was preserved"
  fi
fi
find "$TARGET_DIR" -type d -exec chmod u+rwx,go+rx {} +
find "$TARGET_DIR" -type f -exec chmod u+rw,go+r {} +

python3 - "$ENV_FILE" "$TARGET_DIR" <<'PY'
from pathlib import Path
import os
import sys

path = Path(sys.argv[1])
target = sys.argv[2]
lines = path.read_text().splitlines()
key = 'LSEVIN_UPLOADS_DIR'
updated = False
out = []
for line in lines:
    if line.startswith(key + '='):
        out.append(f'{key}={target}')
        updated = True
    else:
        out.append(line)
if not updated:
    if out and out[-1] != '':
        out.append('')
    out.extend(['# Persistent application uploads', f'{key}={target}'])
path.write_text('\n'.join(out).rstrip() + '\n')
os.chmod(path, 0o600)
PY

# Ensure the deployed Compose file uses the persistent variable even if only the
# recovery script was copied instead of the complete patch package.
python3 - "$COMPOSE_FILE" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
replacements = (
    ('- /opt/lsevin/uploads:/app/UploadFiles', '- ${LSEVIN_UPLOADS_DIR:-/var/lsevin/uploads}:/app/UploadFiles'),
    ('- /var/lsevin/uploads:/app/UploadFiles', '- ${LSEVIN_UPLOADS_DIR:-/var/lsevin/uploads}:/app/UploadFiles'),
)
for old, new in replacements:
    if old in s:
        s = s.replace(old, new, 1)
        break
if '${LSEVIN_UPLOADS_DIR:-/var/lsevin/uploads}:/app/UploadFiles' not in s:
    raise SystemExit('ERROR: could not locate the API UploadFiles mount in docker-compose.server.yml')
p.write_text(s)
PY

(
  cd "$DOCKER_DIR"
  docker compose --project-name docker --env-file .env -f docker-compose.server.yml config --quiet
  docker compose --project-name docker --env-file .env -f docker-compose.server.yml \
    up -d --no-deps --no-build --force-recreate lsevin-api
)

api_container="$(cd "$DOCKER_DIR" && docker compose --project-name docker --env-file .env -f docker-compose.server.yml ps -q lsevin-api)"
[[ -n "$api_container" ]] || fail "API container was not recreated"

mounted_source="$(docker inspect "$api_container" --format '{{range .Mounts}}{{if eq .Destination "/app/UploadFiles"}}{{.Source}}{{end}}{{end}}')"
[[ "$(readlink -f "$mounted_source")" == "$(readlink -f "$TARGET_DIR")" ]] \
  || fail "API mounted $mounted_source instead of $TARGET_DIR"

inside_count="$(docker exec "$api_container" sh -c 'find /app/UploadFiles -type f 2>/dev/null | wc -l' | tr -d ' ' )"
info "API now sees $inside_count uploaded files"

if [[ -n "$EXPECTED_RELATIVE_PATH" ]]; then
  [[ -f "$TARGET_DIR/$EXPECTED_RELATIVE_PATH" ]] \
    || fail "expected file was not recovered: $TARGET_DIR/$EXPECTED_RELATIVE_PATH"
  docker exec "$api_container" test -f "/app/UploadFiles/$EXPECTED_RELATIVE_PATH" \
    || fail "expected file exists on host but is not visible inside the API container"
  info "Verified expected media file: $EXPECTED_RELATIVE_PATH"
fi

app_domain="$(awk -F= '$1=="APP_DOMAIN" {print substr($0,index($0,"=")+1)}' "$ENV_FILE" | tail -n1)"
if [[ -n "$EXPECTED_RELATIVE_PATH" && -n "$app_domain" ]] && command -v curl >/dev/null 2>&1; then
  status="$(curl -k -sS -o /dev/null -w '%{http_code}' \
    --resolve "$app_domain:443:127.0.0.1" \
    "https://$app_domain/files/$EXPECTED_RELATIVE_PATH" || true)"
  if [[ "$status" == "200" ]]; then
    info "Public source URL now returns HTTP 200"
  else
    warn "Public source URL returned HTTP $status; inspect API static-file configuration and Caddy logs"
  fi
fi

cat <<EOF2
Upload recovery completed.
Canonical upload directory: $TARGET_DIR
Recovered source: $best_source

Check containers:
  cd $DOCKER_DIR
  docker compose --project-name docker --env-file .env -f docker-compose.server.yml ps
EOF2
