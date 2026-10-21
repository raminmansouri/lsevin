#!/usr/bin/env bash
# Installs the release-export timer and the release file server on server B. Run as root (or via sudo) from this folder.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
install -m 755 "$HERE/lsevin-release-export" /usr/local/sbin/lsevin-release-export
install -m 755 "$HERE/lsevin-release-server" /usr/local/sbin/lsevin-release-server
mkdir -p /var/lib/lsevin/release-export

cat > /etc/systemd/system/lsevin-release-server.service <<'EOF'
[Unit]
Description=Serves the exported release images to server A (Docker bridge address only; Caddy adds TLS + password)
After=docker.service network-online.target

[Service]
ExecStart=/usr/bin/python3 /usr/local/sbin/lsevin-release-server --bind 172.18.0.1 --port 31480 --root /var/lib/lsevin/release-export
Restart=always
RestartSec=5
User=nobody
Group=nogroup
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
ReadOnlyPaths=/var/lib/lsevin/release-export
MemoryMax=96M

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/lsevin-release-export.service <<'EOF'
[Unit]
Description=Export the application images B runs, for server A
After=k3s.service

[Service]
Type=oneshot
Nice=15
IOSchedulingClass=idle
ExecStart=/usr/local/sbin/lsevin-release-export
EOF

cat > /etc/systemd/system/lsevin-release-export.timer <<'EOF'
[Unit]
Description=Export the running release every 2 minutes

[Timer]
OnBootSec=3min
OnUnitActiveSec=2min
AccuracySec=15s

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now lsevin-release-server.service lsevin-release-export.timer
echo "installed. first export runs within 2 minutes (or: systemctl start lsevin-release-export.service)"
