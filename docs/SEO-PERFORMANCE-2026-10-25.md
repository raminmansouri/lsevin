# SEO and performance work — 25 October 2026

Status: **NOT READY FOR RELEASE**. Worktree: `.worktrees/consultation-fix`, base commit `f3dabb43d1b65e709c6fbe7d9056f5842c7ab942`. Changes have not been deployed. Live-site observations describe the existing release, not this candidate.

## Target and measurement

The requested target is visitor-visible TTFB below 30 ms, not database execution time. Report cold browser navigation, warm connection TTFB, origin processing, cache hits/misses, p50/p95 and error rates separately. A single-machine sample cannot establish a global latency SLO. DNS, TCP/TLS, geographic distance and CDN routing contribute independently of SQL execution.

Live browser's first home navigation: approximately 548 ms TTFB, including about 249 ms between requestStart and responseStart. Subsequent browser fetch observations: categories ~1140 ms, explore ~561 ms, search ~2190 ms, sitemap ~400 ms. These are individual baseline observations, not population percentiles.

Fresh-connection curl baseline: [raw results](verification/seo-performance/2026-10-25-baseline.json). Three samples per route, 18/18 HTTP 200; all exceeded 30 ms. This is a small diagnostic sample. TLS setup accounted for much of the delay. The raw results preserve cumulative DNS/TCP/TLS timing; do not add these cumulative values together.

## Dependency and safety analysis

| Workflow | Dependency chain | Rendering / boundaries |
|---|---|---|
| Home | page → cached home rails / managed sections → category/provider/service/media/booking aggregates | Existing force-static, 120 s ISR; greeting/location remain client-side. Existing empty-rail build fallbacks still need production validation. |
| Categories | page → category browser action → recursive category counts → category tree, provider membership and service definitions | Changed to 300 s ISR; explicit locale key. Small Suspense leaf synchronizes URL selection without removing catalog HTML. Admin category mutations already invalidate the category-group tag. |
| Search landing | page → cached popular categories/trending → catalog and booking aggregates | Changed to 300 s ISR; recent searches remain client-side and uncached across users. Search stays noindex/follow. |
| Search results | results → search repository → indexed multilingual search/provider/staff queries | Dynamic; existing limit-before-media strategy preserved. Requires real EXPLAIN and cardinality evidence before new indexes. |
| Explore | page → shared cached catalog + per-request identity/geolocation → customer favorites | Dynamic to preserve private favorites and local prices; independent catalog/identity work now starts together. Favorites remain outside the shared cache. |
| Provider | page/metadata → provider cache → provider/services/staff/media | Existing SSG/ISR preserved. Canonical domain corrected through SEO config. |
| Service | page/metadata → service cache → catalog, finance, favorites, requirements and staff | Reuses identical current/original price conversion; removes unused phone-country read and debug logging. Infrastructure errors propagate instead of becoming cached 404s. |
| Staff | page/metadata → specialist cache → staff, services, provider links, credentials/media | Existing SSG/ISR preserved; exceptions no longer become cached 404s. |
| Booking | authenticated selection → availability → draft/cart/checkout → persistence/payment | Must remain fresh and authenticated. No shared cache added to availability, customer records, writes or payment state. Real DB/auth/concurrency/payment tests remain blocked. |
| SEO | page metadata/robots/sitemap → validated canonical origin → catalog | New `NEXT_PUBLIC_SEO_URL` separates search domain from app/SSO origin; production configuration uses lsevincare.com. |

No schema, index, constraint or released migration was changed. In particular `0006_seed_world_locations.sql` is untouched. Database tuning is **not complete**: the configured localhost connection failed with EACCES; Docker Desktop's Linux engine is unavailable. Current production schema/checksums could not be inspected. Do not add speculative indexes or change booking transaction semantics without query plans and representative data.

## Implemented SEO foundations

