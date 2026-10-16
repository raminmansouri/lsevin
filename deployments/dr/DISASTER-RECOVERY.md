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
* **B disk above 90 %** - leftover Docker volumes (`docker_elasticsearch_data` ~57 GB, legacy) are the biggest item; archive, then remove with owner approval.

## 3. Recovery procedures

### 3.1 Rebuild server A (A lost or reinstalled)
1. New Ubuntu 24.04 server (8 CPU / 8 GB / 80 GB+), DNS set to `172.29.2.100` / `172.29.0.100`, root SSH key from the PC.
2. Install: `docker.io`, k3s, `rclone`, OpenVPN, Caddy image `lsevin-caddy:geoip`, Jenkins image `lsevin-jenkins:lts-jdk21`
   (the repo `deployments/jenkins`, `deployments/docker`, `deployments/kubernetes/platform`).
3. Get the config bundle: from B (`/var/backups/lsevin-offsite/A/`) or the PC kit. Decrypt (kit: `decrypt-backups.ps1`; server: `rclone --config /etc/lsevin-dr/rclone.conf copy peer:config /tmp/cfg`).
   Unpack at `/` (`tar xzf config-A-*.tar.gz -C /`): restores `/etc/lsevin*`, `/etc/openvpn`, certificates, Caddyfile, systemd units, SymmetricDS node config, Jenkins
   credentials/secrets, `/root/.ssh`. The `k8s/` folder holds the Kubernetes secrets/configmaps/deployments as YAML (`kubectl apply -f`).
4. Start the VPN (`lsevin-vpn status`), then bring up the stack with `deployments/kubernetes/platform` manifests and images (Jenkins build or `docker save`
   from B). Database: either let SymmetricDS initial-load from B (`deployments/symmetricds/scripts/a-01..a-02`, preferred: always current), or restore the newest
   dump of A (decrypt `peer:db` on B / the PC) with `pg_restore -U lsevin -d lsevin --no-owner --clean --if-exists`.
5. Media: `lsevin-files-sync --resync` pulls the bucket from B. Certificates: `lsevin-fetch-cert`.
6. Check with `lsevin-sync-status`, `tests/lsevin-sync-verify`, `status.ps1`.

### 3.2 Rebuild server B (B lost)
Same idea with the Ansible roles in `deployments/ansible` and `deployments/docker/Caddyfile.server`. Data source: A has a live copy of the database and
media (the bucket) - **B must not be treated as master while empty**: restore B's database from A's newest encrypted dump (`/var/backups/lsevin-offsite/B/` on A holds
B's old dumps; A's own live DB is newer) and re-create the SymmetricDS hub (`scripts/b-01..b-03`). A cannot reach B until B has its address back (VPN
route is to `202.133.90.50` only). Meanwhile Cloudflare keeps pointing `lsevincare.com` at B: point it at the new address (DNS API token on B `/etc/lsevin-acme/`
is lost with B - create a new one; the kit does not store it).

### 3.3 Both servers lost
PC kit -> `pull-backups.ps1` (newest copies), `decrypt-backups.ps1`, then 3.2 and 3.1 using the decrypted config bundles and dumps.

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
bare-metal rebuild of A or B from the bundles (steps above are assembled from the pieces that were each tested). Do one rehearsal on a spare VM
and correct this document.

Known data finding (2026-10-14): `tests/lsevin-sync-verify` shows rows that differ between A and B in `category.provider_services` (2 rows missing on B, which leaves 5
orphaned `service_before_after` rows on B), `category.service_definitions` (1 row, B newer) and `shop.product_attributes` (7 rows). Not repaired yet (needs an
owner decision); see the report.

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
