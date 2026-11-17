# Server B disk and memory pressure (2026-11-15 .. 2026-11-17): what happened and what runs now

## Incidents
* **2026-11-15 09:33 UTC, `memory_critical`:** Jenkins `lsevin-main-production #462` ran the webapp `next build` on B (16 GB): 4.3 GB RSS, ~460% CPU,
  available memory 3.57%, load 16. No OOM kill (8 GB swap).
* **2026-11-17 ~02:00 UTC, lsevincare.com down for ~6 h:** B's disk climbed 78.5% -> 94.5% (18:00 -> 01:45), kubelet evicted pods (hard eviction at
  nodefs.available < 5%), the Postgres pod was one of them and its image `lsevin-postgres:17.10-alpine-pgvector0.8.1` was then garbage-collected
  as unused -> `ImagePullBackOff` -> database down -> webapp `Init:Error` -> Caddy/Cloudflare 503. Fixed by copying the image from A (backup tar on B:
  `/opt/lsevin/image-backups/`). Never roll the Postgres Deployment back to `17.10-alpine` (no pgvector).

## Root causes (measured)
| What | Evidence | Size |
|---|---|---|
| **Webapp ISR page cache in the container filesystem** | runtime-written `.html/.rsc/.meta` under `/app/.next/server/app/<locale>/...`; `next.config` has `cacheMaxMemorySize: 0`; writable layer +18 MB/min per pod | ~1.1 GB/h per pod, up to ~24 GB, emptied only by a pod restart. THE cause of the 11-16/17 climb. |
| **Postgres error log spam -> Elasticsearch** | `ERROR: No active exchange rate found from IRR to EUR/AED/IQD/CNY/RUB/SAR/QAR/OMR/KWD/GBP` (finance.get_latest_rate, called by finance.convert_money for viewer pricing), ~18/s, ~25 log lines each | 460 lines/s, 51M docs / 4.5 GB per day in ES (was 0.8 GB/day on 11-10); ES held 17 GB |
| **`next build` on the production host** | BuildKit ignores `docker build --resource ...` (Jenkinsfile.main DOCKER_BUILD_LIMITS) | +4.3 GB RAM, ~460% CPU while it runs |
Elasticsearch itself is NOT the cause of the spikes (heap 0.3 of 0.54 GB, store grew ~1.8 GB during the 23 GB climb) but it was the largest persistent disk user.
At idle ~10 of B's 16 GB are used by production services (postgres 1.5, ES 1.1, 2 webapps ~1 each, kibana 0.56, eventstore 0.47, dockerd 1.6, k3s 0.6).

## What runs on B now (installed 2026-11-17, sources in this folder)
1. **`lsevin-build-guard.service`** (`lsevin-build-guard`): every 3 s writes `memory.high=4500M` and `cpu.max=300%` into any new BuildKit build cgroup
   `/sys/fs/cgroup/system.slice/*:docker:*` that has no limit. Soft ceiling: the build is throttled/swapped, never killed. (Verified: the service capped a test BuildKit build 2026-11-17 09:34, and the temporary version held a real build at its
   ceiling and B's lowest available memory was 3.3 GB instead of 0.3 GB; it makes the build slower.) Things that do NOT work and were reverted: the dockerd
   `cgroup-parent` setting (BuildKit still creates a literal dir under system.slice) and capping `docker.service`.
   Tune: `systemctl edit lsevin-build-guard` -> `Environment=BUILD_MEM_HIGH=6000M`. Undo: `systemctl disable --now lsevin-build-guard`.
2. **`lsevin-webapp-cache-recycle.timer`** (every 20 min): rolling-restarts the webapp Deployment (RollingUpdate maxSurge 1 / maxUnavailable 0 + readiness =
   no downtime) when the biggest pod writable layer >= 5000 MB, or the disk is >= 85% and a layer >= 1000 MB. Skips during a build/deploy or an unstable
   rollout, and at most once per 45 min (20 min under disk pressure). Log: `/var/log/lsevin-webapp-cache-recycle.log`. Test: `lsevin-webapp-cache-recycle --dry-run`.
   NOT an ephemeral-storage limit on purpose: both pods fill at the same rate, so a limit would evict both at once.
   **Proper fix still to do in the app:** bound the ISR cache (`experimental.isrFlushToDisk: false` with a real `cacheMaxMemorySize`, or a cache handler).
3. **Postgres log verbosity** (`postgresql.conf`: `log_error_verbosity = terse`, `log_min_error_statement = fatal`, reload only): 15,751 -> 778 lines/min. One
   line per failed conversion is still logged. Backup of the previous file: `postgresql.conf.bak-20261117-0928` next to it.
   **Real fix = finance adds the missing IRR -> EUR/AED/IQD/CNY/RUB/SAR/QAR/OMR/KWD/GBP rates** (or the app stops asking for pairs without a rate / caches "no rate").
4. **Elasticsearch retention 7 -> 4 days** (`lsevin-es-retention.service` Environment `KEEP_DAYS=4`); 3 spam days deleted (~4 GB).
5. **Alert `disk_filling_fast`** (critical, rules.json): disk > 85% and projected > 95% within 4 h. Backtest: first true 20:40 on 11-16, 5 h 20 min before the eviction.
   Alerts go to the `lsevin critical` channel only after 10 minutes (see deployments/monitoring/telegram.env.example).
6. Postgres image backup: `/opt/lsevin/image-backups/lsevin-postgres-17.10-alpine-pgvector0.8.1.tar` (`k3s ctr -n k8s.io images import <tar>`).

## Verify / when to look again
* After the next release build: `journalctl -u lsevin-build-guard` shows `capped ...`; `memory_low` does not fire; build time (was ~12 min uncapped, 20-32 min capped).
* `tail /var/log/lsevin-webapp-cache-recycle.log`: normally `ok: largest pod cache NNN MB`; a `recycling` line means a rolling restart happened.
* Disk climbing > 1 GB/h again: `du` under `/var/lib/rancher/k3s/agent/containerd` (pod layers), `pgsql_tmp`, ES index sizes (`_cat/indices?s=store.size:desc`).
* Not changed: Jenkinsfile.main (its `--resource` flags are dead but harmless), kibana, the ~23 GB "unused" docker volumes (docker_postgres_data is the LIVE database via hostPath: never prune volumes).
