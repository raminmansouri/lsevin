# Two-way file sync A <-> B (images, videos, documents)

The .NET API stores every uploaded file in SeaweedFS (bucket `lsevin-media`, S3 API). This job keeps that bucket
identical on server A (Iran) and server B, in both directions, without B ever connecting to A.

```
A: SeaweedFS S3 (127.0.0.1:30901) <-- rclone bisync --> 127.0.0.1:18333 --ssh -L (via OpenVPN)--> B: SeaweedFS S3 (127.0.0.1:30901)
```

* `lsevin-files-tunnel.service` (on A): `ssh -N -L 127.0.0.1:18333:127.0.0.1:30901 filesync@B`, auto-reconnect.
* B account `filesync`: no shell, key restricted to `port-forwarding` of `127.0.0.1:30901` only.
* `lsevin-files-sync` + `lsevin-files-sync.timer` (every 2 min): `rclone bisync`, size+checksum comparison, delete cap
  (10 %), canary object, conflict = both versions kept (`..path1` / `..path2`), 3 GB per-run transfer cap.
* Credentials: the same S3 identity exists on both sides (copied secrets); rclone config is root-only on A.

Not covered on purpose: MinIO (`lsevin-media`, legacy, no longer the configured backend) and
`/var/lib/lsevin/uploads` (newest file July 2026). Both were copied once in full. The portal/CRM PVCs are empty.

Operations (on A): `lsevin-files-sync --status`, `lsevin-files-sync --resync` (rebuild baseline, deletes nothing),
log `/var/log/lsevin-files-sync.log`.

Notes
* Large videos cross the OpenVPN link: watch the provider's data allowance (`MAX_TRANSFER` caps one run).
* A file deleted on one side is deleted on the other at the next run; the 10 % cap stops mass deletions.
* Tests: `tests/files-sync-test.sh` (run from a PC that can SSH to A).
