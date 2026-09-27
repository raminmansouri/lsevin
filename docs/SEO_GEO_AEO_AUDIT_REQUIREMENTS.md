# Production SEO / GEO / AEO Audit & Engineering Requirements

Audit: 2026-09-27 · Production: `https://appmain.lsevin.com` · Scope: live HTTP output plus current repository. This is an audit-only deliverable; application code was not changed.

## 1. Executive Summary

LSevin has a sound base: Next.js App Router, server-rendered entity content, ISR for key templates, localized URLs, active-record filtering, responsive images in several core components, and centralized absolute canonical/hreflang URL generation. The production SEO layer is nevertheless publishing materially broken signals. Mobile home outputs title `51635800` and description `[object Object]`; the sampled service outputs serialized Lexical JSON as its description; English HTML declares `lang="fa" dir="rtl"`; invalid provider and product URLs return 200; the sitemap inventories legacy provider/type routes but not current mobile service/provider/specialist/product templates; and no entity JSON-LD exists.

The safest high-value program is: repair crawler-visible output and statuses; centralize typed metadata and locale rules; replace the monolithic legacy sitemap; add truthful entity schema; then improve semantic links, measured image/payload performance, and governed GEO/AEO content. No broad URL migration or speculative content factory is recommended.

| Area | Health | Priority | Engineering needed | Main issue |
| --- | --- | --- | --- | --- |
| Crawlability | Minor issues | P2 | Yes | Private/search controls depend too much on robots disallow. |
| Indexability | Serious issue | P0 | Yes | Confirmed soft 404s and inconsistent noindex. |
| Metadata | Critical | P0 | Yes | Verification title, object/JSON descriptions. |
| Canonicals | Minor issues | P2 | Yes | Good helper, incomplete coverage/content eligibility. |
| Structured Data | Serious issue | P1 | Yes | No entity JSON-LD detected. |
| Rendering | Minor issues | P2 | Yes | Core content SSR/ISR; document locale and payload risks remain. |
| Performance | Needs improvement | P2 | Yes | Large HTML/RSC and inconsistent gallery images; no field CWV supplied. |
| Internal Linking | Needs improvement | P2 | Yes | Some entity relations are spans/buttons, not links. |
| International SEO | Serious issue | P0 | Yes | Non-Persian HTML declares Persian/RTL; fallback-aware hreflang absent. |
| Content SEO | Needs improvement | P2 | Yes | Valuable facts exist but rich text and provenance are not normalized. |
| GEO | Needs improvement | P2 | Yes | Entity relationships are fragmented and unstructured. |
| AEO | Needs improvement | P2 | Yes | Answer sections are inconsistent across entities. |
| Measurement | Needs improvement | P2 | Yes | No SEO contract tests or search-console evidence. |

## 2. Audit Scope

Outside-in checks covered `/`, requested Persian home/service, English equivalents, invalid entity URLs, robots and sitemap. Inside-out review covered routes/layouts, middleware, i18n, metadata, repositories/caches, structured data, media, errors, search/facets, database models, CI/tests and Caddy/Kubernetes deployment.

## 3. Audit Limitations

No Search Console, Bing Webmaster, analytics, rankings, crawl logs or CrUX data was available; none is fabricated. Live checks are representative, not a full 4,000-record crawl. No direct production DB query was run. HTML byte sizes are observed document sizes, not CWV. Current source and deployed build can differ; the product soft-404 discrepancy must be reconciled.

## 4. Application Architecture

| Concern | Verified architecture |
| --- | --- |
| Framework | Next.js `15.6.0-canary.41`, React 19, TypeScript, App Router |
| Backend/data | Next server repositories/route handlers plus modular .NET services; PostgreSQL translated entity data |
| Rendering | RSC with client islands; mixed dynamic SSR and `force-static` ISR |
| i18n | `next-intl`; `en, fa, tr, es, ar, ku, de, fr, ru, tg, zh`; Persian default |
| SEO | Root/locale/page metadata; `src/lib/seo/alternates.ts`; dynamic robots/sitemap |
| Cache/deploy | Next cache/ISR, cache wrappers/tags, standalone Node behind Caddy/Kubernetes |
| Media | `next/image`, `ImageWithFallback`, some raw `<img>`; AVIF/WebP enabled |
| Access | Middleware gates protected/admin areas; Caddy separates/noindexes financial host |

Sources: `frontend/webapp/package.json`, `next.config.ts`, `middleware.ts`, `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/i18n/routing.ts`, `deployments/docker/Caddyfile.server`.

## 5. SEO Architecture Map

```text
Browser/crawler → Caddy → middleware (host/locale/auth) → root layout
→ locale layout → page.tsx generateMetadata/RSC → cached repository → PostgreSQL
→ initial HTML + client islands
```

