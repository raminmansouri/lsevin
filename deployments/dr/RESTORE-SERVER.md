# Restore a lost server (A or B) — step by step

Use this when **one server is gone** (dead disk, deleted VM, hacked and wiped) and you have a **fresh Ubuntu 24.04 machine**
(8 CPU, 8 GB RAM, 80 GB disk — the same as today). The other server keeps the site alive meanwhile and holds the newest data.
Background and other incidents: [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md).

> **Honesty box.** Every piece below was tested on its own (backups, encryption, decrypt, bundle contents, database restore test, sync tests,
> the Kubernetes export cleaner, the bundle completeness check). The **whole chain on a blank machine has not been rehearsed yet.**
> Do one rehearsal on a spare VM before you need it (section 8) and correct this page with what you learn. Expect to need your hands once or twice.

Time: about 1–2 hours if everything is prepared, plus waiting for downloads and the database copy.

## 0. What must exist BEFORE a disaster (check once a month — `status.ps1` shows most of it)

| What | Where | How it gets there |
|---|---|---|
| Encryption key `secrets\dr-crypt.conf` | the PC kit **and one copy outside the PC** (password manager / USB) | by hand, once. **Without it nothing below can be decrypted.** |
| Encrypted config bundle (every 4 h), database dumps (daily), images archive (weekly) of **each** server | on the *other* server, and in the PC kit `backups\` | automatic; the PC copy by `pull-backups.ps1` (run it weekly) |
| Offline tools: k3s, rclone, SymmetricDS, lego, repository copy | PC kit `tools\` and `repo.bundle` | `prepare-tools.ps1 -Repo <your git checkout>` (once; redo after upgrades) |
| SSH keys to the new machine | your PC | the hosting provider's "add SSH key" |

## 1. Pick the case

| Lost | Survivor | Source of fresh data | Extra |
|---|---|---|---|
| **A** (Iran) | B | a fresh dump taken **on B** | A reaches B only through its VPN; set A up last-but-one |
| **B** (global) | A | a fresh dump taken **on A**; media comes back from A | B's public IP changes → DNS (step 8) |
| both | — | newest copies in the PC kit | restore **B first**, then A (section 7) |

Everything below is written for server **X** = the lost one, **Y** = the survivor.

## 2. Prepare the recovery folder (on your PC)

```powershell
cd $HOME\Desktop\lsevin-dr-kit
powershell -ExecutionPolicy Bypass -File pull-backups.ps1        # newest encrypted copies from both servers (only if Y is alive)
powershell -ExecutionPolicy Bypass -File decrypt-backups.ps1     # -> backups\plain\A  and  backups\plain\B   (contain SECRETS; delete afterwards)
```

You need these files from `backups\plain\X\`:
* `config\config-X-<time>.tar.gz` — newest = last 4 hours of configuration (secrets, Caddy, units, Jenkins home, SymmetricDS config, Kubernetes objects)
* `images\images-X-<time>.tar` — staged application images (optional but saves hours of builds)

and a **fresh database dump from the survivor Y** (the plain dumps in the kit are up to 24 h old; the survivor's live data is newer):
```powershell
# Y = B:  ssh -i $HOME\.ssh\lsevin_b agent@202.133.90.50 "sudo lsevin-logical-backup"   then copy the newest /opt/lsevin/backups/logical/lsevin-2*.dump
# Y = A:  ssh -i $HOME\.ssh\lsevin_a root@213.176.121.235 "lsevin-logical-backup"       then copy the newest /var/backups/lsevin/db/lsevin-2*.dump
```

## 3. Copy everything to the new machine

```powershell
$ip = "<new server IP>"
ssh root@$ip "mkdir -p /root/recovery/tools"
scp backups\plain\X\config\config-X-*.tar.gz            root@${ip}:/root/recovery/
scp backups\plain\X\images\images-X-*.tar               root@${ip}:/root/recovery/       # if present
scp <the fresh lsevin-2*.dump>                          root@${ip}:/root/recovery/
scp tools\*                                             root@${ip}:/root/recovery/tools/
scp repo.bundle                                         root@${ip}:/root/recovery/
scp -r <repo>\deployments\dr\rebuild                    root@${ip}:/root/rebuild
```
(Use the newest config bundle only; older ones are fallbacks.)

## 4. Run the rebuild (on the new machine, as root)

```bash
cd /root/rebuild && chmod +x lsevin-rebuild
./lsevin-rebuild X plan          # shows what it found and checks the bundle is complete — read it
./lsevin-rebuild X all           # runs every phase; asks "yes" before it touches the database and before it starts replication
```
The phases (you can run any one again with `./lsevin-rebuild X <phase>`): `base` → `config` → `k3s` → `code` → `data-tier` → `database` → `apps` → `edge` → `sync` → `verify`.

What each does, in plain words:
1. **base** — installs Docker, Java, rclone, 4 GB swap.
2. **config** — unpacks the bundle (secrets, Caddyfile, certificates, systemd units, SymmetricDS settings, SSH keys, Jenkins home). It does **not** overwrite `/etc/fstab`, `netplan`, `/etc/hosts`, firewall — those stay in `/root/recovery/extracted/etc` for you to compare.
3. **k3s** — puts the images archive where k3s imports it at start, installs k3s, waits for the node.
4. **code** — puts the repository at `/opt/lsevin/app` at the commit the old server ran.
5. **data-tier** — re-creates namespace, secrets, services and the data pods (postgres, pgbouncer, redis, eventstore, seaweedfs, elasticsearch) from the bundle.
6. **database** — restores the dump into the **empty** database (refuses if it already has tables), without SymmetricDS tables/triggers.
7. **apps** — starts API, webapp, CRM, providers and the schedulers/workers.
8. **edge** — starts Caddy, Jenkins and (A) the VPN, and enables every timer/service the old server had.
9. **sync** — installs/starts SymmetricDS (A: client; B: hub), sets identity columns to BY DEFAULT, starts the media sync.
10. **verify** — health checks; prints what failed.

## 5. After the script

1. **Images that are not in the archive** (crm, providers, portal): their pods show `ImagePullBackOff` until Jenkins builds them. Open Jenkins (A: `http://<ip>:8080` through the VPN/SSH tunnel; B: `devops.lsevin.com`) and run `lsevin-crm-production`, `lsevin-providers-production` (and `lsevin-main-production` if the webapp is missing). Builds take 20–40 min; do them one at a time.
2. **Media** (images/files):
   * X = A: done by the `sync` phase (`lsevin-files-sync --resync` pulls the bucket from B).
   * X = B: run on **A**: `lsevin-files-sync --resync` (copies the bucket to the empty B store). Check object counts match: the exporter metric `lsevin_file_sync_last_ok_age_seconds`.
