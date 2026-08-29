#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

# Read-only inventory of where uploaded media currently lives, run BEFORE the
# MinIO cutover. It changes nothing except, optionally, rescuing files that exist
# only inside the running API container (which a rebuild would destroy).
#
# Outputs, into the current directory:
#   uploads-manifest.<timestamp>.tsv   relkey <TAB> size <TAB> sha256  (best source)
#   inspect-report.<timestamp>.txt     the full console report
#
# Usage:
#   ./inspect-upload-storage.sh [SOURCE_DIR_OVERRIDE]
#
# Env:
#   COMPOSE_DIR   dir holding docker-compose.server.yml + .env
#                 (default: autodetected under /opt/lsevin-new, /opt/lsevin/app)
#   LSEVIN_UPLOADS_DIR   canonical host uploads dir (default /var/lib/lsevin/uploads)
#   RESCUE_DIR    where container-only files are copied (default /var/lib/lsevin/uploads-rescue-<ts>)

TS="$(date -u +%Y%m%dT%H%M%SZ)"
EXPLICIT_SOURCE="${1:-}"
UPLOADS_DIR="${LSEVIN_UPLOADS_DIR:-/var/lib/lsevin/uploads}"
RESCUE_DIR="${RESCUE_DIR:-/var/lib/lsevin/uploads-rescue-${TS}}"
REPORT="inspect-report.${TS}.txt"
MANIFEST="uploads-manifest.${TS}.tsv"
PROJECT="${COMPOSE_PROJECT_NAME:-docker}"

fail() { echo "ERROR: $*" >&2; exit 1; }
say() { printf '\n=== %s ===\n' "$*" | tee -a "$REPORT"; }
log() { printf '%s\n' "$*" | tee -a "$REPORT"; }

for c in docker find awk sort; do command -v "$c" >/dev/null 2>&1 || fail "$c is required"; done
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum is required"
docker info >/dev/null 2>&1 || fail "Docker daemon is unavailable"

: > "$REPORT"
log "LSevin upload-storage inspection — ${TS}"

# --------------------------------------------------------------------------
# 1. What image is the API running, and does it contain the MinIO backend?
# --------------------------------------------------------------------------
say "Running lsevin-api container"
api_container="$(docker ps -a --filter label=com.docker.compose.service=lsevin-api \
  --format '{{.ID}} {{.Image}} {{.Status}}' | head -n1 || true)"
if [[ -z "$api_container" ]]; then
  log "No lsevin-api container found."
  api_id=""
else
  log "$api_container"
  api_id="${api_container%% *}"
  image_created="$(docker inspect --format '{{.Created}}' "$api_id" 2>/dev/null || true)"
  log "container created: ${image_created}"
  # The storage abstraction ships in BuildingBlocks.Core.dll. grep the assembly
  # for the type name — present only once "serve media from MinIO" is deployed.
  if docker exec "$api_id" sh -c \
      'grep -aql MinioFileObjectStore /app/BuildingBlocks.Core.dll 2>/dev/null || \
       grep -aqr MinioFileObjectStore /app/*.dll 2>/dev/null'; then
    log "storage abstraction: PRESENT (MinioFileObjectStore found in /app)"
  else
    log "storage abstraction: NOT FOUND — this container predates the MinIO backend"
  fi
fi

# --------------------------------------------------------------------------
# 2. Candidate on-disk upload locations
# --------------------------------------------------------------------------
count_files() { find "$1" -xdev -type f 2>/dev/null | wc -l | tr -d ' '; }
sum_bytes() { find "$1" -xdev -type f -printf '%s\n' 2>/dev/null | awk '{s+=$1} END{print s+0}'; }

declare -a candidates=()
add() { [[ -n "${1:-}" && -d "$1" ]] || return 0; candidates+=("$(readlink -f "$1")"); }

add "$EXPLICIT_SOURCE"
add "$UPLOADS_DIR"
add /var/lsevin/uploads
add /opt/lsevin/uploads
add /opt/lsevin/app/uploads
add /opt/lsevin/app/UploadFiles
add /opt/lsevin-new/uploads
add /opt/lsevin-new/UploadFiles
while IFS= read -r d; do add "$d"; done < <(
  find /opt/lsevin /opt/lsevin-new -maxdepth 6 -type d \
    \( -iname uploads -o -iname UploadFiles \) 2>/dev/null | sort -u)
while IFS= read -r v; do
  case "$v" in *upload*|*Upload*)
    add "$(docker volume inspect "$v" --format '{{.Mountpoint}}' 2>/dev/null || true)" ;;
  esac
done < <(docker volume ls --format '{{.Name}}')