Target: entity data → plain-text normalizer → typed metadata/canonical/eligible alternates → JSON-LD; and paged indexable queries → sitemap index → bounded child sitemaps.

## 6. Public Route Inventory

| Family | Expected policy |
| --- | --- |
| `/[locale]`, `/consulting` | Index |
| `/[locale]/n/app/mobile/home`, `/categories`, `/explore`, `/featured`, `/providers`, `/packages` | Index only stable, valuable server-visible landings |
| `/[locale]/n/app/mobile/service/[id]`, `/provider/[id]`, `/specialist/[id]` | Index active entities |
| `/[locale]/n/app/mobile/shop`, `/shop/category/[slug]`, `/shop/product/[slug]` | Index active canonical pages |
| `/[locale]/service-providers/[id]`, `/type/[id]` | Legacy; retain only if canonical, otherwise redirect after separate decision |
| Search/results/map/shop-search/filter parameters | `noindex, follow`; promote only governed stable landings |
| Gallery utility | Noindex/canonical-to-parent unless uniquely valuable |
| Auth/profile/booking/cart/orders/notifications/medical/wallet/admin/portals | Noindex; never expose authenticated data |
| `/[locale]/share/[token]` | Existing `noindex, nofollow, nocache` is healthy |

## 7. Page Template Inventory

| Template | Route | Source | Rendering | Indexable | Metadata |
| --- | --- | --- | --- | --- | --- |
| Marketing home | `/[locale]` | `src/app/[locale]/(main)/page.tsx` | Server | Yes | Local generator + alternates |
| Mobile home | `/[locale]/n/app/mobile/home` | `.../home/page.tsx` | ISR 120 | Yes after fix | Unsafe inherited default |
| Service | `.../service/[id]` | `page.tsx`, `service-page.tsx` | ISR 3600 | Yes | Local; raw Lexical risk |
| Provider | `.../provider/[id]` | `page.tsx`, `provider-detail-view.tsx` | ISR 3600 | Yes | Local; missing `notFound` |
| Specialist | `.../specialist/[id]` | `page.tsx`, `specialist-page.tsx` | ISR 3600 | Yes | Local |
| Product | `.../shop/product/[slug]` | `page.tsx` | ISR 3600 | Yes | Local; live soft-404 discrepancy |
| Category/shop | `.../categories`, `.../shop/category/[slug]`, `.../shop` | respective pages | Server/ISR | Conditional/Yes | Inconsistent; categories hardcoded English |
| Search | `.../search`, `search-results`, `shop/search` | respective pages | Dynamic/client islands | No | Missing consistent robots |
| Private utilities | multiple | auth/admin/profile/portal groups | Dynamic/auth | No | Inconsistent noindex |

## 8. What Is Already Healthy

- Core service content, H1, headings, links and images appear in initial HTML.
- Sampled home/service use prerender/ISR and return 200.
- `alternates.ts` produces absolute self-canonicals and reciprocal locale URLs.
- Robots is 200, references sitemap, and does not block JS/CSS/media.
- Repositories broadly filter `is_active`; service/specialist call `notFound()`.
- Entity templates normally contain one H1; many images have contextual alt and `sizes`.
- Local WOFF2 uses swap; analytics is after-interactive; Caddy provides TLS/compression/security headers.

## 9. Critical Findings

1. Live metadata corruption (SEO-TECH-001).
2. Wrong server document language/direction (SEO-I18N-001).
3. Soft 404 and utility indexability failures (SEO-INDEX-001).
4. Sitemap omits current commercial route families and is monolithic (SEO-SITEMAP-001).
5. No structured entity graph (SEO-SCHEMA-001).

## 10. Technical SEO

Fix output/status contracts before enhancements. Do not migrate UUID URLs merely for keywords. Validate the production canonical origin and prevent staging indexing. Root `/` is rewritten to `/fa`; ensure it canonically consolidates to the intended locale URL.

## 11. Source-Code SEO Audit

`[locale]/layout.tsx` retains a temporary verification title and unsafe description behavior. Entity pages duplicate concatenation/slicing. Repositories return localized Lexical JSON as strings. `sitemap.ts` queries only providers/types and expands all IDs × locales in memory. Root `<html>` is hardcoded Persian. No JSON-LD utility exists. Some “static” route comments conflict with `force-dynamic` declarations.

## 12. Crawlability

Public content is accessible. Robots disallow is not an index-removal mechanism; private/search templates need HTML/header noindex. AI crawlers inherit wildcard rules. Do not block rendering assets.

## 13. Indexability

Index only public active canonical 200 pages. Missing/inactive entities should 404; transient database failures should 5xx/retry rather than become permanent 404 or indexable error shells. Search and transactional routes must be noindex and absent from sitemap.

## 14. Rendering / JavaScript SEO

Core entity SEO is server-rendered; client components for favorites, booking, currency and carousels are appropriate. Risks are hydration-only document locale correction, non-anchor navigation, large serialized graphs and build-time empty home content cached until ISR. Do not recommend SSR everywhere.

