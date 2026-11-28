#!/usr/bin/env node
/**
 * Keeps the unified search index (unified_search.documents) in step with the catalogue.
 *
 *   pnpm search:index                  process the outbox once (changes since the last run)
 *   pnpm search:index --loop 30        keep processing every 30 s (worker mode)
 *   pnpm search:index --full           re-read every source (nightly reconcile / first build)
 *   pnpm search:index --full --type tour    one data type only
 *   pnpm search:index --no-embed       keyword/geo index only (embedding service not needed)
 *
 * Only new or changed documents are embedded (content hash + unified_search.embedding_cache), and
 * documents whose source is gone, unpublished or inactive are deleted.
 *
 * Environment: DATABASE_URL, EMBEDDING_URL (default http://127.0.0.1:8089),
 * EMBEDDING_API_KEY (optional), EMBEDDING_MODEL.
 */
import postgres from "postgres";

import { adapters } from "./search/adapters.mjs";
import { embedPassages, MODEL } from "./search/embedding.mjs";
import { chunk, embeddingText, fold, sha256 } from "./search/lib.mjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Environment may already be set (server, CI).
}

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  max: 4,
  onnotice: () => {},
  prepare: false,
}); // prepare: false keeps it safe behind a transaction-pooling PgBouncer
const FETCH_BATCH = 200;
const WITH_EMBEDDINGS = !flag("no-embed");
const onlyType = option("type");

function documentHash(doc) {
  return sha256(
    JSON.stringify([
      doc.title,
      doc.subtitle,
      doc.url,
      doc.image,
      doc.city,
      doc.country,
      doc.lat,
      doc.lng,
      doc.priceToman,
      doc.rating,
      doc.reviewCount,
      doc.quality,
      doc.serviceKey,
      doc.providerId,
      doc.attrs,
      doc.text,
      embeddingText(doc),
    ])
  );
}

async function upsertBatch(docType, docs) {
  if (!docs.length) return { written: 0, embedded: 0 };

  const ids = docs.map((doc) => doc.sourceId);
  const existing = await sql`
    select source_id, content_hash, (embedding is not null and embedding_model = ${MODEL}) as has_embedding
      from unified_search.documents where doc_type = ${docType} and source_id = any(${ids})`;
  const known = new Map(existing.map((row) => [row.source_id, row]));

  const prepared = docs.map((doc) => ({ doc, hash: documentHash(doc) }));
  const changed = prepared.filter(({ doc, hash }) => {
    const row = known.get(doc.sourceId);
    return (
      !row ||
      row.content_hash !== hash ||
      (WITH_EMBEDDINGS && !row.has_embedding)
    );
  });
  if (!changed.length) return { written: 0, embedded: 0 };

  let vectors = new Map();
  if (WITH_EMBEDDINGS)
    vectors = await embedPassages(
      sql,
      changed.map(({ doc }) => embeddingText(doc))
    );

  await sql.begin(async (tx) => {
    for (const { doc, hash } of changed) {
      const vector = WITH_EMBEDDINGS
        ? (vectors.get(embeddingText(doc)) ?? null)
        : null;
      const keepOld = !WITH_EMBEDDINGS; // keyword-only run must not wipe an existing embedding
      await tx`
        insert into unified_search.documents
          (doc_type, source_id, title, subtitle, url, image, city, country, lat, lng, price_toman, rating,
           review_count, quality, service_key, provider_id, attrs, search_text, is_public, content_hash,
           embedding, embedding_model, indexed_at)
        values
          (${docType}, ${doc.sourceId}, ${tx.json(doc.title)}, ${tx.json(doc.subtitle)}, ${doc.url}, ${doc.image},
           ${doc.city}, ${doc.country}, ${doc.lat}, ${doc.lng}, ${doc.priceToman}, ${doc.rating}, ${doc.reviewCount},
           ${doc.quality}, ${doc.serviceKey}, ${doc.providerId}, ${tx.json(doc.attrs)}, ${doc.text}, true, ${hash},
           ${vector}::halfvec, ${vector ? MODEL : null}, now())
        on conflict (doc_type, source_id) do update set
          title = excluded.title, subtitle = excluded.subtitle, url = excluded.url, image = excluded.image,
          city = excluded.city, country = excluded.country, lat = excluded.lat, lng = excluded.lng,
          price_toman = excluded.price_toman, rating = excluded.rating, review_count = excluded.review_count,
          quality = excluded.quality, service_key = excluded.service_key, provider_id = excluded.provider_id,
          attrs = excluded.attrs, search_text = excluded.search_text, is_public = true,
          content_hash = excluded.content_hash,
          embedding = ${keepOld ? tx`unified_search.documents.embedding` : tx`excluded.embedding`},
          embedding_model = ${keepOld ? tx`unified_search.documents.embedding_model` : tx`excluded.embedding_model`},
          indexed_at = now()`;
    }
  });
  return {
    written: changed.length,
    embedded: WITH_EMBEDDINGS
      ? new Set(changed.map(({ doc }) => embeddingText(doc))).size
      : 0,
  };
}

