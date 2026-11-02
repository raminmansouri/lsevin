# lsevin.com as the primary domain — migration plan

Audience: engineers and DevOps running the cutover, and whoever owns Search Console.

Decision (2026-11-02): the webapp will be served on **lsevin.com** and **lsevincare.com**; **lsevin.com is the primary brand domain**, so search engines must index lsevin.com.

## Current state (checked 2026-11-02)

| Host | Serves | Indexing signals |
|---|---|---|
| lsevincare.com | Next.js webapp (server B, via Cloudflare + Worker `lsevincare-geo`) | canonical, sitemap, hreflang, JSON-LD all on lsevincare.com since 2026-10-28 |
| appmain.lsevin.com | same webapp | canonical points to lsevincare.com |
| lsevin.com | **WordPress 7.1.4** (Cloudflare) | own sitemap: 324 URLs (55 en + 53 ar + 1 tr procedure pages, 37 blog posts, 171 doctor profiles, 3 shop utilities, 2 authors, home). App paths such as `/fa/n/app/mobile/home` return 404 there. |

The search engine available to the agent returned no lsevin.com results, so WordPress rankings are probably small, but its content (procedure pages in English and Arabic, blog, doctor profiles) is the brand's largest body of indexable text and must not be dropped.

Inventory with proposed handling per URL: [lsevin-com-wordpress-urls.csv](lsevin-com-wordpress-urls.csv).

## Do not switch canonicals early

`PRIMARY_PUBLIC_ORIGIN` in `frontend/webapp/src/lib/seo/origin.ts` decides the indexed domain. Changing it to `https://lsevin.com` while lsevin.com still serves WordPress would point every canonical, hreflang, sitemap and JSON-LD URL at pages that 404. Switch it **in the same release window** as the DNS/routing change below, never before.

Already prepared (safe now, no effect until requests arrive on lsevin.com):

- `lsevin.com` and `www.lsevin.com` are trusted public hosts (`src/lib/http/public-origin.ts`), so sign-in and cart cookies stay on lsevin.com.
- Server actions already allow `lsevin.com` / `*.lsevin.com` (`next.config.ts`).
- Organization JSON-LD lists `lsevin.com` as a brand alternate.

## Decision needed: what happens to the WordPress content

| Option | What it means | SEO effect | Effort |
|---|---|---|---|
| **A. Path split at the edge (recommended first step)** | Cloudflare Worker on lsevin.com sends app paths to server B and everything else (WordPress inventory, `/blog/*`, `/doctors/*`, `/wp-*`, `/*-in-iran/`, `/ar/*-in-iran/`) to WordPress | No URL lost; both bodies of content stay indexable on one domain | Worker + routing tests (DevOps) |
| B. Migrate WordPress content into the app | Rebuild procedure pages, blog and doctor profiles as app pages; 301 each old URL to its new URL | Clean single stack; temporary ranking dip while Google re-crawls | Large content + data work |
| C. 301 everything to the closest app page | Old URLs redirect to guides / category pages | Many distinct pages collapse onto a few targets; Google treats many of these as soft 404s | Small, but loses content |

Overlap to resolve under any option: WordPress `/rhinoplasty-in-iran/`, `/hair-transplant-in-iran/`, `/ivf-in-iran/` and the dental pages cover the same topics as the app guides `/{en,ar}/medical-tourism/{rhinoplasty,hair-transplant,ivf,dental}`. Keep **one** canonical page per topic and language (merge the better content into it, 301 the other), or the two compete for the same queries.

### Option A routing rules (sketch)

Route to the **app** when the path is:

- `/` (home → app redirects to `/fa/n/app/mobile/home`), `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, `/sw.js`, `/_next/*`, `/api/*`, `/app-health`, `/files/*`
- `/{fa|en|ar|tr|ku|ru|tg|zh|de|fr|es}` and `/{locale}/n/*`, `/{locale}/medical-tourism*`, `/{locale}/consulting`, `/{locale}/tours*`, `/{locale}/privacy-policy`, auth and account paths (`/{locale}/sign-in`, `/sign-up`, `/otp`, `/profile`, …)

Route to **WordPress** otherwise. Watch the `/ar/` and `/tr/` collisions: WordPress uses `/ar/<slug>/` for procedure pages, the app uses `/ar/n/…` and `/ar/medical-tourism…`, so match the app prefixes first. The app sitemap and WordPress sitemap must both be listed in `robots.txt` (or merged into a sitemap index).

## Cutover checklist (one release window)

1. **Decide** option A, B or C and the per-topic canonical pages (product/SEO owner).
2. **DNS/TLS:** lsevin.com and www.lsevin.com proxied in Cloudflare to the router (Worker for option A, or server B directly for B/C); certificates valid.
3. **Ingress:** add `lsevin.com` and `www.lsevin.com` to `deployments/kubernetes/platform/ingress.yaml` (and Caddy on server A if the Iran site serves it).
4. **API CORS:** add `https://lsevin.com` to the .NET API `CorsOptions__AllowedUrls__*` (k8s secret; see `secrets.example.yaml`).
5. **Code:** set `PRIMARY_PUBLIC_ORIGIN = "https://lsevin.com"` (and `NEXT_PUBLIC_SEO_URL` in `Jenkinsfile.main` / `platform.env`), update the e2e/probe expected origin, release through Jenkins.
6. **Redirects:** apply the CSV decisions (WordPress utilities `/cart/`, `/wishlist/`, `/products-compare/` → app shop; anything migrated → its new URL, 301).
7. **lsevincare.com:** keep serving (mobile apps and the Iran geo-split use it); canonicals then point to lsevin.com automatically. Optionally 301 public GET pages to lsevin.com later, never `/api`, auth or payment callbacks.
8. **Verify:** `pnpm seo:probe https://lsevin.com https://lsevin.com` and `SEO_E2E_BASE_URL=https://lsevin.com SEO_EXPECTED_ORIGIN=https://lsevin.com pnpm test:seo:e2e`; every WordPress inventory URL returns 200 or a single 301 hop (no 404s).
9. **Search Console:** verify lsevin.com as a domain property, submit the sitemap(s); if lsevincare.com was verified, use Change of Address lsevincare.com → lsevin.com once lsevincare.com 301s. Same in Bing and Yandex.

## Rollback

Revert `PRIMARY_PUBLIC_ORIGIN` and the DNS/Worker routes; lsevincare.com keeps working throughout, so rollback does not affect app users.
