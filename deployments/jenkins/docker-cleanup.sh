#!/usr/bin/env sh
set -eu

# Docker is only the build/staging store on the production node. Kubernetes
# runs imported images from containerd, so old Docker images are recoverable.
# Never prune volumes here: legacy database/media volumes may still be needed
# for disaster recovery even when they currently have no attached container.
#
# Every Jenkins build leaves a 0.5-1.3 GB application image behind, so an age
# filter alone lets a day of busy pushes fill the disk. The application
# repositories therefore keep only the newest LSEVIN_DOCKER_KEEP tags
# (rollback copies live in containerd; a container using an image blocks its
# removal), and everything else unused is pruned by age.
# DRY_RUN=1 prints what would be removed.

if pgrep -f '[d]ocker build' >/dev/null 2>&1 \
  || pgrep -f '[d]ocker-buildx buildx build' >/dev/null 2>&1; then
  echo "A Docker build is active; cleanup deferred."
  exit 0
fi

image_age="${LSEVIN_DOCKER_IMAGE_MAX_AGE:-3h}"
cache_reserve="${LSEVIN_DOCKER_CACHE_RESERVE:-3GB}"
keep="${LSEVIN_DOCKER_KEEP:-2}"
repos="${LSEVIN_DOCKER_REPOS:-lsevin-crm lsevin-webapp lsevin-webapp-migrations lsevin-api lsevin-providers lsevin-portal}"
dry="${DRY_RUN:-0}"

before=$(df --output=pcent / | tail -1 | tr -dc 0-9)

for repo in $repos; do
  # newest first; the first $keep tags stay
  docker images "$repo" --format '{{.CreatedAt}}|{{.Repository}}:{{.Tag}}' 2>/dev/null \
    | sort -r | cut -d'|' -f2 | grep -v ':<none>$' | tail -n +"$((keep + 1))" \
    | while read -r ref; do
        if [ "$dry" = 1 ]; then
          echo "would remove $ref"
        else
          docker rmi "$ref" >/dev/null 2>&1 && echo "removed $ref" || echo "kept $ref (in use)"
        fi
      done
done

if [ "$dry" = 1 ]; then
  echo "dry run: skipping image/cache prune"
  exit 0
fi

echo "Pruning unused Docker images older than ${image_age}."
docker image prune --all --force --filter "until=${image_age}"

# --keep-storage is the older name of --reserved-space (this Docker release prints a
# deprecation notice and maps it); older engines only know the first spelling, newer
# ones may drop it, so each is tried in turn. A run on B pruned 4 GB of cache this way.
echo "Pruning BuildKit cache while keeping ${cache_reserve}."
docker builder prune --force --keep-storage "${cache_reserve}" \
  || docker builder prune --force --reserved-space "${cache_reserve}"

echo "disk ${before}% -> $(df --output=pcent / | tail -1 | tr -dc 0-9)%"
df -h /
