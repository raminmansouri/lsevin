#!/usr/bin/env bash
# live-conflict-test.sh - proves "newest edit wins" on the REAL databases.
# Pauses node A's sync (about 1-2 minutes), edits the same support.tags row on both sides (A edits LAST),
# restarts node A and checks both sides end up with A's value. Creates and removes one "livetest-conflict-*" row.
set -uo pipefail
A_HOST="${A_HOST:-root@213.176.121.235}"; A_KEY="${A_KEY:-$HOME/.ssh/lsevin_a}"
B_HOST="${B_HOST:-agent@202.133.90.50}";  B_KEY="${B_KEY:-$HOME/.ssh/lsevin_b}"
O=(-o IdentitiesOnly=yes -o ServerAliveInterval=15 -o ConnectTimeout=20)
TS=$(date +%s); NAME="livetest-conflict-$TS"
qa() { ssh -i "$A_KEY" "${O[@]}" "$A_HOST" "k3s kubectl -n lsevin exec deploy/postgres -- sh -c \"psql -U \\\"\\\$POSTGRES_USER\\\" -d lsevin -Atc \\\"$1\\\"\"" | tr -d '\r'; }
qb() { ssh -i "$B_KEY" "${O[@]}" "$B_HOST" "sudo kubectl -n lsevin exec deploy/postgres -- sh -c \"psql -U \\\"\\\$POSTGRES_USER\\\" -d lsevin -Atc \\\"$1\\\"\"" | tr -d '\r'; }
node_a() { ssh -i "$A_KEY" "${O[@]}" "$A_HOST" "systemctl $1 symds-node-a"; }
cleanup() { node_a start >/dev/null 2>&1; sleep 20; qa "delete from support.tags where name='$NAME'" >/dev/null; qb "delete from support.tags where name='$NAME'" >/dev/null; sleep 20
  echo "-- cleanup: leftover A=$(qa "select count(*) from support.tags where name='$NAME'") B=$(qb "select count(*) from support.tags where name='$NAME'")"; }
trap cleanup EXIT

echo "create the row on A and wait until B has it"
qa "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'$NAME','#000000',true,now(),now())" >/dev/null
for i in $(seq 1 30); do [ "$(qb "select count(*) from support.tags where name='$NAME'")" = "1" ] && break; sleep 4; done

echo "pause node A, then edit on B first and on A LAST"
node_a stop; sleep 5
qb "update support.tags set color='#BBBBBB' where name='$NAME'" >/dev/null; sleep 3
qa "update support.tags set color='#AAAAAA' where name='$NAME'" >/dev/null
echo "  while paused: A=$(qa "select color from support.tags where name='$NAME'") B=$(qb "select color from support.tags where name='$NAME'")"
node_a start

echo "wait for both sides to agree (max 3 min)"
for i in $(seq 1 36); do
  a=$(qa "select color from support.tags where name='$NAME'"); b=$(qb "select color from support.tags where name='$NAME'")
  [ "$a" = "$b" ] && { sleep 8; a2=$(qa "select color from support.tags where name='$NAME'"); b2=$(qb "select color from support.tags where name='$NAME'"); [ "$a2" = "$b2" ] && break; }
  sleep 5
done
echo "  final: A=$a B=$b"
[ "$a" = "#AAAAAA" ] && [ "$b" = "#AAAAAA" ] && { echo "RESULT: PASS (newest edit, made on A, won on both sides)"; exit 0; }
echo "RESULT: FAIL (expected both #AAAAAA)"; exit 1
