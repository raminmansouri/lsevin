#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${EUID}" -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }
here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install -o root -g root -m 0750 "${here}/lsevin-config-backup" /usr/local/sbin/lsevin-config-backup
install -o root -g root -m 0644 "${here}/lsevin-config-backup.service" /etc/systemd/system/lsevin-config-backup.service
install -o root -g root -m 0644 "${here}/lsevin-config-backup.timer" /etc/systemd/system/lsevin-config-backup.timer
systemctl daemon-reload
systemctl enable --now lsevin-config-backup.timer
systemctl start lsevin-config-backup.service
