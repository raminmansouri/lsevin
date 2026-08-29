#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

# Copy the on-disk uploads tree into the MinIO media bucket and PROVE that every
# file made it. Idempotent and re-runnable. It never deletes anything: no
# --remove on mirror, and objects that exist only in the bucket are reported but
# not touched.
#
# Verification is layered and fails the whole run (exit 1) if ANY layer fails:
#   1. source file count matches the inspect manifest (source did not change)
#   2. `mc mirror` completes with no transfer errors
#   3. a second `mc mirror --dry-run` has NOTHING left to copy
#      (mirror's own size/etag comparison — every source file is on the target)
#   4. with STRICT=1: sha256 of every object == sha256 in the manifest
#
# Usage:
#   ./mirror-uploads-to-minio.sh SOURCE_DIR MANIFEST_TSV
#   STRICT=1 ./mirror-uploads-to-minio.sh SOURCE_DIR MANIFEST_TSV
#
# Env:
#   COMPOSE_DIR    dir with docker-compose.server.yml + .env (autodetected)
#   MIRROR_IMAGE   image providing `mc` (default: the pinned MinIO server image)
#   MINIO_NETWORK  docker network name (default: lsevin-network)

SOURCE="${1:?usage: mirror-uploads-to-minio.sh SOURCE_DIR MANIFEST_TSV}"
MANIFEST="${2:?usage: mirror-uploads-to-minio.sh SOURCE_DIR MANIFEST_TSV}"
STRICT="${STRICT:-0}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
MIRROR_IMAGE="${MIRROR_IMAGE:-minio/minio:RELEASE.2025-09-07T16-13-09Z}"
MINIO_NETWORK="${MINIO_NETWORK:-lsevin-network}"
OUT_DIR="$(pwd)/mirror-run-${TS}"

fail() { echo "ERROR: $*" >&2; exit 1; }
say() { printf '\n=== %s ===\n' "$*"; }

command -v docker >/dev/null 2>&1 || fail "docker is required"
docker info >/dev/null 2>&1 || fail "Docker daemon is unavailable"
[[ -d "$SOURCE" ]] || fail "source dir not found: $SOURCE"
[[ -f "$MANIFEST" ]] || fail "manifest not found: $MANIFEST"
docker network inspect "$MINIO_NETWORK" >/dev/null 2>&1 || fail "docker network '$MINIO_NETWORK' not found"

SOURCE_REAL="$(readlink -f "$SOURCE")"
MANIFEST_REAL="$(readlink -f "$MANIFEST")"
mkdir -p "$OUT_DIR"

# ---- load MinIO settings from the compose .env -----------------------------
COMPOSE_DIR="${COMPOSE_DIR:-}"
if [[ -z "$COMPOSE_DIR" ]]; then
  for d in /opt/lsevin-new/deployments/docker /opt/lsevin/app/deployments/docker \
           "$(cd "$(dirname "$0")/../../docker" 2>/dev/null && pwd || true)"; do
    [[ -n "$d" && -f "$d/docker-compose.server.yml" && -f "$d/.env" ]] && { COMPOSE_DIR="$d"; break; }
  done
fi
[[ -n "$COMPOSE_DIR" && -f "$COMPOSE_DIR/.env" ]] || fail "could not find compose .env; set COMPOSE_DIR"
# shellcheck disable=SC1091
set -a; . "$COMPOSE_DIR/.env"; set +a

BUCKET="${MINIO_BUCKET:-lsevin-media}"
: "${MINIO_ROOT_USER:?MINIO_ROOT_USER missing from .env}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD missing from .env}"

# ---- layer 1: source vs manifest count -----------------------------------
say "Layer 1 — source matches manifest"
manifest_count="$(grep -c . "$MANIFEST" | tr -d ' ')"
source_count="$(find "$SOURCE_REAL" -type f | wc -l | tr -d ' ')"
echo "manifest entries: $manifest_count"
echo "source files:     $source_count"
(( manifest_count == source_count )) || fail \
  "source changed since inspection ($source_count files vs $manifest_count in manifest); re-run inspect-upload-storage.sh"

