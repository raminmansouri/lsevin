import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function percentile(values, p) {
  if (!values.length) throw new Error("At least one sample is required.");
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
}

export function summarize(samples, budgetMs) {
  const times = samples.filter((x) => x.status === 200).map((x) => x.ttfbMs);
  return {
    requests: samples.length,
    successful: times.length,
    p50Ms: times.length ? percentile(times, 0.5) : null,
    p95Ms: times.length ? percentile(times, 0.95) : null,
    budgetMs,
    pass:
      times.length === samples.length &&
      times.length > 0 &&
      percentile(times, 0.95) < budgetMs,
  };
}

export function run(args = process.argv.slice(2)) {
  const value = (name, fallback) =>
    args
      .find((x) => x.startsWith(`--${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") ?? fallback;
  const origin = new URL(value("origin", "https://lsevincare.com"));
  if (
    !/^https?:$/.test(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("Supply an HTTP(S) origin without credentials/path/query.");
  const count = Number(value("samples", "10"));
  const budgetMs = Number(value("budget-ms", "30"));
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 100 ||
    !Number.isFinite(budgetMs) ||
    budgetMs <= 0
  )
    throw new Error("Invalid sample count or budget.");
  const paths = [
    "/fa/n/app/mobile/home",
    "/fa/n/app/mobile/categories",
    "/fa/n/app/mobile/explore",
    "/fa/n/app/mobile/search",
    "/sitemap.xml",
    "/robots.txt",
  ];
  for (const [flag, route] of [
    ["provider", "provider"],
    ["service", "service"],
    ["staff", "specialist"],
  ]) {
    const id = value(`${flag}-id`, "");
    if (id) {
      if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error(`Invalid ${flag} id`);
      paths.push(`/fa/n/app/mobile/${route}/${id}`);
    }
  }
  const report = {
    measuredAt: new Date().toISOString(),
    origin: origin.origin,
    method:
      "curl GET; new connection per sample; DNS/TCP/TLS included; no redirects followed",
    routes: [],
  };
  for (const path of paths) {
    const samples = [];
    for (let i = 0; i < count; i++) {
      const r = spawnSync(
        "curl",
        [
          "--silent",
          "--show-error",
          "--max-time",
          "20",
          "--output",
          process.platform === "win32" ? "NUL" : "/dev/null",
          "--write-out",
          "%{http_code} %{time_starttransfer} %{time_namelookup} %{time_connect} %{time_appconnect} %{time_total}",
          new URL(path, origin).href,
        ],
        { encoding: "utf8", timeout: 25_000 }
      );
      const [status, ttfb, dns, tcp, tls, total] =
        r.stdout?.trim().split(/\s+/).map(Number) ?? [];
      samples.push({
        status: r.status === 0 ? status : 0,
        ttfbMs: Number.isFinite(ttfb) ? ttfb * 1000 : null,
        dnsMs: dns * 1000,
        tcpMs: tcp * 1000,
        tlsMs: tls * 1000,
        totalMs: total * 1000,
        curlExit: r.status,
      });
    }
    const entry = { path, ...summarize(samples, budgetMs), samples };
    report.routes.push(entry);
    console.error(
      `${path}: ${entry.successful}/${count} HTTP 200; p95=${entry.p95Ms} ms; budget=${budgetMs} ms; ${entry.pass ? "PASS" : "FAIL"}`
    );
  }
  const output = value("out", "");
  if (output) writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  else console.log(JSON.stringify(report, null, 2));
  if (args.includes("--enforce") && report.routes.some((x) => !x.pass))
    process.exitCode = 1;
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  run();
