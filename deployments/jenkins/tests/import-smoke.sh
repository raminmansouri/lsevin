#!/bin/sh
# Run inside Jenkins against its real Docker daemon and K3s import helper.
# No application deployment, database write, or production image removal.
set -eu
DEPLOY="${DEPLOY:-/opt/lsevin/app/deployments/jenkins/k3s-deploy.sh}"
BASE_IMAGE="${K3S_HELPER_IMAGE:-rancher/k3s:v1.36.4-k3s1}"
TEST_IMAGE="lsevin-deploy-import-smoke:check-$(date +%s)-$$"
ARCHIVE="pwa-import-smoke-$$.tar"
cleanup() {
  "$DEPLOY" discard-images "$TEST_IMAGE" >/dev/null 2>&1 || true
  docker image rm "$TEST_IMAGE" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM
docker image inspect "$BASE_IMAGE" >/dev/null
docker tag "$BASE_IMAGE" "$TEST_IMAGE"
"$DEPLOY" import "$ARCHIVE" "$TEST_IMAGE"
"$DEPLOY" verify-images "$TEST_IMAGE"
echo 'PASS: Jenkins-created archive is visible to the host import helper.'