- Live canonical URLs and robots/sitemap advertised appmain.lsevin.com instead of lsevincare.com. Added a separate validated public SEO origin, wired through Docker build, compose, Kubernetes config and Jenkins build arguments. App/auth URLs remain independently configured.
- Home uses localized HomePage title/description. Categories now has localized metadata, canonical/hreflang and social metadata.
- Sitemap uses one cached catalog query (300 s), current mobile provider/service/staff URLs, active-parent eligibility for service/staff, deduplication and a 50,000 URL guard. Database failures are caught outside the data cache so a transient empty catalog is not cached as success. A catalog above the limit requires real sharding before release; this implementation deliberately refuses to publish invalid XML.
- Added factual Organization/WebSite JSON-LD to home. No invented medical credentials, testimonials, ratings or rich-result promises.
- Provider/service/staff SSG already existed; this work does not claim to have introduced it.
- Search and private booking/account robots policies are preserved.

## SEO specialist action plan

Primary working assumption: Persian/Iran; secondary: English medical travel. No keyword volumes or ranking forecasts have been invented.

| Page family | Search intent / research seeds | Next evidence required |
|---|---|---|
| Home | رزرو خدمات درمانی، خدمات سلامت و اقامت; healthcare booking | Search Console queries, conversions and audience geography |
| Category landing | treatment/specialty + city, accommodation + city | Actual active inventory; unique localized introduction and useful crawlable links |
| Service | actual procedure + city/provider, appointment details | Accurate prices/currency, preparation/recovery information reviewed by qualified professionals |
| Provider | verified business/practitioner name + specialty + city | Consistent legal/contact/address details, real credentials and provider-approved copy |
| Staff | actual professional name + specialty | Verified qualifications, practice location and medically reviewed biographies |
| Editorial guides | genuine patient questions around booking/travel/preparation | Named qualified author/reviewer, authoritative citations, review dates and no unsupported clinical claims |

1. Verify lsevincare.com as a Search Console domain property using the owner's DNS access. Obtain read-only Search Console/analytics access or exports; do not claim ownership or indexing submission without it.
2. Deploy a verified candidate with consistent canonical domain at build AND runtime; test all locales and aliases, then submit the corrected sitemap. Decide public-only redirects for the old hostname after checking SSO and deep links. Do not redirect auth/payment callbacks blindly.
3. Audit Google-selected vs declared canonicals, indexing exclusions, crawled-not-indexed URLs, broken links and actual query impressions. Track branded/nonbranded conversions separately.
4. Research a small set of real treatment/specialty/city topics. Improve existing inventory pages before creating location pages at scale. Never publish empty/thin doorway pages or pretend translations are complete.
5. Add original, accurate medical content with a qualified reviewer and sources. Verify provider credentials/address information and publish transparent company/contact/privacy information. Never fabricate reviews or acquire spam links.
6. Monitor weekly for query/page/country/device changes, CTR and qualified bookings. Prioritize useful pages with impressions near page one based on real data. Ranking improvement takes evidence and time; page-one/number-one placement cannot be guaranteed.

## Performance follow-up

- Run `pnpm benchmark:queries -- <private-output.json>` with `PERFORMANCE_DATABASE_URL` explicitly set to an authorized database. The script uses read-only transactions, statement timeouts, relation statistics, index definitions, migration checksums and representative EXPLAIN ANALYZE plans. It never exports customer rows, connection strings or query parameters. Keep artifacts private.
- Obtain production-like anonymized cardinalities and slow-query statistics. Benchmark actual home/search/availability queries with representative locales, filters, identity and concurrent bookings, not only the diagnostic listing examples.
- Add only measured missing indexes as new migrations; verify existing equivalent indexes, lock behavior, previous-production-state upgrade and write overhead. Use concurrent index creation where justified and supported by the migration runner.
- Inspect real CDN cache behavior: live categories/search/explore were DYNAMIC; sitemap also DYNAMIC. Restrict any edge HTML cache to proven public representations. Never cache sessions, favorites, currency/geo variants, server actions, booking availability or RSC variants under an incomplete key.
- Test close-to-origin and target visitor locations with cold and warm connections, then tune CDN coverage/origin placement. SQL tuning alone cannot guarantee visitor-visible 30 ms across networks.

