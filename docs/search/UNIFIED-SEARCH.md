# Unified search

One search over everything a visitor can look for: clinics, treatments offered by a clinic, tours, stays and
articles. "کاشت مو قیطریه تهران" is read as *treatment* (hair transplant) + *neighborhood* (Gheytarieh) +
*city* (Tehran) and answered with the closest matching offers first.

## How a query is answered

```
text ─► fold (Persian/Arabic letters, digits, ZWNJ)
     ─► parse: place (neighborhood/city), synonyms, filler words  ─► service words
     ─► keyword (pg_trgm + full text) ┐
     ─► meaning (pgvector, e5-small)  ├─► rank fusion ─► + quality, distance, title match ─► results
     ─► place (distance to the point) ┘
```

* **Keyword**: `unified_search.documents.tsv` (full text, `simple` config) and a trigram index on `search_text`
  (typo tolerant).
* **Meaning**: 384-dimension embeddings from the self-hosted `multilingual-e5-small` model, `halfvec` + HNSW.
  Scores of this model are compressed (about 0.70–0.93), so rank positions are fused, never raw scores.
* **Place**: `unified_search.places` is a small gazetteer (cities + Tehran neighborhoods). A neighborhood becomes a
  point and results are ordered by distance to it. **The neighborhood centres are approximate (about 1 km)**;
  replace them with OpenStreetMap data when available.
* **Confidence**: a result is "confident" if its words matched or its similarity is at least 0.86
  (`SEARCH_VECTOR_CONFIDENT_SIM`). The rest are shown as "the closest options we have".
* **Degradation**: if the embedding service does not answer within 400 ms (`SEARCH_EMBED_TIMEOUT_MS`), search
  continues with keywords and place only (`usedVector: false`); after a failure the service is skipped for 10 s.

## Data model (schema `unified_search`)

| Object | Purpose |
|---|---|
| `documents` | One row per searchable item, list-partitioned by `doc_type` (+ default partition) |
| `sources` | Registry of data types and whether they are indexed |
| `outbox` | "This item changed" queue, filled by row triggers (never fail the original write) |
| `embedding_cache` | `(model, hash) -> vector`: unchanged text is never embedded twice; also caches query vectors |
| `places`, `synonyms` | Gazetteer and operator-editable synonyms (`هیر ترانسپلنت` → `کاشت مو`) |
| `suggestions` | Autocomplete terms (prefix + trigram, no embedding call) |
| `query_log` | What visitors searched and how many results; no identity (salted, day-scoped session hash) |
| `landing_pages` (view) | Treatment × city combinations with ≥ 3 distinct public providers |

The schema is **not** `search`: production already has a `search` schema (the replicated mobile search history).
These tables are derived data and are deliberately **not registered with SymmetricDS**; each site builds its own
index. Replication (and the nightly reconcile) keeps site A consistent.

## Adding a new kind of data

1. Add an adapter in `frontend/webapp/scripts/search/adapters.mjs` (`listIds` + `fetch`, returning documents) and
   register it in `adapters`.
2. `insert into unified_search.sources (doc_type, description) values ('…', '…')`.
3. Optionally a trigger calling `unified_search.enqueue('<doc_type>', '<id>')` (see migration 0127). Without one the
   nightly `--full` run still picks the data up.
4. If the type has its own page, add its label to `src/features/search/ui/strings.ts` and `DOC_TYPES` in
   `src/features/search/types.ts`.

No schema change, no API change. A new `doc_type` lands in the default partition; add a dedicated partition in a
migration when the type grows large.

## Landing pages (SEO)

`/<locale>/find/<treatment>/<city>` lists real providers with prices, with `BreadcrumbList` + `ItemList` JSON-LD,
canonical, hreflang (Persian and English only) and sitemap entries. They are **off** until
`SEARCH_LANDING_PAGES=1`. A combination is served only if `unified_search.landing_pages` contains it; anything
else is a real 404. Result pages (`/search`) are `noindex`.

Review before enabling: `select * from unified_search.landing_pages;` is exactly the list of pages that would exist.

## Operating it

```bash
pnpm search:rebuild          # re-read every source (first build / after a model change)
pnpm search:index            # process the change queue once
pnpm search:worker           # keep processing every 30 s (what the Deployment runs)
pnpm search:report           # top queries, queries with no result, pages that would be published
pnpm assistant:index:local   # assistant knowledge base with the local model
node scripts/search-benchmark.mjs --seed 100000   # load test (only *_it / *_test databases)
```

Environment (web app and workers): `EMBEDDING_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`,
`SEARCH_EMBED_TIMEOUT_MS`, `SEARCH_VECTOR_MIN_SIM`, `SEARCH_VECTOR_CONFIDENT_SIM`, `SEARCH_LOG_SALT`,
`SEARCH_RATE_LIMIT_PER_MIN` (60), `SEARCH_SUGGEST_RATE_LIMIT_PER_MIN` (180), `SEARCH_LANDING_SITEMAP_REVALIDATE` (3600 s), `SEARCH_LANDING_PAGES`, `ASSISTANT_EMBEDDINGS` (`openai` default | `local`), `ASSISTANT_LOCAL_MIN_SCORE`.

## Changing the embedding model

Vectors from different models cannot be compared. Every document stores `embedding_model`; the indexer only
treats a document as done when its stored model equals the configured one. To change model: deploy the new
service, set `EMBEDDING_MODEL`, run `pnpm search:rebuild` (queries embed with the new model only after the
rebuild finishes: run it first on a copy or during a quiet hour), and size the `halfvec(n)` columns in a new
migration if the dimension differs.

## Known limits

* Neighborhood coordinates are approximate and only Tehran is covered.
* Similarity thresholds were measured on small sets (assistant passages: relevant ≥ 0.846, unrelated ≤ 0.798).
  Re-measure after indexing the full production content.
* Short transliterations ("هیر ترانسپلنت") are weak for the model: that is what `synonyms` is for.
* Result pages are rendered per request (never cached): the hot path is the embedding cache + three indexed queries.
* Performance numbers (100k documents, dev rig) are in deployments/search/README.md; production hardware was not measured.
* int8 quantization makes an embedding depend very slightly on batch padding (cosine >= 0.99 between alone/batched).
