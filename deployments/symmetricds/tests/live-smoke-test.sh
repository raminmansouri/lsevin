#!/usr/bin/env bash
# live-smoke-test.sh - end-to-end check of the A <-> B SymmetricDS sync on the REAL databases.
# Run from a PC that can SSH to both servers. Creates a few rows labelled "livetest-*" in support.tags and
# category.category_groups and removes them at the end (also on failure).
set -uo pipefail
A_HOST="${A_HOST:-root@213.176.121.235}"; A_KEY="${A_KEY:-$HOME/.ssh/lsevin_a}"
B_HOST="${B_HOST:-agent@202.133.90.50}";  B_KEY="${B_KEY:-$HOME/.ssh/lsevin_b}"
O=(-o IdentitiesOnly=yes -o ServerAliveInterval=15 -o ConnectTimeout=20)
TS=$(date +%s); FAIL=0
qa() { ssh -i "$A_KEY" "${O[@]}" "$A_HOST" "k3s kubectl -n lsevin exec deploy/postgres -- sh -c \"psql -U \\\"\\\$POSTGRES_USER\\\" -d lsevin -Atc \\\"$1\\\"\"" | tr -d '\r'; }
qb() { ssh -i "$B_KEY" "${O[@]}" "$B_HOST" "sudo kubectl -n lsevin exec deploy/postgres -- sh -c \"psql -U \\\"\\\$POSTGRES_USER\\\" -d lsevin -Atc \\\"$1\\\"\"" | tr -d '\r'; }
ok()   { echo "  PASS  $*"; }
bad()  { echo "  FAIL  $*"; FAIL=1; }
wait_eq() { # <qa|qb> <sql> <expected> <label> [max seconds]
  local fn=$1 sql=$2 want=$3 label=$4 max=${5:-120} t=0 r=""
  while [ $t -lt "$max" ]; do r=$($fn "$sql"); [ "$r" = "$want" ] && { ok "$label (${t}s)"; return 0; }; sleep 4; t=$((t + 4)); done
  bad "$label (got '$r', wanted '$want')"; return 1
}
cleanup() {
  echo "-- cleanup"
  qa "delete from support.tags where name like 'livetest-$TS-%'" >/dev/null
  qb "delete from support.tags where name like 'livetest-$TS-%'" >/dev/null
  qa "delete from category.category_groups where title like 'livetest-$TS-%'" >/dev/null
  qb "delete from category.category_groups where title like 'livetest-$TS-%'" >/dev/null
  sleep 30
  echo "  leftover test rows  A=$(qa "select count(*) from support.tags where name like 'livetest-$TS-%'")/$(qa "select count(*) from category.category_groups where title like 'livetest-$TS-%'")  B=$(qb "select count(*) from support.tags where name like 'livetest-$TS-%'")/$(qb "select count(*) from category.category_groups where title like 'livetest-$TS-%'")"
}
trap cleanup EXIT

echo "T0 sync processes"
[ "$(ssh -i "$A_KEY" "${O[@]}" "$A_HOST" 'systemctl is-active symds-node-a')" = "active" ] && ok "node A service active" || bad "node A service not active"
[ "$(ssh -i "$B_KEY" "${O[@]}" "$B_HOST" 'systemctl is-active symds-hub')" = "active" ] && ok "hub service active" || bad "hub service not active"

echo "T1 A -> B insert"
qa "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'livetest-$TS-A','#aaa',true,now(),now())" >/dev/null
wait_eq qb "select count(*) from support.tags where name='livetest-$TS-A'" 1 "row created on A reaches B"

echo "T2 B -> A insert"
qb "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'livetest-$TS-B','#bbb',true,now(),now())" >/dev/null
wait_eq qa "select count(*) from support.tags where name='livetest-$TS-B'" 1 "row created on B reaches A"

echo "T3 update on A: arrives on B and the app's own updated-at trigger is not re-fired there"
qa "update support.tags set color='#111' where name='livetest-$TS-A'" >/dev/null
wait_eq qb "select color from support.tags where name='livetest-$TS-A'" '#111' "update on A reaches B"
a=$(qa "select last_modified_date from support.tags where name='livetest-$TS-A'"); b=$(qb "select last_modified_date from support.tags where name='livetest-$TS-A'")
[ "$a" = "$b" ] && ok "last_modified_date identical on both ($a)" || bad "last_modified_date differs A=$a B=$b"

echo "T4 auto-number ranges: same table written on both sides at the same time"
qa "insert into category.category_groups (title) values ('livetest-$TS-fromA')" >/dev/null &
qb "insert into category.category_groups (title) values ('livetest-$TS-fromB')" >/dev/null &
wait
wait_eq qa "select count(*) from category.category_groups where title like 'livetest-$TS-from%'" 2 "A holds both rows"
wait_eq qb "select count(*) from category.category_groups where title like 'livetest-$TS-from%'" 2 "B holds both rows"
ida=$(qa "select id from category.category_groups where title='livetest-$TS-fromA'"); idb=$(qa "select id from category.category_groups where title='livetest-$TS-fromB'")
echo "  ids: fromA=$ida (A range >= 1,000,000,000)  fromB=$idb"
{ [ -n "$ida" ] && [ -n "$idb" ] && [ "$ida" != "$idb" ] && [ "$ida" -ge 1000000000 ] && [ "$idb" -lt 1000000000 ]; } && ok "ids are in separate ranges" || bad "ids not separated"

echo "T5 delete on B reaches A"
qb "delete from support.tags where name='livetest-$TS-B'" >/dev/null
wait_eq qa "select count(*) from support.tags where name='livetest-$TS-B'" 0 "delete on B reaches A"

echo "T6 sync health"
echo "  A errors: incoming=$(qa 'select count(*) from sym_incoming_error') outgoing=$(qa 'select count(*) from sym_outgoing_batch where status not in (chr(79)||chr(75),chr(78)||chr(69))')"
echo "  B errors: incoming=$(qb 'select count(*) from sym_incoming_error') outgoing=$(qb 'select count(*) from sym_outgoing_batch where status not in (chr(79)||chr(75),chr(78)||chr(69))')"
[ "$(qa 'select count(*) from sym_incoming_error')$(qb 'select count(*) from sym_incoming_error')" = "00" ] && ok "no incoming errors on either side" || bad "incoming errors present"

echo; [ $FAIL = 0 ] && echo "RESULT: ALL PASS" || echo "RESULT: FAILURES"
exit $FAIL
