#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "ERROR: run this script as root: sudo -i" >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo "ERROR: /etc/os-release is missing." >&2
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release
if [[ ${ID:-} != "ubuntu" ]]; then
  echo "ERROR: this installer supports Ubuntu. Detected: ${PRETTY_NAME:-unknown}." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y software-properties-common ca-certificates gnupg openssl python3 python3-apt

if ! grep -Rqs "ppa.launchpad.net/ansible/ansible" /etc/apt/sources.list /etc/apt/sources.list.d 2>/dev/null; then
  add-apt-repository --yes --update ppa:ansible/ansible
else
  apt-get update
fi

apt-get install -y ansible

if ! command -v ansible-playbook >/dev/null 2>&1; then
  echo "ERROR: ansible-playbook was not installed." >&2
  exit 1
fi

core_version="$(ansible --version | sed -n '1s/.*core \([0-9][0-9.]*\).*/\1/p')"
if [[ -z "$core_version" ]]; then
  echo "ERROR: unable to determine ansible-core version." >&2
  ansible --version >&2
  exit 1
fi

minimum="2.16.0"
if [[ "$(printf '%s\n%s\n' "$minimum" "$core_version" | sort -V | head -n1)" != "$minimum" ]]; then
  echo "ERROR: ansible-core $core_version is too old; version $minimum or newer is required." >&2
  exit 1
fi

echo "Ansible installed system-wide successfully."
ansible --version
