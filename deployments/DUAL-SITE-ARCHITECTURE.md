# LSevin dual-site architecture (B = Turkey / global, A = Iran)

Status date: 2026-10-09. This document describes what is actually built and running, how the pieces connect, how
failures are handled, and how to operate and recover it. Secrets are never written here; locations are given instead.

---------------------------------------------------------------------------------------------------------------------

## 1. Why this exists and the constraint that shapes everything

* **B** (202.133.90.50, Turkey) is the original production server and serves everybody outside Iran.
* **A** (213.176.121.235, Iran) was added to serve Iranian visitors from inside Iran.
* **A and B cannot connect to each other.** Nothing outside Iran can reach A (not B, not Cloudflare), and B cannot
  open connections into A. Only A can dial out, and only through a purchased **OpenVPN** account.
* Consequence: every link between the sites is **initiated by A** and goes through the VPN to B's public address.
  B is only ever *contacted*. Anything that "pushes from B to A" is really "A pulls from B".

```
                       Internet (outside Iran)                           |   Iran national network
                                                                         |
  visitors ---> Cloudflare (lsevincare.com, Worker lsevincare-geo) ---> B |   Iranian visitors
                    |  proxied origin = B                                |        |
                    |  Iran + A healthy: HTTP 302 -> ir.lsevincare.com --+--------+----> A  (DNS only, A's public IP)
                                                                         |
   B 202.133.90.50                                A 213.176.121.235
   +---------------------------------+            +---------------------------------+
   | Caddy (docker) 80/443           |            | Caddy (docker, host network)    |
   |   appmain/api/crm/... + /symds  |            |   ir.lsevincare.com (HTTPS)     |
   | k3s: api, webapp, crm, portal,  |            |   lsevincare.com & others (HTTP)|
   |   providers, postgres+pgbouncer,|            | k3s: same application stack     |
   |   redis, seaweedfs, minio, ES.. |            |   (webapp = Iran variant)       |
   | SymmetricDS HUB  (listens)      |<-- HTTPS --| SymmetricDS client (dials out)  |
   | SeaweedFS S3 :30901             |<-- SSH -L -| rclone bisync + tunnel          |
   | acme/lego (certs for ir.*)      |<-- SSH ----| lsevin-fetch-cert               |
   | Jenkins (docker)                |            | OpenVPN split tunnel + manager  |
   +---------------------------------+            | Jenkins (docker), health, backup|
              ^                                    +----------------+----------------+
              |        all A -> B traffic goes through              |
              +---------------- OpenVPN (route only 202.133.90.50/32) +
```

---------------------------------------------------------------------------------------------------------------------

## 2. Components

### 2.1 Server B (production, Ubuntu 22.04, 8 CPU, 15 GB RAM)
| Layer | What | Notes |
|---|---|---|
| Edge | Caddy (docker `docker-caddy-1`), Let's Encrypt certs | `deployments/docker/Caddyfile.server`; includes `handle_path /symds/*` for the hub |
| Orchestration | single-node k3s, namespace `lsevin` | manifests/images deployed by Jenkins (`k3s-deploy.sh`) |
| Data | PostgreSQL 17.10 (pod, hostPath volume) behind PgBouncer; SeaweedFS (S3 + filer); MinIO (legacy); Redis | DB `lsevin` (+ `lsevin_case_validation_20261001`) |
| Apps | lsevin-api (.NET), lsevin-webapp (Next.js), crm (+worker, scheduler), lsevin-portal, providers-worker/scheduler | |
| Observability | Prometheus, Grafana, Elasticsearch, Kibana, Fluent-bit, OTel | not replicated to A (A is smaller) |
| CI/CD | Jenkins controller in Docker | pipelines from GitHub |
| Added for the dual-site | `symds-hub` (SymmetricDS 3.16.17, Java 21, bound to the docker bridge 172.18.0.1:31415, user `symds`); `lsevin-acme` + timer + path unit (lego DNS-01); user `filesync` (restricted keys); UFW rule for the hub | secrets in `/opt/symds/hub/engines/hub.properties` and `/etc/lsevin-acme/cloudflare.token` (root-only) |

