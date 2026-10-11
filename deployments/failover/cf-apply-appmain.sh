#!/usr/bin/env bash
# cf-apply-appmain.sh - run ON SERVER B. Gives appmain.lsevin.com the same Iran/non-Iran split as lsevincare.com:
# deploys the same Worker code as a separate script (lsevin-appmain-geo) and routes appmain.lsevin.com/* to it.
# Everybody is served from B through Cloudflare; Iranian visitors are redirected to lsevin.ir (server A) while A's
# heartbeat is fresh. Idempotent. Previous DNS/routes are saved to /var/lib/lsevin-acme/cf-backup-appmain-<time>.json.
# IR_REDIRECT (off|canary|on) is kept if the script already exists, otherwise starts as canary (like lsevincare-geo).
set -uo pipefail
ZONE_NAME=lsevin.com; HOST=appmain.lsevin.com; SCRIPT=lsevin-appmain-geo; A_IP=213.176.121.235
WORKER_JS="${WORKER_JS:-/usr/local/share/lsevin/cloudflare-worker.js}"; MODE="${IR_REDIRECT:-canary}"
TOKEN=$(tr -d ' \r\n' < /etc/lsevin-acme/cloudflare.token); BK=/var/lib/lsevin-acme/cf-backup-appmain-$(date +%Y%m%d-%H%M%S).json
cf() { curl -s -m 40 -H "Authorization: Bearer $TOKEN" "$@"; }
J() { python3 -c "import json,sys; d=json.load(sys.stdin); $1"; }
Z=$(cf "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME")
ZID=$(echo "$Z" | J 'print(d["result"][0]["id"])'); ACC=$(echo "$Z" | J 'print(d["result"][0]["account"]["id"])')
[ -n "$ZID" ] && [ -n "$ACC" ] || { echo "cannot read zone"; exit 1; }
{ echo '{"dns":'; cf "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?per_page=200"; echo ',"routes":'; cf "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes"; echo '}'; } > "$BK"; echo "backup: $BK"

# a PROXIED record pointing at A can never work (Cloudflare is outside Iran) -> make it DNS only
cf "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?per_page=200" | J '
for r in d["result"]:
    if r["type"]=="A" and r["content"]=="'$A_IP'" and r.get("proxied"): print(r["id"], r["name"])' | while read -r id name; do
  cf -X PUT -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records/$id" \
     --data "{\"type\":\"A\",\"name\":\"$name\",\"content\":\"$A_IP\",\"ttl\":300,\"proxied\":false}" | J "print('$name -> A set to DNS only:', d['success'])"
done

# keep the mode already set on the script, if any
OLD=$(cf "https://api.cloudflare.com/client/v4/accounts/$ACC/workers/scripts/$SCRIPT/settings" | J 'print(next((b.get("text","") for b in d.get("result",{}).get("bindings",[]) if b.get("name")=="IR_REDIRECT"),""))' 2>/dev/null)
[ -n "${OLD:-}" ] && MODE=$OLD
META="{\"main_module\":\"worker.js\",\"compatibility_date\":\"2024-09-01\",\"bindings\":[{\"type\":\"plain_text\",\"name\":\"IR_REDIRECT\",\"text\":\"$MODE\"}]}"
cf -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACC/workers/scripts/$SCRIPT" \
   -F "metadata=$META;type=application/json" -F "worker.js=@$WORKER_JS;type=application/javascript+module;filename=worker.js" | J 'print("worker deployed:", d["success"], [e.get("message") for e in d.get("errors",[])])'
echo "IR_REDIRECT=$MODE"
EXIST=$(cf "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" | J '
for r in d["result"]:
    if r["pattern"]=="'$HOST'/*": print(r["id"])')
RB="{\"pattern\":\"$HOST/*\",\"script\":\"$SCRIPT\"}"
if [ -n "$EXIST" ]; then cf -X PUT -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes/$EXIST" --data "$RB" | J 'print("route updated:", d["success"])'
else cf -X POST -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZID/workers/routes" --data "$RB" | J 'print("route created:", d["success"], d.get("errors"))'; fi
sleep 5; printf "https://%s/ -> " "$HOST"; curl -s -o /dev/null -m 25 -w "%{http_code}\n" "https://$HOST/"
