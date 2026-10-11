#!/usr/bin/env bash
# Run ON SERVER B as root: ./b-acme-setup.sh "<ssh public key of server A's certfetch key>"
# Installs lego, the lsevin-acme tool, systemd units (token file written -> issue immediately; daily renew timer),
# and authorizes A's certfetch key for ONE read-only forced command.
set -euo pipefail
PUBKEY="${1:?usage: $0 '<A certfetch public key>'}"
HERE=$(cd "$(dirname "$0")" && pwd)
V=$(curl -s -m 30 https://api.github.com/repos/go-acme/lego/releases/latest | python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])')
if ! command -v lego >/dev/null 2>&1; then
  cd /tmp; curl -s -L -m 200 -o lego.tgz "https://github.com/go-acme/lego/releases/download/$V/lego_${V}_linux_amd64.tar.gz"
  tar -xzf lego.tgz lego && install -m 755 lego /usr/local/bin/lego; rm -f lego lego.tgz
fi
lego --version | head -1

install -d -m 700 /etc/lsevin-acme /var/lib/lsevin-acme
[ -f /etc/lsevin-acme/email ] || echo "admin@lsevin.com" > /etc/lsevin-acme/email
install -m 755 "$HERE/lsevin-acme" /usr/local/sbin/lsevin-acme
install -m 755 "$HERE/cf-apply.sh" /usr/local/sbin/lsevin-cf-apply
install -d /usr/local/share/lsevin; install -m 644 "$HERE/cloudflare-worker.js" /usr/local/share/lsevin/cloudflare-worker.js
printf '#!/bin/sh\nexec cat /var/lib/filesync/certs/ir.tgz\n' > /usr/local/sbin/lsevin-serve-cert; chmod 755 /usr/local/sbin/lsevin-serve-cert

# the forced command needs a shell; the tunnel key is pinned to /bin/false so it can never run anything
usermod -s /bin/sh filesync
install -d -m 750 -o filesync -g filesync /var/lib/filesync/certs
AK=/var/lib/filesync/.ssh/authorized_keys
TUNNEL=$(grep -v 'certfetch' "$AK" | grep 'port-forwarding' | sed 's/^restrict,port-forwarding,\(command="[^"]*",\)\?/restrict,port-forwarding,command="\/bin\/false",/' | sort -u)
{ echo "$TUNNEL"; echo "restrict,command=\"/usr/local/sbin/lsevin-serve-cert\" $PUBKEY"; } > "$AK.new"
mv "$AK.new" "$AK"; chown filesync:filesync "$AK"; chmod 600 "$AK"
cut -c1-120 "$AK"

cat > /etc/systemd/system/lsevin-acme.service <<'U'
[Unit]
Description=Issue/renew the ir.lsevincare.com certificate (DNS-01) and publish it for server A
After=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/lsevin-acme
TimeoutStartSec=15min
U
cat > /etc/systemd/system/lsevin-acme.timer <<'U'
[Unit]
Description=Daily certificate renewal check
[Timer]
OnCalendar=*-*-* 00,06,12,18:30:00
RandomizedDelaySec=20min
Persistent=true
[Install]
WantedBy=timers.target
U
cat > /etc/systemd/system/lsevin-acme.path <<'U'
[Unit]
Description=Start certificate issuance as soon as the Cloudflare token is written
[Path]
PathChanged=/etc/lsevin-acme/cloudflare.token
[Install]
WantedBy=multi-user.target
U
systemctl daemon-reload
systemctl enable --now lsevin-acme.timer lsevin-acme.path >/dev/null 2>&1
echo "armed: path=$(systemctl is-active lsevin-acme.path) timer=$(systemctl is-active lsevin-acme.timer)"
