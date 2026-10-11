#!/usr/bin/env bash
# outage-recovery-test.sh - REAL outage drill. Takes the A<->B VPN fully down for OUTAGE_S seconds (default 270),
# writes a database row and a file on A and a database row on B during the outage, watches the public heartbeat the
# Cloudflare Worker uses (it must go stale, which makes the Worker keep visitors on B), then restores the VPN and
# checks that everything converges without any manual action. Test rows are removed at the end.
# Run from a PC that can SSH to both servers.
set -uo pipefail
A_HOST="${A_HOST:-root@213.176.121.235}"; A_KEY="${A_KEY:-$HOME/.ssh/lsevin_a}"
B_HOST="${B_HOST:-agent@202.133.90.50}";  B_KEY="${B_KEY:-$HOME/.ssh/lsevin_b}"
OUTAGE_S="${OUTAGE_S:-270}"
O=(-o IdentitiesOnly=yes -o ServerAliveInterval=15 -o ConnectTimeout=20)
A() { ssh -i "$A_KEY" "${O[@]}" "$A_HOST" "$@"; }
psa() { A "k3s kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U \"\$POSTGRES_USER\" -d lsevin -X -At'" | tr -d '\r'; }
psb() { ssh -i "$B_KEY" "${O[@]}" "$B_HOST" "sudo kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U \"\$POSTGRES_USER\" -d lsevin -X -At'" | tr -d '\r'; }
hb_age() { local e; e=$(curl -s -m 20 https://api.lsevin.com/files/Categories/_health/a.json | python -c 'import json,sys; print(json.load(sys.stdin)["epoch"])' 2>/dev/null); [ -n "$e" ] && echo $(( $(date +%s) - e )) || echo "?"; }
TS=$(date +%s); N="livetest-outage-$TS"; FAIL=0
ok() { echo "  PASS  $*"; }; bad() { echo "  FAIL  $*"; FAIL=1; }
restore_vpn() { A "systemctl start openvpn-client@lsevin-vpn; sleep 3; systemctl start lsevin-vpn-manager" >/dev/null 2>&1; }
trap 'restore_vpn; echo "-- cleanup"; echo "delete from support.tags where name like '"'"'$N%'"'"'" | psa >/dev/null; echo "delete from support.tags where name like '"'"'$N%'"'"'" | psb >/dev/null; A "export RCLONE_CONFIG=/etc/lsevin-files/rclone.conf; rclone deletefile a:lsevin-media/livetest/$N.txt" >/dev/null 2>&1' EXIT

echo "before: public heartbeat age = $(hb_age)s"
echo "== OUTAGE START: stopping VPN manager + tunnel on A"
A "systemctl stop lsevin-vpn-manager; systemctl stop openvpn-client@lsevin-vpn; sleep 2; echo \"  A -> B:443 now: \$(timeout 5 bash -c 'echo > /dev/tcp/202.133.90.50/443' 2>/dev/null && echo open || echo UNREACHABLE)\""
echo "== writes during the outage (each side keeps working on its own)"
echo "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'$N-A','#aaa',true,now(),now())" | psa >/dev/null && ok "A accepted a database write while cut off"
echo "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'$N-B','#bbb',true,now(),now())" | psb >/dev/null && ok "B accepted a database write while cut off"
A "export RCLONE_CONFIG=/etc/lsevin-files/rclone.conf; echo 'written on A during outage $TS' | rclone rcat a:lsevin-media/livetest/$N.txt" && ok "A accepted a file upload while cut off"
echo "== watching the signals the failover depends on"
t=0; stale_seen=""; while [ $t -lt "$OUTAGE_S" ]; do
  sleep 30; t=$((t+30)); age=$(hb_age); aok=$(A "python3 -c \"import json; print(json.load(open('/var/lib/lsevin-health/status.json'))['ok'])\"" 2>/dev/null)
  echo "  t+${t}s  public heartbeat age=${age}s  A's own health ok=${aok}   $( [ "$age" != "?" ] && [ "$age" -gt 180 ] && echo '<- Worker now treats A as DOWN and keeps visitors on B')"
  [ "$age" != "?" ] && [ "$age" -gt 180 ] && stale_seen=yes
done
[ -n "$stale_seen" ] && ok "heartbeat went stale (>180 s) so the Worker fails over to B" || bad "heartbeat never went stale"
echo "== RECOVERY: starting VPN + manager (no other action)"
t0=$(date +%s); restore_vpn
for i in $(seq 1 60); do sleep 10
  a_on_b=$(echo "select count(*) from support.tags where name='$N-A'" | psb); b_on_a=$(echo "select count(*) from support.tags where name='$N-B'" | psa)
  f_on_b=$(A "export RCLONE_CONFIG=/etc/lsevin-files/rclone.conf; rclone lsf b:lsevin-media/livetest/$N.txt 2>/dev/null | wc -l")
  [ "$a_on_b" = 1 ] && [ "$b_on_a" = 1 ] && [ "$f_on_b" = 1 ] && break
done
echo "  after $(( $(date +%s) - t0 ))s: A's row on B=$a_on_b  B's row on A=$b_on_a  A's file on B=$f_on_b"
[ "$a_on_b$b_on_a$f_on_b" = "111" ] && ok "backlog replayed in both directions after reconnect, no manual step" || bad "did not converge"
sleep 60; age=$(hb_age); [ "$age" != "?" ] && [ "$age" -lt 150 ] && ok "heartbeat fresh again (${age}s): Worker may redirect Iranian visitors to A again" || bad "heartbeat still stale (${age}s)"
echo "  sync errors: A=$(echo 'select count(*) from sym_incoming_error' | psa) B=$(echo 'select count(*) from sym_incoming_error' | psb)"
echo; [ $FAIL = 0 ] && echo "RESULT: ALL PASS" || echo "RESULT: FAILURES"
exit $FAIL
