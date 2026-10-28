# Lsevin SEO release checklist — 27 October 2026

Scope: `lsevincare.com`, primarily Persian search in Iran, with English and other genuinely translated pages as secondary markets. This checklist records observed public behavior separately from the unpublished `feat/seo-geo-lsevincare` candidate. A first-page Google position cannot be promised.

## Priority 0: fix indexation signals

- [ ] Publish an **exact, verified** candidate that sets `NEXT_PUBLIC_SEO_URL=https://lsevincare.com` at build and runtime. Live `/fa/n/app/mobile/home` still declares `https://appmain.lsevin.com/fa/n/app/mobile/home` as canonical; its hreflang URLs also use `appmain.lsevin.com`.
- [ ] After deployment, verify canonical, reciprocal hreflang, and HTTP 200 on home, categories, provider, service, staff, shop, and guides in every published locale. Verify the canonical is the same host and URL as the corresponding sitemap `<loc>`.
- [ ] Verify `/sitemap.xml` contains only canonical, indexable, active URLs and no `appmain.lsevin.com` URLs. Live sitemap returned HTTP 200 and about 3.6 MB, but its first `<loc>` and alternates pointed to `appmain.lsevin.com`. The candidate has sitemap tests; the live deployment has not passed them.
- [ ] Check the Search Console property for `lsevincare.com`, submit the corrected sitemap **after** deployment, and inspect Google-selected canonicals and indexing exclusions. Search Console access has not been connected or verified.

## Priority 1: on-page and language quality

- [ ] Publish the candidate's localized categories metadata and inspect rendered initial HTML. Live Persian categories returned title `ال سوین | Categories`, English description `Browse all active LSevin service categories.`, English H1 `Categories`, and no canonical link. This is a confirmed production defect.
- [ ] Check each indexable locale for translated main content, title, description, H1, breadcrumbs, and structured data. Do not index thin translated shells or list locale versions in hreflang when the body has no real translation.
- [ ] Inspect rendered JSON-LD in a browser and validate with Google's Rich Results Test. The sampled live home and categories pages rendered zero `application/ld+json` scripts; the candidate adds factual organization/entity schema. Do not add unsupported medical claims or review ratings.
- [ ] Map one primary search intent to each home, category, provider, service, staff, and guide page. Use actual Search Console query, page, country, device, click, impression, and conversion data before prioritizing keywords.
- [ ] Strengthen healthcare trust signals: verified provider identity, qualifications, contact details, author/reviewer credentials, review dates, and cited sources for medical guidance. Get qualified review of clinical text before publication.

## Priority 2: speed and crawl health

- [ ] Run the candidate's production build, full typecheck/lint, SEO unit tests, real-database migration/query tests, persistent Playwright suite, and staging smoke tests. Current candidate has no successful complete release-gate record.
- [ ] Measure cold and warm visitor-visible TTFB, p50/p95, cache-hit rate, and errors by location. The previous three-sample public baseline exceeded 30 ms on every sampled route; it does not establish a population percentile or prove a fix.
- [ ] Use representative read-only query plans and an isolated upgrade from the actual prior migration state before applying database optimization. No production SEO/performance migration has been applied from this branch.
- [ ] Keep authenticated booking, favorites, payments, and availability out of shared public HTML caches. Test direct navigation, refresh, browser history, cache invalidation, and locale isolation.

## Evidence and publication boundary

Live read-only checks on 27 October 2026: `robots.txt` HTTP 200, `sitemap.xml` HTTP 200, home HTTP 200, categories HTTP 200; Playwright inspected rendered home/categories metadata and JSON-LD counts. These checks describe the **current live release**, not the SEO candidate. The web-fetch tool could not retrieve these URLs; direct HTTP and Playwright checks succeeded.

The SEO candidate is pushed to `feat/seo-geo-lsevincare`. Its latest inspected commit was `9ce1c61f`. Its `pnpm test:seo` could not run in this worktree because `vitest` is absent from the incomplete local dependency installation. Earlier isolated tests are documented in [SEO-PERFORMANCE-2026-10-25.md](SEO-PERFORMANCE-2026-10-25.md), but they do not replace a final-build browser/staging gate.

Publication status: **NOT READY FOR RELEASE** until the candidate passes those gates and the deployed pages are rechecked. The provider-portal branch is a separate deployment and is also not confirmed live.
