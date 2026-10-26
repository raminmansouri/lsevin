#!/usr/bin/env bash
# files-sync-test.sh - end-to-end test of the two-way file sync on the REAL SeaweedFS buckets.
# Run from a PC that can SSH to server A. Uses the prefix livetest-<ts>/ (and Categories/_livetest-<ts>/ for the
# "served by the app" check) and removes everything at the end.
set -uo pipefail
A_HOST="${A_HOST:-root@213.176.121.235}"; A_KEY="${A_KEY:-$HOME/.ssh/lsevin_a}"
O=(-o IdentitiesOnly=yes -o ServerAliveInterval=15 -o ConnectTimeout=20)
A() { ssh -i "$A_KEY" "${O[@]}" "$A_HOST" "$@"; }
TS=$(date +%s); P="livetest-$TS"; C="Categories/_livetest-$TS"; FAIL=0
ok()  { echo "  PASS  $*"; }
bad() { echo "  FAIL  $*"; FAIL=1; }
R='export RCLONE_CONFIG=/etc/lsevin-files/rclone.conf'
sync_now() {  # run sync cycles until one that STARTED after this call has completed OK (skips are not successes)
  A "$R; touch /tmp/fs-marker; for i in 1 2 3 4 5 6 7 8; do /usr/local/sbin/lsevin-files-sync >/dev/null 2>&1; [ /var/lib/lsevin-files/last-ok -nt /tmp/fs-marker ] && exit 0; sleep 15; done; exit 1" >/dev/null 2>&1     || echo "  (warning: no completed sync cycle within the wait window)"
}
has()  { A "$R; rclone lsf $1:lsevin-media/$2 >/dev/null 2>&1 && [ -n \"\$(rclone lsf $1:lsevin-media/$2 2>/dev/null)\" ] && echo yes || echo no"; }
size() { A "$R; rclone size $1:lsevin-media/$2 --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"bytes\"])'"; }
cleanup() { echo "-- cleanup"; A "$R; rclone purge a:lsevin-media/$P >/dev/null 2>&1; rclone purge b:lsevin-media/$P >/dev/null 2>&1; rclone purge a:lsevin-media/$C >/dev/null 2>&1; rclone purge b:lsevin-media/$C >/dev/null 2>&1; true"
  sync_now; echo "  leftover  A=$(A "$R; rclone lsf a:lsevin-media/$P 2>/dev/null | wc -l")/$(A "$R; rclone lsf a:lsevin-media/$C 2>/dev/null | wc -l")  B=$(A "$R; rclone lsf b:lsevin-media/$P 2>/dev/null | wc -l")/$(A "$R; rclone lsf b:lsevin-media/$C 2>/dev/null | wc -l")"; }
trap cleanup EXIT

echo "T0 services"
[ "$(A 'systemctl is-active lsevin-files-tunnel')" = active ] && ok "tunnel active" || bad "tunnel not active"
[ "$(A 'systemctl is-active lsevin-files-sync.timer')" = active ] && ok "sync timer active" || bad "sync timer not active"

echo "T1 file created on A reaches B"
A "$R; echo 'from A $TS' | rclone rcat a:lsevin-media/$P/a.txt"; sync_now
[ "$(has b $P/a.txt)" = yes ] && ok "a.txt present on B" || bad "a.txt missing on B"

echo "T2 file created on B reaches A"
A "$R; echo 'from B $TS' | rclone rcat b:lsevin-media/$P/b.txt"; sync_now
[ "$(has a $P/b.txt)" = yes ] && ok "b.txt present on A" || bad "b.txt missing on A"

echo "T3 change (different size) on A reaches B"
A "$R; echo 'from A $TS - changed and longer' | rclone rcat a:lsevin-media/$P/a.txt"; sync_now
sa=$(size a $P/a.txt); sb=$(size b $P/a.txt); [ "$sa" = "$sb" ] && ok "sizes equal ($sa bytes)" || bad "sizes differ A=$sa B=$sb"

echo "T4 delete on A reaches B, delete on B reaches A"
A "$R; rclone deletefile a:lsevin-media/$P/a.txt; rclone deletefile b:lsevin-media/$P/b.txt"; sync_now
[ "$(has b $P/a.txt)" = no ] && ok "a.txt deleted on B" || bad "a.txt still on B"
[ "$(has a $P/b.txt)" = no ] && ok "b.txt deleted on A" || bad "b.txt still on A"

echo "T5 larger file (video-sized sample, 40 MB) A -> B across the VPN"
A "$R; head -c 41943040 /dev/urandom | rclone rcat a:lsevin-media/$P/big.bin"
t0=$(date +%s); sync_now; dt=$(( $(date +%s) - t0 ))
sa=$(size a $P/big.bin); sb=$(size b $P/big.bin)
{ [ "$sa" = "41943040" ] && [ "$sb" = "41943040" ]; } && ok "40 MB arrived intact on B in ${dt}s (~$(( 40 / (dt>0?dt:1) )) MB/s incl. listing)" || bad "big file: A=$sa B=$sb"

echo "T6 an image uploaded on B is served by the app on A"
png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='
A "$R; echo $png | base64 -d | rclone rcat b:lsevin-media/$C/pixel.png"; sync_now
code=$(A "curl -s -o /dev/null -m 20 -w '%{http_code}' http://127.0.0.1:30081/files/$C/pixel.png")
[ "$code" = 200 ] && ok "A's API serves /files/$C/pixel.png (HTTP 200)" || bad "A's API returned HTTP $code"

echo "T7 health"
A "/usr/local/sbin/lsevin-files-sync --status" | sed 's/^/  /' | head -6

echo; [ $FAIL = 0 ] && echo "RESULT: ALL PASS" || echo "RESULT: FAILURES"
exit $FAIL
