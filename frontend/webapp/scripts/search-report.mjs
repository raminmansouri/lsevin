#!/usr/bin/env node
/**
 * Operator report for the unified search (read-only):
 *   index health, queue backlog, what visitors search, what finds nothing, which landing pages
 *   would be published.
 *
 *   pnpm search:report
 */
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Environment may already be set (server, CI).
}

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
const MODEL = process.env.EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";
const sql = postgres(DATABASE_URL, {
  max: 1,
  onnotice: () => {},
  prepare: false,
});

const section = (title) => console.log(`\n== ${title} ==`);

try {
  section("Index (documents per type)");
  console.table(
    await sql`
      select s.doc_type, s.enabled, coalesce(d.documents, 0)::int as documents,
             coalesce(d.embedded, 0)::int as embedded, coalesce(d.wrong_model, 0)::int as "other model",
             to_char(s.last_full_sync, 'YYYY-MM-DD HH24:MI') as "last full sync"
        from unified_search.sources s
        left join (select doc_type, count(*) as documents, count(embedding) as embedded,
                          count(*) filter (where embedding is not null and embedding_model is distinct from ${MODEL}) as wrong_model
                     from unified_search.documents group by doc_type) d on d.doc_type = s.doc_type
       order by s.doc_type`
  );

  section("Change queue");
  const [queue] = await sql`
    select count(*)::int as waiting, coalesce(extract(epoch from now() - min(enqueued_at))::int, 0) as oldest_seconds
      from unified_search.outbox`;
  console.log(queue);
  if (queue.oldest_seconds > 900)
    console.log(
      "!! the oldest change has waited more than 15 minutes: is the indexer running?"
    );

  section("Searches in the last 30 days");
  const [totals] = await sql`
    select count(*)::int as searches, count(*) filter (where results = 0)::int as no_result,
           round(avg(took_ms))::int as avg_ms, percentile_cont(0.95) within group (order by took_ms)::int as p95_ms,
           count(*) filter (where not used_vector)::int as without_vector
      from unified_search.query_log where created_at > now() - interval '30 days'`;
  console.log(totals);
  console.log("\nMost frequent:");
  console.table(
    await sql`select normalized as query, times, avg_results, avg_ms from unified_search.v_top_queries limit 20`
  );
  console.log("Found nothing (what to add or to teach as a synonym):");
  console.table(
    await sql`select normalized as query, times, to_char(last_seen, 'YYYY-MM-DD') as "last seen" from unified_search.v_zero_result_queries limit 20`
  );

  section("Landing pages that would be published (SEARCH_LANDING_PAGES=1)");
  const pages = await sql`
    select service_slug, city_slug, providers, min_price_toman, avg_rating from unified_search.landing_pages
     order by providers desc, service_slug limit 30`;
  const [{ total }] =
    await sql`select count(*)::int as total from unified_search.landing_pages`;
  console.log(`${total} page(s)`);
  if (pages.length) console.table(pages);
} finally {
  await sql.end({ timeout: 5 });
}
