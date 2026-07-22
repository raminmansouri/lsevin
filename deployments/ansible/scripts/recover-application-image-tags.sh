#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/lsevin-new}"
DOCKER_DIR="${APP_ROOT}/deployments/docker"
ENV_FILE="${DOCKER_DIR}/.env"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.server.yml"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-docker}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -d "${DOCKER_DIR}" ]] || fail "Docker deployment directory not found: ${DOCKER_DIR}"
[[ -f "${ENV_FILE}" ]] || fail "Production environment file not found: ${ENV_FILE}"
[[ -f "${COMPOSE_FILE}" ]] || fail "Compose file not found: ${COMPOSE_FILE}"
command -v docker >/dev/null 2>&1 || fail 'Docker is not installed.'
command -v python3 >/dev/null 2>&1 || fail 'Python 3 is not installed.'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose v2 is unavailable.'

compose() {
  docker compose \
    --project-name "${PROJECT_NAME}" \
    --env-file "${ENV_FILE}" \
    -f "${COMPOSE_FILE}" \
    "$@"
}

recover_tag() {
  local service="$1"
  local target_image="$2"
  local container_id image_id

  if docker image inspect "${target_image}" >/dev/null 2>&1; then
    printf '%s already exists.\n' "${target_image}"
    return 0
  fi

  container_id="$(compose ps --all --quiet "${service}" | head -n 1)"
  [[ -n "${container_id}" ]] || fail \
    "${target_image} is missing and no ${service} container exists. Rebuild it through Jenkins."

  image_id="$(
    docker container inspect "${container_id}" |
      python3 -c 'import json, sys; print(json.load(sys.stdin)[0]["Image"])'
  )"

  docker image inspect "${image_id}" >/dev/null 2>&1 || fail \
    "The image object ${image_id} used by ${service} is unavailable. Rebuild through Jenkins."

  docker image tag "${image_id}" "${target_image}"
  docker image inspect "${target_image}" >/dev/null
  printf 'Restored %s from container %s image %s.\n' \
    "${target_image}" "${container_id}" "${image_id}"
}

cd "${DOCKER_DIR}"
compose config --quiet
recover_tag lsevin-api lsevin-api:server
recover_tag lsevin-webapp lsevin-webapp:server

printf '%s\n' 'Application image tags are ready. Rerun the Ansible deployment.'