say "On-disk candidates"
printf '%-64s %10s %14s\n' 'path' 'files' 'bytes' | tee -a "$REPORT"
best=""; best_files=-1
declare -A seen=()
for c in "${candidates[@]}"; do
  [[ -n "${seen[$c]:-}" ]] && continue
  seen[$c]=1
  f="$(count_files "$c")"; b="$(sum_bytes "$c")"
  printf '%-64s %10s %14s\n' "$c" "$f" "$b" | tee -a "$REPORT"
  if (( f > best_files )); then best_files="$f"; best="$c"; fi
done

# --------------------------------------------------------------------------
# 3. Files that exist ONLY inside the running container
# --------------------------------------------------------------------------
container_only=0
if [[ -n "$api_id" ]]; then
  say "Inside the API container: /app/UploadFiles"
  in_count="$(docker exec "$api_id" sh -c 'find /app/UploadFiles -type f 2>/dev/null | wc -l' | tr -d ' ' || echo 0)"
  log "container /app/UploadFiles file count: ${in_count}"
  mount_src="$(docker inspect --format \
    '{{range .Mounts}}{{if eq .Destination "/app/UploadFiles"}}{{.Source}}{{end}}{{end}}' "$api_id" 2>/dev/null || true)"
  if [[ -z "$mount_src" && "${in_count:-0}" -gt 0 ]]; then
    container_only=1
    log "WARNING: /app/UploadFiles is NOT bind-mounted — these ${in_count} files live only in"
    log "         the container writable layer and are lost on the next rebuild."
    say "Rescuing container-only files to ${RESCUE_DIR}"
    mkdir -p "$RESCUE_DIR"
    docker cp "${api_id}:/app/UploadFiles/." "$RESCUE_DIR/"
    rescued="$(count_files "$RESCUE_DIR")"
    log "rescued ${rescued} files"
    if (( rescued > best_files )); then best_files="$rescued"; best="$(readlink -f "$RESCUE_DIR")"; fi
  elif [[ -n "$mount_src" ]]; then
    log "/app/UploadFiles is bind-mounted from: ${mount_src}"
  fi
fi

# --------------------------------------------------------------------------
# 4. What is already in the bucket?
# --------------------------------------------------------------------------
say "MinIO bucket contents"
COMPOSE_DIR="${COMPOSE_DIR:-}"
if [[ -z "$COMPOSE_DIR" ]]; then
  for d in /opt/lsevin-new/deployments/docker /opt/lsevin/app/deployments/docker; do
    [[ -f "$d/docker-compose.server.yml" ]] && { COMPOSE_DIR="$d"; break; }
  done
fi
if [[ -n "$COMPOSE_DIR" && -f "$COMPOSE_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; . "$COMPOSE_DIR/.env"; set +a
  bucket="${MINIO_BUCKET:-lsevin-media}"
  minio_container="$(docker ps --filter label=com.docker.compose.service=minio --format '{{.ID}}' | head -n1 || true)"
  if [[ -n "$minio_container" ]]; then
    docker exec "$minio_container" sh -c \
      "mc alias set local http://localhost:9000 '$MINIO_ROOT_USER' '$MINIO_ROOT_PASSWORD' >/dev/null 2>&1 && \
       mc ls --recursive --summarize local/$bucket 2>/dev/null | tail -n 5" | tee -a "$REPORT" \
      || log "could not list bucket '$bucket' (may not exist yet)"
  else
    log "minio container not running"
  fi
else
  log "compose .env not found; skipped bucket listing"
fi

# --------------------------------------------------------------------------
# 5. Manifest of the best source — the migration's source of truth
# --------------------------------------------------------------------------
say "Building manifest from best source: ${best:-<none>} (${best_files} files)"
[[ -n "$best" && "$best_files" -gt 0 ]] || fail "no non-empty upload source found; pass one as argument 1"
: > "$MANIFEST"
( cd "$best" && find . -type f -printf '%P\n' | LC_ALL=C sort ) | while IFS= read -r rel; do
  key="$(printf '%s' "$rel" | tr '\\' '/')"
  size="$(stat -c %s "$best/$rel")"
  sum="$(sha256sum "$best/$rel" | awk '{print $1}')"
  printf '%s\t%s\t%s\n' "$key" "$size" "$sum" >> "$MANIFEST"
done
lines="$(wc -l < "$MANIFEST" | tr -d ' ')"
log "wrote ${MANIFEST} (${lines} entries)"

cat <<SUMMARY | tee -a "$REPORT"

Inspection complete.
  Best source:     ${best}
  Manifest:        ${MANIFEST} (${lines} files)
  Report:          ${REPORT}
  Container-only:  $( ((container_only)) && echo "YES — rescued to ${RESCUE_DIR}" || echo "no" )

Next: ./mirror-uploads-to-minio.sh "${best}" "${MANIFEST}"
SUMMARY
