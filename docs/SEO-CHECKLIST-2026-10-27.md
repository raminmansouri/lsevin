# Lsevin SEO release checklist — 27 October 2026

Scope: `lsevincare.com`, primarily Persian search in Iran, with English and other genuinely translated pages as secondary markets. This checklist records observed public behavior separately from the unpublished `feat/seo-geo-lsevincare` candidate. A first-page Google position cannot be promised.

## Priority 0: fix indexation signals

- [x] **PASS 2026-10-28** — live since `ba3a38cd` (Jenkins after #390 failure and the `99a03678` release). `seoOrigin()` maps the production app origin to lsevincare.com when the build lacks the variable, because B's hand-synced Jenkins job does not pass it. DevOps follow-up: add `NEXT_PUBLIC_SEO_URL` to that job template (tracker T30).
  Original item: Publish an **exact, verified** candidate that sets `NEXT_PUBLIC_SEO_URL=https://lsevincare.com` at build and runtime. Live `/fa/n/app/mobile/home` still declares `https://appmain.lsevin.com/fa/n/app/mobile/home` as canonical; its hreflang URLs also use `appmain.lsevin.com`.
- [ ] **PARTIAL 2026-10-29** — `pnpm seo:probe https://lsevincare.com`: HTTP 200, canonical == sitemap `<loc>`, hreflang self + reciprocal on every sampled page type and locale. Open: two `<h1>` per page since the desktop redesign; fixed on `feat/seo-geo-lsevincare` (`6261fbf8`, `b4fc4558`), deploy pending (tracker T38).
  Original item: After deployment, verify canonical, reciprocal hreflang, and HTTP 200 on home, categories, provider, service, staff, shop, and guides in every published locale. Verify the canonical is the same host and URL as the corresponding sitemap `<loc>`.
- [x] **PASS 2026-10-29** — 10,259 URLs, all on lsevincare.com; only indexable locale versions (untranslated ones are noindex and excluded); legacy `/service-providers` and `/type` removed (308 to current pages). Probe: sampled sitemap URLs are 200, indexable and self-canonical.
  Original item: Verify `/sitemap.xml` contains only canonical, indexable, active URLs and no `appmain.lsevin.com` URLs. Live sitemap returned HTTP 200 and about 3.6 MB, but its first `<loc>` and alternates pointed to `appmain.lsevin.com`. The candidate has sitemap tests; the live deployment has not passed them.
- [ ] **BLOCKED (owner)** — needs the site owner's Google account: verify lsevincare.com (DNS TXT in Cloudflare), submit `https://lsevincare.com/sitemap.xml`. Bing and Yandex likewise (tracker T20–T22).
  Original item: Check the Search Console property for `lsevincare.com`, submit the corrected sitemap **after** deployment, and inspect Google-selected canonicals and indexing exclusions. Search Console access has not been connected or verified.

## Priority 1: on-page and language quality

- [x] **PASS 2026-10-29** — live fa categories: title `همه دسته‌ها | السوین`, localized description, self canonical; JSON-LD added on the branch (deploy pending).
  Original item: Publish the candidate's localized categories metadata and inspect rendered initial HTML. Live Persian categories returned title `ال سوین | Categories`, English description `Browse all active LSevin service categories.`, English H1 `Categories`, and no canonical link. This is a confirmed production defect.
- [x] **PASS 2026-10-29** — per-entity locale eligibility: a locale is indexed only when the entity's text exists in it (probe: untranslated `en` service page is `noindex`, absent from hreflang and sitemap). Titles and descriptions localized in 11 locales; guides only in fa/ar/en.
  Original item: Check each indexable locale for translated main content, title, description, H1, breadcrumbs, and structured data. Do not index thin translated shells or list locale versions in hreflang when the body has no real translation.
- [ ] **PARTIAL 2026-10-29** — JSON-LD parses and is structurally valid on all sampled pages (probe), no ratings or medical claims. Google's Rich Results Test itself is not scripted (manual check after deploy). Categories/shop/consultation schema on the branch, deploy pending.
  Original item: Inspect rendered JSON-LD in a browser and validate with Google's Rich Results Test. The sampled live home and categories pages rendered zero `application/ld+json` scripts; the candidate adds factual organization/entity schema. Do not add unsupported medical claims or review ratings.
- [ ] **BLOCKED (data)** — needs Search Console query/page/country data (item above). Initial keyword map: research brief in tracker T13/T24/T35 and the 15 guides.
  Original item: Map one primary search intent to each home, category, provider, service, staff, and guide page. Use actual Search Console query, page, country, device, click, impression, and conversion data before prioritizing keywords.
- [ ] **PARTIAL** — guides carry review dates and cited sources; no ratings. Open: named medical reviewer with council number (tracker T14) and verified provider credentials (content team).
  Original item: Strengthen healthcare trust signals: verified provider identity, qualifications, contact details, author/reviewer credentials, review dates, and cited sources for medical guidance. Get qualified review of clinical text before publication.

## Priority 2: speed and crawl health

- [ ] **PARTIAL 2026-11-02** — branch `63cc09c6`: SEO unit tests 132/132 (host); earlier release candidates passed the Jenkins-equivalent build from `git archive`, Playwright SEO 27/27, typecheck = baseline (611). Blocked now: Docker Desktop down, so the clean build + Playwright run of the latest merge has not run. No staging environment exists (production-safe read-only smoke instead).
  Original item: Run the candidate's production build, full typecheck/lint, SEO unit tests, real-database migration/query tests, persistent Playwright suite, and staging smoke tests. Current candidate has no successful complete release-gate record.
- [ ] **PARTIAL 2026-10-29** — from this workstation only: p50 297 ms / p95 1047 ms over 34 public pages (`pnpm seo:probe`). Not measured by visitor location; Cloudflare does not cache HTML yet (tracker T16).
  Original item: Measure cold and warm visitor-visible TTFB, p50/p95, cache-hit rate, and errors by location. The previous three-sample public baseline exceeded 30 ms on every sampled route; it does not establish a population percentile or prove a fix.
- [x] **PASS (perf branch)** — migration 0084 tested on a 0083-state copy and replays in an isolated DB (`tests/catalog-performance.test.mjs`); released 2026-10-28.
  Original item: Use representative read-only query plans and an isolated upgrade from the actual prior migration state before applying database optimization. No production SEO/performance migration has been applied from this branch.
- [x] **PASS 2026-10-29** — probe: bookings/profile/favorites redirect guests or are `private, no-store` and `noindex`; search is `noindex`; only anonymous public pages send `s-maxage`.
  Original item: Keep authenticated booking, favorites, payments, and availability out of shared public HTML caches. Test direct navigation, refresh, browser history, cache invalidation, and locale isolation.

## Evidence and publication boundary

Live read-only checks on 27 October 2026: `robots.txt` HTTP 200, `sitemap.xml` HTTP 200, home HTTP 200, categories HTTP 200; Playwright inspected rendered home/categories metadata and JSON-LD counts. These checks describe the **current live release**, not the SEO candidate. The web-fetch tool could not retrieve these URLs; direct HTTP and Playwright checks succeeded.

The SEO candidate is pushed to `feat/seo-geo-lsevincare`. Its latest inspected commit was `9ce1c61f`. Its `pnpm test:seo` could not run in this worktree because `vitest` is absent from the incomplete local dependency installation. Earlier isolated tests are documented in [SEO-PERFORMANCE-2026-10-25.md](SEO-PERFORMANCE-2026-10-25.md), but they do not replace a final-build browser/staging gate.

Status as of 2026-11-02: see each item. Live release: lsevincare.com canonical domain since 2026-10-28.

Publication status at the time of writing (2026-10-27): **NOT READY FOR RELEASE** until the candidate passes those gates and the deployed pages are rechecked. The provider-portal branch is a separate deployment and is also not confirmed live.
