#!/usr/bin/env bash
# live-types-test.sh - proves that every special PostgreSQL column type used by the application survives the
# A <-> B sync unchanged (jsonb, arrays, enums, tsvector, interval, inet, bytea, numeric, ...).
# It creates a throw-away table public.zz_sync_probe on BOTH real databases, registers it with the live sync,
# round-trips rows in both directions, compares an MD5 of each full row on both sides, then removes everything.
set -uo pipefail
A_HOST="${A_HOST:-root@213.176.121.235}"; A_KEY="${A_KEY:-$HOME/.ssh/lsevin_a}"
B_HOST="${B_HOST:-agent@202.133.90.50}";  B_KEY="${B_KEY:-$HOME/.ssh/lsevin_b}"
O=(-o IdentitiesOnly=yes -o ServerAliveInterval=15 -o ConnectTimeout=20)
W=$(mktemp -d); FAIL=0
ssha() { ssh -i "$A_KEY" "${O[@]}" "$A_HOST" "$@"; }
sshb() { ssh -i "$B_KEY" "${O[@]}" "$B_HOST" "$@"; }
psa() { ssha "k3s kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U \"\$POSTGRES_USER\" -d lsevin -X -At -v ON_ERROR_STOP=1'" | tr -d '\r'; }
psb() { sshb "sudo kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U \"\$POSTGRES_USER\" -d lsevin -X -At -v ON_ERROR_STOP=1'" | tr -d '\r'; }
ok()  { echo "  PASS  $*"; }
bad() { echo "  FAIL  $*"; FAIL=1; }

HUB_SYNC='cd /opt/symds/hub && sudo -u symds env JAVA_HOME=$(dirname $(dirname $(readlink -f $(command -v java)))) bin/symadmin --engine hub sync-triggers 2>&1 | grep -c "Done synchronizing"'
A_SYNC='cd /opt/symds/node-a && JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 bin/symadmin --engine nodea sync-triggers 2>&1 | grep -c "Done synchronizing"'

cleanup() {
  echo "-- cleanup"
  echo "delete from sym_trigger_router where trigger_id='public__zz_sync_probe'; delete from sym_trigger where trigger_id='public__zz_sync_probe';" | psb >/dev/null
  sleep 45
  sshb "sudo bash -c '$HUB_SYNC'" >/dev/null 2>&1
  ssha "bash -c '$A_SYNC'" >/dev/null 2>&1
  echo "drop table if exists public.zz_sync_probe;" | psb >/dev/null
  echo "drop table if exists public.zz_sync_probe;" | psa >/dev/null
  echo "  probe table left  B=$(echo "select count(*) from pg_tables where tablename='zz_sync_probe'" | psb)  A=$(echo "select count(*) from pg_tables where tablename='zz_sync_probe'" | psa)"
  echo "  probe triggers left B=$(echo "select count(*) from sym_trigger where trigger_id='public__zz_sync_probe'" | psb)  A=$(echo "select count(*) from sym_trigger where trigger_id='public__zz_sync_probe'" | psa)"
  rm -rf "$W"
}
trap cleanup EXIT

cat > "$W/ddl.sql" <<'SQL'
create table if not exists public.zz_sync_probe (
  id uuid primary key, tx text, js jsonb, ja jsonb, ta text[], ia integer[], en shop.cart_status,
  tv tsvector, iv interval, ip inet, bi bytea, nu numeric(12,4), dt date, tz timestamptz, bo boolean, bg bigint
);
SQL
echo "setup: probe table on both databases + register with the sync"
psb < "$W/ddl.sql" >/dev/null && psa < "$W/ddl.sql" >/dev/null || { bad "could not create probe table"; exit 1; }
cat > "$W/cfg.sql" <<'SQL'
insert into sym_trigger (trigger_id, source_schema_name, source_table_name, channel_id, last_update_time, create_time)
values ('public__zz_sync_probe','public','zz_sync_probe','business',now(),now()) on conflict do nothing;
insert into sym_trigger_router (trigger_id, router_id, initial_load_order, create_time, last_update_time)
select 'public__zz_sync_probe', router_id, 100, now(), now() from sym_router on conflict do nothing;
SQL
psb < "$W/cfg.sql" >/dev/null
sshb "sudo bash -c '$HUB_SYNC'" >/dev/null 2>&1
for i in $(seq 1 30); do [ "$(echo "select count(*) from sym_trigger where trigger_id='public__zz_sync_probe'" | psa)" = "1" ] && break; sleep 5; done
sleep 10; ssha "bash -c '$A_SYNC'" >/dev/null 2>&1
tb=$(echo "select count(*) from pg_trigger where tgrelid='public.zz_sync_probe'::regclass and tgname like 'sym_on_%'" | psb)
ta=$(echo "select count(*) from pg_trigger where tgrelid='public.zz_sync_probe'::regclass and tgname like 'sym_on_%'" | psa)
[ "$tb" = 3 ] && [ "$ta" = 3 ] && ok "capture triggers installed on both (B=$tb A=$ta)" || { bad "triggers B=$tb A=$ta"; exit 1; }

