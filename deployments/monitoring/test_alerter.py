"""Tests for lsevin-alerter's decision logic (no network, no Prometheus, no Telegram). Run:  python test_alerter.py"""
import importlib.machinery, importlib.util, os, sys, tempfile, time, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
loader = importlib.machinery.SourceFileLoader("alerter", os.path.join(HERE, "lsevin-alerter"))
spec = importlib.util.spec_from_loader("alerter", loader)
A = importlib.util.module_from_spec(spec)
loader.exec_module(A)
REAL_HTTP_CHECK = A.http_check          # Env() replaces A.http_check with a fake; keep the real one for the HTTP tests


class Env:
    """a controllable world: the rows Prometheus returns, whether Prometheus/Telegram work, and the clock"""
    def __init__(self):
        self.t = 1_000_000.0
        self.rows = {}              # expr -> [(labels, value)]
        self.prom_up = True
        self.telegram_up = True
        self.sent = []
        self.http = {}              # check name -> (ok, detail)
        A.now = lambda: self.t
        A.prom_url = lambda: "http://prom"
        A.muted = lambda: set()
        def pq(base, expr):
            if not self.prom_up:
                raise OSError("down")
            return self.rows.get(expr, [])
        A.prom_query = pq
        A.http_check = lambda c: self.http.get(c["name"], (True, "ok"))
        def tg(text):
            if not self.telegram_up:
                return False
            self.sent.append(text)
            return True
        A.telegram_send = tg

    def tick(self, cfg, st, seconds=60):
        self.t += seconds
        A.step(cfg, st, True)
        A.flush_outbox(st)


CFG = {"daily_summary_utc": "23:59", "http_checks": [{"name": "site", "url": "http://x", "for": 120, "severity": "critical"}],
       "rules": [{"name": "disk_high", "expr": "E1", "for": 120, "severity": "warning", "summary": "disk {value}% on {site}"},
                 {"name": "sync_error", "expr": "E2", "for": 0, "severity": "critical", "summary": "{direction} batches stuck: {value}"}]}


def fresh():
    st = {"alerts": {}, "summary_day": "2999-01-01"}
    return Env(), st


