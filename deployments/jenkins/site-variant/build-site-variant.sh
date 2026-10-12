#!/usr/bin/env bash
# build-site-variant.sh <base-image> <from-host> <to-host> <new-tag>
#
# Derives a site-specific copy of an already built lsevin-webapp image by rewriting the public hostname that
# Next.js compiled into it (NEXT_PUBLIC_URL / API / FILES / SOCKET all share one host). Used for the Iran site (A):
#   build-site-variant.sh lsevin-webapp:db9eec21fbf6-280 appmain.lsevin.com ir.lsevincare.com lsevin-webapp:ir-db9eec21fbf6-280
# Why not rebuild? NEXT_PUBLIC_* are inlined at build time; a rebuild needs the exact source commit, an npm build
# (about 3 GB RAM) and risks behaviour drift. Rewriting a copy of the image that is already running is exact, fast,
# and needs no network. crm./pay./admin. hostnames are deliberately left untouched.
#
# Standalone on a node with Docker and k3s: the base image is exported from containerd into Docker, the variant is
# built, then imported back into containerd. Inside Jenkins set SKIP_CONTAINERD=1: the image is already in Docker and
# the pipeline's own "import" step moves it to k3s afterwards. Using the same tag as the base replaces it. Idempotent.
set -euo pipefail
BASE="${1:?base image}"; FROM="${2:?host to replace}"; TO="${3:?new host}"; TAG="${4:?new tag}"
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
case "$FROM$TO" in *[!a-zA-Z0-9.-]*) echo "hosts may only contain letters, digits, dots, dashes" >&2; exit 2;; esac

if ! docker image inspect "$BASE" >/dev/null 2>&1; then
  [ "${SKIP_CONTAINERD:-0}" = 1 ] && { echo "base image $BASE not found in Docker" >&2; exit 1; }
  k3s ctr -n k8s.io images export "$WORK/base.tar" "docker.io/library/$BASE"
  docker load -i "$WORK/base.tar" >/dev/null
fi
cat > "$WORK/Dockerfile" <<EOF
FROM $BASE
USER root
# rewrite every text artefact Next.js produced (JS chunks, prerendered HTML, RSC payloads, JSON manifests)
RUN find /app -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.html' -o -name '*.rsc' -o -name '*.json' -o -name '*.body' -o -name '*.meta' -o -name '*.txt' \) \
      -exec grep -l -F '$FROM' {} + | xargs -r sed -i 's#$(printf '%s' "$FROM" | sed 's/\./\\./g')#$TO#g' \
 && chown -R nextjs:nodejs /app \
 && echo "remaining references to $FROM: \$(grep -r -F -l '$FROM' /app 2>/dev/null | wc -l)"
USER nextjs
LABEL lsevin.site-variant="$TO" lsevin.base-image="$BASE"
EOF
docker build -q -t "$TAG" "$WORK" >/dev/null
[ "${SKIP_CONTAINERD:-0}" = 1 ] || docker save "$TAG" | k3s ctr -n k8s.io images import - >/dev/null
echo "built${SKIP_CONTAINERD:+ (docker only)} and imported: $TAG  (base $BASE, $FROM -> $TO)"