/** Suggestions for autocomplete: every title, folded. */
async function upsertSuggestions(docType, docs, seen) {
  // One row per term (a single INSERT cannot touch the same key twice); keep the best weight.
  const byTerm = new Map();
  for (const doc of docs) {
    for (const display of new Set(Object.values(doc.title))) {
      const term = fold(display);
      if (term.length < 2 || term.length > 80) continue;
      seen?.add(term);
      const previous = byTerm.get(term);
      if (!previous || previous.weight < doc.quality) {
        byTerm.set(term, {
          term,
          display: String(display).slice(0, 120),
          doc_type: docType,
          weight: doc.quality,
        });
      }
    }
  }
  for (const part of chunk([...byTerm.values()], 500)) {
    await sql`
      insert into unified_search.suggestions ${sql(part, "term", "display", "doc_type", "weight")}
      on conflict (term) do update set
        weight = greatest(unified_search.suggestions.weight, excluded.weight),
        display = excluded.display, doc_type = excluded.doc_type`;
  }
}

async function removeDocuments(docType, ids) {
  if (!ids.length) return 0;
  const gone =
    await sql`delete from unified_search.documents where doc_type = ${docType} and source_id = any(${ids}) returning 1`;
  return gone.length;
}

const MEDIA_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Some image columns hold a media-library id instead of a path: swap in the file URL. */
async function resolveImages(docs) {
  const wanted = [
    ...new Set(
      docs
        .map((doc) => doc.image)
        .filter((value) => value && MEDIA_ID.test(value))
    ),
  ];
  if (!wanted.length) return;
  const rows =
    await sql`select id::text as id, file_url from media.media_library where id = any(${wanted}::uuid[])`;
  const byId = new Map(rows.map((row) => [row.id.toLowerCase(), row.file_url]));
  for (const doc of docs) {
    if (doc.image && MEDIA_ID.test(doc.image))
      doc.image = byId.get(doc.image.toLowerCase()) ?? null;
  }
}

/** Read the given ids of one type, write what is public, delete what is not. */
async function syncIds(docType, ids, seenTerms) {
  const adapter = adapters[docType];
  const totals = { written: 0, embedded: 0, removed: 0 };
  for (const part of chunk(ids, FETCH_BATCH)) {
    const docs = await adapter.fetch(sql, part);
    await resolveImages(docs);
    const found = new Set(docs.map((doc) => doc.sourceId));
    const result = await upsertBatch(docType, docs);
    await upsertSuggestions(docType, docs, seenTerms);
    totals.written += result.written;
    totals.embedded += result.embedded;
    totals.removed += await removeDocuments(
      docType,
      part.filter((id) => !found.has(id))
    );
  }
  return totals;
}

async function enabledTypes() {
  const rows =
    await sql`select doc_type from unified_search.sources where enabled`;
  return rows
    .map((row) => row.doc_type)
    .filter((type) => adapters[type] && (!onlyType || type === onlyType));
}

async function runOutbox() {
  const claimed =
    await sql`select source_type, source_id, enqueued_at::text as enqueued_at from unified_search.outbox order by unified_search.outbox.enqueued_at limit 2000`;
  if (!claimed.length) return 0;
  const enabled = new Set(await enabledTypes());
  const byType = new Map();
  for (const row of claimed) {
    if (!enabled.has(row.source_type)) continue;
    if (!byType.has(row.source_type)) byType.set(row.source_type, []);
    byType.get(row.source_type).push(row.source_id);
  }
  for (const [type, ids] of byType) {
    const totals = await syncIds(type, ids, null);
    console.log(
      `outbox ${type}: ${ids.length} changed -> ${totals.written} written, ${totals.removed} removed`
    );
  }
  // Delete exactly what was claimed: a change that arrived mid-run has a newer enqueued_at and stays queued.
  // The timestamps travel as text: JS dates (and the driver) would cut the microseconds and the match would never hold.
  await sql`
    delete from unified_search.outbox o using (
      select * from unnest(${claimed.map((r) => r.source_type)}::text[], ${claimed.map((r) => r.source_id)}::text[],
                           ${claimed.map((r) => r.enqueued_at)}::text[]) as c(t, i, at)
    ) c where o.source_type = c.t and o.source_id = c.i and o.enqueued_at <= c.at::timestamptz`;
  return claimed.length;
}

async function runFull() {
  const started = Date.now();
  const seenTerms = new Set();
  for (const type of await enabledTypes()) {
    const ids = await adapters[type].listIds(sql);
    const totals = await syncIds(type, ids, seenTerms);
    // Anything indexed that the source no longer lists is stale.
    const indexed =
      await sql`select source_id from unified_search.documents where doc_type = ${type}`;
    const live = new Set(ids);
    const stale = indexed
      .map((row) => row.source_id)
      .filter((id) => !live.has(id));
    totals.removed += await removeDocuments(type, stale);
    await sql`update unified_search.sources set last_full_sync = now() where doc_type = ${type}`;
    console.log(
      `full ${type}: ${ids.length} in source, ${totals.written} written, ${totals.embedded} embedded, ${totals.removed} removed`
    );
  }
  if (!onlyType && seenTerms.size) {
    const stale = await sql`
      delete from unified_search.suggestions where term <> all(${[...seenTerms]}) returning 1`;
    console.log(
      `suggestions: ${seenTerms.size} kept, ${stale.length} stale removed`
    );
  }
  console.log(
    `full run finished in ${((Date.now() - started) / 1000).toFixed(1)}s (${WITH_EMBEDDINGS ? MODEL : "no embeddings"})`
  );
}

async function main() {
  const loop = Number(option("loop") ?? 0);
  if (flag("full")) {
    await runFull();
    if (!loop) return;
  }
  do {
    try {
      await runOutbox();
    } catch (error) {
      console.error("outbox run failed:", error?.message ?? error);
      if (!loop) throw error;
    }
    if (loop) await new Promise((resolve) => setTimeout(resolve, loop * 1000));
  } while (loop);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
