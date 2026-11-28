#!/usr/bin/env node
/**
 * Load test for the unified search: seed a large synthetic catalogue, then time real queries.
 *
 *   node scripts/search-benchmark.mjs --seed 100000                 # insert synthetic documents (ids "bench-*")
 *   node scripts/search-benchmark.mjs --run http://127.0.0.1:3056 --queries 400 --concurrency 8
 *   node scripts/search-benchmark.mjs --clean                       # remove the synthetic documents
 *
 * Seeding writes to DATABASE_URL and REFUSES any database whose name does not end in _it or
 * _test. The run phase only calls GET /api/search on a running app (so it measures the whole
 * path: parse, embedding, keyword + vector + place queries, fusion, JSON).
 */
import postgres from "postgres";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const WORDS = ["کاشت", "مو", "بینی", "لیزر", "فیلر", "بوتاکس", "ایمپلنت", "دندان", "چشم", "لاغری", "ارتوپدی", "پوست", "زیبایی", "جراحی", "تور", "هتل", "ویلا", "آپارتمان", "یزد", "شیراز", "اصفهان", "مشهد", "ترمیم", "درمان", "مشاوره", "کلینیک", "بیمارستان", "اقامت", "رستوران", "ماساژ"];
const CITIES = [
  ["tehran", 35.6892, 51.389], ["mashhad", 36.2605, 59.6168], ["shiraz", 29.5918, 52.5837], ["isfahan", 32.6546, 51.668],
  ["tabriz", 38.08, 46.2919], ["karaj", 35.8327, 50.9915], ["yazd", 31.8974, 54.3569], ["kish", 26.5579, 53.98],
  ["rasht", 37.2808, 49.5832], ["ahvaz", 31.3183, 48.6706], ["kashan", 33.985, 51.41], ["qom", 34.6416, 50.8746],
  ["istanbul", 41.0082, 28.9784], ["dubai", 25.2048, 55.2708], ["muscat", 23.588, 58.3829],
];

async function seed(total) {
  const sql = postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} });
  const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);
  if (!/_(it|test)$/.test(dbName)) throw new Error(`refusing to seed "${dbName}": only *_it / *_test databases`);
  await sql`delete from unified_search.documents where source_id like 'bench-%'`;
  const types = [["offer", 0.6], ["provider", 0.05], ["tour", 0.15], ["stay", 0.1], ["article", 0.1]];
  const started = Date.now();
  let done = 0;
  for (const [type, share] of types) {
    const count = Math.round(total * share);
    for (let from = 0; from < count; from += 5000) {
      const batch = Math.min(5000, count - from);
      await sql`
        insert into unified_search.documents
          (doc_type, source_id, title, subtitle, url, city, lat, lng, price_toman, rating, review_count, quality,
           service_key, provider_id, search_text, content_hash, embedding, embedding_model)
        select ${type}, 'bench-' || ${type} || '-' || g,
               jsonb_build_object('fa-IR', w.a || ' ' || w.b || ' ' || g),
               jsonb_build_object('fa-IR', 'کلینیک ' || (g % 5000)),
               '/bench/' || g, c.city, c.lat + (random() - 0.5) * 0.25, c.lng + (random() - 0.5) * 0.25,
               (random() * 90000000)::int, round((3 + random() * 2)::numeric, 1), (random() * 200)::int, random()::real,
               'svc-' || (g % 60), 'prov-' || (g % 5000),
               w.a || ' ' || w.b || ' ' || c.city || ' ' || g, md5(${type} || g::text),
               -- references g so the subquery runs once per row (an uncorrelated one would give every row the same vector)
               (select ('[' || string_agg((random() - 0.5)::text, ',') || ']')::halfvec from generate_series(1, 384) k where k > g * 0),
               'bench'
          from generate_series(${from + 1}::int, ${from + batch}::int) g
          cross join lateral (select (${sql.json(WORDS)}::jsonb ->> (floor(random() * ${WORDS.length}))::int) as a,
                                     (${sql.json(WORDS)}::jsonb ->> (floor(random() * ${WORDS.length}))::int) as b) w
          cross join lateral (select * from jsonb_to_recordset(${sql.json(CITIES.map(([city, lat, lng]) => ({ city, lat, lng })))}::jsonb) as x(city text, lat float8, lng float8)
                               order by random() limit 1) c`;
      done += batch;
      process.stdout.write(`\rseeded ${done}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    }
  }
  await sql`analyze unified_search.documents`;
  const [{ n, size }] = await sql`select count(*)::int as n, pg_size_pretty((select sum(pg_total_relation_size(i.inhrelid)) from pg_inherits i where i.inhparent = 'unified_search.documents'::regclass)) as size from unified_search.documents`;
  console.log(`\ndocuments: ${n}, table+indexes: ${size}`);
  await sql.end();
}

async function clean() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const gone = await sql`delete from unified_search.documents where source_id like 'bench-%' returning 1`;
  console.log(`removed ${gone.length} synthetic documents`);
  await sql.end();
}

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

async function run(base, queries, concurrency) {
  const service = ["کاشت مو", "جراحی بینی", "لیزر", "فیلر", "ایمپلنت دندان", "تور", "هتل", "ارتوپدی", "مشاوره پوست", "ماساژ"];
  const places = ["", " تهران", " قیطریه تهران", " شیراز", " اصفهان", " الهیه", " زعفرانیه تهران", " مشهد"];
  const variants = ["", " ارزان", " بهترین", " دکتر"];
  const list = [];
  for (let i = 0; i < queries; i += 1) {
    // Every query is distinct, so each one pays for a real embedding (no cache hits).
    list.push(`${service[i % service.length]}${places[(i * 7) % places.length]}${variants[(i * 3) % variants.length]} ${Math.floor(i / 40) || ""}`.trim());
  }
  const timings = [];
  let failures = 0;
  let noVector = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < list.length) {
      const q = list[cursor++];
      const started = performance.now();
      try {
        const response = await fetch(`${base}/api/search?q=${encodeURIComponent(q)}&locale=fa&limit=12`, { signal: AbortSignal.timeout(30_000) });
        const json = await response.json();
        if (!response.ok) failures += 1;
        else if (!json.usedVector) noVector += 1;
      } catch {
        failures += 1;
      }
      timings.push(performance.now() - started);
    }
  };
  // Warm-up: compile routes, fill connection pool and plan caches.
  for (const q of ["کاشت مو", "تور یزد", "جراحی بینی تهران"]) await fetch(`${base}/api/search?q=${encodeURIComponent(q)}`).catch(() => {});
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const seconds = (performance.now() - started) / 1000;
  timings.sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      queries: list.length, concurrency, failures, withoutVector: noVector, seconds: Number(seconds.toFixed(1)),
      qps: Number((list.length / seconds).toFixed(1)),
      ms: { p50: Math.round(percentile(timings, 50)), p95: Math.round(percentile(timings, 95)), p99: Math.round(percentile(timings, 99)), max: Math.round(timings.at(-1)) },
    }, null, 2),
  );
}

const main = async () => {
  if (args.includes("--seed")) return seed(Number(option("seed", 100000)));
  if (args.includes("--clean")) return clean();
  if (args.includes("--run")) return run(option("run"), Number(option("queries", 300)), Number(option("concurrency", 8)));
  console.log("usage: --seed N | --run <base-url> [--queries N] [--concurrency N] | --clean");
};
main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 100));