## 15. Metadata Architecture

Create one typed server-only builder. Inputs: locale, canonical path, entity kind/name, normalized description candidates, image and alternate eligibility. Normalize Lexical/translation values, collapse whitespace and truncate Unicode at word boundaries. Fallback: governed summary → short description → plain-text long description → factual entity sentence → localized site fallback.

## 16. Canonical Architecture

Extend `alternatesFor`; keep absolute, self-referencing, query-free locale URLs that resolve directly 200. Choose one provider/home route family only after data/product review. Any later migration requires permanent redirects, internal-link/sitemap/hreflang switch, monitoring and reversible rollout.

## 17. Sitemap Architecture

Current XML is valid/200 but only static, provider-type and provider legacy routes; it lacks current services, specialists, products/categories and meaningful lastmod. Use an index and bounded, keyset-paged children with active/indexable filters, canonical helpers and updated timestamps. Do not advertise fallback-only locales as genuine translations.

## 18. Robots / Crawler Policy

Wildcard currently applies to Googlebot, Bingbot, OAI-SearchBot, GPTBot, ChatGPT-User, Google-Extended, ClaudeBot and PerplexityBot. Product/Legal/SEO must distinguish search discovery, user-triggered retrieval and training. Do not assume allow or block is universally correct.

## 19. URL & Routing Architecture

Locale prefixes and product slugs are appropriate; UUID entity IDs are stable. Query/filter URLs must not create an indexable universe. Unsupported locales are rejected by `hasLocale`. Preserve stable URLs unless measurable value justifies migration.

## 20. International SEO

Routing declares 11 locales while Next message declaration lists eight, and SQL often falls back to `en-US`. Create one locale registry (code, BCP47, direction, catalog, fallback, enabled/indexable). Expose translation provenance and emit only reciprocal, valid hreflang destinations with approved fallback behavior.

## 21. Structured Data / Entity Modeling

Use server-rendered connected JSON-LD: `Organization`/`WebSite`; `Service`; provider `Organization`/appropriate factual subtype; specialist `Person` or `Physician` only with evidence; `Product`/`Offer` only with visible current price/availability; `BreadcrumbList`; optional visible FAQ. Stable `@id` = canonical entity URL. Never invent ratings, credentials, addresses, offers or authorship.

## 22. Internal Linking

Data relationships exist but product related services are plain `<span>` chips and some navigation is action-like. Add reusable entity links and visible breadcrumbs; cap related lists by activity/relevance. Keep actions as buttons and navigation as anchors.

## 23. Performance / Core Web Vitals

Observed HTML: home ~544,659 bytes; sampled service ~396,993 bytes. Service serializes broad recommendation/gallery/entity data. Product gallery uses raw eager `<img>` for every image. Healthy: AVIF/WebP, many `sizes`, WOFF2, ISR and Caddy compression. These are source/lab risks, not field CWV claims; measure mobile Lighthouse/WebPageTest and RUM separately.

## 24. Mobile SEO

Viewport and mobile-first layouts exist. Validate 360/390/768/desktop for LCP priority, CLS-safe media, tap semantics and server-visible primary content.

## 25. Content SEO

Database content includes rich first-party service/provider/staff/product facts. Normalize and expose them; do not manufacture generic keyword text or arbitrary word counts. Index entity-locale pages only with distinct identity and sufficient factual value.

## 26. E-E-A-T / Trust

For medical content expose factual provider identity, responsible practitioner/credentials, location, policies, reviewer/review date and sources only when modeled. Clearly distinguish provider-supplied promotion, platform verification and editorial guidance.

## 27. GEO

Add visible concise entity facts, stable IDs, named relationships, provenance and citations for external claims. Keep visible facts and schema consistent. This improves comprehension but cannot guarantee AI citation.

## 28. AEO

Service pages should answer what/who/where/price basis/duration/eligibility/process/inclusions/policies/next step. Provider: identity/location/services/staff/hours/booking. Specialist: specialty/credentials/languages/affiliation/services. Product: attributes/price/availability/delivery/returns/alternatives. Render only governed available answers.

## 29. AI Crawler Accessibility

Keep factual content and links in HTML. Record intentional user-agent policy; test exact agents against HTML/media/robots. Never cloak.

## 30. Image SEO

Retain contextual alt and responsive Next images. Add governed media alt/caption only where derivation is insufficient. Prioritize only LCP image, lazy-load galleries, supply dimensions/aspect ratios, handle GIF/video intentionally, and consider image sitemap only after canonical entity sitemaps.

## 31. Error / 404 Handling

Standardize repository outcomes: found, absent/inactive, deleted and transient failure. Unknown/inactive → 404; deliberate retired policy may use 410; true replacement → 301/308; outage → retryable error. Avoid 200 error shells.

