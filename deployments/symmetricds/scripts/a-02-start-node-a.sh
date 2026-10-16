#!/usr/bin/env bash
# Run ON SERVER A as root. Starts the client; it registers with the hub (initial load stays OFF) and starts syncing.
set -euo pipefail
systemctl enable --now symds-node-a
for i in $(seq 1 30); do
  sleep 5
  grep -q "Successfully registered node" /opt/symds/node-a/logs/symmetric.log 2>/dev/null && break
done
grep -E "registered|ERROR" /opt/symds/node-a/logs/symmetric.log | tail -5 | cut -c1-200 || true
echo "Verify on B:  select node_id, registration_enabled, initial_load_enabled from sym_node_security;   (001 should show 0 | 0)"
echo "Then run deployments/symmetricds/tests/live-smoke-test.sh from your PC."
