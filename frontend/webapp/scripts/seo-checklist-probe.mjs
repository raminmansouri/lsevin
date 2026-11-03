// Read-only production-safe probe for docs/SEO-CHECKLIST-2026-10-27.md (GET requests only).
// Usage: pnpm seo:probe [baseUrl] [expectedOrigin]  (defaults: https://lsevincare.com)
const base = process.argv[2] || "https://lsevincare.com";
const origin = process.argv[3] || "https://lsevincare.com";
let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("PASS ", m); };
const ko = (m) => { fail++; console.log("FAIL ", m); };

async function get(path, opts = {}) {
  const t0 = performance.now();
  const res = await fetch(base + path, { redirect: "manual", ...opts });
  const body = res.status < 300 ? await res.text() : "";
  return { res, body, ms: performance.now() - t0 };
}
const attr = (html, re) => (html.match(re) || [])[1];
const canonicalOf = (h) => attr(h, /<link rel="canonical" href="([^"]+)"/);
const hreflangs = (h) => Object.fromEntries([...h.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
const h1count = (h) => (h.match(/<h1[\s>]/g) || []).length;
const robotsMeta = (h) => attr(h, /<meta name="robots" content="([^"]+)"/) || "";
const jsonLd = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);

// --- P0: sitemap ------------------------------------------------------------
const sm = await get("/sitemap.xml");
const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
sm.res.status === 200 ? ok(`sitemap 200 (${locs.length} URLs)`) : ko(`sitemap HTTP ${sm.res.status}`);
const foreign = locs.filter((u) => !u.startsWith(origin + "/"));
foreign.length ? ko(`sitemap has ${foreign.length} URLs off ${origin}`) : ok("all sitemap URLs on canonical origin");

// Sample every page type in the sitemap, all its locales for the first entity.
const pick = (re, n) => [...new Set(locs.filter((u) => re.test(u)))].slice(0, n);
const sample = [
  ...pick(/\/n\/app\/mobile\/home$/, 11),
  ...pick(/\/n\/app\/mobile\/categories$/, 3),
  ...pick(/\/n\/app\/mobile\/shop$/, 2),
  ...pick(/\/n\/app\/mobile\/provider\//, 3),
  ...pick(/\/n\/app\/mobile\/service\//, 3),
  ...pick(/\/n\/app\/mobile\/specialist\//, 2),
  ...pick(/\/n\/app\/mobile\/shop\/product\//, 2),
  ...pick(/\/medical-tourism/, 6),
  ...pick(/\/consulting$/, 2),
];
const timings = [];
for (const url of sample) {
  const path = url.slice(origin.length);
  const { res, body, ms } = await get(path);
  timings.push(ms);
  if (res.status !== 200) { ko(`${path} HTTP ${res.status} (sitemap lists it)`); continue; }
  const canon = canonicalOf(body);
  canon === url ? ok(`${path} canonical == sitemap loc`) : ko(`${path} canonical ${canon} != ${url}`);
  /noindex/.test(robotsMeta(body)) ? ko(`${path} is in the sitemap but noindex`) : ok(`${path} indexable`);
  const h1 = h1count(body);
  h1 === 1 ? ok(`${path} one h1`) : ko(`${path} h1 count ${h1}`);
  const alts = hreflangs(body);
  const self = Object.values(alts).includes(url);
  Object.keys(alts).length === 0 || self ? ok(`${path} hreflang includes itself (${Object.keys(alts).length})`) : ko(`${path} hreflang missing self`);
  // Reciprocity: each alternate must list this URL back.
  for (const [lang, alt] of Object.entries(alts)) {
    if (lang === "x-default" || alt === url) continue;
    const back = await get(alt.slice(origin.length));
    const backAlts = hreflangs(back.body);
    Object.values(backAlts).includes(url) ? null : ko(`${path} -> ${lang} ${alt} does not link back`);
  }
  const blocks = jsonLd(body);
  if (!blocks.length) ko(`${path} no JSON-LD`);
  for (const raw of blocks) {
    try {
      const data = JSON.parse(raw);
      const nodes = data["@graph"] ?? [data];
      if (data["@context"] !== "https://schema.org") ko(`${path} JSON-LD @context`);
      for (const n of nodes) {
        if (!n["@type"]) ko(`${path} node without @type`);
        if (n["@type"] === "BreadcrumbList" && !(n.itemListElement || []).every((i, k) => i.position === k + 1 && i.name && i.item)) ko(`${path} bad BreadcrumbList`);
        if (n["@type"] === "Product" && n.offers && !(n.offers.price > 0 && n.offers.priceCurrency)) ko(`${path} Product offer incomplete`);
        if (n["@type"] === "FAQPage" && !(n.mainEntity || []).every((q) => q.name && q.acceptedAnswer?.text)) ko(`${path} bad FAQPage`);
        if (/aggregateRating|reviewRating/.test(JSON.stringify(n))) ko(`${path} rating markup present`);
      }
    } catch { ko(`${path} JSON-LD does not parse`); }
  }
}

// --- P1: categories metadata (the confirmed live defect) ---------------------
const cat = await get("/fa/n/app/mobile/categories");
const catTitle = attr(cat.body, /<title>([^<]*)<\/title>/) || "";
/Categories/.test(catTitle) || !/السوین/.test(catTitle) ? ko(`fa categories title "${catTitle}"`) : ok(`fa categories title localized "${catTitle}"`);
/Browse all active/.test(cat.body) ? ko("fa categories still has English description") : ok("fa categories description localized");

// --- P1: untranslated locales are noindex and out of the sitemap -------------
const faOnly = locs.find((u) => /\/fa\/n\/app\/mobile\/service\//.test(u) && !locs.includes(u.replace("/fa/", "/en/")));
if (faOnly) {
  const en = await get(faOnly.slice(origin.length).replace("/fa/", "/en/"));
  /noindex/.test(robotsMeta(en.body)) ? ok("untranslated en service page is noindex") : ko("untranslated en service page indexable");
}

// --- P2: private pages stay out of shared caches and the index ---------------
for (const path of ["/fa/n/app/mobile/bookings", "/fa/n/app/mobile/profile", "/fa/n/app/mobile/favorites", "/fa/n/app/mobile/search"]) {
  const { res, body } = await get(path);
  const cc = res.headers.get("cache-control") || "";
  if (res.status >= 300 && res.status < 400) { ok(`${path} redirects guests (${res.status})`); continue; }
  /public|s-maxage/.test(cc) && !/private|no-store/.test(cc) ? ko(`${path} shared-cacheable: ${cc}`) : ok(`${path} not shared-cached (${cc || "none"})`);
  /noindex/.test(robotsMeta(body)) ? ok(`${path} noindex`) : ko(`${path} indexable`);
}

// --- P2: visitor-visible timing from this machine ---------------------------
const sorted = [...timings].sort((a, b) => a - b);
const p = (q) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]);
console.log(`INFO  full-response time over ${sorted.length} pages: p50 ${p(0.5)} ms, p95 ${p(0.95)} ms (from this machine; not a population metric)`);

console.log(`---- ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