# ---- layers 2-4 run inside a throwaway mc container ---------------------
say "Layers 2-4 — mirror + verify (image: $MIRROR_IMAGE)"
docker run --rm -i \
  --network "$MINIO_NETWORK" \
  --entrypoint /bin/sh \
  -e MINIO_ENDPOINT="http://minio:9000" \
  -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
  -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  -e BUCKET="$BUCKET" \
  -e STRICT="$STRICT" \
  -v "$SOURCE_REAL:/src:ro" \
  -v "$MANIFEST_REAL:/manifest.tsv:ro" \
  -v "$OUT_DIR:/out" \
  "$MIRROR_IMAGE" -s <<'CONTAINER'
set -eu

echo "container: connecting to MinIO"
mc alias set local "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
mc ready local

echo "container: mc mirror --overwrite /src -> local/${BUCKET}"
# Layer 2: real copy. --overwrite re-pushes anything whose size/etag differs.
# Write to a file (no pipe) so a non-zero exit from mc is not masked.
if ! mc mirror --overwrite /src "local/${BUCKET}" > /out/mirror.log 2>&1; then
  echo "FAIL: mc mirror reported transfer errors:" >&2
  cat /out/mirror.log >&2
  exit 1
fi

echo "container: second pass must have nothing to copy"
# Layer 3: mirror's own size/etag comparison. Re-run as --dry-run and count the
# copy lines (each planned copy prints an ' -> ' arrow). Zero == every source
# file is already on the target, byte-length and etag matching.
mc mirror --overwrite --dry-run /src "local/${BUCKET}" > /out/residual.log 2>&1 || true
residual="$(grep -c ' -> ' /out/residual.log || true)"
if [ "${residual:-0}" -ne 0 ]; then
  echo "FAIL: ${residual} file(s) still not mirrored after the copy pass:" >&2
  grep ' -> ' /out/residual.log >&2
  exit 1
fi
echo "OK: nothing left to copy"

# Layer 4 (opt-in): byte-for-byte checksum against the manifest.
if [ "${STRICT}" = "1" ]; then
  if ! command -v sha256sum >/dev/null 2>&1; then
    echo "FAIL: STRICT=1 but this image has no sha256sum; re-run with MIRROR_IMAGE set to one that does" >&2
    exit 1
  fi
  echo "container: STRICT checksum verification"
  bad=0
  while IFS="$(printf '\t')" read -r key size sum; do
    [ -n "$key" ] || continue
    got="$(mc cat "local/${BUCKET}/${key}" | sha256sum | cut -d' ' -f1)" || { echo "MISSING  $key" >>/out/strict-fail.txt; bad=$((bad+1)); continue; }
    if [ "$got" != "$sum" ]; then
      echo "MISMATCH $key (manifest $sum, bucket $got)" >>/out/strict-fail.txt
      bad=$((bad+1))
    fi
  done < /manifest.tsv
  if [ "$bad" -gt 0 ]; then
    echo "FAIL: $bad object(s) failed checksum verification:" >&2
    cat /out/strict-fail.txt >&2
    exit 1
  fi
  echo "OK: all objects match the manifest sha256"
fi

# Informational: objects in the bucket with no source file (new uploads, prior mirror).
mc diff /src "local/${BUCKET}" > /out/diff.txt 2>&1 || true
extra="$(grep -c . /out/diff.txt 2>/dev/null || echo 0)"
echo "note: mc diff reports ${extra} line(s) — see /out/diff.txt (bucket-only objects are expected)"

verified="$(grep -c . /manifest.tsv | tr -d ' ')"
echo "OK: ${verified} source files verified present in local/${BUCKET}"
CONTAINER

say "Mirror + verification PASSED"
cat <<SUMMARY

  Source:    $SOURCE_REAL
  Bucket:    local/$BUCKET
  Manifest:  $MANIFEST_REAL ($manifest_count files)
  Strict:    $( [[ "$STRICT" == "1" ]] && echo "yes (sha256 checked)" || echo "no (set STRICT=1 for full checksum)" )
  Logs:      $OUT_DIR

Safe to cut over: set FILE_STORAGE_BACKEND=Minio in $COMPOSE_DIR/.env and
  docker compose --project-name docker --env-file .env -f docker-compose.server.yml up -d lsevin-api
SUMMARY