### 2.2 Server A (Ubuntu 24.04, 8 CPU, 7.8 GB RAM, 80 GB disk)
| Layer | What | Notes |
|---|---|---|
| Network | OpenVPN client `openvpn-client@lsevin-vpn` (split tunnel: only B's IP is routed through it) + `lsevin-vpn-manager` | profiles in `/etc/openvpn/lsevin-pool/` (root-only); CLI `lsevin-vpn status|add|clear-cooldown` |
| Firewall | UFW: allow 22, 80, 443 and the k3s pod networks | k3s API/kubelet/exporters are not exposed |
| Edge | Caddy (docker, host network): `https://ir.lsevincare.com` (Let's Encrypt cert), plain-HTTP aliases, `/__lsevin/health` | `/opt/lsevin/caddy/Caddyfile` |
| Application | same k3s stack as B, same image versions. **Webapp is an Iran variant** (public host rewritten to `ir.lsevincare.com`) | see 5 |
| Data | own PostgreSQL 17.10 + PgBouncer, own SeaweedFS, Redis | continuously synchronised with B |
| Sync | `symds-node-a` (SymmetricDS client), `lsevin-files-tunnel` + `lsevin-files-sync.timer` (rclone), `lsevin-fetch-cert.timer`, `lsevin-health.timer` | |
| CI/CD | Jenkins controller (127.0.0.1:8080), env `SITE_REWRITE_TO=ir.lsevincare.com` | needs a GitHub credential to run pipelines |
| Backups | pgBackRest (weekly full, daily incremental) + nightly logical dumps (14 days) + SeaweedFS object backup CronJob | `/etc/cron.d/lsevin-backups` |

### 2.3 Cloudflare (zone `lsevincare.com`, Free plan)
| Record / object | Value |
|---|---|
| `lsevincare.com` A | 202.133.90.50 (B), **proxied** |
| `global.lsevincare.com` A | 202.133.90.50, DNS only |
| `ir.lsevincare.com` A | 213.176.121.235 (A), **DNS only** (browsers connect straight to A) |
| Worker `lsevincare-geo` | route `lsevincare.com/*`, variable `IR_REDIRECT` = `canary` (see 6) |
| Worker `dawn-hall-fae2` | the original Worker, route `*.lsevincare.com/*`; untouched, inert (subdomains are DNS only) |

`lsevin.com` DNS is hosted at hostido.net.pl and was not changed.


### 2.4 lsevin.ir = the Iranian domain (DNS and CDN at ArvanCloud, origin = server A)
* Why: some Iranian mobile operators cannot reach A's address (213.176.121.235, HostIran) directly (`ERR_CONNECTION_TIMED_OUT`),
  and Cloudflare is unreachable from some Iranian networks. The ArvanCloud edge is reachable from every operator, so the
  Iranian site is `https://lsevin.ir` (and `www.lsevin.ir`) with the Arvan proxy ("cloud") switched on; Arvan talks to A.
* Visitor -> Arvan edge (needs an HTTPS certificate configured in the Arvan panel) -> A's Caddy (`Caddyfile.A`, origin
  certificate for `lsevin.ir` + `*.lsevin.ir` issued on B via DNS-01 CNAME delegation and fetched by A) -> k3s apps.
* A's webapp image is the Iran variant for host `lsevin.ir` (`lsevin-webapp:lsevinir-<tag>`); `AUTH_URL`, `NEXT_PUBLIC_*`,
  `NEXT_PUBLIC_APP_URL` and the API CORS list name `lsevin.ir`. A's Jenkins controller has `SITE_REWRITE_TO=lsevin.ir`.
* `ir.lsevincare.com` (DNS only, direct to A) now only forwards (302) to `https://lsevin.ir`; the Cloudflare Worker redirects
  Iranians to `lsevin.ir`.
* **Cluster DNS override** (`coredns-custom`, file `failover/coredns-custom.lsevin-ir.override`): inside A's cluster
  `lsevin.ir`/`www.lsevin.ir` resolve to A itself, so the webapp's image optimiser and other self-calls never loop through the
  CDN. Uses the CoreDNS `template` plugin (`hosts` may be used only once per server block and breaks CoreDNS).
* Certificates: `/etc/lsevin-acme/certs` on B (`lsevin-ir|lsevin.ir,*.lsevin.ir|cname`); ArvanCloud holds the one record
  `_acme-challenge.lsevin.ir CNAME _acme-challenge.lsevin-ir.lsevincare.com`.
* Open: the Arvan edge needs HTTPS enabled for the domain (certificate in the Arvan panel); until then the edge answers
  `handshake failure` on 443 (browser: `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`). Plain HTTP through the edge already reaches A.
* Client IPs seen by the API behind the edge are the edge's addresses (Caddy overrides X-Forwarded-For); trusting Arvan's
  ranges for the real client IP is a follow-up.

---------------------------------------------------------------------------------------------------------------------

## 3. Data synchronisation (two-way, A always dials out)

### 3.1 Database: SymmetricDS 3.16.17 (not 3.18: 3.18.1 Community throttles sync jobs to 15 min)
* **Hub** on B (`group server`, node 000, listens), **client** on A (`group client`, node 001, connects out through
  the VPN to `https://api.lsevin.com/symds/hub` — Caddy rewrites `/symds/*` to the hub's `/sync/*`).
* Scope: 696 tables that have a primary key, via capture triggers on both sides (about 2,170 each). Excluded:
  `background_jobs`, migration history tables, `sessions`, `refresh_tokens`, `phone_login_codes`, `sso_sessions`,
  `panel_sessions`, `panel_login_attempts`, `rate_limit_hits`, and 3 tables without a primary key. The second database
  `lsevin_case_validation_20261001` is not synchronised.
* Typical latency 0–4 s while the link is up; backlog replays automatically after an outage (tested: 201 s).
* Applying rows uses `session_replication_role = replica`, so the application's own triggers (`updated_at`, etc.) do not
  fire a second time on the receiving side. Engine DB URL uses `stringtype=unspecified` (needed for enum/jsonb/array).
* **Auto-numbers:** A's sequences were moved into a high range (1,000,000,000 for integer, 1,000,000,000,000 for
  bigint columns); B's numbering is unchanged. Both can insert concurrently without collisions.
* **Conflicts:** 748 "newest edit wins" rules (`USE_TIMESTAMP`) on tables with a NOT NULL `last_modified_date`/
  `updated_at`; other tables apply the incoming change.
* Config and tooling: `deployments/symmetricds/` (`sql/`, `scripts/`, `config/`, `tests/`).

### 3.2 Files: rclone bisync of the SeaweedFS bucket `lsevin-media`
* Runs **on A** every 2 minutes (`lsevin-files-sync`, flock-protected). Path: A's S3 (127.0.0.1:30901)
  <-> `127.0.0.1:18333` <-(ssh -L through the VPN, account `filesync`, forwarding of B's S3 port only)-> B's S3.
* Creates, changes and deletes propagate. Comparison is size + checksum (MD5 from the listing; modtime comparison was
  tested and does not work). Safety: refuses to run if either side is unreachable; canary object `RCLONE_TEST` must
  exist on both; aborts if more than 10 % would be deleted (tested); conflicting edits keep **both** versions
  (`name.conflict1`, `name.conflict2`); transfer cap 3 GB per run; reserved `_scratch/` prefix is never synced.
* Observed throughput through the VPN: about 0.5 MB/s. Propagation latency for a new upload: up to about 4 minutes.
* Not live-synchronised: MinIO (legacy, not a configured backend), `/var/lib/lsevin/uploads` (newest file July 2026),
  and the portal/CRM PVC directories (empty today). They were copied once in full.

### 3.3 Certificates
`lsevin-acme` on B (lego, DNS-01 through the Cloudflare API token) issues/renews the certificate for
`ir.lsevincare.com` (renews when under 30 days remain) and publishes it; `lsevin-fetch-cert` on A pulls it daily over
an SSH key that can only run one read-only command, validates it, installs it and force-reloads Caddy.

---------------------------------------------------------------------------------------------------------------------

## 4. The VPN link and its reserve profiles
Split tunnel: server-pushed routes/DNS/default-gateway are ignored; only `202.133.90.50/32` goes through the tunnel,
so A's own traffic and SSH are unaffected. UDP remotes are dropped when the profile also offers TCP (UDP does not pass
from Iran; it made every reconnect wait 45 s). `lsevin-vpn-manager` checks every 30 s and rotates to the next profile
when the tunnel is dead for 3 checks (or B is unreachable through a live tunnel for about 10 minutes). A profile that
failed on authentication / credit is parked for 6 h, other failures for 30 min. Add reserves with
`lsevin-vpn add FILE.ovpn` (only one profile is installed today).

---------------------------------------------------------------------------------------------------------------------

## 5. The Iran webapp variant
Next.js compiles `NEXT_PUBLIC_*` (public host) into the build. A's pages must not send visitors back to B, so A runs
`lsevin-webapp:ir-<tag>`: a copy of the *exact image B runs* with the host `appmain.lsevin.com` rewritten to
`ir.lsevincare.com` (`deployments/jenkins/site-variant/build-site-variant.sh`). Jenkins integration: when the
controller defines `SITE_REWRITE_TO` (A's does, B's does not) the pipeline rewrites the freshly built image under the
same tag before importing it, so every future build on A stays an Iran variant. A's `webapp-secrets` (`AUTH_URL`,
`NEXT_PUBLIC_*`) and `api-secrets` (CORS origin) were pointed at the Iran host; `crm.`, `pay.` and `admin.` hostnames
remain B's on purpose. Backups of the original A values: `/root/*.before-ir.yaml` on A.

