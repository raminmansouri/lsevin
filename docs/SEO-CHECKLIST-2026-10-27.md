# Lsevin SEO release checklist — updated 29 October 2026

Scope: `lsevincare.com`; Persian search is the first priority. A first-page Google position depends on competition and indexing and cannot be guaranteed by a code release.

## Live release verified on 29 October

- [x] The visitor-serving origin returns HTTP 200 for sampled home, categories, provider, service, specialist, shop product, and guide URLs. Sampled pages use self canonicals on `lsevincare.com` and render JSON-LD.
- [x] Persian categories render a Persian title and H1. Home renders Organization and WebSite JSON-LD. The live categories page still has some English interface strings; this branch corrects them.
- [x] `/sitemap.xml` returns HTTP 200 with 10,317 unique locations and no `appmain.lsevin.com` host in the complete XML. The sitemap includes unsupported language variants of category and shop landings; this branch removes those entries.
- [x] The public origin runs the previously deployed SEO candidate. Production migration `0084_translation_empty_fast_path.sql` is recorded. Jenkins main-production build 392 succeeded.

## Current branch: indexation and page quality

- [ ] Release this branch from current `Lsevin-New`; verify the deployed commit, sitemap, robots, canonical, and reciprocal hreflang after publication.
- [ ] Index category landings only in Persian and English, and shop landing/products/categories only in Persian until the other locales contain substantive localized copy. Keep other language routes accessible with `noindex,follow`. **Implemented in this branch; production verification pending.**
- [ ] Localize category interface strings and add factual CollectionPage JSON-LD to eligible category landings. **Implemented in this branch; browser verification pending.**
- [ ] Inspect each indexable locale's visible content, title, description, H1, breadcrumbs, structured data, and internal links. Extend genuine translations before adding a locale to sitemap/hreflang.
- [ ] Validate rendered structured data with Google's Rich Results Test. Do not invent ratings, credentials, or medical claims.
- [ ] Improve provider and clinical trust signals: verified identity, qualifications, contact details, authorship, review dates, and cited sources, subject to qualified clinical review.
- [ ] Map search intent to home, category, provider, service, specialist, and guide pages using real query and conversion data.

## Search Console and measurement

- [ ] Connect and verify the `lsevincare.com` Search Console property. Submit the published sitemap and inspect indexing exclusions, Google-selected canonicals, clicks, impressions, queries, countries, and devices. No connected property or export has been verified in this workspace.
- [ ] Measure visitor-visible cold and warm TTFB by geography, route, and cache status. The earlier public baseline was approximately 0.61–1.03 seconds, above the requested 30 ms. Record p50/p95 and error rates after any change. The 30 ms target is **not met or verified**.
- [ ] Keep authenticated booking, availability, payments, and user data out of shared public HTML caches; test refresh, direct navigation, history, invalidation, and locale isolation.
- [ ] For further database work, inspect representative query plans and test a migration upgrade from the actual previous production migration state. Do not edit released migrations.

## Release gates for this branch

- [ ] Dependency-complete production build, lint, typecheck, SEO tests, and relevant integration tests.
- [ ] Persistent Playwright tests for category navigation/localization and robots/sitemap policy, including browser interaction and a real runtime.
- [ ] Stage the exact candidate, check startup, logs, migrations if any, health, key routes, and browser workflows.
- [ ] Verify the same checks on the visitor-serving production deployment after publication.

This is a working checklist. Unchecked items are open; a build or source inspection alone does not close them. Current branch release status: **NOT READY FOR RELEASE**.
