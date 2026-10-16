#!/usr/bin/env python3
"""Generates dashboards/lsevin-site-a.json: the "Server A (Iran) health" Grafana dashboard for B's Grafana.
Every query filters on site="A", the external label A's Prometheus adds before pushing to B. Re-run after editing."""
import json, os

DS = {"type": "prometheus", "uid": "prometheus"}
panels, pid = [], 0


def nid():
    global pid
    pid += 1
    return pid


def stat(title, expr, x, y, unit="none", steps=None, mappings=None, w=3):
    steps = steps or [{"color": "green", "value": None}]
    p = {"id": nid(), "type": "stat", "title": title, "datasource": DS, "gridPos": {"h": 4, "w": w, "x": x, "y": y},
         "targets": [{"expr": expr, "refId": "A", "datasource": DS, "instant": True}],
         "fieldConfig": {"defaults": {"unit": unit, "thresholds": {"mode": "absolute", "steps": steps}, "mappings": mappings or [],
                                      "noValue": "no data"}, "overrides": []},
         "options": {"colorMode": "background", "graphMode": "none", "reduceOptions": {"calcs": ["lastNotNull"]}}}
    panels.append(p)


def series(title, exprs, x, y, unit="none", w=12, h=7):
    panels.append({"id": nid(), "type": "timeseries", "title": title, "datasource": DS, "gridPos": {"h": h, "w": w, "x": x, "y": y},
                   "targets": [{"expr": e, "legendFormat": l, "refId": chr(65 + i), "datasource": DS} for i, (e, l) in enumerate(exprs)],
                   "fieldConfig": {"defaults": {"unit": unit, "custom": {"lineWidth": 1, "fillOpacity": 8}}, "overrides": []}})


def table(title, expr, x, y, w=12, h=8, unit="none", steps=None, legend=""):
    steps = steps or [{"color": "green", "value": None}]
    panels.append({"id": nid(), "type": "bargauge", "title": title, "datasource": DS, "gridPos": {"h": h, "w": w, "x": x, "y": y},
                   "targets": [{"expr": expr, "legendFormat": legend, "refId": "A", "datasource": DS, "instant": True}],
                   "fieldConfig": {"defaults": {"unit": unit, "thresholds": {"mode": "absolute", "steps": steps}, "min": 0}, "overrides": []},
                   "options": {"orientation": "horizontal", "displayMode": "gradient", "reduceOptions": {"calcs": ["lastNotNull"]}}})


OK = [{"type": "value", "options": {"1": {"text": "UP", "color": "green"}, "0": {"text": "DOWN", "color": "red"}}}]
S = 'site="A"'
stat("Site health", f"lsevin_site_ok{{{S}}}", 0, 0, steps=[{"color": "red", "value": None}, {"color": "green", "value": 1}], mappings=OK)
stat("Heartbeat age", f"lsevin_site_heartbeat_age_seconds{{{S}}}", 3, 0, "s", [{"color": "green", "value": None}, {"color": "orange", "value": 120}, {"color": "red", "value": 180}])
stat("DB sync lag", f"lsevin_db_sync_lag_seconds{{{S}}}", 6, 0, "s", [{"color": "green", "value": None}, {"color": "orange", "value": 300}, {"color": "red", "value": 900}])
stat("DB batches waiting", f"lsevin_db_sync_pending_batches{{{S}}}", 9, 0, "none", [{"color": "green", "value": None}, {"color": "orange", "value": 20}, {"color": "red", "value": 200}])
stat("File sync age", f"lsevin_file_sync_last_ok_age_seconds{{{S}}}", 12, 0, "s", [{"color": "green", "value": None}, {"color": "orange", "value": 600}, {"color": "red", "value": 1800}])
stat("Disk used", f"lsevin_disk_used_percent{{{S}}}", 15, 0, "percent", [{"color": "green", "value": None}, {"color": "orange", "value": 80}, {"color": "red", "value": 90}])
stat("Certificate days left", f"lsevin_cert_days_left{{{S}}}", 18, 0, "d", [{"color": "red", "value": None}, {"color": "orange", "value": 14}, {"color": "green", "value": 30}])
stat("Backups older than 36 h", f'count(lsevin_backup_age_seconds{{{S},kind!="offsite_upload"}} > 129600) or vector(0)', 21, 0, "none",
     [{"color": "green", "value": None}, {"color": "red", "value": 1}])

series("CPU used %", [(f'100 - avg(rate(node_cpu_seconds_total{{mode="idle",{S}}}[5m])) * 100', "cpu")], 0, 4, "percent")
series("Load average (8 CPUs)", [(f"node_load1{{{S}}}", "1 min"), (f"node_load5{{{S}}}", "5 min")], 12, 4)
series("Memory and swap used %", [(f"100 * (1 - node_memory_MemAvailable_bytes{{{S}}} / node_memory_MemTotal_bytes{{{S}}})", "memory"),
                                  (f"100 * (1 - node_memory_SwapFree_bytes{{{S}}} / node_memory_SwapTotal_bytes{{{S}}})", "swap")], 0, 11, "percent")
series("Public pages (blackbox probes, 1 = OK)", [(f"probe_success{{{S}}}", "{{instance}}")], 12, 11)
series("Database sync lag and backlog", [(f"lsevin_db_sync_lag_seconds{{{S}}}", "lag s"), (f"lsevin_db_sync_pending_batches{{{S}}}", "batches waiting")], 0, 18)
series("PostgreSQL connections", [(f"sum(pg_stat_activity_count{{{S}}})", "connections")], 12, 18)
table("Server A: age of the newest backup (alert above 26 h)", f"lsevin_backup_age_seconds{{{S}}}", 0, 25, 12, 8, "s",
      [{"color": "green", "value": None}, {"color": "orange", "value": 93600}, {"color": "red", "value": 129600}], "{{kind}}")
table("Disk used % (A = site A, no label = server B)", "lsevin_disk_used_percent", 12, 33, 12, 4, "percent", [{"color": "green", "value": None}, {"color": "orange", "value": 80}, {"color": "red", "value": 90}], "{{site}}")
table("Server B: age of the newest backup (alert above 26 h)", 'lsevin_backup_age_seconds{site!="A"}', 0, 33, 12, 8, "s",
      [{"color": "green", "value": None}, {"color": "orange", "value": 93600}, {"color": "red", "value": 129600}], "{{kind}}")
table("Health checks (1 = OK)", f"lsevin_check{{{S}}}", 12, 25, 12, 8, "none",
      [{"color": "red", "value": None}, {"color": "green", "value": 1}], "{{check}}")

dash = {"uid": "lsevin-site-a", "title": "Server A (Iran) health / سلامت سرور A", "tags": ["lsevin", "site-a"], "timezone": "browser",
        "schemaVersion": 41, "version": 1, "refresh": "30s", "time": {"from": "now-6h", "to": "now"}, "panels": panels,
        "templating": {"list": []}, "annotations": {"list": []},
        "description": "Metrics are pushed from server A's Prometheus to this one (remote write); filter site=\"A\"."}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboards", "lsevin-site-a.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump(dash, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote", out)
