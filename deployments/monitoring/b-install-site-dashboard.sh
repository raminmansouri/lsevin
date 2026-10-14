#!/usr/bin/env bash
# b-install-site-dashboard.sh - run ON SERVER B. Adds dashboards/lsevin-site-a.json to B's Grafana (ConfigMap grafana-dashboards,
# provisioned automatically within about a minute). Idempotent.
set -euo pipefail
F="${1:-$(dirname "$0")/dashboards/lsevin-site-a.json}"
python3 - "$F" <<'PYEOF'
import json, subprocess, sys
body = open(sys.argv[1], encoding="utf-8").read()
patch = json.dumps({"data": {"lsevin-site-a.json": body}})
subprocess.run(["kubectl", "-n", "lsevin", "patch", "cm", "grafana-dashboards", "--type", "merge", "-p", patch], check=True)
PYEOF
