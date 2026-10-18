#!/usr/bin/env bash
# a-remote-write-setup.sh - run ON SERVER A (root). Makes A's Prometheus push its metrics to B's Prometheus, so server A's
# health is visible in B's Grafana. B cannot dial A, so A pushes (Prometheus remote write) over the VPN route to B.
#
#   B side (already live): Caddy route  https://api.lsevin.com/prom-write/  (basic auth user "site-a")  ->  Prometheus
#   with --web.enable-remote-write-receiver.   See deployments/docker/Caddyfile.server and platform/monitoring.yaml.
#   A side (this script): password in a Kubernetes secret, `site: A` external label, remote_write block, host alias so
#   the pod reaches api.lsevin.com at B's address (the public name is Cloudflare-proxied and unreachable from Iran).
# Password: /etc/lsevin/prom-remote-write.pw on A (root-only). Idempotent.
set -euo pipefail
NS=lsevin; B_IP=${B_IP:-202.133.90.50}
PW_FILE=/etc/lsevin/prom-remote-write.pw
[ -s "$PW_FILE" ] || { echo "missing $PW_FILE (the remote-write password)"; exit 1; }

kubectl -n $NS create secret generic prom-remote-write --from-file=password="$PW_FILE" --dry-run=client -o yaml | kubectl apply -f - >/dev/null

# --- config map: external label + remote_write (only once)
python3 - <<'PYEOF'
import json, subprocess
def kc(*a, inp=None):
    return subprocess.run(["kubectl", "-n", "lsevin", *a], input=inp, capture_output=True, text=True, check=True).stdout
cm = json.loads(kc("get", "cm", "prometheus-config", "-o", "json"))
y = cm["data"]["prometheus.yml"]
changed = False
if "job_name: lsevin-site" not in y:
    # scrape job for the site exporter (deployments/monitoring/lsevin-site-exporter, listens on the pod bridge)
    y = y.replace("scrape_configs:\n", "scrape_configs:\n  - job_name: lsevin-site\n    static_configs: [{targets: [\"10.42.0.1:9199\"]}]\n", 1)
    changed = True
if "remote_write:" in y:
    print("config: remote_write already present")
    if changed:
        cm["data"]["prometheus.yml"] = y
        for k in ("resourceVersion", "uid", "creationTimestamp", "managedFields"):
            cm["metadata"].pop(k, None)
        kc("apply", "-f", "-", inp=json.dumps(cm))
        print("config: lsevin-site scrape job added")
else:
    y = y.replace("global:\n  scrape_interval: 15s\n  evaluation_interval: 15s\n",
                  "global:\n  scrape_interval: 15s\n  evaluation_interval: 15s\n  external_labels:\n    site: A\n", 1)
    y = y.rstrip("\n") + """
# Push everything to the Prometheus on server B (shown in B's Grafana, label site="A").
remote_write:
  - url: https://api.lsevin.com/prom-write/
    basic_auth:
      username: site-a
      password_file: /etc/prom-remote-write/password
    queue_config: {capacity: 20000, max_shards: 4, max_samples_per_send: 2000, batch_send_deadline: 10s}
    write_relabel_configs:
      - {source_labels: [__name__], regex: "go_.*|promhttp_.*|scrape_samples_.*|scrape_series_added", action: drop}
"""
    cm["data"]["prometheus.yml"] = y
    for k in ("resourceVersion", "uid", "creationTimestamp", "managedFields"):
        cm["metadata"].pop(k, None)
    kc("apply", "-f", "-", inp=json.dumps(cm))
    print("config: remote_write added")
PYEOF

# --- deployment: mount the secret and alias api.lsevin.com to B (only once)
if ! kubectl -n $NS get deploy prometheus -o jsonpath='{.spec.template.spec.volumes[*].name}' | grep -qw prom-remote-write; then
  kubectl -n $NS patch deploy prometheus --type=json -p "[
    {\"op\":\"add\",\"path\":\"/spec/template/spec/volumes/-\",\"value\":{\"name\":\"prom-remote-write\",\"secret\":{\"secretName\":\"prom-remote-write\"}}},
    {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/volumeMounts/-\",\"value\":{\"name\":\"prom-remote-write\",\"mountPath\":\"/etc/prom-remote-write\",\"readOnly\":true}},
    {\"op\":\"add\",\"path\":\"/spec/template/spec/hostAliases\",\"value\":[{\"ip\":\"$B_IP\",\"hostnames\":[\"api.lsevin.com\"]}]}
  ]" >/dev/null
  echo "deployment patched"
else
  kubectl -n $NS rollout restart deploy/prometheus >/dev/null
  echo "deployment restarted (already patched)"
fi
kubectl -n $NS rollout status deploy/prometheus --timeout=240s | tail -1
