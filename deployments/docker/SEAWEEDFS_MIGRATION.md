# SeaweedFS migration runbook

This migration is deliberately non-destructive: MinIO and its data directory
remain available until the backup, copy and application cutover have all been
verified. SeaweedFS uses the existing S3 client in the API, so application file
keys and URLs do not change.

## Configuration matrix

| Build/environment | Docker Compose | Kubernetes | Storage endpoint |
|---|---|---|---|
| Debug / local | `docker-compose.dev.yml` | `kubernetes/development` | host `localhost:9000`, in-cluster `seaweedfs:8333` |
| Release / server bootstrap | `docker-compose.server.yml` | `kubernetes/hybrid` | MinIO remains active while SeaweedFS is populated |
| Release / server cutover | set the two server environment values below | `kubernetes/hybrid-seaweedfs-cutover` | in-cluster `seaweedfs:8333` |

The Debug launch profiles point the API at the local S3 port. Release receives
credentials only from server environment/Kubernetes Secrets; no production
credential is stored in source control.

## Local development

Start SeaweedFS and create the private `lsevin-media` bucket:

```powershell
docker compose -f deployments/docker/docker-compose.dev.yml --env-file deployments/docker/.env.dev up -d
```

The old `lsevin_dev_minio` volume is retained. To inspect or migrate it, start
the legacy source explicitly:

```powershell
docker compose -f deployments/docker/docker-compose.dev.yml --env-file deployments/docker/.env.dev --profile legacy-storage up -d minio-legacy
```

The API reads and writes SeaweedFS through `http://localhost:9000`. Public media
is exposed through the API at `http://localhost:5003/files/...`; the S3 bucket
itself remains private.

## Production Kubernetes cutover

1. Apply the hybrid manifests. This starts SeaweedFS but the migration Job stays
   suspended, so no data moves yet.
2. Confirm the MinIO source, SeaweedFS pod and free space under
   `/var/lib/lsevin/object-storage-backups`.
3. Unsuspend `migrate-minio-to-seaweedfs`. It first creates a timestamped local
   backup, then copies to SeaweedFS, performs a byte-download comparison, and
   writes source/destination counts plus a SHA-256 manifest.
4. Only after the Job succeeds, apply the cutover overlay, which deploys the API
   build with the `SeaweedFS` backend and internal S3 endpoint:

   `kubectl kustomize --load-restrictor LoadRestrictionsNone deployments/kubernetes/hybrid-seaweedfs-cutover | kubectl apply -f -`
5. Test representative public category/provider images and a private customer
   document. Keep MinIO and the timestamped backup for at least 30 days.

```bash
kubectl -n lsevin patch job migrate-minio-to-seaweedfs \
  --type merge -p '{"spec":{"suspend":false}}'
kubectl -n lsevin logs -f job/migrate-minio-to-seaweedfs
kubectl -n lsevin get job migrate-minio-to-seaweedfs
```

Do not switch the API before the verification Job reports success. Rollback is
to restore the previous API environment and MinIO endpoint; the migration never
deletes or modifies source objects.

For a Docker-based server, use
`deployments/ansible/scripts/migrate-minio-to-seaweedfs.sh`. It follows the same
backup-copy-check sequence and requires credentials through environment variables.
After it succeeds, set `FILE_STORAGE_BACKEND=SeaweedFS` and
`OBJECT_STORAGE_S3_ENDPOINT=http://seaweedfs:8333`, then recreate the API. Until
those two values are changed, the server Compose file continues using MinIO.
