#!/usr/bin/env bash
# usage: sudo ./rollback.sh hub|node-a
# Stops SymmetricDS and removes ALL of its triggers and sym_* tables from that server's lsevin database.
set -euo pipefail
case "${1:-}" in
  hub)    SVC=symds-hub;    DIR=/opt/symds/hub;    ENG=hub;   KC="kubectl";     RUN="sudo -u symds" ;;
  node-a) SVC=symds-node-a; DIR=/opt/symds/node-a; ENG=nodea; KC="k3s kubectl"; RUN="" ;;
  *) echo "usage: $0 hub|node-a"; exit 2 ;;
esac
JH=$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")
cd "$DIR"
$RUN env JAVA_HOME="$JH" bin/symadmin --engine "$ENG" uninstall || true
systemctl disable --now "$SVC" || true
left=$($KC -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d lsevin -Atc \"select count(*) from pg_trigger where tgname ilike 'sym\\_on\\_%'\"")
echo "SymmetricDS triggers left in the DB: $left"