3. **Replication**: on A `lsevin-sync-status`; `deployments/symmetricds/tests/lsevin-sync-verify` from the PC must report identical tables.
4. **Certificates**: A — `lsevin-fetch-cert` (copies from B). B — Caddy re-issues by itself once DNS points to the new IP (needs `/etc/lsevin-acme` from the bundle: Cloudflare token).
5. **Monitoring**: `systemctl status lsevin-site-exporter lsevin-alerter` (B), and `status.ps1`. Telegram should say "resolved" for the alerts that fired during the outage.

## 6. Point the world at the new server (only if its IP changed)

* **B**: Cloudflare DNS (`lsevincare.com`, `appmain.lsevin.com`, `api.lsevin.com`, `crm`, `providers`, `devops`, …) → new IP (`lsevin-cf-apply` scripts in `deployments/failover/`, token is in the bundle's `/etc/lsevin-acme`). **A's VPN profile and firewall target `202.133.90.50`**: edit `/etc/openvpn/client/lsevin-vpn.conf` and the profiles in `/etc/openvpn/lsevin-pool/` on A (and the routes in `lsevin-vpn-manager`), then `systemctl restart openvpn-client@lsevin-vpn lsevin-vpn-manager`. Also the PC kit's `status.ps1`/`watchdog.ps1`/`pull-backups.ps1` and `~/.ssh/config`.
* **A**: the ArvanCloud origin → new A IP (ArvanCloud panel). The VPN server side needs no change if B is unchanged.

## 7. Both servers lost

Restore **B first** (it is the SymmetricDS hub and the global site): use the PC kit's newest dump of B (`backups\plain\B\db\…`) in step 2, then repeat for A using a fresh dump taken on the restored B. Expect to lose up to 24 h of data written since the last dump (the data between that dump and the disaster only existed on the lost servers). The PC pull is weekly, so **run `pull-backups.ps1` more often when you can**.

## 8. Rehearsal (do this once, then once a year)

On a spare VM (or a temporary cloud server) run sections 2–5 for **A** with the *real* bundle — **do not start the VPN or the sync phase** (`./lsevin-rebuild A base`, `config`, `k3s`, `code`, `data-tier`, `database`, `apps`, `verify`). If `config` / `k3s` / `data-tier` pass and pods run, the chain works. Write down every manual fix here. Delete the VM and the decrypted files afterwards. While you do not rehearse, treat this page as **untested glue around tested parts**.

## 9. Troubleshooting

| Symptom | Cause / action |
|---|---|
| `plan` says bundle incomplete | the old server's `site.env` lacked a path; restore anyway (answer yes) and fix the missing file by hand; then update `CONFIG_PATHS` in `/etc/lsevin-dr/site.env` on the survivor |
| k3s install fails (offline) | `tools/k3s` + `tools/k3s-install.sh` missing → run `prepare-tools.ps1` on the PC |
| postgres pod never starts | `kubectl -n lsevin describe pod -l app.kubernetes.io/name=postgres` — usually a hostPath folder missing (`mkdir -p` the path shown) or the secret `data-secrets` missing |
| `pg_restore` errors | needs `postgresql-client-17`; check `/tmp/restore.err` in the postgres pod; a few "already exists" errors are harmless, an abort is not |
| pods `ImagePullBackOff` | image not in the archive → step 5.1 |
| webapp crash-loops with `relation … does not exist` | the migration init container ran against an empty database before the restore: re-run `database` then `kubectl -n lsevin rollout restart deploy lsevin-webapp` |
| replication does not start (A) | VPN not up (`lsevin-vpn status`), or `symmetric-server-3.16.17.zip` missing in `tools/` |
| duplicate/missing rows after the first sync | stop `symds-node-a`, compare with `tests/lsevin-sync-verify`, repair as in DISASTER-RECOVERY.md §3.4 |
| SSH locked out | provider console; keys come from `/root/.ssh` in the bundle |

## 10. What this procedure does NOT cover

* Elasticsearch log history (logs only; rebuilt empty) and Prometheus history on the lost server.
* Data written on the lost server in the last seconds–minutes before the loss and not yet replicated.
* The CloudNativePG operator (`cnpg-system` on B) — it is installed but not used by the live stack.
* Cloudflare/ArvanCloud/GitHub/Telegram account settings (they live outside the servers).
* Credentials pasted into chats or tickets — rotate them after any rebuild.