---------------------------------------------------------------------------------------------------------------------

## 6. Traffic steering and failover
* **Everyone is served by B through Cloudflare** unless the Worker redirects. Cloudflare cannot reach A, so the proxied
  record must never point at A (that was the cause of the Cloudflare 522 outage on 2026-10-09; fixed).
* **Worker `lsevincare-geo`** (`deployments/failover/cloudflare-worker.js`, 22 logic tests): for GET page loads from
  Iran (never API/files/assets/POST) it returns a 302 to `ir.lsevincare.com` only if A's heartbeat says healthy.
  `IR_REDIRECT`: `off` (all to B) | `canary` (only `?site=ir` or cookie `lsevin_site=ir`) | `on` (all Iranian page loads).
  Currently **`canary`**.
* **Heartbeat:** `lsevin-health` on A evaluates apps, VPN, DB-sync lag/errors, file-sync age and disk every minute and
  writes `Categories/_health/a.json` straight into both A's and B's bucket (excluded from the bulk sync). The Worker
  reads it at `https://api.lsevin.com/files/Categories/_health/a.json`; older than 3 minutes or `ok:false` means "A is
  down", so Iranians stay on B. Detail: `http://A/__lsevin/health`.

---------------------------------------------------------------------------------------------------------------------

## 7. Backups and disaster recovery
| Scenario | What protects you | Procedure |
|---|---|---|
| One server lost | the other holds a full, continuously synced copy | rebuild the node, re-seed from the survivor (`deployments/sync/sync-b-to-a.sh`, `lsevin-files-sync --resync`), reinstall sync (`symmetricds/scripts`), run the tests |
| Accidental delete/corruption (replicates to both!) | pgBackRest PITR on each server (WAL archive + full/incr), nightly logical dumps (14 d), nightly SeaweedFS object backups | restore into a scratch instance, extract, re-insert on one side (it replicates). **Restore tested on A** (below) |
| VPN account out of credit / all profiles dead | reserve profiles; both sites keep serving; changes queue and replay | add profile `lsevin-vpn add`; Worker keeps visitors on B while the heartbeat is stale |
| Cloudflare / DNS mistake | records and Worker routes backed up before every change | restore from the saved JSON (kept in the operator's scratch folder / `cf-backup-*.json` on B) |
| Certificate expiry | automatic issue + renewal; A keeps serving the old cert if B is unreachable | check `/var/log/lsevin-cert.log` |

Full step-by-step runbooks: `deployments/failover/README.md`.

---------------------------------------------------------------------------------------------------------------------

## 8. Verification record (everything below was executed on the real systems, 2026-10-09)
| Area | Test | Result |
|---|---|---|
| Public site | `lsevincare.com` after the Cloudflare origin fix; sites on B | 200, `/readiness` Healthy |
| Database sync | `symmetricds/tests/live-smoke-test.sh` (insert/update/delete both ways, app trigger not re-fired, auto-number ranges, no errors) | ALL PASS (run 3 times, last one after two reboots) |
| Database types | `live-types-test.sh`: jsonb, text[]/int[], enum, tsvector, interval, inet, bytea, numeric, timestamptz, bigint | identical rows both ways (MD5), update OK |
| Conflicts | `live-conflict-test.sh`: same row edited on both sides while disconnected | newest edit won on both sides |
| File sync | `symmetricds/tests/files-sync-test.sh`: create/change/delete both ways, 40 MB file, image served by A's API | ALL PASS (also after reboots) |
| File sync safety | sandbox: 30 of 39 files deleted -> **refused**; unreachable remote -> refused; tunnel down -> wrapper exits 1 | PASS |
| File sync same-size rewrite | size+checksum compare (size-only missed the heartbeat; size+modtime produced conflicts) | PASS in sandbox, then production |
| Outage drill | `failover/outage-recovery-test.sh`: VPN fully down 270 s, writes on both sides | writes accepted on both; heartbeat stale after ~150 s; backlog replayed in 145 s; heartbeat fresh again; 0 errors |
| VPN failover logic | cool-down 6 h on auth/credit failure, 30 min otherwise (stubbed journal); rotation to a reserve with a dead profile | PASS (a real wrong-password login was deliberately NOT tried: it could lock the only account) |
| Backup restore | pgBackRest restore on A into a scratch instance (archiving off): 655 MB in 56 s, recovery to consistency, promoted read-write, 740 tables | PASS (row counts reflect the backup point) |
| Reboot | A rebooted twice | all services back in about 130 s; first reboot exposed a DNS regression (below), fixed, second reboot clean |
| Iran site in a real browser | `frontend/webapp/e2e/ir-site.spec.ts` via `playwright.ir.config.ts` | 4/4 pass (one first-load timeout right after a reboot, cold image cache; passes on rerun) |
| Worker | `failover/worker.test.mjs` | 22/22 pass (mocked runtime) |
| Release smoke | `e2e/smoke-release.spec.ts` against A | 5/5 |

**Not tested:** a real user login on `ir.lsevincare.com` (no test account); an upload through the application UI;
a reboot of B (production); a real VPN credit-exhaustion event; the Worker's Iranian branch against real Iranian traffic;
a pgBackRest restore on B; Jenkins pipeline execution on A (needs a GitHub credential).

## 9. Operational lessons recorded while building this
* **DNS survives reboots only if `/etc/network/interfaces` agrees.** The provider's VMware tooling wrote
  `dns-nameservers 4.2.2.4 8.8.4.4` there; the legacy ifupdown layer re-applied it at every boot and overrode netplan.
  Fixed (backup: `/etc/network/interfaces.bak-dns-fix`). Symptom was `UnknownHostException` in the sync client and an
  unsynchronised clock.
* `caddy reload` is a no-op when the Caddyfile is unchanged, so renewed certificate files are not re-read; use
  `caddy reload --force` (the fetch script does).
* SymmetricDS needs `stringtype=unspecified` in the JDBC URL for enum/jsonb columns; one unsupported row blocks every
  later batch on that channel until fixed.
* lego 5.x changed its CLI: all options belong to the `run` subcommand.
* `kubectl exec` ignores piped stdin unless `-i` is given.
* Cloudflare Workers cannot reach A. Never point a proxied record, a Worker `fetch()` or a load-balancer pool at A.

## 10. Open items and risks
* Switch `IR_REDIRECT` from `canary` to `on` only after a real login on `https://ir.lsevincare.com` has been checked.
* Rotate: the `lsevin` database password (a prefix was printed in a chat transcript), the Cloudflare API token and the VPN
  password (both appeared in chat), and A's root password.
* Create the ArvanCloud CNAME for `lsevin.ir` (section 2.4) so its certificate is issued.
* Add reserve VPN profiles; add a GitHub credential to A's Jenkins; commit the repo changes listed in the project report.
* Throughput through the VPN is about 0.5 MB/s; large video uploads take minutes to reach the other site and consume the VPN allowance.
* B has not been rebooted since the hub, the tunnel account and the ACME units were added; they are enabled at boot but untested there.

## 12. Operations update (2026-10-12)

* **A must reach `api.lsevin.com` at B's address.** Once `api.lsevin.com` became a Cloudflare-proxied record, A resolved
  it to Cloudflare, which is unreachable from Iran, and the SymmetricDS client timed out (edits made on lsevin.ir
  never reached B). A's `/etc/hosts` pins `202.133.90.50 api.lsevin.com` (A reaches B only through the VPN route to
  that address). If B's address ever changes, change it there too.
