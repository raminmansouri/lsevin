#!/usr/bin/env sh
set -eu

# Moves medical files that were uploaded before the Private/ prefix existed (health record
# documents and video consultation photos, stored under Categories/...) to Private/medical/,
# where the API only serves them through a short-lived signed link.
#
#   DRY RUN (default): lists what would move, changes nothing.
#   APPLY=1          : copies each object, verifies it, then repoints the database rows.
#   DELETE_OLD=1     : with APPLY=1, also removes the old public copy once the row points at
#                      the new one. Until then the old copy stays reachable at its old URL.
#
# Needs DATABASE_URL (postgres://...), SEAWEEDFS_ACCESS_KEY and SEAWEEDFS_SECRET_KEY.
# Run it after the API with PrivateLinkSecret and the webapp with FILES_PRIVATE_LINK_SECRET
# are deployed, or moved files would not open anywhere.
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${SEAWEEDFS_ACCESS_KEY:?SEAWEEDFS_ACCESS_KEY is required}"
: "${SEAWEEDFS_SECRET_KEY:?SEAWEEDFS_SECRET_KEY is required}"

bucket="${OBJECT_STORAGE_BUCKET:-lsevin-media}"
endpoint="${SEAWEEDFS_ENDPOINT:-http://seaweedfs:8333}"
network="${OBJECT_STORAGE_DOCKER_NETWORK:-lsevin-network}"
apply="${APPLY:-0}"
delete_old="${DELETE_OLD:-0}"

psql_run() {
  docker run --rm -i --network "$network" -e DATABASE_URL="$DATABASE_URL" postgres:17-alpine \
    sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At "$@"' -- "$@"
}

rclone_run() {
  docker run --rm --network "$network" \
    -e RCLONE_CONFIG_S_TYPE=s3 -e RCLONE_CONFIG_S_PROVIDER=Other \
    -e RCLONE_CONFIG_S_ENDPOINT="$endpoint" \
    -e RCLONE_CONFIG_S_ACCESS_KEY_ID="$SEAWEEDFS_ACCESS_KEY" \
    -e RCLONE_CONFIG_S_SECRET_ACCESS_KEY="$SEAWEEDFS_SECRET_KEY" \
    -e RCLONE_CONFIG_S_NO_CHECK_BUCKET=true \
    rclone/rclone:1.71.2 "$@"
}

# Every stored path a health record document or a consultation photo points at.
paths="$(psql_run -c "
  with medical as (
    select regexp_replace(file_url, '^/+', '') as path from patient.clinical_documents
    union
    select regexp_replace(m.file_url, '^/+', '')
    from consultation.video_sessions s
    join media.media_library m on m.id::text = any(s.attachment_media_ids)
  )
  select distinct path from medical
  where path like 'Categories/%' and path not like '%..%'
  order by 1;
")"

count=0
for old in $paths; do
  count=$((count + 1))
  new="Private/medical/$(basename "$old")"
  if [ "$apply" != "1" ]; then
    printf 'would move %s -> %s\n' "$old" "$new"
    continue
  fi
  rclone_run copyto "s:${bucket}/${old}" "s:${bucket}/${new}" --checksum
  rclone_run check "s:${bucket}/${old}" "s:${bucket}/${new}" --one-way --download >/dev/null
  psql_run -v old="$old" -v new="$new" <<'SQL'
begin;
update media.media_library set file_url = :'new'
 where regexp_replace(file_url, '^/+', '') = :'old';
update patient.clinical_documents set file_url = :'new'
 where regexp_replace(file_url, '^/+', '') = :'old';
commit;
SQL
  if [ "$delete_old" = "1" ]; then
    rclone_run deletefile "s:${bucket}/${old}"
  fi
  printf 'moved %s -> %s\n' "$old" "$new"
done

printf '%s medical file(s) %s.\n' "$count" "$([ "$apply" = "1" ] && echo moved || echo 'would move (dry run)')"
