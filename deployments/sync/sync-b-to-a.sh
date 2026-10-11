#!/usr/bin/env bash
# sync-b-to-a.sh - refresh server A (Iran copy) from server B (primary).
#
# Run from a machine that can SSH to BOTH servers (A and B cannot reach each other).
# Data flows B -> your machine (in verified 16 MB chunks, B's link drops long streams)
# -> A. Nothing on B is modified: it only runs pg_dump / tar on B (read-only).
#
#   ./sync-b-to-a.sh --check          compare table counts B vs A, change nothing
#   ./sync-b-to-a.sh                  sync PostgreSQL (all non-template databases)
#   ./sync-b-to-a.sh --files          sync PostgreSQL + uploads + MinIO + SeaweedFS
#   ./sync-b-to-a.sh --files-only     sync only the file stores
#   ./sync-b-to-a.sh --no-restart     leave A's apps stopped afterwards
#
# During the DB restore A's apps are stopped (A serves no live traffic yet; stop the
# Caddy container on A first if that changes). A safety dump of A's current databases
# is written to /var/backups/lsevin/db before they are overwritten. If anything fails,
# the apps on A are scaled back up automatically.
#
# Config (environment variables, defaults shown):
#   B_HOST=agent@202.133.90.50  B_KEY=~/.ssh/lsevin_b
#   A_HOST=root@213.176.121.235 A_KEY=~/.ssh/lsevin_a

set -Eeuo pipefail

B_HOST="${B_HOST:-agent@202.133.90.50}"
B_KEY="${B_KEY:-$HOME/.ssh/lsevin_b}"
A_HOST="${A_HOST:-root@213.176.121.235}"
A_KEY="${A_KEY:-$HOME/.ssh/lsevin_a}"
CHUNK_MB="${CHUNK_MB:-16}"
APPS="lsevin-api lsevin-webapp lsevin-portal crm crm-worker crm-scheduler providers-worker providers-scheduler"

DO_DB=1; DO_FILES=0; CHECK=0; RESTART=1
for arg in "$@"; do
  case "$arg" in
    --check) CHECK=1 ;;
    --files) DO_FILES=1 ;;
    --files-only) DO_FILES=1; DO_DB=0 ;;
    --no-restart) RESTART=0 ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