## Reproduction

From `frontend/webapp`:

```sh
pnpm install --frozen-lockfile
pnpm test:seo
pnpm test:performance
pnpm benchmark:public --samples=20 --out=artifacts/public-benchmark.json --enforce
# Optional public entity IDs: --provider-id=<uuid> --service-id=<uuid> --staff-id=<uuid>
# Candidate/staging, not an unrelated release:
SEO_E2E_BASE_URL=https://candidate.example SEO_EXPECTED_ORIGIN=https://lsevincare.com pnpm test:seo:e2e
PERFORMANCE_DATABASE_URL=<injected-secret> pnpm benchmark:queries -- artifacts/query-diagnostics.json
```

The benchmark exits nonzero with `--enforce` when any status or p95 budget fails. It does not follow redirects and does not count fast HTTP errors as performance successes. Use at least 20 samples for a useful initial p95, then meaningful load and geographic coverage.

Docker build now executes focused unit gates with a dummy local database URL so these mocked tests cannot reach production. Browser/integration/staging checks are still required; writing a CI command does not prove that it ran in the real deployment environment.

## Verification record

- Focused SEO/status/cache/schema/repository suite: 96/96 PASS.
- Benchmark-tool tests: 3/3 PASS.
- Live public initial Playwright suite: 4 PASS / 6 FAIL. Four failures are real canonical/robots gaps in the current production release; two were test selectors corrected after the initial run. Recheck: search navigation/refresh PASS; category filtering and keyboard selection worked, but the expected parent URL was absent (FAIL), confirming the live state-only navigation defect. Candidate now synchronizes selection through the URL; candidate E2E remains unverified.
- Playwright MCP: inspected real home, category and provider pages, headings/canonicals and timing. No production booking/payment/customer writes performed.
- Initial production build: FAIL, Turbopack could not resolve Next.js from the reused dependency location. This is not successful release validation.
- Initial lint: blocked by missing @next/eslint-plugin-next in the reused dependency resolution.
- Full typecheck: interrupted during incomplete dependency installation; not a pass. Offline dependency install was also stopped incomplete after prolonged local file operations; no lockfile/package versions were changed.
- Fallback webpack build: attempted, then stopped before completion; not a pass.
- Selected changed-file Prettier check: PASS.
- Category SSR regression test proves catalog headings/links survive a suspended request-URL leaf.
- Public provider and service pages were also inspected with Playwright MCP; both advertised the old canonical domain.
- Real DB query plans, upgraded production state, authenticated booking, permissions/concurrency, staging and post-deploy candidate smoke: NOT VERIFIED.

Local browser evidence: `frontend/webapp/artifacts/public-seo-report/index.html`, `frontend/webapp/artifacts/public-seo-results.json`, and `frontend/webapp/artifacts/public-seo/` (screenshots and failure traces). These are local ignored artifacts, not deployed links. Successful home/categories/explore screenshots show the existing live release only. Do not mislabel them as verification of this candidate.

SEO skill installed and applied: `coreyhaines31/marketingskills@seo-audit`, version 2.2.2, user-level `C:/Users/Maham/.agents/skills/seo-audit/SKILL.md`. Existing frontend-checklist MCP and Playwright MCP were used. No new paid SEO service or authenticated Search Console connection was installed. The initial browser baseline used the workspace's available @playwright/test runner; rerun with lockfile-pinned dependencies before release.

## Deployment and rollback

Set `NEXT_PUBLIC_SEO_URL=https://lsevincare.com` during image build and runtime (staging must use its intended canonical policy). Rebuild/redeploy the exact tested commit/image; update Kubernetes config as appropriate. Ensure DB access during categories/search prerender: these pages deliberately fail rather than bake empty data on database outages. Validate build route output, initial HTML, cache invalidation, locale isolation and personalized-data boundaries. Warm and inspect public pages, refresh metadata/robots caches, submit the sitemap only after validation.

No migrations or new secrets are required by these changes. Existing database/integration/auth credentials are needed for verification. Keep the previous image/config for rollback; no database rollback is introduced.

