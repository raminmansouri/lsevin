# LSevin disaster recovery

Two production sites: **B** (Turkey, `202.133.90.50`, global: `lsevincare.com`, `appmain.lsevin.com`, `api.lsevin.com`) and **A** (Iran,
`213.176.121.235`, `lsevin.ir`). A and B cannot connect to each other; **A dials out to B through an OpenVPN tunnel** (only to B's address).
Database: SymmetricDS keeps both PostgreSQL databases in sync (two-way). Media: two-way `rclone bisync` of the `lsevin-media` bucket.
Because both sites hold a live copy of data, the loss of one server loses **no data** (only the changes of the last few seconds that had not
been sent yet). Backups exist for the cases where the *wrong* data was replicated (bad delete, corruption, ransomware).

## 1. What protects what

| Risk | Protection | Recovery point (RPO) | Where |
|---|---|---|---|
| One server lost (disk, fire, provider) | the other site holds a live replica (DB + media) | seconds to minutes | the other server |
| Accidental delete / bad migration (replicated to both sites) | daily `pg_dump` (7 days off-site, 14 days local), pgBackRest full weekly + incremental (point-in-time recovery, same site) | 24 h (dump) / minutes (PITR) | `/var/backups/lsevin/db`, `/opt/lsevin/backups/pgbackrest` |
| Lost configuration (secrets, Caddy, certificates, Jenkins, k8s objects, SSH keys, VPN profiles) | **config bundle** every 4 h, encrypted, copied to the other site | 4 h | `/var/backups/lsevin-offsite/<other site>/` on each server |
| Both servers lost | encrypted copies pulled to the admin PC | last pull | `lsevin-dr-kit\backups\` on the PC |
| Backup silently stopped | metrics on B's Grafana: dashboard **"Server A (Iran) health"**, backup-age panels (alert level 26 h) | - | Grafana, B |

Encryption: client-side `rclone crypt` (names and contents). Configuration: `/etc/lsevin-dr/rclone.conf` on each server (root only) and
`secrets\dr-crypt.conf` in the PC kit. **Keep an offline copy of the kit's `secrets` folder (password manager / printed). Without it the
off-site copies cannot be read.**

Schedules (UTC): pgBackRest 03:10, dump 03:40 (A) / 05:30 (B), off-site copy every 4 h (`lsevin-dr-offsite.timer`), restore test Sunday 01:30
(`lsevin-dr-verify.timer`: restores the newest dump into a scratch database and compares tables and row counts), Docker cleanup daily.

## 2. First checks (any incident)

From the PC kit: `status.ps1` (public URLs, both servers, sync, backup ages). On a server: `lsevin-sync-status` (A), `uptime`, `free -m`,
`df -h /`, `kubectl -n lsevin get pods`, `docker ps`. Grafana (B) shows A's health even when A is unreachable (last values + staleness).

Known causes of "the site is down / slow" and their fixes:
* **A is unreachable by SSH but pings** - memory/CPU exhaustion. Wait, or power-cycle at the provider; services self-heal in about 2-3 minutes.
  Look at `sar -q -r`, `journalctl -k | grep -i oom`. Jenkins builds are limited (see `deployments/jenkins`); never start extra builds by hand while the
  site is busy.
* **lsevin.ir answers 504 for people outside Iran / on a VPN** - ArvanCloud's foreign edge cannot reach A. Expected; the fix is ArvanCloud's backup
  origin (B, plain HTTP) which B answers with a redirect to `lsevincare.com` (already configured on B).
* **Webapp slow, `/_next/image` slow** - CPU throttling of the pod (limit is 2 CPUs) or DNS failures from the pod (CoreDNS rule for `lsevin.ir`
  must also answer AAAA; see `failover/coredns-custom.lsevin-ir.override`).
* **B disk above 85 %** - `/var/lib/docker/volumes/docker_elasticsearch_data` (~57 GB) is the LIVE Elasticsearch data (a hostPath of the Kubernetes pod), not a leftover:
  do not delete it. Logs older than 7 days are removed daily by `lsevin-es-retention.timer`; image/build caches by `lsevin-docker-cleanup` and Docker's build-cache GC (6 GB).
* **A or B stops answering SSH but pings** - memory exhaustion (2026-10-18: the admin providers form scanned 1.95 M cities per request). Reboot from the provider panel, then see
  Grafana / Telegram alerts `oom_kill`, `memory_pressure`. Cause was fixed in the webapp (`admin-service-providers.queries.ts`); pgbouncer now cancels application queries after 120 s.

## 3. Recovery procedures

### 3.1 – 3.3 Rebuild a lost server (A, B, or both)
**Follow [RESTORE-SERVER.md](RESTORE-SERVER.md).** It prepares the recovery folder from the PC kit, copies it to a fresh Ubuntu 24.04 machine and runs
`deployments/dr/rebuild/lsevin-rebuild` (phases: base, config, k3s, code, data-tier, database, apps, edge, sync, verify), then lists the manual steps
(DNS, VPN address if B's IP changed, Jenkins builds for images not in the archive). The loss of one server loses no data, because the other holds a live replica.
Both lost: restore B first from the PC kit, then A.

### 3.4 Wrong data was replicated (restore into a scratch database first)
1. **Stop replication first** or the repair spreads/undoes: `systemctl stop symds-node-a` (A) and stop the hub (`scripts/rollback.sh` / `docker stop` on B).
2. Restore the newest good dump into a scratch database, extract the lost rows, re-insert them in the live database (replica role so triggers stay quiet if you
   want them *not* to replicate; normally you do want them to replicate, so use normal inserts).
3. For point-in-time recovery use pgBackRest inside the postgres pod (`pgbackrest --stanza=lsevin --type=time --target=... restore`) on a scratch instance.
4. Start replication again and run `tests/lsevin-sync-verify`.

### 3.5 Roll back a bad deployment
`deployments/jenkins/rollback.sh` (image tags are kept); Jenkins also restores the previous image automatically if `rollout status` fails.

## 4. Verification status (honest list)

Tested: encrypted off-site copy in both directions; decryption on the PC; weekly automated restore of the newest dump into a scratch database (A and B: PASS,
712 tables); config bundle contents; two-way DB/file sync tests; A reboot recovery; outage replay (145 s). **Not rehearsed end to end:** a complete
bare-metal rebuild of A or B (`lsevin-rebuild` and RESTORE-SERVER.md are assembled from pieces that were each tested; the bundle completeness check and the Kubernetes export cleaner were run on the real A bundle). Do one rehearsal on a spare VM (RESTORE-SERVER.md §8).

Data finding of 2026-10-14 (provider_services / service_definitions / product_attributes differences) was repaired on 2026-10-15/16; `tests/lsevin-sync-verify` now reports
the replicated tables identical (cosmetic `shop.product_attributes` text differences converge once both sites run the same webapp version).

## 4b. Monitoring and alerting (Telegram)

`deployments/monitoring/`: `lsevin-site-exporter` (both servers; replication, file sync, VPN, Jenkins, providers, Kubernetes, backups, disk, certificates),
`lsevin-alerter` on B (44 Prometheus rules + 10 public URL checks, `rules.json`; Telegram, retries, daily summary 07:00 UTC; mute a rule by listing it in `/var/lib/lsevin-alerter/muted`),
and the PC `watchdog.ps1` (kit; every 5 minutes: public sites, lsevin.ir via the Iranian line, the alerter's heartbeat) as the safety net for B itself being down.
Secrets: `/etc/lsevin-alerter/telegram.env` (B) and `secrets	elegram.env` (kit). Bot token rotation: BotFather `/revoke`, then update both files and restart `lsevin-alerter`.
Releases: **B builds, A applies B's release** (`deployments/release-sync`): A no longer builds the webapp (it cannot: ~3 GB RAM per build on a 7.9 GB host); `lsevin-release-sync` on A (5-min timer) fetches the images B runs over the VPN, rewrites the host and deploys with rollback; alerts `release_behind`, `release_check_failing`.
Image archives for fast rebuilds: `lsevin-dr-images.timer` (weekly, encrypted, to the other site).

## 5. Installing the tooling on a (new) server

Files: `deployments/dr/` (`lsevin-dr-offsite`, `lsevin-dr-verify`, units, `site-A.env` / `site-B.env`, `rclone.conf.template`) and
`deployments/monitoring/` (`lsevin-site-exporter`, `a-remote-write-setup.sh`, `make-site-dashboard.py`, `b-install-site-dashboard.sh`).
1. `install -m 755 lsevin-dr-offsite lsevin-dr-verify /usr/local/sbin/`; units to `/etc/systemd/system/`; `systemctl enable --now lsevin-dr-offsite.timer lsevin-dr-verify.timer`.
2. `/etc/lsevin-dr/site.env` from `site-A.env` or `site-B.env`; `/etc/lsevin-dr/rclone.conf` from the template, using the **same** crypt passwords as the kit's
   `secrets\dr-crypt.conf` (`rclone obscure` form) and the SeaweedFS S3 key of the sync account (A: endpoint `127.0.0.1:18333`, the tunnel to B; B: `127.0.0.1:30901`).
3. `rclone` binary in `/usr/local/bin` (v1.75.1); exclude `_backups/**` from the media bisync (already in `files-sync/lsevin-files-sync`).
4. Metrics: `lsevin-site-exporter` + `.service` (needs `/etc/lsevin-dr/exporter.env` on B), then `a-remote-write-setup.sh` on A (password in `/etc/lsevin/prom-remote-write.pw`;
   the matching route `/prom-write/` and hash are in B's Caddyfile) and `b-install-site-dashboard.sh` on B.
5. Check: `systemctl start lsevin-dr-offsite.service`, `lsevin-dr-verify`, then Grafana -> "Server A (Iran) health".
