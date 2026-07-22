#!/usr/bin/env bash
# Backward-compatible entry point.
# The old implementation replaced one running container directly and could cause
# a short outage. All calls now use the safer blue-green deployment script.
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/deploy-blue-green.sh" "$@"
