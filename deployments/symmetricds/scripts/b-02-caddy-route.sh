#!/usr/bin/env bash
# Run ON SERVER B as root. Publishes the SymmetricDS hub as https://api.lsevin.com/symds/*
# (Caddy strips /symds and rewrites to the hub's /sync/<engine>/ path, then proxies to 172.18.0.1:31415).
# Idempotent. Backs up the Caddyfile, validates, reloads gracefully (no downtime); restores the backup on failure.
set -euo pipefail
CF=/opt/lsevin/app/deployments/docker/Caddyfile.server
C=docker-caddy-1
cp -a "$CF" "$CF.bak-symds-$(date +%s)"
python3 - "$CF" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
# drop any earlier symds route (including the first version whose path did not match the hub)
s = re.sub(r"\t# SymmetricDS hub[^\n]*\n\thandle(?:_path)? /symds/\* \{\n(?:\t\t[^\n]*\n)+\t\}\n", "", s)
m = re.search(r"^\{\$API_DOMAIN:api\.lsevin\.com\} \{\n", s, re.M)
assert m, "api.lsevin.com site block not found"
block = (
    "\t# SymmetricDS hub for A <-> B sync (HTTPS from the Iran node; node credentials are required)\n"
    "\thandle_path /symds/* {\n"
    "\t\trewrite * /sync{uri}\n"
    "\t\treverse_proxy 172.18.0.1:31415\n"
    "\t}\n"
)
open(p, "w").write(s[: m.end()] + block + s[m.end():])
PY
if docker exec "$C" caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
  docker exec "$C" caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 && echo "caddy reloaded"
else
  echo "VALIDATION FAILED - restoring backup"
  cp -a "$(ls -t "$CF".bak-symds-* | head -1)" "$CF"
  exit 1
fi
# let the Caddy container reach the hub on the docker bridge gateway
ufw allow from 172.18.0.0/16 to any port 31415 proto tcp comment "caddy -> symds hub" >/dev/null || true
echo "NOTE: keep deployments/docker/Caddyfile.server in git in sync (it already contains this route)."