## 32. Search / Faceted Navigation

Use `noindex, follow`, exclude from sitemap, ignore tracking/presentation parameters. Promote proven queries such as service+location only into curated stable landing routes with unique facts and inventory, not indexed query permutations.

## 33. Analytics & SEO Observability

Add smoke checks and structured logs for metadata/sitemap errors, public 404/5xx/redirect dashboards, sitemap sampling, and documented Search Console/Bing ownership/review cadence. Do not log private content.

## 34. Automated SEO Regression Testing

Unit-test text/canonical/locale/schema utilities; integrate robots/sitemap/metadata/indexability; E2E active/missing/inactive entities in `fa/en/ar` and missing-translation cases; smoke status/title/description/canonical/hreflang/H1/JSON-LD/images/cache after deploy.

## 35. Implementation Requirements

### SEO-TECH-001 — Normalize metadata and remove verification output

- [ ] Status: Not implemented
- Priority: P0 — Critical
- Owner: Full-Stack, Content
- Category: Metadata
- Confidence: Confirmed
- Effort: M
- Risk: Low

#### Affected routes
Home and all database entity templates.

#### Source
`src/app/[locale]/layout.tsx`; mobile home/service/provider/specialist/product pages; service/provider repositories; existing Lexical utilities.

#### Current behavior / Problem / Evidence
Home live title is `51635800`, description `[object Object]`; sampled service meta/OG/Twitter description is serialized Lexical JSON. Temporary shared title plus untyped object/rich-text slicing causes invalid snippets.

#### Root cause
No typed boundary between translation objects, Lexical documents and SEO strings.

#### Required solution / Implementation notes
Restore localized brand defaults. Add safe `toSeoPlainText`: accept strings, parse known Lexical JSON, extract text nodes, collapse whitespace, reject objects/HTML/JSON, Unicode word-boundary truncate, and apply deterministic fallbacks. Keep the Enamad meta tag if needed, never its number as title.

#### Acceptance criteria
- [ ] Human localized title/description on every sampled indexable template.
- [ ] No verification number, `[object Object]`, Lexical keys, JSON or HTML in metadata.
- [ ] OG/Twitter use the same normalized values.

#### Tests / Validation
- [ ] Unit plain/translation/Lexical/invalid/RTL/emoji tests.
- [ ] Metadata integration per template; curl/parse production in three locales.

#### Dependencies
None.

#### Regression risks / Rollback
Whitespace loss or duplicate fallbacks. Revert adoption per template while retaining safe localized defaults.

### SEO-I18N-001 — Server-correct `lang` and `dir`

- [ ] Status: Not implemented
- Priority: P0 — Critical
- Owner: Full-Stack, Frontend
- Category: International SEO
- Confidence: Confirmed
- Effort: M
- Risk: Medium

#### Affected routes
All `/[locale]/**`.

#### Source
`src/app/layout.tsx`, `[locale]/layout.tsx`, locale-sync provider, `src/i18n/routing.ts`.

#### Current behavior / Problem / Evidence
Root hardcodes Persian/RTL and client corrects after hydration. Live English home/service still return Persian/RTL in HTML, contradicting content/canonical/hreflang.

#### Root cause
The document root sits above the locale segment.

#### Required solution / Implementation notes
Prototype a pinned-Next-compatible server layout that renders validated locale attributes initially. Centralize `localeDirection`. Preserve financial/root-not-found paths and avoid the next-intl request-cache bug documented in source.

#### Acceptance criteria
- [ ] Every locale has correct initial `lang/dir`; no hydration mismatch.
- [ ] Unsupported locales do not serve mislabeled content.

#### Tests / Validation
- [ ] Registry unit test; HTML integration for 11 locales; static build and production curl.

#### Dependencies
Coordinate with SEO-I18N-002.

#### Regression risks / Rollback
Layout restructure can break static generation. Feature-flag/revert the complete layout change, never ship duplicate document roots.

### SEO-INDEX-001 — Enforce entity statuses and route-group noindex

- [ ] Status: Not implemented
- Priority: P0 — Critical
- Owner: Full-Stack, Backend, DevOps
- Category: Indexability / Errors
- Confidence: Confirmed
- Effort: M
- Risk: Medium

#### Affected routes
Provider/product invalid entities; search/facets; auth/account/booking/cart/orders/medical/admin/portals.

#### Source
Provider/product pages and repositories; search/auth/private layouts; `robots.ts`, middleware, Caddy.

#### Current behavior / Problem / Evidence
Invalid provider and product live returned 200; invalid service/specialist returned 404. Provider source converts missing data to an error view. Utility routes lack consistent noindex; robots disallow cannot prevent indexing.

#### Root cause
Absent/transient outcomes and indexability rules are scattered.

