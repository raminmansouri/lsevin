# Release 0 continuation: MOJ-9 (2026-09-27)

**Disposition:** Child complete under its explicit blocked-design allowance. Release 0 is **not accepted**. No deployment. The application document roots are unchanged; only validated entity behavior and regression evidence are committed.

**Implemented:** Product lookup failures now propagate instead of becoming absence/404, including metadata. Missing products use `notFound()` in metadata as well as page rendering. Provider metadata preserves the same distinction. Transient provider results reject inside the cache boundary; the client server action converts rejection to the existing sanitized structured 500 contract. Explicit-locale, no-FX product reads avoid visitor cookies/headers, fixing the request-context read inside `use cache`.

**Files/Modules Changed:** Product and provider mobile pages; shop `catalog.repository.ts`; provider cached repository and server action; three `src/lib/seo` test files; `scripts/seo-locale-roots-probe.mjs`; this report and fixture evidence JSON.

**Database Changes:** None. Existing active/deleted predicates retained. Tests mock SQL; no database mutations or production reads.

**API Changes:** Provider client action retains `{error: {status: 500, title}}` on failure without database details. Internal cached provider failures now reject rather than returning a successful cache value. No new endpoints.

**UI Changes:** Entity absence routes to existing localized 404 UI; outages follow the existing error boundary. No catalogs, visual components, authentication, or financial application behavior changed.

**Tests Added:** 18 behavior tests covering page/metadata success, absence and failures; malformed provider IDs; active/deleted SQL filters; cookie-free no-FX reads for FA/EN/AR; cache failure rejection and sanitized action response. The SQL predicate checks complement mocked outcomes and are not a substitute for seeded database tests.

**Tests Run:** `pnpm exec vitest run src/lib/seo`: 81/81 passed. `git diff --check`: passed. Scoped ESLint could not start: `ERR_MODULE_NOT_FOUND: Cannot find package '@eslint/js' imported from eslint.config.mjs` (existing installation). No full application build: the candidate architecture already fails the isolated production acceptance fixture, and app generation requires application data/integrations.

The new production probe uses installed Next 15.6.0-canary.41, real next-intl 4.3.12, `useCache`, locale-owned roots, a separate financial root, experimental `globalNotFound`, and a nested fallback boundary. It builds 58 static pages with webpack. All 11 public root documents and 22 private/search documents have the expected locale; roots have correct direction, ambient server translations match the locale, and the prerender manifest retains revalidate=60. Private/search robots assertions and 176 scoped facet/bare/tracking HTTP checks pass. Headless Edge with installed Playwright verifies FA/EN/AR public/search/private hydration (nine pages), translated client content, document locale, and no console/page errors. Browser checks require the optional environment variables documented below.

**Exact architecture blocker:** `/en/missing/path`, `/fa/missing/path`, and `/ar/missing/path` return HTTP 404 but start with `<html id="__next_error__">`, losing both lang and dir. `/unsupported` also returns 404 with this fallback. `/` reaches the global 404 with Persian document attributes. Adding a nested fallback route group and setting the request locale in its page did not resolve the localized failure. The probe intentionally exits 1 and writes `results.json` with the failing routes. Successful hydration/SSG does not satisfy the requirement that every localized response have correct initial document attributes. This is fixture evidence, not proof that every possible multi-root design fails.

The candidate follows documented [locale-owned root layouts](https://nextjs.org/docs/15/app/api-reference/file-conventions/layout) and [experimental global-not-found](https://nextjs.org/docs/15/app/api-reference/file-conventions/not-found). The latter bypasses layouts and does not establish localized notFound behavior. No request-header or forced-dynamic workaround is introduced into the application.

**Entity Status Matrix:**

| Case | Expected behavior | Evidence / remaining boundary |
| --- | --- | --- |
| Active product/provider | Render and metadata success | Actual page functions with fixture repository results pass |
| Missing product | notFound in page and metadata | Actual page functions and repository empty-result test pass |
| Inactive/deleted product | Absent from public lookup, then notFound | Existing active/deleted SQL predicates asserted; seeded DB/HTTP confirmation remains |
| Malformed provider ID | No DB query; 400 result maps to notFound | Repository and page tests pass |
| Missing/inactive provider | Filtered lookup; 404 maps to notFound | Repository predicate/empty-result and page tests pass |
| Transient product DB failure | Reject; never normalize to null/404 | Repository and page/metadata rejection tests pass |
| Transient provider DB failure | 500 result; cache rejects; page errors; action returns sanitized 500 | Repository, cache, page/metadata and action tests pass |
| Invalid service/specialist | Existing 404 behavior | Prior audit evidence retained; not re-certified by this child |

**Known Limitations:** No live/seeded entity HTTP matrix, authenticated E2E, full application hydration, financial authorization test, or timed ISR regeneration. The fixture verifies ISR configuration, not stale-content recovery. Next may return 200 after streaming starts; production crawler and browser status checks are still required for the real loading boundaries. The fixture uses minimal messages/providers, not the complete CRM provider tree. Existing app English HTML remains Persian until a root design passes. Unsupported-locale behavior is direct router behavior in the fixture, without application middleware redirects.

**Risks:** Multiple roots cause full document navigation across route families. The experimental global 404 feature is not enabled in the application. Removing outage suppression intentionally exposes the existing production error boundary rather than a false missing-product page. Existing cached absence responses may persist until normal expiration/invalidation; this task does not purge production caches.

**Follow-up Work / Next Architectural Decision:** Parent MOJ-7 architecture owner must choose a framework-version change with a passing localized-404 reproduction, or a different route-root/boundary arrangement on the pinned canary that passes the same raw-HTML checks. Recommend testing a supported framework version in isolation first; do not migrate the application solely from successful 200-page results. QA & Acceptance owns staging entity/crawler verification after the architecture decision. Keep the parent's Release 0 locale acceptance item open.

**QA Instructions:**

1. From `frontend/webapp`, run `pnpm exec vitest run src/lib/seo`.
2. Run `node scripts/seo-locale-roots-probe.mjs <new-empty-run-scratch-directory>`. Expected current exit is 1 with exactly the three supported-locale 404 document failures. Inspect `results.json`.
3. For browser checks, set `SEO_BROWSER_EXECUTABLE` to an installed Chromium/Edge executable and `SEO_PLAYWRIGHT_MODULE` to a file URL for installed `playwright/index.mjs`. The probe launches and stops its own test server/browser; port 33189 must be free. Cross-drive Windows webpack normalization is fixture-only.
4. In a staging production application, use known active, inactive/deleted, missing, and malformed fixtures for FA/EN/AR product/provider routes; request as both browser and HTML-limited crawler. Check status, initial HTML, robots and error-body privacy. Inject temporary repository failure and confirm it is not served/cached as a 404, then recover and re-fetch. Verify service/specialist 404s and financial host isolation.
5. Do not approve Release 0 until raw HTML lang/dir, root/localized 404s, next-intl isolation, SSG/ISR and real application hydration all pass together.
