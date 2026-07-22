#!/usr/bin/env bash
# Roll a subdomain back by redeploying a previously recorded immutable image.
# Usage: rollback-blue-green.sh crm [IMAGE:TAG]
set -Eeuo pipefail

APP_NAME="${1:-}"
REQUESTED_IMAGE="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_ROOT="${LSEVIN_SUBDOMAIN_STATE_ROOT:-/var/lib/lsevin/subdomains}"
HISTORY_FILE="${STATE_ROOT}/${APP_NAME}/releases.tsv"

case "${APP_NAME}" in
  crm|providers|shop) ;;
  *) echo 'Usage: rollback-blue-green.sh crm|providers|shop [IMAGE:TAG]' >&2; exit 1 ;;
esac

if [[ -n "${REQUESTED_IMAGE}" ]]; then
  ROLLBACK_IMAGE="${REQUESTED_IMAGE}"
else
  [[ -s "${HISTORY_FILE}" ]] || {
    echo "No release history exists: ${HISTORY_FILE}" >&2
    exit 1
  }
  # The last field is the image that was active before the latest deployment.
  ROLLBACK_IMAGE="$(tail -n 1 "${HISTORY_FILE}" | awk -F '\t' '{print $5}')"
fi

[[ -n "${ROLLBACK_IMAGE}" && "${ROLLBACK_IMAGE}" != none ]] || {
  echo 'No previous image is recorded; pass an explicit IMAGE:TAG.' >&2
  exit 1
}

docker image inspect "${ROLLBACK_IMAGE}" >/dev/null 2>&1 || {
  echo "Rollback image is not available locally: ${ROLLBACK_IMAGE}" >&2
  exit 1
}

exec "${SCRIPT_DIR}/deploy-blue-green.sh" "${APP_NAME}" "${ROLLBACK_IMAGE}"