#### Required solution / Implementation notes
Use discriminated repository outcomes; absent/inactive 404, transient failure error/5xx. Add server meta/header `noindex,nofollow` for private and `noindex,follow` for search. Keep auth enforcement and sitemap exclusion. Reconcile deployed product behavior.

#### Acceptance criteria
- [ ] Missing/inactive entities 404; outages do not masquerade as 404/200.
- [ ] Search/private policies render server-side; no protected data leaks.

#### Tests / Validation
- [ ] Active/inactive/malformed/outage matrix; guest E2E; production status/header crawl.

#### Dependencies
None.

#### Regression risks / Rollback
Broad noindex or outage-as-404. Roll back by route group, retain explicit result types.

### SEO-META-001 — Central typed metadata/canonical builder

- [ ] Status: Not implemented
- Priority: P1 — High
- Owner: Full-Stack
- Category: Metadata / Canonical
- Confidence: Strong evidence
- Effort: M
- Risk: Low

#### Affected routes
All public templates.

#### Source
`src/lib/seo/alternates.ts`, public page metadata functions, env configuration.

#### Current behavior / Problem / Root cause
URL helper is shared but title/description/social logic is duplicated and categories are hardcoded English. Template-by-template evolution causes drift.

#### Required solution / Implementation notes
Builder accepts normalized facts and generates title, description, canonical, eligible alternates, OG and Twitter. Validate HTTPS production origin; strip query/tracking; page files retain mapping only.

#### Acceptance criteria
- [ ] One absolute query-free locale-correct canonical returning 200.
- [ ] Consistent localized social metadata; no client-state dependency.

#### Tests / Validation
- [ ] Builder/origin/unit; template integrations; tracking-parameter smoke.

#### Dependencies
SEO-TECH-001.

#### Regression risks / Rollback
Wrong mapper could merge entities. Migrate/revert template-by-template.

### SEO-I18N-002 — Unified locale registry and translation-aware hreflang

- [ ] Status: Not implemented
- Priority: P1 — High
- Owner: Full-Stack, Content
- Category: International SEO
- Confidence: Strong evidence
- Effort: L
- Risk: Medium

#### Affected routes / Source
All localized public pages/sitemaps; `src/i18n/**`, `next.config.ts`, `alternates.ts`, repositories using `get_translation_t(...,'en-US')`, message catalogs.

#### Current behavior / Problem / Evidence
Routes advertise 11 languages; plugin declaration lists eight; repositories can silently fall back while all alternates are emitted.

#### Root cause
UI locale support is treated as complete entity translation support.

#### Required solution / Implementation notes
One registry with BCP47, direction, catalog, fallback and enabled/indexable state. Expose translation provenance. Emit valid reciprocal entity alternates under a documented per-entity fallback policy; preserve x-default intent.

#### Acceptance criteria
- [ ] Routing/messages/metadata/sitemap/schema share registry.
- [ ] Every alternate is 200, reciprocal and approved; missing translations follow policy.

#### Tests / Validation
- [ ] Registry consistency, provenance, reciprocity, full/partial/missing translation E2E.

#### Dependencies
SEO-I18N-001, SEO-META-001.

#### Regression risks / Rollback
Over-removing alternates. Roll out eligibility after registry consistency; retain old map behind flag.

### SEO-SITEMAP-001 — Scalable canonical entity sitemap index

- [ ] Status: Not implemented
- Priority: P1 — High
- Owner: Full-Stack, Backend
- Category: Sitemap
- Confidence: Confirmed
- Effort: L
- Risk: Medium

#### Affected routes / Source
`/sitemap.xml`, new child sitemaps; `src/app/sitemap.ts`; provider/specialist/service/shop repositories.

#### Current behavior / Problem / Evidence
One response loads all providers/types, expands 11 locales, lists legacy routes only, omits lastmod, silently degrades on DB error. Live XML confirms legacy paths.

#### Root cause
Generator predates current mobile entity architecture.

#### Required solution / Implementation notes
Sitemap index + bounded keyset-paged children by route family, stable ordering, canonical/locale helpers, active/public/indexable filters and meaningful `updated_at`. Observe failures; exclude redirects/noindex/private/fallback-thin pages.

#### Acceptance criteria
- [ ] Applicable landing/service/provider/specialist/product/category URLs included.
- [ ] Every loc returns direct 200/self-canonical; inactive/deleted/noindex excluded.
- [ ] Bounded, cached deterministic children with matching alternates/lastmod.

#### Tests / Validation
- [ ] Boundary/XML/DB fixture tests; stream-parse staging and sample status/canonical before submission.

#### Dependencies
SEO-META-001, SEO-I18N-002, SEO-INDEX-001.

#### Regression risks / Rollback
DB load/duplicates. Keep old generator available until new index validates.

### SEO-SCHEMA-001 — Truthful connected JSON-LD