SSH_OPTS=(-o IdentitiesOnly=yes -o ServerAliveInterval=10 -o ServerAliveCountMax=6 -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new)
ssh_b() { ssh -i "$B_KEY" "${SSH_OPTS[@]}" "$B_HOST" "$@"; }
ssh_a() { ssh -i "$A_KEY" "${SSH_OPTS[@]}" "$A_HOST" "$@"; }
log() { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

WORK="$(mktemp -d)"
RB=/tmp/lsevin-sync-$$   # scratch dir on B
RA=/root/lsevin-sync     # scratch dir on A
APPS_DOWN=0
cleanup() {
  local rc=$?
  if [ "$APPS_DOWN" = 1 ] && [ "$RESTART" = 1 ]; then
    echo "!! restoring A's apps after interruption" >&2
    ssh_a "k3s kubectl -n lsevin scale deploy/pgbouncer --replicas=1 >/dev/null; k3s kubectl -n lsevin scale deploy/seaweedfs deploy/minio --replicas=1 >/dev/null; k3s kubectl -n lsevin scale $(echo $APPS | sed 's#[^ ]*#deploy/&#g') --replicas=1 >/dev/null" || true
  fi
  ssh_b "sudo rm -rf $RB" >/dev/null 2>&1 || true
  ssh_a "rm -rf $RA" >/dev/null 2>&1 || true
  rm -rf "$WORK"
  exit $rc
}
trap cleanup EXIT

[ -f "$B_KEY" ] || { echo "missing SSH key for B: $B_KEY" >&2; exit 1; }
[ -f "$A_KEY" ] || { echo "missing SSH key for A: $A_KEY" >&2; exit 1; }

# Helpers that run on the servers (sent over stdin, nothing is installed).
read -r -d '' REMOTE_LIB <<'EOF' || true
list_dbs() { $KC -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d postgres -Atc \"select datname from pg_database where not datistemplate and datname <> 'postgres' order by 1\"" | tr -d '\r'; }
table_count() { $KC -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -Atc \"select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema') and table_name not like 'sym\\_%'\"" | tr -d '\r'; }
EOF
run_b() { { echo "KC=kubectl"; echo "$REMOTE_LIB"; cat; } | ssh_b 'sudo bash -s'; }
run_a() { { echo "KC='k3s kubectl'"; echo "$REMOTE_LIB"; cat; } | ssh_a 'bash -s'; }

# fetch <remote path on B> <local file>: 16 MB chunks, retried, sha256-verified.
fetch() {
  local r="$1" l="$2" size i=0 exp try ch=$((CHUNK_MB * 1048576))
  size=$(ssh_b "sudo stat -c %s '$r'" | tr -d '\r'); : > "$l"
  while [ $((i * ch)) -lt "$size" ]; do
    exp=$((size - i * ch)); [ "$exp" -gt "$ch" ] && exp=$ch
    for try in 1 2 3 4 5 6 7 8; do
      ssh_b "sudo dd if='$r' bs=1M skip=$((i * CHUNK_MB)) count=$CHUNK_MB 2>/dev/null" > "$WORK/chunk" || true
      [ "$(stat -c %s "$WORK/chunk")" -eq "$exp" ] && break
      sleep 2
    done
    [ "$(stat -c %s "$WORK/chunk")" -eq "$exp" ] || { echo "chunk $i of $r failed after retries" >&2; return 1; }
    cat "$WORK/chunk" >> "$l"; i=$((i + 1))
  done
  [ "$(ssh_b "sudo sha256sum '$r'" | cut -c1-64)" = "$(sha256sum "$l" | cut -c1-64)" ] || { echo "checksum mismatch: $r" >&2; return 1; }
}
# push <local file> <remote path on A>, verified.
push() {
  ssh_a "cat > '$2'" < "$1"
  [ "$(ssh_a "sha256sum '$2'" | cut -c1-64)" = "$(sha256sum "$1" | cut -c1-64)" ] || { echo "upload checksum mismatch: $2" >&2; return 1; }
}

scale_down() {
  APPS_DOWN=1
  ssh_a "k3s kubectl -n lsevin scale $(echo $APPS | sed 's#[^ ]*#deploy/&#g') deploy/pgbouncer --replicas=0 >/dev/null; sleep 12"
}
scale_up() {
  ssh_a "k3s kubectl -n lsevin scale deploy/pgbouncer --replicas=1 >/dev/null; k3s kubectl -n lsevin rollout status deploy/pgbouncer --timeout=120s | tail -1
k3s kubectl -n lsevin scale $(echo $APPS | sed 's#[^ ]*#deploy/&#g') --replicas=1 >/dev/null
for d in $APPS; do k3s kubectl -n lsevin rollout status deploy/\$d --timeout=240s | tail -1; done"
  APPS_DOWN=0
}

# Re-seeding A overwrites its databases. Once bidirectional sync is live that would destroy A's own writes.
if [ "$DO_DB" = 1 ] && [ "$CHECK" = 0 ] && [ "${FORCE:-0}" != 1 ]; then
  if [ "$(ssh_a 'systemctl is-active symds-node-a 2>/dev/null || true' | tr -d '')" = "active" ]; then
    echo "REFUSING: SymmetricDS node A is running; a DB refresh would overwrite A's local writes." >&2
    echo "Stop it first (systemctl stop symds-node-a) or set FORCE=1 if you really mean to re-seed." >&2
    exit 3
  fi
fi

# ----------------------------------------------------------------------------- check
if [ "$CHECK" = 1 ]; then
  log "Comparing table counts (read-only)"
  DBS="$(echo 'list_dbs' | run_b)"
  printf '%-34s %8s %8s  %s\n' DATABASE B A STATUS
  for db in $DBS; do
    b="$(echo "table_count $db" | run_b)"
    a="$(echo "table_count $db" | run_a 2>/dev/null || echo missing)"
    st=OK; [ "$a" = "$b" ] || st=DIFFERENT
    printf '%-34s %8s %8s  %s\n' "$db" "$b" "${a:-missing}" "$st"
  done
  exit 0
fi

# ----------------------------------------------------------------------------- database
if [ "$DO_DB" = 1 ]; then
  log "[B] dumping roles + databases (read-only pg_dump, custom format)"
  DBS="$(run_b <<EOF2
set -euo pipefail
D=$RB; rm -rf \$D; mkdir -p \$D; chmod 700 \$D
for db in \$(list_dbs); do
  \$KC -n lsevin exec deploy/postgres -- sh -c "pg_dump -U \"\\\$POSTGRES_USER\" -Fc -Z 6 \$db" > \$D/\$db.dump
  echo "\$db \$(table_count \$db)" >> \$D/counts.txt
done
\$KC -n lsevin exec deploy/postgres -- sh -c "pg_dumpall -U \"\\\$POSTGRES_USER\" --globals-only" > \$D/globals.sql
chmod 600 \$D/*
list_dbs
EOF2
)"
  [ -n "$DBS" ] || { echo "no databases found on B" >&2; exit 1; }
  echo "databases: $(echo $DBS)"

  log "downloading dumps (resumable, verified)"
  mkdir -p "$WORK/db"
  for f in globals.sql counts.txt $(for d in $DBS; do echo "$d.dump"; done); do
    fetch "$RB/$f" "$WORK/db/$f"
    printf '  %-45s %s bytes\n' "$f" "$(stat -c %s "$WORK/db/$f")"
  done
  for d in $DBS; do
    [ "$(head -c 5 "$WORK/db/$d.dump")" = "PGDMP" ] || { echo "$d.dump is not a valid custom-format dump" >&2; exit 1; }
  done

  log "uploading to A (verified)"
  ssh_a "rm -rf $RA; mkdir -p $RA; chmod 700 $RA"
  for f in globals.sql counts.txt $(for d in $DBS; do echo "$d.dump"; done); do push "$WORK/db/$f" "$RA/$f"; done

  log "[A] stopping apps, taking a safety dump, restoring"
  scale_down
  run_a <<EOF3
set -uo pipefail
P=\$(\$KC -n lsevin get pod -l app.kubernetes.io/name=postgres -o jsonpath='{.items[0].metadata.name}')
X="\$KC -n lsevin exec \$P --"
SAFE=/var/backups/lsevin/db/pre-sync-\$(date -u +%Y%m%dT%H%M%SZ); mkdir -p \$SAFE
echo "-- roles"
\$KC -n lsevin exec -i \$P -- sh -c 'psql -U "\$POSTGRES_USER" -d postgres -q' < $RA/globals.sql 2>&1 | grep -v -E 'already exists|already been granted|^\$' | head -5 || true
for db in $(echo $DBS); do
  echo "-- \$db"
  if [ "\$(\$X sh -c "psql -U \"\\\$POSTGRES_USER\" -d postgres -Atc \"select count(*) from pg_database where datname='\$db'\"" | tr -d '\r')" = "0" ]; then
    \$X sh -c "createdb -U \"\\\$POSTGRES_USER\" \$db"
  else
    \$X sh -c "pg_dump -U \"\\\$POSTGRES_USER\" -Fc -Z 6 \$db" > \$SAFE/\$db.dump && echo "   safety dump: \$SAFE/\$db.dump"
    \$X sh -c "psql -U \"\\\$POSTGRES_USER\" -d postgres -qc \"select pg_terminate_backend(pid) from pg_stat_activity where datname='\$db' and pid<>pg_backend_pid()\"" >/dev/null
  fi
  \$KC -n lsevin cp $RA/\$db.dump \$P:/tmp/\$db.dump
  \$X sh -c "pg_restore -l /tmp/\$db.dump | grep -v -i ' sym_' > /tmp/\$db.list"
  \$X sh -c "pg_restore -L /tmp/\$db.list -U \"\\\$POSTGRES_USER\" -d \$db --clean --if-exists --no-owner --no-privileges -j2 /tmp/\$db.dump" 2>&1 | grep -E 'error|FATAL' | head -5 || true
  \$X rm -f /tmp/\$db.list
  \$X sh -c "psql -U \"\\\$POSTGRES_USER\" -d \$db -qc 'analyze'"
  \$X rm -f /tmp/\$db.dump
done
find /var/backups/lsevin/db -maxdepth 1 -name 'pre-sync-*' -mtime +7 -exec rm -rf {} + 2>/dev/null
EOF3

  log "verifying table counts"
  ok=1
  printf '%-34s %8s %8s  %s\n' DATABASE B A STATUS
  while read -r db bcount; do
    acount="$(echo "table_count $db" | run_a)"
    st=OK; [ "$acount" = "$bcount" ] || { st=MISMATCH; ok=0; }
    printf '%-34s %8s %8s  %s\n' "$db" "$bcount" "$acount" "$st"
  done < "$WORK/db/counts.txt"
  [ "$ok" = 1 ] || { echo "table counts differ - A's apps are left stopped for inspection" >&2; APPS_DOWN=0; exit 1; }
fi

# ----------------------------------------------------------------------------- files
# tar the source on B, fetch, then swap it into place on A (old copy kept until the swap works).
sync_dir() {  # <name> <abs dir> [deployment to pause on A]
  local name="$1" dir="$2" dep="${3:-}"
  log "[files] $name  ($dir)"
  ssh_b "sudo mkdir -p $RB && sudo sh -c 'tar -C $dir -czf $RB/$name.tgz .' && sudo chmod 600 $RB/$name.tgz"
  fetch "$RB/$name.tgz" "$WORK/$name.tgz"
  printf '  downloaded %s bytes\n' "$(stat -c %s "$WORK/$name.tgz")"
  ssh_a "mkdir -p $RA; chmod 700 $RA"
  push "$WORK/$name.tgz" "$RA/$name.tgz"
  ssh_a "set -e
[ -z '$dep' ] || k3s kubectl -n lsevin scale deploy/$dep --replicas=0 >/dev/null
[ -z '$dep' ] || sleep 8
rm -rf '$dir.new'; mkdir -p '$dir.new'; tar -C '$dir.new' -xzf $RA/$name.tgz
rm -rf '$dir.old'; [ ! -d '$dir' ] || mv '$dir' '$dir.old'; mv '$dir.new' '$dir'; rm -rf '$dir.old'
[ -z '$dep' ] || k3s kubectl -n lsevin scale deploy/$dep --replicas=1 >/dev/null
du -sh '$dir' | cut -f1 | sed 's/^/  on A: /'
rm -f $RA/$name.tgz"
  rm -f "$WORK/$name.tgz"; ssh_b "sudo rm -f $RB/$name.tgz"
}
if [ "$DO_FILES" = 1 ]; then
  echo "NOTE: file stores are copied while B keeps running. For a byte-exact copy of SeaweedFS run this in a quiet window."
  sync_dir uploads  /var/lib/lsevin/uploads
  sync_dir minio    /var/lib/lsevin/minio    minio
  sync_dir seaweedfs /var/lib/lsevin/seaweedfs seaweedfs
fi

# ----------------------------------------------------------------------------- restart + health
if [ "$RESTART" = 1 ] && [ "$DO_DB" = 1 ]; then
  log "[A] starting apps"
  scale_up
fi
if [ "$RESTART" = 1 ]; then
  log "[A] health"
  ssh_a 'for u in http://127.0.0.1:30081/readiness http://127.0.0.1:30080/sw.js http://127.0.0.1:30082/api/health http://127.0.0.1:30083/api/health; do for i in 1 2 3 4 5 6; do c=$(curl -s -o /dev/null -m 15 -w "%{http_code}" $u); [ "$c" = 200 ] && break; sleep 10; done; printf "%-44s %s\n" $u $c; done'
fi
log "done"
