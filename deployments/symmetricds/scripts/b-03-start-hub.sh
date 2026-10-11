#!/usr/bin/env bash
# Run ON SERVER B as root. Takes a fresh incremental backup, starts the hub, loads the topology + triggers
# (writes sym_* tables and ~2,100 capture triggers into the LIVE lsevin DB), opens registration for node 001.
# Roll back with rollback.sh hub.
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd); HUB=/opt/symds/hub
JH=$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")
q() { kubectl -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d lsevin -Atc \"$1\""; }
symadmin() { (cd $HUB && sudo -u symds env JAVA_HOME="$JH" bin/symadmin --engine hub "$@"); }

echo "== fresh incremental backup (rollback point)"
kubectl -n lsevin exec deploy/postgres -- su -s /bin/sh postgres -c "pgbackrest --stanza=lsevin --type=incr backup" 2>&1 | grep -E "backup command end|ERROR" | tail -2
kubectl -n lsevin exec deploy/postgres -- su -s /bin/sh postgres -c "pgbackrest --stanza=lsevin info" | grep -E "timestamp start" | tail -1

systemctl enable --now symds-hub
echo "waiting for the engine to create its tables..."
for i in $(seq 1 30); do sleep 4; [ "$(q "select count(*) from information_schema.tables where table_name='sym_trigger'")" = "1" ] && break; done
sleep 75   # let the engine's own first trigger sync finish before config is loaded (avoids a race)

kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U "$POSTGRES_USER" -d lsevin -X -q -t' < "$HERE/sql/topology-and-triggers.sql"

for n in 1 2 3; do
  symadmin sync-triggers 2>&1 | grep -E "Done synchronizing|Failed" | head -2 || true
  miss=$(q "select count(*) from sym_trigger t where not exists (select 1 from pg_trigger g join pg_class c on c.oid=g.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname=t.source_schema_name and c.relname=t.source_table_name and g.tgname like 'sym_on_i_%')")
  echo "tables still missing capture triggers: $miss"; [ "$miss" = "0" ] && break; sleep 15
done
symadmin open-registration client 001
q "select node_id, node_group_id from sym_node"
echo "hub ready."