* **Replicated tables need `GENERATED BY DEFAULT` identity columns.** SymmetricDS inserts rows with the id they had on
  the other node; PostgreSQL rejects that for `GENERATED ALWAYS` ("cannot insert a non-DEFAULT value into column"),
  and one failing batch blocks the whole `business` channel. `sql/identity-by-default.sql` was applied on A and B for
  `shop.analytics_events`, `accounting.audit_log`, `accounting.panel_login_attempts`, `accounting.wallet_ledger` and
  `patient.audit_log`. Any new table with an `ALWAYS` identity column must get the same treatment on both sides.
* **A's Jenkins publishes by polling, from a local mirror.** GitHub cannot call a webhook on a server in Iran, so
  `JENKINS_POLL_SCM` (see `jenkins/casc/jobs.groovy`) makes the jobs poll every 5 minutes. A full clone from GitHub
  breaks over A's connection, so the main repository is built from `/opt/lsevin-mirror/lsevin.git`, refreshed every
  2 minutes by `jenkins/git-mirror/lsevin-git-mirror` (incremental fetches work). All A-only Jenkins settings
  (port, releases mount, site variant, mirror, GitHub credential) are in
  `jenkins/git-mirror/docker-compose.override.A.yml`; never replace A's compose file without that override.
  Private repositories use the credential `github-mohammadjafariyan`, whose token is read from
  `/etc/lsevin/jenkins/github-token` (root-only, not in git). A job needs one finished build before polling starts.
