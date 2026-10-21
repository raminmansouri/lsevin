#!/usr/bin/env bash
# Installs the release sync on server A. Run as root from this folder. Needs /etc/lsevin/release.pw (the password for B's /_releases/ route).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
[ -s /etc/lsevin/release.pw ] || { echo "create /etc/lsevin/release.pw first (the same password as the hash in B's Caddyfile route /_releases/)"; exit 1; }
install -m 755 "$HERE/lsevin-release-sync" /usr/local/sbin/lsevin-release-sync
mkdir -p /var/lib/lsevin-release
[ -s /var/lib/lsevin-release/applied.json ] || { echo "seed /var/lib/lsevin-release/applied.json with what A runs now (see README.md), otherwise the first run re-deploys everything"; exit 1; }

cat > /etc/systemd/system/lsevin-release-sync.service <<'EOF'
[Unit]
Description=Apply the release that server B runs (images fetched from B over the VPN)
After=network-online.target k3s.service docker.service

[Service]
Type=oneshot
Nice=10
ExecStart=/usr/local/sbin/lsevin-release-sync
TimeoutStartSec=45min
EOF

cat > /etc/systemd/system/lsevin-release-sync.timer <<'EOF'
[Unit]
Description=Check for a new release from B every 5 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
AccuracySec=30s

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now lsevin-release-sync.timer
echo "installed: lsevin-release-sync.timer (every 5 minutes). Manual run: lsevin-release-sync [--check|--force]"
