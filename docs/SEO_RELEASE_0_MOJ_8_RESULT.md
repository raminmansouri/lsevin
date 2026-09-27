# MOJ-8 implementation and QA handoff — 2026-09-27

**Implemented:** Server metadata now emits `noindex, nofollow` at private route boundaries and `noindex, follow` for search, search-results, shop search and map discovery. Query-scoped `X-Robots-Tag: noindex, follow` applies to known shop-category and legacy provider-type facets. Unfiltered public landings and tracking-only URLs retain their policy. Existing authorization and sitemap generation are unchanged; no deployment occurred.

**Files/modules changed:** `frontend/webapp/src/lib/seo/{robots-policy,facet-headers}.ts`, their contract tests, locale contract tests, `next.config.ts`, `scripts/seo-root-layout-probe.mjs`, and narrow server layouts under the auth/admin/provider, financial, account, booking, medical/care, notifications, bug-report, shop utility and search trees. Existing direction and locale validation helpers in `src/config/locales.ts` are reused. Inherited audit, metadata/plain-text/provider-404 edits and unrelated infrastructure/API changes were preserved.

**Database changes:** None; no database access in verification.

**API changes:** None. Response headers change only for the two facet route families with a recognized query key. Shop: sort, page, brand, inStockOnly, onSale, minRating, minPrice, maxPrice. Provider type: search, countryCode, cityCode, attributeFilters.

**UI changes:** No visible markup changes; server robots metadata only. Root locale rendering is deliberately unchanged because the proposed root-params approach failed the production probe.

**Tests added:** 18 locale registry/direction/validation cases and 40 robots contract cases. These check private/search layout inheritance, public-route exclusions, and scoped facet configuration. The reproducible production probe builds fixture pages with the installed Next 15.6.0-canary.41 and the actual robots/header policy modules.

**Tests run:** `pnpm exec vitest run src/lib/seo`: 63/63 pass (58 new, 5 inherited plain-text tests). Production fixture compilation/static generation and `next start` HTTP checks passed: all 11 locale HTML files expose empty root params; 22 search/private HTML files contain the expected robots meta; 176 facet/bare/tracking HTTP checks confirm headers; fa/en/ar and financial fixtures return 200; unsupported and unmatched fixtures return 404. `useCache: true` and an ISR fixture with revalidate 60 remain enabled. Loading the real Next config returned all 12 header rules successfully through Next's legacy TS loader. `git diff --check` passed.

**Known limitations / exact SEO-I18N-001 blocker:** With `app/layout` above `app/[locale]`, `await params` in the root is `{}` for every built locale. The prototype therefore produces `<html lang="fa" dir="rtl" data-root-params="{}">` even for English. Production HTTP confirms this behavior. Reading next-intl in the root risks the documented request-cache contamination; reading request headers would change static-rendering behavior. Neither workaround was shipped. Correct locale document attributes require a separately validated restructuring of document ownership (including financial and not-found), rather than a root params patch. This is a blocker to Release 0 acceptance, not a claim that all P0 criteria pass.

The probe is isolated, not a full application build or authenticated E2E run. It does not prove production next-intl caching, hydration, financial authorization, or ISR regeneration. Existing root not-found contains its own html/body and also needs consideration in any document-layout redesign. Entity active/inactive/outage behavior from the inherited slice was not reimplemented or re-certified here.

**Probe environment:** Scratch lives on C: while dependencies live on E:. Turbopack rejected the external dependency junction; webpack initially generated malformed cross-drive client entries. The successful probe uses `--webpack` with a fixture-only entry normalization of `./E:/...` to `E:/...`. Application webpack/Turbopack configuration is unchanged. Next's real config loader falls back from native Node TS import resolution to its supported legacy loader. Baseline browser mapping emitted a stale-data advisory.

**Risks:** Robots directives are crawler guidance, never authorization. Existing robots.txt disallows can delay discovery of noindex on previously indexed private URLs. New private/search route families must receive appropriate boundaries. The full app build, guest/authenticated runtime, and staging checks remain QA requirements. Locale correctness remains unresolved and prevents a full Release 0 sign-off.

**Follow-up work:** Architecture/full-stack owner must choose and build-test locale-owned document roots or another supported design, preserving root 404 and the separate Persian financial product. QA & Acceptance should verify the implemented indexability slice and retain the locale blocker against parent MOJ-7. This child explicitly permits completion with a concrete locale blocker.

**QA instructions:**

1. In `frontend/webapp`, run `pnpm exec vitest run src/lib/seo`.
2. Run `node scripts/seo-root-layout-probe.mjs <new-empty-scratch-path>`; the path must not already exist. The script uses localhost port 33189 and writes `results.json` into scratch. A successful exit confirms the documented blocker and robots/header assertions; it does not mean locale correctness passed.
3. In a staging production build, fetch raw HTML as a crawler for FA/EN/AR search, search-results, map-discovery and shop/search; expect `noindex, follow`. Check auth/account/booking/medical/admin/provider/financial pages or their sign-in targets for `noindex, nofollow`, without bypassing authentication.
4. Fetch public home/provider/service/specialist/product/category pages and confirm no inherited noindex. Check `/en/n/app/mobile/shop/category/<valid-slug>?brand=...` and `/en/type/<valid-id>?search=...` for the scoped header; bare and `?utm_source=qa` versions must not receive it. Check all locales, private links, 404s and entity failure behavior before deployment.
5. Confirm English document attributes are still a known failure; do not approve the full Release 0 locale requirement based on this child.
