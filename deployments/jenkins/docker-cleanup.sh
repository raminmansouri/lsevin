#!/usr/bin/env sh
set -eu

# Docker is only the build/staging store on the production node. Kubernetes
# runs imported images from containerd, so old Docker images are recoverable.
# Never prune volumes here: legacy database/media volumes may still be needed
# for disaster recovery even when they currently have no attached container.

if pgrep -f '[d]ocker build' >/dev/null 2>&1 \
  || pgrep -f '[d]ocker-buildx buildx build' >/dev/null 2>&1; then
  echo "A Docker build is active; cleanup deferred."
  exit 0
fi

image_age="${LSEVIN_DOCKER_IMAGE_MAX_AGE:-72h}"
cache_reserve="${LSEVIN_DOCKER_CACHE_RESERVE:-5GB}"

echo "Pruning unused Docker images older than ${image_age}."
docker image prune --all --force --filter "until=${image_age}"

echo "Pruning BuildKit cache while reserving ${cache_reserve}."
docker builder prune --force --reserved-space "${cache_reserve}"

df -h /