class T(unittest.TestCase):
    def test_pending_then_fires_once_then_resolves(self):
        e, st = fresh()
        e.rows["E1"] = [({"site": "A"}, 83.0)]
        e.tick(CFG, st); self.assertEqual(e.sent, [])                      # pending: "for" not reached
        e.tick(CFG, st); self.assertEqual(e.sent, [])
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1)                  # fires after 120 s
        self.assertIn("disk_high", e.sent[0]); self.assertIn("83", e.sent[0]); self.assertIn("[A]", e.sent[0])
        for _ in range(10): e.tick(CFG, st)
        self.assertEqual(len(e.sent), 1, "no repeat while it stays firing")  # no spam
        e.rows["E1"] = []
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1, "one clean evaluation is not enough (flapping)")
        e.tick(CFG, st); self.assertEqual(len(e.sent), 2); self.assertIn("resolved", e.sent[1])

    def test_flap_does_not_resolve(self):
        e, st = fresh()
        e.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1)
        e.rows["E2"] = []; e.tick(CFG, st)
        e.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]; e.tick(CFG, st)
        e.rows["E2"] = []; e.tick(CFG, st); e.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]; e.tick(CFG, st)
        self.assertEqual(len(e.sent), 1, "flapping alert neither resolves nor re-fires")

    def test_short_blip_never_notifies(self):
        e, st = fresh()
        e.rows["E1"] = [({"site": "B"}, 90.0)]; e.tick(CFG, st)
        e.rows["E1"] = []; e.tick(CFG, st); e.tick(CFG, st)
        self.assertEqual(e.sent, [])

    def test_critical_reminder_after_two_hours(self):
        e, st = fresh()
        e.rows["E2"] = [({"direction": "outgoing", "site": "A"}, 2.0)]
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1)
        e.tick(CFG, st, 3600); self.assertEqual(len(e.sent), 1)
        e.tick(CFG, st, 3700); self.assertEqual(len(e.sent), 2); self.assertIn("still open", e.sent[1])

    def test_http_check_failure_alert(self):
        e, st = fresh()
        e.http["site"] = (False, "HTTP 502")
        e.tick(CFG, st); e.tick(CFG, st); self.assertEqual(e.sent, [])
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1); self.assertIn("HTTP 502", e.sent[0])

    def test_prometheus_down_is_reported_and_keeps_alerts(self):
        e, st = fresh()
        e.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1)
        e.prom_up = False
        for _ in range(3): e.tick(CFG, st)
        self.assertTrue(any("MONITORING BROKEN" in m for m in e.sent))
        self.assertFalse(any("resolved" in m for m in e.sent), "blind monitoring must not report 'resolved'")
        e.prom_up = True; e.tick(CFG, st)
        self.assertTrue(any("answers again" in m for m in e.sent))

    def test_undelivered_messages_are_retried(self):
        e, st = fresh()
        e.telegram_up = False
        e.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]
        e.tick(CFG, st); self.assertEqual(e.sent, []); self.assertEqual(len(st["outbox"]), 1)
        e.telegram_up = True; e.tick(CFG, st)
        self.assertEqual(len(e.sent), 1); self.assertTrue(e.sent[0].startswith("(delayed)")); self.assertEqual(st["outbox"], [])

    def test_mute_suppresses_a_rule(self):
        e, st = fresh()
        A.muted = lambda: {"sync_error"}
        e.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]
        e.tick(CFG, st); self.assertEqual(e.sent, [])

    def test_daily_summary_all_ok_and_with_open_alert(self):
        e, st = fresh(); st["summary_day"] = "2000-01-01"
        cfg = dict(CFG, daily_summary_utc="00:00")
        e.tick(cfg, st); self.assertEqual(len(e.sent), 1); self.assertIn("everything OK", e.sent[0])
        e.tick(cfg, st); self.assertEqual(len(e.sent), 1, "only once per day")
        e2, st2 = fresh(); st2["summary_day"] = "2000-01-01"
        e2.rows["E2"] = [({"direction": "incoming", "site": "A"}, 1.0)]
        e2.tick(cfg, st2)
        self.assertTrue(any("Daily summary" in m and "open alert" in m for m in e2.sent))

    def test_rule_with_missing_label_does_not_crash(self):
        e, st = fresh()
        e.rows["E2"] = [({}, 1.0)]
        e.tick(CFG, st); self.assertEqual(len(e.sent), 1); self.assertIn("?", e.sent[0])


class HttpCheck(unittest.TestCase):
    """the real http_check against a local server: one slow answer is retried before it counts as 'slow'"""
    def serve(self, delays):
        import http.server, threading
        hits = []
        class H(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                n = len(hits); hits.append(1)
                time.sleep(delays[min(n, len(delays) - 1)])
                self.send_response(200); self.end_headers(); self.wfile.write(b"ok")
            def log_message(self, *a): pass
        srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        self.addCleanup(srv.shutdown)
        return "http://127.0.0.1:%d/" % srv.server_address[1], hits

    def test_single_slow_answer_is_not_a_failure(self):
        url, hits = self.serve([1.3, 0])
        ok, detail = REAL_HTTP_CHECK({"url": url, "slow_seconds": 1})
        self.assertTrue(ok, detail); self.assertEqual(len(hits), 2)

    def test_persistently_slow_is_a_failure(self):
        url, hits = self.serve([1.3, 1.3])
        ok, detail = REAL_HTTP_CHECK({"url": url, "slow_seconds": 1})
        self.assertFalse(ok); self.assertIn("slow", detail)

    def test_fast_answer_is_checked_once(self):
        url, hits = self.serve([0])
        ok, _ = REAL_HTTP_CHECK({"url": url, "slow_seconds": 1})
        self.assertTrue(ok); self.assertEqual(len(hits), 1)



if __name__ == "__main__":
    unittest.main(verbosity=2)
