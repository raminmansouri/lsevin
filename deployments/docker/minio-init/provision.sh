#!/bin/sh
# Idempotent MinIO provisioning for the LSevin media bucket.
#
# Runs as the one-shot `minio-init` Compose service (and from Jenkins stage 5)
# before `lsevin-api` starts. Every step tolerates "already exists", so re-running
# it is a no-op once the bucket, policy and service account are in place.
#
# It ensures:
#   1. the media bucket (MINIO_BUCKET)
#   2. an anonymous download policy limited to the two public prefixes
#      (Categories/*, ServiceProviders/*) -- CustomerDocument/* stays private
#   3. a scoped service account for the API (MINIO_API_ACCESS_KEY / _SECRET_KEY)
#      whose inline policy allows only Get/Put/Delete/List on this one bucket
#
# Only `sh` builtins and `mc` are used -- the MinIO image userland is minimal.
set -eu

ALIAS=local
ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
BUCKET="${MINIO_BUCKET:?MINIO_BUCKET is required}"
: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"

case "${MINIO_API_ACCESS_KEY:-}" in
  '' | CHANGE_ME_*)
    echo "minio-init: ERROR MINIO_API_ACCESS_KEY is unset or still a placeholder." >&2
    exit 1
    ;;
esac
case "${MINIO_API_SECRET_KEY:-}" in
  '' | CHANGE_ME_*)
    echo "minio-init: ERROR MINIO_API_SECRET_KEY is unset or still a placeholder." >&2
    exit 1
    ;;
esac

anon_policy=/tmp/lsevin-anon-policy.json
svc_policy=/tmp/lsevin-svc-policy.json

cat > "$anon_policy" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": ["*"] },
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::${BUCKET}/Categories/*",
        "arn:aws:s3:::${BUCKET}/ServiceProviders/*"
      ]
    }
  ]
}
JSON

cat > "$svc_policy" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::${BUCKET}/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::${BUCKET}"]
    }
  ]
}
JSON

echo "minio-init: connecting to ${ENDPOINT}"
mc alias set "$ALIAS" "$ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
mc ready "$ALIAS"

echo "minio-init: ensuring bucket '${BUCKET}'"
mc mb --ignore-existing "${ALIAS}/${BUCKET}"

echo "minio-init: applying anonymous read policy (Categories/*, ServiceProviders/*)"
mc anonymous set-json "$anon_policy" "${ALIAS}/${BUCKET}"

if mc admin user svcacct info "$ALIAS" "$MINIO_API_ACCESS_KEY" >/dev/null 2>&1; then
  echo "minio-init: service account '${MINIO_API_ACCESS_KEY}' exists; refreshing secret + policy"
  mc admin user svcacct edit "$ALIAS" "$MINIO_API_ACCESS_KEY" \
    --secret-key "$MINIO_API_SECRET_KEY" \
    --policy "$svc_policy"
else
  echo "minio-init: creating scoped service account '${MINIO_API_ACCESS_KEY}'"
  mc admin user svcacct add "$ALIAS" "$MINIO_ROOT_USER" \
    --access-key "$MINIO_API_ACCESS_KEY" \
    --secret-key "$MINIO_API_SECRET_KEY" \
    --policy "$svc_policy"
fi

echo "minio-init: verifying the service account can reach the bucket"
mc alias set apicheck "$ENDPOINT" "$MINIO_API_ACCESS_KEY" "$MINIO_API_SECRET_KEY" >/dev/null
mc ls "apicheck/${BUCKET}" >/dev/null
mc alias remove apicheck >/dev/null

rm -f "$anon_policy" "$svc_policy"
echo "minio-init: done"
