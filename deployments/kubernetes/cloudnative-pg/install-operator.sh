#!/usr/bin/env bash
set -Eeuo pipefail

VERSION=1.30.0
URL="https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v${VERSION}/cnpg-${VERSION}.yaml"
EXPECTED_SHA256=f8bede43fe4ee0d478c2355b204a36876b2ae4faac60f2a9452280b293da3b88
MANIFEST="$(mktemp)"
trap 'rm -f "$MANIFEST"' EXIT

curl --fail --silent --show-error --location "$URL" --output "$MANIFEST"
printf '%s  %s\n' "$EXPECTED_SHA256" "$MANIFEST" | sha256sum --check --status
k3s kubectl apply --server-side -f "$MANIFEST"
k3s kubectl -n cnpg-system patch deployment cnpg-controller-manager --type=merge -p \
  '{"spec":{"template":{"metadata":{"annotations":{"prometheus.io/scrape":"true","prometheus.io/port":"8080","prometheus.io/path":"/metrics"}}}}}'
k3s kubectl -n cnpg-system rollout status deployment/cnpg-controller-manager --timeout=5m
