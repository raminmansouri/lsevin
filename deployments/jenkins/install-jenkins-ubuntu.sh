#!/usr/bin/env bash
set -Eeuo pipefail

# Install Jenkins LTS on Ubuntu/Debian as a systemd service.
# Run once from the repository: sudo bash deployments/jenkins/install-jenkins-ubuntu.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

[[ "${EUID}" -eq 0 ]] || { echo 'Run this script as root (sudo).' >&2; exit 1; }
[[ -r /etc/os-release ]] || { echo 'Cannot identify operating system.' >&2; exit 1; }
. /etc/os-release
case "${ID_LIKE:-${ID}}" in
  *debian*|*ubuntu*) ;;
  *) echo "This installer supports Ubuntu/Debian only; detected ${PRETTY_NAME}." >&2; exit 1 ;;
esac

apt update
apt install -y ca-certificates curl fontconfig git gnupg jq openjdk-21-jre rsync sudo unzip util-linux wget
java -version

install -m 0755 -d /etc/apt/keyrings
wget -qO /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
cat > /etc/apt/sources.list.d/jenkins.list <<'REPO'
deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/
REPO

apt update
apt install -y jenkins

command -v docker >/dev/null 2>&1 || {
  echo 'Docker is not installed. Install Docker Engine and the Compose plugin before enabling deployment.' >&2
  exit 1
}
docker compose version >/dev/null 2>&1 || {
  echo 'Docker Compose plugin is missing.' >&2
  exit 1
}
getent group docker >/dev/null || groupadd docker
usermod -aG docker jenkins

# Stable code, release metadata, uploaded media, and backups are deliberately
# separate. Git/Jenkins synchronization is allowed to modify only /opt/lsevin/app.
install -d -o jenkins -g docker -m 2775 /opt/lsevin/app
install -d -o jenkins -g docker -m 2775 /opt/lsevin/releases
install -d -o jenkins -g docker -m 2775 /opt/lsevin/jenkins
install -d -o root -g docker -m 2775 /var/lib/lsevin/uploads
install -d -o root -g docker -m 2770 /var/backups/lsevin/uploads
install -d -o root -g docker -m 2770 /var/backups/lsevin/uploads/snapshots
install -d -o root -g docker -m 2775 /opt/lsevin/backups
install -d -o jenkins -g docker -m 2775 /opt/lsevin/backups/predeploy
install -d -o jenkins -g docker -m 2775 /opt/lsevin/app/deployments/docker/geoip

# Seed the stable deployment directory so the first Jenkins run has Compose,
# Caddy, Dockerfiles, and .env.example available. Existing live secrets and the
# external GeoIP database are preserved if this installer is rerun.
rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='bin/' \
  --exclude='obj/' \
  --exclude='deployments/docker/.env' \
  --exclude='deployments/docker/geoip/' \
  "${REPO_ROOT}/" /opt/lsevin/app/

if [[ ! -f /opt/lsevin/app/deployments/docker/.env ]]; then
  cp /opt/lsevin/app/deployments/docker/.env.example \
    /opt/lsevin/app/deployments/docker/.env
  echo 'Created a placeholder production .env. Replace every CHANGE_ME value before deployment.'
fi

chown -R jenkins:docker /opt/lsevin/app /opt/lsevin/releases /opt/lsevin/jenkins
chown root:docker /opt/lsevin/backups
chown jenkins:docker /opt/lsevin/backups/predeploy
find /opt/lsevin/app /opt/lsevin/releases /opt/lsevin/jenkins /opt/lsevin/backups/predeploy -type d -exec chmod 2775 {} +
if [[ -f /opt/lsevin/app/deployments/docker/.env ]]; then
  chown jenkins:jenkins /opt/lsevin/app/deployments/docker/.env
  chmod 600 /opt/lsevin/app/deployments/docker/.env
fi
install -d -m 0755 /run/jenkins

# Jenkins is not exposed on a raw TCP port. Caddy reaches it through this Unix
# socket and publishes it as https://devops.lsevin.com.
mkdir -p /etc/systemd/system/jenkins.service.d
cat > /etc/systemd/system/jenkins.service.d/lsevin.conf <<'SYSTEMD'
[Service]
Environment="JENKINS_PORT=-1"
Environment="JENKINS_UNIX_DOMAIN_PATH=/run/jenkins/jenkins.socket"
SYSTEMD

systemctl daemon-reload
systemctl enable --now jenkins
systemctl restart jenkins

# New group membership is applied after the service restart.
sleep 3
systemctl --no-pager --full status jenkins || true

cat <<'NEXT'

Jenkins is installed.

Next commands:
  sudo cat /var/lib/jenkins/secrets/initialAdminPassword
  sudo ls -l /run/jenkins/jenkins.socket
  sudo -u jenkins docker ps

Before opening Jenkins:
  1. Replace all CHANGE_ME values in /opt/lsevin/app/deployments/docker/.env.
  2. Copy the production GeoIP MMDB into /opt/lsevin/app/deployments/docker/geoip/.
  3. Add DNS A record: devops.lsevin.com -> this server IP.
  4. Start/reload Caddy with the updated server Compose configuration.
  5. Open https://devops.lsevin.com and complete the setup wizard.
NEXT