- [ ] Status: Not implemented
- Priority: P1 — High
- Owner: Full-Stack, SEO, Content
- Category: Structured Data / Entities
- Confidence: Confirmed
- Effort: L
- Risk: Medium

#### Affected routes / Source
Public home/entity pages; new `src/lib/seo/schema/**`; entity repositories.

#### Current behavior / Problem / Evidence
No Schema.org/JSON-LD source or sampled live scripts. Entity identity/relationships must be inferred.

#### Root cause
No schema architecture.

#### Required solution / Implementation notes
Typed builders and XSS-safe server renderer. Stable canonical `@id`; types/properties listed in Section 21; dedupe root/page graphs; omit unknown data and keep visible/schema parity.

#### Acceptance criteria
- [ ] Valid localized server JSON-LD with connected unique IDs.
- [ ] Offer/review/credential facts only when current, visible and supported.

#### Tests / Validation
- [ ] Serializer/XSS and shape tests; page consistency; applicable official validators.

#### Dependencies
SEO-META-001.

#### Regression risks / Rollback
Stale offers/duplicate nodes. Disable per schema type without changing pages.

### SEO-LINK-PERF-001 — Semantic links, responsive media and bounded payloads

- [ ] Status: Not implemented
- Priority: P2 — Medium
- Owner: Frontend, Full-Stack
- Category: Internal Linking / Performance / Image SEO
- Confidence: Strong evidence
- Effort: L
- Risk: Medium

#### Affected routes / Source
Home/service/provider/specialist/product/category; detail/card/breadcrumb/image components; page DTOs.

#### Current behavior / Problem / Evidence
Related product services are spans, some navigation is button-like; raw eager galleries and large RSC data inflate mobile delivery. Live HTML baselines are in Section 23.

#### Root cause
No shared semantic entity-link or media-loading/DTO budget contract.

#### Required solution / Implementation notes
Reusable entity anchors/breadcrumbs; bounded active relationships. Only likely LCP image priority, lazy secondary media, correct `sizes`/dimensions, supported raster through Next. Split/defer secondary data without removing core HTML. Measure before/after; warm ISR after deploy.

#### Acceptance criteria
- [ ] Major relations are initial-HTML anchors to canonical 200 URLs.
- [ ] One likely eager/LCP image; galleries responsive/lazy/CLS-safe.
- [ ] Measured byte/lab improvement with server core content retained.

#### Tests / Validation
- [ ] Semantics/link integrity, visual breakpoints, network inspection, Lighthouse/WebPageTest comparison.

#### Dependencies
SEO-META-001 for target URLs.

#### Regression risks / Rollback
Dead links, wrong priority, hidden crawl content. Roll out/revert by component/template.

### GEO-AEO-001 — Governed entity facts, trust and direct answers

- [ ] Status: Not implemented
- Priority: P2 — Medium
- Owner: Full-Stack, Content, Product, SEO
- Category: GEO / AEO / E-E-A-T
- Confidence: Strong evidence
- Effort: L
- Risk: Medium

#### Affected routes / Source
Service/provider/specialist/product/valuable category pages; repositories, admin/provider forms, new fact/answer components, schema mappers.

#### Current behavior / Problem
Useful facts/process/FAQ data exists but is fragmented and completeness/provenance vary; recurring questions are not consistently answered.

#### Root cause
No reusable entity fact/answer contract or content completeness governance.

#### Required solution / Implementation notes
First run completeness reporting. Render concise identity/relationship/location/update/source facts and Section 28 answers only from governed data. Distinguish provider-supplied/platform-verified/editorial claims. Add only necessary nullable fields (media alt/caption, reviewer/date/sources/indexability audit), with additive migrations and safe backfill. FAQ schema must mirror visible FAQ.

#### Acceptance criteria
- [ ] Users can answer what/who/where/source/updated and entity questions when data exists.
- [ ] No empty/fabricated/unverified claims; visible facts match JSON-LD.
- [ ] Any schema migration is additive/backward compatible and publishing UI previews output.

#### Tests / Validation
- [ ] Completeness report, migration/form/provenance/component tests, localized content QA and visible/schema comparison.

#### Dependencies
SEO-SCHEMA-001; new fields only after completeness analysis.

#### Regression risks / Rollback
Spam/stale regulated claims. Disable modules/new-field reads; retain additive columns.

### SEO-OBS-001 — SEO contracts, monitoring and crawler policy

- [ ] Status: Not implemented
- Priority: P2 — Medium (`SEO-AI` policy portion P3)
- Owner: Full-Stack, DevOps, SEO, Product, Legal
- Category: Tests / Observability / AI crawler policy
- Confidence: Strong evidence
- Effort: M
- Risk: Low (policy decision Medium)

#### Affected routes / Source
All critical templates, robots/sitemaps/middleware; Vitest/CI/deploy smoke; `robots.ts`, Caddy.