* **Mobile apps** choose between `lsevincare.com` and `lsevin.ir` by racing `GET /app-health` (HTTP 204) on both
  (`frontend/webapp/src/app/app-health`); the page must be deployed to both sites before the apps are released.
* **Capacity rules for A (7.9 GB, 8 CPUs, shared with the application).** On 2026-10-13 A stopped answering (load
  average > 150, OOM kills) when the CRM, providers and shop pipelines, which build with an unlimited
  `docker compose build`, ran next to the main build. Rules now: only `lsevin-main-production` polls
  (`JENKINS_POLL_SCM_JOBS`); the other jobs are started by hand, one at a time; image builds are capped with
  `JENKINS_BUILD_LIMITS` (1 CPU, 2 GB) and the compose builds with `--memory`; the Jenkins controller has
  `oom_score_adj: 500` so the kernel sacrifices it before the application; the host has 6 GB of swap; and
  `lsevin-docker-cleanup.timer` (daily) keeps the BuildKit cache near 5 GB. Check `uptime` and `free -m` before starting
  any extra build on A, and keep `/` below about 80 %.
* **crm / providers / financial on the Iranian domain:** `crm.lsevin.ir`, `providers.lsevin.ir` and
  `financial.lsevin.ir` are served by A's Caddy (`failover/Caddyfile.A`, wildcard certificate `*.lsevin.ir`; DNS at
  ArvanCloud). Logins on these hosts have not been tested.
