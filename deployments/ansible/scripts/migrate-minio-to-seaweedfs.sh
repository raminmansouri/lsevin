#!/usr/bin/env sh
set -eu

# Non-destructive object-storage migration. The MinIO source is never modified.
# Required secrets are read from the environment and are not written to logs.
: "${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY is required}"
: "${MINIO_SECRET_KEY:?MINIO_SECRET_KEY is required}"
: "${SEAWEEDFS_ACCESS_KEY:?SEAWEEDFS_ACCESS_KEY is required}"
: "${SEAWEEDFS_SECRET_KEY:?SEAWEEDFS_SECRET_KEY is required}"

bucket="${OBJECT_STORAGE_BUCKET:-lsevin-media}"
source_endpoint="${MINIO_ENDPOINT:-http://minio:9000}"
destination_endpoint="${SEAWEEDFS_ENDPOINT:-http://seaweedfs:8333}"
backup_root="${OBJECT_STORAGE_BACKUP_DIR:-/var/lib/lsevin/object-storage-backups}"
container_network="${OBJECT_STORAGE_DOCKER_NETWORK:-lsevin-network}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="${backup_root}/${stamp}"

mkdir -p "$backup_dir"

docker run --rm \
  --network "$container_network" \
  --entrypoint /bin/sh \
  -e RCLONE_CONFIG_MINIO_TYPE=s3 \
  -e RCLONE_CONFIG_MINIO_PROVIDER=Minio \
  -e RCLONE_CONFIG_MINIO_ENDPOINT="$source_endpoint" \
  -e RCLONE_CONFIG_MINIO_ACCESS_KEY_ID="$MINIO_ACCESS_KEY" \
  -e RCLONE_CONFIG_MINIO_SECRET_ACCESS_KEY="$MINIO_SECRET_KEY" \
  -e RCLONE_CONFIG_MINIO_NO_CHECK_BUCKET=true \
  -e RCLONE_CONFIG_SEAWEED_TYPE=s3 \
  -e RCLONE_CONFIG_SEAWEED_PROVIDER=Other \
  -e RCLONE_CONFIG_SEAWEED_ENDPOINT="$destination_endpoint" \
  -e RCLONE_CONFIG_SEAWEED_ACCESS_KEY_ID="$SEAWEEDFS_ACCESS_KEY" \
  -e RCLONE_CONFIG_SEAWEED_SECRET_ACCESS_KEY="$SEAWEEDFS_SECRET_KEY" \
  -e RCLONE_CONFIG_SEAWEED_NO_CHECK_BUCKET=true \
  -e MIGRATION_BUCKET="$bucket" \
  -v "$backup_dir:/backup" \
  rclone/rclone:1.71.2 -ceu '
    rclone copy "minio:${MIGRATION_BUCKET}" /backup/objects --checksum --metadata
    rclone copy "minio:${MIGRATION_BUCKET}" "seaweed:${MIGRATION_BUCKET}" --checksum --metadata
    rclone check "minio:${MIGRATION_BUCKET}" "seaweed:${MIGRATION_BUCKET}" --one-way --download
    rclone size "minio:${MIGRATION_BUCKET}" --json > /backup/source-size.json
    rclone size "seaweed:${MIGRATION_BUCKET}" --json > /backup/destination-size.json
    find /backup/objects -type f -print0 | sort -z | xargs -0 -r sha256sum > /backup/sha256.txt
  '

printf 'Verified backup and migration completed: %s\n' "$backup_dir"
printf 'MinIO was retained unchanged for rollback.\n'
