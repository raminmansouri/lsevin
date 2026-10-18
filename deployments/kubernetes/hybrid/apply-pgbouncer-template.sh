#!/bin/sh
# Publishes docker/pgbouncer/pgbouncer.ini.template (with query_timeout) as the ConfigMap the pgbouncer pod mounts, then restarts pgbouncer.
# Run on the server (A or B) after changing the template.  No image rebuild needed.
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
K="kubectl"; command -v kubectl >/dev/null 2>&1 || K="k3s kubectl"; [ "$(id -u)" = 0 ] || K="sudo -n $K"
$K -n lsevin create configmap pgbouncer-template --from-file=pgbouncer.ini.template="$HERE/../../docker/pgbouncer/pgbouncer.ini.template" --dry-run=client -o yaml | $K apply -f -
$K -n lsevin rollout restart deployment/pgbouncer
$K -n lsevin rollout status deployment/pgbouncer --timeout=120s