Required release gates remain incomplete. **NOT READY FOR RELEASE**.

## Primary references

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://nextjs.org/docs/app/guides/caching-without-cache-components

## Continuation: real database verification and isolated environment

Docker and database access became available after the initial report. The PostgreSQL connector was used strictly read-only against the configured Lsevin production profile; no production migrations or writes were performed.

- Production PostgreSQL: 17.10; JIT already off. The historical combined-search statement averaged about 2,939 ms over 51 recorded calls. This is cumulative server telemetry, not visitor TTFB.
- The committed bytes of `0069_optimize_translation_lookup.sql` hash to `7d1cd94a8122dca774299ed4e703fdc823ff294a7863bb5108be29cb9679e33d`, matching the inspected production migration registry. Windows checkout CRLF bytes have a different hash; that is not a reason to edit the released migration.
- Added `0084_translation_empty_fast_path.sql`, ordered after the inspected production catalog migrations through 0082. This replaces only the existing function, preserving its signature, defaults, immutable/parallel-safe attributes and translation semantics. It returns immediately for empty normalized translation objects rather than opening repeated empty iteration loops. No tables, indexes, constraints or stored data change.
- Search now translates display-only provider names and tags after the ranked limit. The predicates, rank, tie-break fields, eligibility, result shape and personalized currency handling remain in their original layers.
- Read-only execution-plan samples on production catalog: original unfiltered search ~703 ms; deferred display translations ~395 ms; the additional SQL empty-object guard experiment ~184 ms. [Sanitized measurements](verification/seo-performance/2026-10-25-query-plans.json). These single samples include cache/load variation and do not establish a p95 or post-deployment gain. The production function has not been changed.
- Isolated local DB: `lsevin_seo_verify_20261025`, cloned from the local development schema. All fixtures are synthetic. The old local snapshot incorrectly listed migration 0045 while lacking its `value_toman` column; it also lacked pre-existing search-text columns. The test bootstrap reconstructs these existing production fields only inside the disposable fixture database. It does not modify released migrations or pretend the old snapshot matches production.
- `tests/catalog-performance.test.mjs`: **17/17 PASS**, no skipped cases. It exercises the actual migration runner with only 0083 after installing the inspected prior function; validates the recorded migration checksum; compares 135 translation-input/locale combinations; checks function attributes and unchanged catalog counts; and compares complete old/new SQL search payloads for 15 combinations of locales, terms, country/city/category/type filters and limits. Its fixture SQL is preserved under `tests/fixtures/`.
- Actual migration runner evidence: `frontend/webapp/artifacts/migration-upgrade.log`: 0083 applied successfully in the isolated fixture DB. No production migration was run.
- Empty-object function microbenchmark, 5,000 nonconstant calls: approximately 93 ms before / 7 ms after in the latest local run. Performance is diagnostic; tests assert semantic equivalence rather than a flaky absolute timing threshold.

Reproduce the real DB checks with `PERFORMANCE_TEST_DATABASE_URL` set to the isolated local `lsevin_seo_verify_*` database, then `pnpm test:catalog-db`. The test refuses remote hosts and unrelated database names. Re-running it reconstructs the prior function and replays 0083 only within that guarded disposable database.

A local `.pnpm-store` cache was also being included in broad source scans. It is now excluded from Git, Docker context, TypeScript and ESLint scans. Linux verification tooling and a separate application container/volume are being prepared with lockfile-pinned dependencies; installation is not itself a passing build.

Additional performance finding: `resolveIsIranianVisitor` can wait up to 2,500 ms for a cold external IP lookup while Caddy already supplies `X-Country`. Changing that pricing/localization path needs a verified proxy trust boundary and phone-country precedence tests; no unverified trusted-header shortcut was enabled.

Search Console: Windsor.ai was discovered and offered as an available connector. It is not installed/connected, and property data has not been accessed. The account owner must install/connect the Google account for lsevincare.com. No ownership, submission, ranking or indexing results are claimed.