#### Current behavior / Problem
Live regressions escaped; sitemap partial failures are silent; AI bot behavior is implicit wildcard policy.

#### Root cause
SEO output is not an application contract and crawler classes lack recorded business policy.

#### Required solution / Implementation notes
Deterministic fixture tests and rate-limited read-only post-deploy smoke; structured sitemap/metadata errors; public status dashboards. Record per-class search/user-fetch/training decision for named bots, then implement exact rules without blocking assets/cloaking. Establish Search Console/Bing ownership externally.

#### Acceptance criteria
- [ ] CI catches corrupt/missing metadata, lang/dir, canonical, status and JSON-LD.
- [ ] Post-deploy template/locale smoke and sitemap sampling run with alerts.
- [ ] Bot decision matrix has owner/date/rationale; robots matches it.

#### Tests / Validation
- [ ] Failure-injection; exact user-agent fetch; verify alert and webmaster sitemap processing.

#### Dependencies
Final contracts; Product/Legal for crawler policy.

#### Regression risks / Rollback
Flaky/load-heavy smoke or unintended bot loss. Disable unstable smoke; restore wildcard policy; retain deterministic CI.

## 36. Prioritized Backlog

| ID | Priority | Effort | Risk |
| --- | --- | --- | --- |
| SEO-TECH-001 | P0 | M | Low |
| SEO-I18N-001 | P0 | M | Medium |
| SEO-INDEX-001 | P0 | M | Medium |
| SEO-META-001 | P1 | M | Low |
| SEO-I18N-002 | P1 | L | Medium |
| SEO-SITEMAP-001 | P1 | L | Medium |
| SEO-SCHEMA-001 | P1 | L | Medium |
| SEO-LINK-PERF-001 | P2 | L | Medium |
| GEO-AEO-001 | P2 | L | Medium |
| SEO-OBS-001 | P2/P3 | M | Low/Medium |

## 37. Release Plan

- Release 0 — SEO-TECH-001, SEO-I18N-001, SEO-INDEX-001 and their regression tests.
- Release 1 — SEO-META-001 and registry foundation of SEO-I18N-002.
- Release 2 — SEO-SITEMAP-001 and SEO-SCHEMA-001 by entity template.
- Release 3 — SEO-LINK-PERF-001 after baselines.
- Release 4 — completeness/model portion of GEO-AEO-001.
- Release 5 — visible GEO/AEO fact/answer enrichment.
- Release 6 — remaining SEO-OBS-001 monitoring, webmaster operations and approved AI policy.

## 38. Dependency Graph

```text
TECH-001 → META-001 ─┬→ SITEMAP-001 → LINK/PERF
I18N-001 → I18N-002 ─┘       ↓
INDEX-001 ────────────────────┘
META-001 → SCHEMA-001 → GEO/AEO-001
OBS-001 starts in Release 0 and expands with every contract.
```

Parallel: metadata normalizer and indexability matrix; locale-layout prototype and sitemap query design; schema data mapping and performance baselines.

## 39. Full-Stack Developer Execution Plan

### Batch 1 — Crawler-visible correctness

**Objective:** repair snippets, document locale and status/noindex. **Requirements:** TECH-001, I18N-001, INDEX-001, initial OBS. **Files:** root/locale layouts, entity pages/repositories, private/search layouts, tests, optional scoped Caddy headers. **Database:** none. **API:** internal discriminated repository result only. **Frontend:** metadata/document/not-found/noindex. **Backend:** absent vs transient outcome. **Infrastructure:** optional X-Robots-Tag. **Tests:** parser, 11-locale HTML, status/noindex matrix, guest E2E. **Deploy:** rolling, warm fixtures, verify both replicas. **Smoke:** `fa/en/ar`, valid/invalid entities, search/private routes. **DoD:** all P0 acceptance criteria pass live.

### Batch 2 — Shared SEO/i18n foundation

**Objective:** predictable localized metadata. **Requirements:** META-001, I18N-002. **Files:** `src/lib/seo/**`, `src/i18n/**`, `next.config.ts`, public pages/repositories. **Database:** none. **API:** optional translation provenance in internal DTOs. **Frontend/backend:** builder migration and provenance. **Infrastructure:** production-origin validation. **Tests:** canonical/origin/registry/hreflang/template. **Deploy:** service → provider → specialist → product → landings. **Smoke:** full/partial/missing translations and query stripping. **DoD:** all indexable templates use shared contract.

### Batch 3 — Discovery and entity graph

**Objective:** expose canonical inventory and relationships. **Requirements:** SITEMAP-001, SCHEMA-001. **Files:** sitemap routes/repositories, schema utilities/pages. **Database:** none unless query plan proves additive index/timestamp need. **API:** internal keyset queries. **Frontend:** JSON-LD/breadcrumb alignment. **Backend:** paged eligibility queries. **Infrastructure:** cache/alerts and later search-engine submission. **Tests:** XML boundaries/reconciliation, DB fixtures, serializer/schema validation. **Deploy:** publish/validate children then switch index. **Smoke:** parse all XML, sample statuses, one schema per type/locale. **DoD:** active canonical inventory discoverable and schema truthful.

