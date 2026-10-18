# Failover and disaster recovery (A = Iran, B = Turkey)

## The one fact everything depends on
Cloudflare (and anything else outside Iran) **cannot reach server A**; B cannot either. A can only dial out through the
OpenVPN link. Therefore:
* The proxied hostnames (`lsevincare.com`, `appmain.lsevin.com`, ...) must always have **B** as origin.
  Pointing a proxied record, a Worker `fetch()` or a Load-Balancer pool at A produces **Cloudflare 522 for everyone**.
* Iranian visitors reach A by a **DNS-only** hostname (`ir.lsevincare.com` -> 213.176.121.235): their browser
  connects to A inside Iran. `cloudflare-worker.js` redirects Iranian GET page loads there while A is healthy.

## Health signals
| Signal | Where | Meaning |
|---|---|---|
| `http://<A>/__lsevin/health` | A's Caddy | detailed JSON (apps, VPN, DB sync lag/errors, file sync age, disk) |
| `Categories/_health/a.json` | synced bucket, public via `https://api.lsevin.com/files/Categories/_health/a.json` | `{ok, epoch}` written every minute by `lsevin-health`; the Worker treats A as alive if `ok` and younger than 3 minutes |
| `lsevin-sync-status` | on A | operator view |

## What happens when something fails
| Failure | Effect | Automatic response | Operator action |
|---|---|---|---|
| A down / A's apps unhealthy | heartbeat goes stale/not-ok | Worker stops redirecting; Iranians use B (slower, but works if Iran can reach Cloudflare) | fix A; sync catches up on its own |
| B down | foreign users down; A keeps serving Iranians (its DB/files are complete copies) | none possible (Cloudflare origin is B) | restore B (below), or temporarily point the proxied origin to a rebuilt B |
| OpenVPN profile out of credit | A cannot reach B; both keep serving; changes queue on both sides | `lsevin-vpn-manager` rotates to a reserve profile (30 min cool-down, 6 h after auth failure) | add reserve profiles: `lsevin-vpn add FILE.ovpn` |
| All VPN profiles dead | sync paused, queues grow (DB `sym_data`, files) | alert via health (`vpn:false`, `ok:false`); Worker sends Iranians to B | add a profile; backlog replays automatically |
| Long partition, both sides edited the same row | newest edit wins (tables with a modified-time column); files: both versions kept as `..path1/..path2` | automatic | review `..path1/..path2` keys if any |
| Disk full on A | health `disk_ok:false` at 85 % | Worker fails over to B | free space |

## Disaster recovery
Both servers hold a full, continuously synced copy of the database and the media bucket, so losing **one** server loses
no data (except the last minutes of changes that had not synced yet). Accidental deletes/corruption **do replicate**,
so point-in-time backups on each server are the safety net:
* PostgreSQL: pgBackRest (WAL archive + full weekly / incr daily) and a nightly `pg_dump` on A
  (`/var/backups/lsevin/db`, 14 days); B has pgBackRest (`/opt/lsevin/backups/pgbackrest`) and its nightly logical dumps.
* Media: nightly SeaweedFS object backup CronJob on each server (rclone to a local hostPath).

### Restore a node from the other (server lost)
1. New/blank server: install as in `deployments/ansible` (B) or this repo's A procedure (k3s, images, manifests, secrets).
2. Seed the database from the survivor: `deployments/sync/sync-b-to-a.sh` (B -> A). For the opposite direction dump on A
   (`pg_dump -Fc`) and restore on B with the same method. Stop `symds-*` services first; the script refuses to run while
   the sync client is active.
3. Seed files: `deployments/sync/sync-b-to-a.sh --files-only`, or `lsevin-files-sync --resync` on A (union, deletes nothing).
4. Re-run `symmetricds/scripts` (`a-01` / `a-02` for A; for B `b-01..b-03`), then `tests/live-smoke-test.sh`.

### Undo an accidental delete / bad change (already replicated to both)
* Database: pgBackRest PITR on a **scratch** instance, extract the rows, re-insert on one node (they replicate).
  `pgbackrest --stanza=lsevin --type=time --target="2026-10-09 08:00:00+00" --pg1-path=/tmp/pitr restore`, start it on a
  spare port, `pg_dump -t schema.table`, load into production.
* Files: copy the object back from `/var/lib/lsevin/object-storage-backups` (nightly rclone backup) with
  `rclone copy <backup path> a:lsevin-media/<key path>`; the sync propagates it.

### Rebuild SymmetricDS after a long outage that overflowed the backlog
`scripts/rollback.sh node-a`, refresh A with `sync-b-to-a.sh` (A is then identical to B), `a-01`, `a-02`.

## TLS for ir.lsevincare.com on A (automatic)
* B (internet access) runs `lsevin-acme`: ensures the DNS-only record, obtains/renews the Let's Encrypt certificate
  with DNS-01 through the Cloudflare API token in `/etc/lsevin-acme/cloudflare.token` (root-only), publishes the
  bundle. `lsevin-acme.path` starts issuance when the token file changes; `lsevin-acme.timer` checks daily and renews
  when fewer than 30 days remain.
* A runs `lsevin-fetch-cert` (daily + at boot): fetches the bundle over a key that can only run one read-only command
  on B, validates it (not expired, key matches, subject), installs it and force-reloads Caddy (log:
  `/var/log/lsevin-cert.log`).
* Rotate the Cloudflare token: write the new token to `/etc/lsevin-acme/cloudflare.token` on B (mode 600).

## Cloudflare state (as set up on 2026-10-09)
* `lsevincare.com` A 202.133.90.50 **proxied** (was wrongly 213.176.121.235 = A, which caused error 522).
* `global.lsevincare.com` -> B, `ir.lsevincare.com` -> A, both DNS only.
* Worker `lsevincare-geo` on route `lsevincare.com/*` with variable `IR_REDIRECT=off` (everyone served from B).
  The older Worker `dawn-hall-fae2` / route `*.lsevincare.com/*` was left untouched (it never runs: the subdomains are DNS only).
* To start sending Iranian visitors to A: set `IR_REDIRECT=on` (only after the gate below is cleared).

## GATE before IR_REDIRECT=on
Pages served by A currently embed `appmain.lsevin.com` (58 references: images, links, API calls) because the webapp image
was built with B's public URLs (Next.js bakes `NEXT_PUBLIC_*` in at build time). A visitor on `ir.lsevincare.com` would
keep calling B. A needs a webapp build/config whose public base URLs are the Iran hostname, plus CORS/auth callback
URLs for it. Then re-run `tests/live-smoke-test.sh`, the Playwright smoke spec against `https://ir.lsevincare.com`, and a
real login.

## Known gaps
* MinIO (legacy bucket), `/var/lib/lsevin/uploads` and the portal/CRM PVC directories are not live-synced.
