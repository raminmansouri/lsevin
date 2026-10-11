#!/usr/bin/env bash
# cf-apply.sh - run ON SERVER B (has internet) after the Cloudflare token exists. Idempotent.
#  1. fixes the 522: any PROXIED DNS record of the zone whose target is server A is pointed back at B
#  2. makes sure ir.lsevincare.com (DNS only) points at A
#  3. deploys cloudflare-worker.js and routes  lsevincare.com/*  to it (previous routes are saved first)
# Every change is logged; the previous state is written to /var/lib/lsevin-acme/cf-backup-<time>.json.
# Token scopes needed: Zone:Zone:Read, Zone:DNS:Edit, Zone:Workers Routes:Edit, Account:Workers Scripts:Edit.
set -uo pipefail
ZONE_NAME="${ZONE_NAME:-lsevincare.com}"; A_IP=213.176.121.235; B_IP=202.133.90.50
SCRIPT_NAME="${SCRIPT_NAME:-lsevincare-geo}"
WORKER_JS="${WORKER_JS:-/usr/local/share/lsevin/cloudflare-worker.js}"
TOKEN=$(tr -d ' \r\n' < /etc/lsevin-acme/cloudflare.token); BK=/var/lib/lsevin-acme/cf-backup-$(date +%Y%m%d-%H%M%S).json
cf() { curl -s -m 40 -H "Authorization: Bearer $TOKEN" "$@"; }
J() { python3 -c "import json,sys; d=json.load(sys.stdin); $1"; }

Z=$(cf "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME")
ZID=$(echo "$Z" | J 'print(d["result"][0]["id"])' 2>/dev/null); ACC=$(echo "$Z" | J 'print(d["result"][0]["account"]["id"])' 2>/dev/null)
[ -n "${ZID:-}" ] || { echo "cannot read zone $ZONE_NAME - check token scopes"; exit 1; }

# --- backup of everything we may touch
{ echo '{"dns":'; cf "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?per_page=200"; echo ',"routes":'; cf "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes"; echo '}'; } > "$BK"
echo "backup: $BK"

# --- 1. proxied records that point at A are the cause of the 522
cf "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?per_page=200" | J '
for r in d["result"]:
    if r["type"] in ("A","AAAA","CNAME") and r.get("proxied"): print(r["id"], r["type"], r["name"], r["content"])' | while read -r id type name content; do
  echo "proxied record: $name -> $content"
  if [ "$content" = "$A_IP" ]; then
    cf -X PUT -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records/$id" \
       --data "{\"type\":\"A\",\"name\":\"$name\",\"content\":\"$B_IP\",\"ttl\":1,\"proxied\":true}" | J 'print("   FIXED (was A, now B):", d["success"])'
  fi
done

# --- 2. Iran hostname (DNS only) -> A
REC=$(cf "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?name=ir.$ZONE_NAME&type=A" | J 'r=d["result"]; print(r[0]["id"] if r else "")')
BODY="{\"type\":\"A\",\"name\":\"ir.$ZONE_NAME\",\"content\":\"$A_IP\",\"ttl\":300,\"proxied\":false}"
if [ -z "$REC" ]; then cf -X POST -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records" --data "$BODY" | J 'print("ir record created:", d["success"])'
else cf -X PUT -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records/$REC" --data "$BODY" | J 'print("ir record ensured:", d["success"])'; fi

# --- 3. Worker + route
if [ -f "$WORKER_JS" ] && [ -n "${ACC:-}" ]; then
  META='{"main_module":"worker.js","compatibility_date":"2024-09-01"}'
  cf -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACC/workers/scripts/$SCRIPT_NAME" \
     -F "metadata=$META;type=application/json" -F "worker.js=@$WORKER_JS;type=application/javascript+module;filename=worker.js" | J 'print("worker deployed:", d["success"], [e.get("message") for e in d.get("errors",[])])'
  EXIST=$(cf "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" | J '
for r in d["result"]:
    if r["pattern"]=="'"$ZONE_NAME"'/*": print(r["id"])')
  RB="{\"pattern\":\"$ZONE_NAME/*\",\"script\":\"$SCRIPT_NAME\"}"
  if [ -n "$EXIST" ]; then cf -X PUT -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes/$EXIST" --data "$RB" | J 'print("route updated:", d["success"])'
  else cf -X POST -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" --data "$RB" | J 'print("route created:", d["success"])'; fi
else echo "worker step skipped (missing $WORKER_JS or account id)"; fi

# --- result check
sleep 5; printf "https://%s/ -> " "$ZONE_NAME"; curl -s -o /dev/null -m 25 -w "%{http_code}\n" "https://$ZONE_NAME/"