### Batch 4 — Links and measured performance

**Objective:** improve crawl paths/mobile delivery. **Requirements:** LINK-PERF-001. **Files:** cards/details/breadcrumb/image wrappers, DTOs, warm-up. **Database:** none. **API:** optional smaller internal DTOs. **Frontend/backend:** semantic links, image policy, defer secondary data. **Infrastructure:** cache warming/RUM. **Tests:** semantics, integrity, visuals, lab comparison. **Deploy:** one template at a time. **Smoke:** initial HTML and media network. **DoD:** byte/lab improvement without content/visual regression.

### Batch 5 — Content, GEO and AEO

**Objective:** trustworthy facts and answers. **Requirements:** GEO-AEO-001. **Files:** optional additive migrations, forms, repositories, fact/answer/schema components. **Database:** completeness report first; additive nullable changes/backfill only. **API:** optional backward-compatible provenance fields. **Tests:** migrations/forms/provenance/localized QA. **Deploy:** workflow first, small curated pilot second. **Smoke:** complete/incomplete records and fallback locales. **DoD:** question matrix passes where data exists; nothing fabricated.

### Batch 6 — Operations/policy

**Objective:** durable detection and intentional crawler policy. **Requirements:** remaining OBS-001. **Files:** CI, deploy smoke, monitoring, robots/docs. **Database/API:** none. **Infrastructure:** scheduled smoke/alerts/webmaster setup. **Tests:** failure injection and exact bot agents. **Deploy:** policy separately for attribution. **DoD:** monitored contracts, named owner/cadence and approved robot behavior.

## 40. Deployment & Rollback Strategy

Use rolling, template-by-template changes. Never combine URL migration with metadata/schema refactors. Build representative routes for 11 locales, warm ISR after DB is reachable, verify both replicas/Caddy, and retain old sitemap until validation. Database changes must be additive/backward compatible. A future URL migration needs separately approved redirect map, internal-link/sitemap/canonical transition, monitoring and reversible rules.

## 41. Post-Deployment Validation

Immediately parse no-JS HTML for `fa/en/ar`: status, lang/dir, title/description/canonical, robots, reciprocal hreflang, one H1, visible content, JSON-LD, image alt/dimensions. Test invalid/inactive entities and private/search routes. Parse sitemap children and sample direct 200/self-canonical targets. Then monitor public 4xx/5xx/redirects, sitemap errors, webmaster processing and lab vs field performance separately.

## 42. Deferred Opportunities

Keyword slugs; programmatic location/service landings; image sitemaps; blog/editorial system; PPR/edge rewrite; comparison pages. Pursue only with demand, unique data, governance and migration value.

## 43. Audit Evidence

| Evidence (2026-09-27) | Result |
| --- | --- |
| `/` | 200 middleware rewrite to `/fa` |
| Persian mobile home | 200 ISR, ~544,659 bytes, `51635800`, `[object Object]` |
| English mobile home | 200, `<html lang="fa" dir="rtl">`, same broken metadata |
| Requested Persian service | 200 ISR, ~396,993 bytes, canonical + 11 alternates, localized title, Lexical JSON description, server content/images |
| English service | Localized content/title but Persian document attributes and Lexical description |
| Invalid service/specialist | 404 |
| Invalid provider/product | 200 |
| Robots | 200, sitemap reference and private/API disallows |
| Sitemap | 200; monolithic legacy providers/types; current mobile entity families absent from generator |
| JSON-LD | None in sampled HTML or source search |

Primary source paths: `src/app/layout.tsx`; `[locale]/layout.tsx`; `src/i18n/routing.ts`; `middleware.ts`; `src/lib/seo/alternates.ts`; `src/app/robots.ts`; `src/app/sitemap.ts`; mobile home/service/provider/specialist/product/search/categories pages and components; service/provider/specialist/shop repositories; `next.config.ts`; `Caddyfile.server`; Kubernetes ingress; deployment smoke scripts.

# Developer Backlog

## P0 — Fix immediately
- [ ] SEO-TECH-001
- [ ] SEO-I18N-001
- [ ] SEO-INDEX-001

## P1 — High impact
- [ ] SEO-META-001
- [ ] SEO-I18N-002
- [ ] SEO-SITEMAP-001
- [ ] SEO-SCHEMA-001

## P2 — Important
- [ ] SEO-LINK-PERF-001
- [ ] SEO-OBS-001

## P3 — Optimization
- [ ] SEO-OBS-001 — AI crawler policy portion

## GEO / AEO
- [ ] GEO-AEO-001
