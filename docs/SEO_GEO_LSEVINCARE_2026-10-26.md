# lsevincare.com SEO / GEO: audit and release batch (2026-10-26)

Audience: engineers releasing the webapp and the people running search and content.
Tracker (status, owners, off-site tasks): https://claude.ai/artifact/DNg7jqCPBhP6pwA73rQ3fG

Branch `feat/seo-geo-lsevincare` is built on `perf/seo-query-optimization-20261026` (lsevincare.com as the
canonical origin, new sitemap, migration 0084) and merges `fix/frontend-checklist-a11y` (locale-root redirects,
accessibility fixes). Releasing it releases both.

## What the audit found on the live site

| # | Finding | Effect |
|---|---|---|
| 1 | Every page's canonical, hreflang, robots `Sitemap:` and all sitemap URLs point to `appmain.lsevin.com`. | Google folds lsevincare.com into appmain; `site:lsevincare.com` returns nothing. |
| 2 | `/` and `/fa` return 200 with a self-canonical and a 1-second meta refresh to `/n/app/mobile/home`. | The strongest URL sends mixed signals; `/en` visitors landed on Persian. |
| 3 | Sitemap = 1,837 legacy `/service-providers/{id}` + 132 `/type/{id}`; none of 2,809 services, 275 specialists, 303 products; no lastmod. | Commercial pages are undiscovered. |
| 4 | Service text exists in Persian for 2,726 services but in English for 362 and Arabic for 230; all 11 locales were indexable. | ~25,000 near-duplicate URLs (Persian text in translated chrome). |
| 5 | HTTP `Link` header (next-intl) lists all 11 locales on the request host; HTML hreflang lists appmain. | Two disagreeing hreflang sets; engines ignore both. |
| 6 | `<html lang="fa" dir="rtl">` on every locale. | Wrong language signal for Bing; LTR pages render mirrored until hydration. |
| 7 | No JSON-LD anywhere. | No entity graph for Google or AI answer engines. |
| 8 | Brand «ال سوین» / "L Sevin"; generic titles; `/consulting` title is `HomePage.page.title`; mobile home has no H1; placeholder descriptions such as "." | Weak snippets and relevance. |
| 9 | Home hero image `loading="lazy"` is the LCP element (Lighthouse mobile: Performance 43, CLS 0.24). | Slower LCP. |
| 10 | No page targets medical-travel queries in fa/ar/en; Arabic SERPs for «العلاج في ايران» show no commercial competitor. | Content gap and opportunity. |

## What this batch changes

- **Single canonical origin:** `NEXT_PUBLIC_SEO_URL=https://lsevincare.com` (from the perf branch) for canonicals, hreflang, sitemap, robots, JSON-LD.
- **Locale roots:** `/` and `/{locale}` redirect to `/{locale}/n/app/mobile/home` (next.config).
- **Locale-aware indexing** (`src/lib/seo/locale-eligibility.ts`): an entity's locale version is indexable only when its main text exists in that language (≥ 40 characters, not a copy of the Persian). Other versions are `noindex,follow` and are left out of hreflang and the sitemap. Translating a description makes that version indexable automatically.
- **Sitemap:** provider, service, specialist (indexable locales only), shop products and categories (Persian), guides with lastmod; legacy routes removed.
- **One hreflang source:** next-intl `alternateLinks: false`; hreflang uses `ckb` for the Sorani `/ku` pages.
- **Language signals:** `Content-Language` header per locale (next.config headers); a pre-paint script sets `<html lang/dir>` from the URL.
- **Structured data** (`src/lib/seo/entity-schema.ts`): Organization/WebSite with brand alternates (السوین, لسوين, Lsevin…), provider as Hotel/Hospital/MedicalClinic/Dentist/… by type, Service, Person, Product + Offer, BreadcrumbList. No ratings: part of the reviews are admin-created, and self-served business stars are not eligible.
- **On-page:** brand spelling, keyword titles per locale, a descriptive home H1, real `/consulting` metadata in 11 languages, placeholder descriptions fall back, hero image priority.
- **Guides** (`/fa|ar|en/medical-tourism`, `/visa`, `/medical-hotels`, `/mashhad`, `/rhinoplasty`): server-rendered, sourced, dated, with FAQPage / HowTo / MedicalWebPage schema; linked from the home page; other languages 404 (no machine filler).
- **`/llms.txt`** for AI assistants.

## Deployment

- Jenkins must pass `NEXT_PUBLIC_SEO_URL=https://lsevincare.com` at build time (already in `Jenkinsfile.main` on this branch) and the runtime config must match (`deployments/kubernetes/platform/config/platform.env`).
- Migration `0084_translation_empty_fast_path.sql` runs automatically in the webapp `migrate` init container.
- After deploy: purge Cloudflare cache for `/robots.txt`, `/sitemap.xml` and HTML; check a provider page's canonical on lsevincare.com.

## After release (owner actions)

1. Verify lsevincare.com as a domain property in Google Search Console (DNS TXT in Cloudflare) and submit `https://lsevincare.com/sitemap.xml`.
2. Bing Webmaster Tools (import from GSC) and Yandex Webmaster (ru/tg markets).
3. Once the canonical is live and indexed, 301 public pages on appmain.lsevin.com to lsevincare.com (keep auth, API, payment callbacks).
4. Medical reviewer for the guides (name and council number on the page).
5. See the tracker for performance, content and authority work.

## Verification

Filled in at release time; see the commit message and the tracker row T30.
