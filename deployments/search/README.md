# Unified search: deployment

Architecture and data model: [`docs/search/UNIFIED-SEARCH.md`](../../docs/search/UNIFIED-SEARCH.md).

Nothing here is applied by a pipeline. A human applies it, per site, in this order.

## What gets deployed

| Piece | Image | Notes |
|---|---|---|
| Migrations `0127`, `0128` | `Dockerfile.migrations` (existing) | New schema `unified_search`, triggers on 6 catalogue tables, `ai.knowledge_chunks` gains `embedding_local` and its OpenAI column becomes nullable |
| Embedding service | `frontend/embedding-service/Dockerfile` | ~0.5 GB RAM, model baked into the image (no internet at run time) |
| Index worker + nightly reconcile | `frontend/webapp/Dockerfile.search-indexer` | tiny (node + `postgres`) |
| Web app | existing | needs `EMBEDDING_URL`, `EMBEDDING_API_KEY` |

## Prerequisites (verified read-only on site B, 2026-11-28)

* PostgreSQL 17.10 with `vector 0.8.1` and `pg_trgm 1.6` (needs `halfvec`, so pgvector ≥ 0.7).
* Every catalogue column the adapters read exists (checked against production column by column).
* A schema called `search` already exists in production (replicated mobile search history). **Do not reuse it**;
  this feature lives in `unified_search`.
* Site A: confirm the same two extensions before migrating (A was not reachable when this was written).

## Rollout

1. **Build and import images** (B builds; A receives them through the release sync like the web app):
   `lsevin-embedding`, `lsevin-search-indexer`.
2. **Secret** (each site): `kubectl -n lsevin create secret generic search-secrets --from-literal=EMBEDDING_API_KEY="$(openssl rand -hex 32)"`.
3. **Migrate**: `0127` takes a short lock on `category.service_providers`, `category.provider_services`,
   `category.service_definitions`, `tour.tours`, `stay.properties`, `content.post_translations` only to add triggers
   (no table rewrite). The triggers swallow their own errors: they cannot fail a catalogue write.
4. **Start the embedding service**, wait for `/health`, then the indexer.
5. **First build**: `kubectl -n lsevin create job --from=cronjob/search-reconcile first-build`. Watch its log.
6. **Verify** (read-only): `select doc_type, count(*), count(embedding) from unified_search.documents group by 1;`
   and `pnpm search:report`.
7. **Web app**: deploy with `EMBEDDING_URL=http://embedding:8089` and `EMBEDDING_API_KEY`. The page `/<locale>/search`
   and `/api/search` are live immediately (no feature flag: nothing links to them until a menu entry is added).
8. **Optional, later**: `SEARCH_LANDING_PAGES=1` (after reviewing `unified_search.landing_pages`) and
   `ASSISTANT_EMBEDDINGS=local` (after `pnpm assistant:index:local`).

Site A reaches the embedding service on B through the VPN/proxy only if A has no local copy: set A's `EMBEDDING_URL`
to B's service and keep `SEARCH_EMBED_TIMEOUT_MS` at 400. Search on A keeps working without vectors if the link is down.

## Rollback

* Web: remove `EMBEDDING_URL` (search falls back to keywords + place) or revert the web release.
* Workers: `kubectl -n lsevin scale deploy/search-indexer deploy/embedding --replicas=0`.
* Data: everything is derived; `drop schema unified_search cascade` plus
  `alter table ai.knowledge_chunks drop column embedding_local, drop column embedding_model` removes it. The OpenAI
  column of `ai.knowledge_chunks` was never touched (only made nullable).

## Monitoring

The existing `deployment_unavailable` rule (`lsevin_deploy_unavailable_replicas > 0`, 5 min) already covers the `embedding`
and `search-indexer` deployments. A change-queue backlog is **not** alerted yet (it needs an exporter metric):
`pnpm search:report` shows the queue age and warns above 15 minutes. Check it after the first release.

## Capacity (measured 2026-11-28)

Test rig: 6-core Windows PC, Docker Postgres limited to 1 GB, dev server (`next dev`), embedding service, Chrome and the
test runner all sharing the same CPUs. **Server B (8 vCPU, 16 GB, `next start`) was not measured.**
100,000 synthetic documents (60k offers, 15k tours, 10k stays, 10k articles, 5k providers; random 384-dim vectors, the
hardest case for HNSW), every query distinct so each pays for a real embedding:

| Clients | Throughput | p50 | p95 | p99 | Without vector (timeout) |
|---|---|---|---|---|---|
| 1 | 11 q/s | 82 ms | 159 ms | 252 ms | 0 / 300 |
| 8 | 32 q/s | 231 ms | 479 ms | 665 ms | 0 / 300 |
| 16 | 35 q/s | 432 ms | 751 ms | 848 ms | 0 / 300 |

Database pieces alone at 100k documents: vector 10-16 ms (37 ms with a city filter), keyword 12-21 ms, place 4-18 ms,
autocomplete under 2 ms. Embedding service: 15 ms per query, micro-batched under load. Index size: 274 MB for
100k documents (HNSW is about 1.1 KB per vector), so about 2.7 GB per million.

Found and fixed with this benchmark (before: after): keyword query 733 ms: 21 ms (trigram OR branch and unbounded
ranking), filtered vector 86 ms: 37 ms (scan cap), 35% of queries missing the embedding budget at 8 clients: 0
(micro-batching).

* Embedding pod limit 1.5 GB is the largest new commitment. Server B had ~4 GB RAM available and 625 MB of swap in use.
  Do not run the service on site A (about 1.7 GB available): use B's.
