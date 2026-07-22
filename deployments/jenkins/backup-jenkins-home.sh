#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

CONTROLLER_DIR="${JENKINS_CONTROLLER_DIR:-/opt/lsevin-new/deployments/jenkins}"
ENV_FILE="${CONTROLLER_DIR}/controller.env"
BACKUP_ROOT="${JENKINS_BACKUP_DIR:-/var/backups/lsevin/jenkins}"
HOME_DIR="${JENKINS_HOME_DIR:-/var/lib/lsevin/jenkins}"
RETENTION_DAYS="${JENKINS_BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="${BACKUP_ROOT}/jenkins-home-${TIMESTAMP}.tar.gz"
LOCK_FILE=/run/lock/lsevin-jenkins-backup.lock

fail() { echo "ERROR: $*" >&2; exit 1; }
[[ "${EUID}" -eq 0 ]] || fail 'run as root'
[[ -f "${ENV_FILE}" ]] || fail "missing ${ENV_FILE}"
[[ -d "${HOME_DIR}" ]] || fail "missing ${HOME_DIR}"
mkdir -p "${BACKUP_ROOT}"
exec 9>"${LOCK_FILE}"
flock -n 9 || fail 'another Jenkins backup is running'

compose=(docker compose --env-file "${ENV_FILE}" -f "${CONTROLLER_DIR}/docker-compose.yml")
was_running=false
if [[ "$("${compose[@]}" ps -q jenkins 2>/dev/null || true)" ]]; then
  was_running=true
  "${compose[@]}" stop -t 60 jenkins
fi
restart() {
  if [[ "${was_running}" == true ]]; then
    "${compose[@]}" up -d --no-build jenkins >/dev/null || true
  fi
}
trap restart EXIT

tar --numeric-owner --xattrs --acls \
  --exclude='./workspace/*' \
  --exclude='./caches/*' \
  -C "${HOME_DIR}" -czf "${ARCHIVE}" .
gzip -t "${ARCHIVE}"
sha256sum "${ARCHIVE}" > "${ARCHIVE}.sha256"
[[ "$(stat -c '%s' "${ARCHIVE}")" -ge 10240 ]] || fail 'backup archive is unexpectedly small'
find "${BACKUP_ROOT}" -maxdepth 1 -type f -name 'jenkins-home-*.tar.gz' -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_ROOT}" -maxdepth 1 -type f -name 'jenkins-home-*.tar.gz.sha256' -mtime "+${RETENTION_DAYS}" -delete
ln -sfn "$(basename "${ARCHIVE}")" "${BACKUP_ROOT}/latest.tar.gz"
printf 'BACKUP=%s\n' "${ARCHIVE}"