rowsql() { # <uuid> <variant>
cat <<SQL
insert into public.zz_sync_probe values (
 '$1', \$q\$héllo wörld — "quotes", 'single', commas, \\ backslash, newline:
line2, emoji 🙂, Persian: سلام دنیا\$q\$,
 \$q\${"a":1,"nested":{"list":[1,2,{"x":null}],"s":"متن فارسی \"quoted\"","f":1.50,"t":true},"empty":{}}\$q\$::jsonb,
 \$q\$[{"k":"v$2"},[],null,"str"]\$q\$::jsonb,
 array['plain','with,comma','with "quote"','with {brace}',NULL,'','سلام'],
 array[1,NULL,-5,2147483647],
 'active',
 to_tsvector('simple','the quick brown fox $2'),
 interval '1 year 2 mons 3 days 04:05:06.789',
 '192.168.10.7/24'::inet,
 '\\xdeadbeef00ff'::bytea,
 12345678.9012,
 date '2026-02-28',
 timestamptz '2026-10-09 08:30:00.123456+03:30',
 true,
 9223372036854775807);
SQL
}
rowmd5() { echo "select md5(row_to_json(p)::text) from public.zz_sync_probe p where id='$1'" | $2; }
wait_row() { local t=0; while [ $t -lt 150 ]; do [ "$(echo "select count(*) from public.zz_sync_probe where id='$1'" | $2)" = "1" ] && return 0; sleep 5; t=$((t+5)); done; return 1; }

IDA=$(python -c "import uuid; print(uuid.uuid4())"); IDB=$(python -c "import uuid; print(uuid.uuid4())")

echo "T1 row with every special type created on A -> B"
rowsql "$IDA" A | psa >/dev/null || bad "insert on A failed"
if wait_row "$IDA" psb; then
  a=$(rowmd5 "$IDA" psa); b=$(rowmd5 "$IDA" psb)
  [ -n "$a" ] && [ "$a" = "$b" ] && ok "identical row on both sides (md5 $a)" || { bad "row differs A=$a B=$b"; echo "select row_to_json(p) from public.zz_sync_probe p where id='$IDA'" | psa | cut -c1-400; echo "select row_to_json(p) from public.zz_sync_probe p where id='$IDA'" | psb | cut -c1-400; }
else bad "row from A never reached B"; fi

echo "T2 row created on B -> A"
rowsql "$IDB" B | psb >/dev/null || bad "insert on B failed"
if wait_row "$IDB" psa; then
  a=$(rowmd5 "$IDB" psa); b=$(rowmd5 "$IDB" psb)
  [ -n "$a" ] && [ "$a" = "$b" ] && ok "identical row on both sides (md5 $b)" || { bad "row differs A=$a B=$b"; }
else bad "row from B never reached A"; fi

echo "T3 update of jsonb / array / enum on A reaches B"
echo "update public.zz_sync_probe set js='{\"changed\":[1,2,3]}'::jsonb, ta=array['x','y,z'], en='converted' where id='$IDA'" | psa >/dev/null
t=0; while [ $t -lt 150 ]; do [ "$(echo "select js::text||ta::text||en::text from public.zz_sync_probe where id='$IDA'" | psb)" = "$(echo "select js::text||ta::text||en::text from public.zz_sync_probe where id='$IDA'" | psa)" ] && [ "$(echo "select en from public.zz_sync_probe where id='$IDA'" | psb)" = "converted" ] && break; sleep 5; t=$((t+5)); done
[ "$(echo "select en from public.zz_sync_probe where id='$IDA'" | psb)" = "converted" ] && ok "update (jsonb, text[], enum) applied on B (${t}s)" || bad "update did not arrive"

echo "T4 sync health"
ea=$(echo "select count(*) from sym_incoming_error" | psa); eb=$(echo "select count(*) from sym_incoming_error" | psb)
[ "$ea$eb" = "00" ] && ok "no incoming errors (A=$ea B=$eb)" || bad "incoming errors A=$ea B=$eb"

echo; [ $FAIL = 0 ] && echo "RESULT: ALL PASS" || echo "RESULT: FAILURES"
exit $FAIL
