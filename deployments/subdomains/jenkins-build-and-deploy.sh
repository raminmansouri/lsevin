#!/usr/bin/env bash
# Build an immutable application image from the current Jenkins workspace and,
# when automatic deployment is enabled, publish it through blue-green deployment.
set -Eeuo pipefail
umask 027

APP_NAME="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ENV_ROOT="${LSEVIN_PROJECT_ENV_ROOT:-/etc/lsevin/projects}"
APP_ENV_FILE="${APP_ENV_FILE:-${PROJECT_ENV_ROOT}/${APP_NAME}.env}"
APP_DOCKERFILE="${APP_DOCKERFILE:-Dockerfile}"
APP_BUILD_CONTEXT="${APP_BUILD_CONTEXT:-.}"
AUTO_DEPLOY="${AUTO_DEPLOY:-true}"

fail() { echo "ERROR: $*" >&2; exit 1; }
say() { printf '\n=== %s ===\n' "$*"; }

for command_name in docker git awk; do
  command -v "${command_name}" >/dev/null 2>&1 \
    || fail "Required command is missing: ${command_name}"
done

case "${APP_NAME}" in
  crm) IMAGE_REPOSITORY='lsevin-crm-webapp' ;;
  providers) IMAGE_REPOSITORY='lsevin-providers-webapp' ;;
  shop) IMAGE_REPOSITORY='lsevin-shop-webapp' ;;
  *) fail 'Usage: jenkins-build-and-deploy.sh crm|providers|shop' ;;
esac

[[ -f "${APP_DOCKERFILE}" ]] || fail "Dockerfile not found: ${APP_DOCKERFILE}"
[[ -d "${APP_BUILD_CONTEXT}" ]] || fail "Build context not found: ${APP_BUILD_CONTEXT}"
[[ -f "${APP_ENV_FILE}" ]] || fail "Runtime environment file missing: ${APP_ENV_FILE}"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || fail 'The Jenkins workspace is not a Git checkout.'
GIT_SHA="$(git rev-parse HEAD)"
SHORT_SHA="$(git rev-parse --short=12 HEAD)"
IMAGE="${IMAGE_REPOSITORY}:release-${SHORT_SHA}"

# Read a setting without sourcing the secret file as executable shell code.
env_value() {
  local key="$1"
  awk -F= -v wanted="${key}" '
    $0 !~ /^[[:space:]]*#/ && $1 == wanted {
      sub(/^[^=]*=/, ""); value=$0
    }
    END { print value }
  ' "${APP_ENV_FILE}"
}

# NEXT_PUBLIC_* values are commonly compiled into Next.js browser bundles. Only
# this allowlist is passed to `docker build`; private secrets such as AUTH_SECRET
# remain runtime-only and never become image layers.
BUILD_ARGS=()
for key in \
  NEXT_PUBLIC_URL \
  NEXT_PUBLIC_API_URL \
  NEXT_PUBLIC_FILES_URL \
  NEXT_PUBLIC_SOCKET_URL \
  NEXT_PUBLIC_NESHAN_MAP_KEY \
  NEXT_PUBLIC_MAPBOX_TOKEN; do
  value="$(env_value "${key}")"
  if [[ -n "${value}" ]]; then
    BUILD_ARGS+=(--build-arg "${key}=${value}")
  fi
done
BUILD_ARGS+=(--build-arg "APP_VERSION=${SHORT_SHA}")
BUILD_ARGS+=(--label "com.lsevin.application=${APP_NAME}")
BUILD_ARGS+=(--label "org.opencontainers.image.revision=${GIT_SHA}")
BUILD_ARGS+=(--label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)")

say "Build ${APP_NAME} image"
docker build --pull \
  --file "${APP_DOCKERFILE}" \
  --tag "${IMAGE}" \
  "${BUILD_ARGS[@]}" \
  "${APP_BUILD_CONTEXT}"

docker image inspect "${IMAGE}" >/dev/null
printf 'Built image: %s\n' "${IMAGE}"

case "${AUTO_DEPLOY,,}" in
  true|1|yes|on)
    say "Deploy ${APP_NAME}"
    APP_ENV_FILE="${APP_ENV_FILE}" APP_VERSION="${SHORT_SHA}" \
      "${SCRIPT_DIR}/deploy-blue-green.sh" "${APP_NAME}" "${IMAGE}"
    ;;
  *)
    echo "AUTO_DEPLOY=${AUTO_DEPLOY}; image was built but not published."
    ;;
esac
