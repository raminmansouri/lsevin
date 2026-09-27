// Proposed locale-owned roots on pinned Next. Exit 1 records a known 404 blocker.
// Never writes to the application's .next. Browser checks use optional SEO_* env vars.
// Usage: node scripts/seo-locale-roots-probe.mjs <empty scratch directory>
import { mkdir, writeFile, symlink, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import ts from "typescript";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) throw new Error("An empty scratch directory is required");
const scratch = resolve(target);
await mkdir(scratch); // Fail rather than overwrite an existing directory.
await symlink(resolve(project, "node_modules"), resolve(scratch, "node_modules"), "junction");
const locales = ["en", "fa", "tr", "es", "ar", "ku", "de", "fr", "ru", "tg", "zh"];
const files = {
  "public/favicon.ico": await readFile(resolve(project, "src/app/favicon.ico")),
  "package.json": JSON.stringify({ private: true, type: "module" }),
  // Scratch and checkout can be on different Windows drives. Next prefixes
  // cross-drive client entry paths with './'; normalize those fixture entries.
  "next.config.mjs": `import createNextIntlPlugin from 'next-intl/plugin'; import {facetHeaders} from './facet-headers.js'; export default createNextIntlPlugin('./i18n/request.js')({ experimental: { useCache: true, globalNotFound: true }, poweredByHeader: false,
    async headers() {return facetHeaders(${JSON.stringify(locales)});},
    webpack(config) { const entry = config.entry; config.entry = async () => {
      const fix = value => typeof value === 'string' ? value.replace(/^\\.\\/(?=[A-Za-z]:\\/)/, '') : Array.isArray(value) ? value.map(fix) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k,fix(v)])) : value;
      return fix(typeof entry === 'function' ? await entry() : entry);
    }; return config; }
  });`,
  "i18n/request.js": `import {getRequestConfig} from 'next-intl/server'; export default getRequestConfig(async ({requestLocale}) => { const locale = await requestLocale || 'fa'; return {locale, messages: {Probe: {value: locale}}, timeZone: 'UTC'}; });`,
  "app/[locale]/layout.js": `import {notFound} from 'next/navigation';
    import {NextIntlClientProvider} from 'next-intl';
    import {setRequestLocale, getMessages} from 'next-intl/server';
    const locales = ${JSON.stringify(locales)};
    export function generateStaticParams() { return locales.map(locale => ({locale})); }
    export default async function Layout({children, params}) { const {locale} = await params; if (!locales.includes(locale)) notFound();
      setRequestLocale(locale); const messages = await getMessages({locale});
      return <html lang={locale} dir={['fa','ar','ku'].includes(locale) ? 'rtl' : 'ltr'}><body><NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider></body></html>; }`,
  "app/financial/layout.js": `export default function Layout({children}) {return <html lang="fa" dir="rtl"><body>{children}</body></html>;}`,
  "app/global-not-found.js": `export default function NotFound() {return <html lang="fa" dir="rtl"><body><main>404</main></body></html>;}`,
  "app/[locale]/(fallback)/not-found.js": `export default function NotFound() {return <main>404</main>;}`,
  "app/[locale]/(fallback)/[...rest]/page.js": `import {notFound} from 'next/navigation'; import {setRequestLocale} from 'next-intl/server'; export default async function Page({params}) {setRequestLocale((await params).locale); notFound();}`,
  "app/[locale]/(fallback)/layout.js": `export default function Layout({children}) {return children;}`,
  "app/[locale]/client.js": `'use client'; import {useTranslations} from 'next-intl'; import {useEffect,useState} from 'react'; export default function Client() {const t=useTranslations('Probe'); const [ready,setReady]=useState(false); useEffect(()=>setReady(true),[]); return <button data-ready={ready} onClick={()=>setReady(false)}>{t('value')}</button>;}`,
  "app/[locale]/page.js": `import {setRequestLocale,getTranslations} from 'next-intl/server'; import Client from './client'; export const revalidate = 60; export default async function Page({params}) {const {locale}=await params; setRequestLocale(locale); const t=await getTranslations('Probe'); return <><main>{t('value')}</main><Client /></>; }`,
  "app/financial/page.js": "export default function Page() { return <main>Financial fixture</main>; }",

  "app/[locale]/search/layout.js": "export {searchMetadata as metadata} from '../../../robots-policy'; export default function Layout({children}) {return children;}",
  "app/[locale]/search/page.js": "import Client from '../client'; export default function Page() {return <><main>Search fixture</main><Client /></>;}",
  "app/[locale]/private/layout.js": "export {privateMetadata as metadata} from '../../../robots-policy'; export default function Layout({children}) {return children;}",
  "app/[locale]/private/page.js": "import Client from '../client'; export default function Page() {return <><main>Private fixture</main><Client /></>;}",
  "robots-policy.js": ts.transpileModule(await readFile(resolve(project, "src/lib/seo/robots-policy.ts"), "utf8"), {compilerOptions: {module: ts.ModuleKind.ESNext}}).outputText,
  "facet-headers.js": ts.transpileModule(await readFile(resolve(project, "src/lib/seo/facet-headers.ts"), "utf8"), {compilerOptions: {module: ts.ModuleKind.ESNext}}).outputText,
  "app/[locale]/n/app/mobile/shop/category/[slug]/page.js": "export function generateStaticParams() {return [{slug:'fixture'}];} export default function Page() {return <main>Category fixture</main>;}",
  "app/[locale]/type/[id]/page.js": "export function generateStaticParams() {return [{id:'fixture'}];} export default function Page() {return <main>Type fixture</main>;}",
};
for (const [name, contents] of Object.entries(files)) {
  await mkdir(dirname(resolve(scratch, name)), { recursive: true });
  await writeFile(resolve(scratch, name), contents);
}
const cli = resolve(project, "node_modules/next/dist/bin/next");
await new Promise((ok, fail) => {
  const child = spawn(process.execPath, [cli, "build", "--webpack"], { cwd: scratch, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
  child.on("error", fail);
  child.on("exit", code => code === 0 ? ok() : fail(new Error(`Build exited ${code}`)));
});
const results = [];
const failures = [];
for (const locale of locales) {
  const html = await readFile(resolve(scratch, `.next/server/app/${locale}.html`), "utf8");
  const tag = html.match(/<html[^>]*>/)?.[0];
  assert.ok(tag?.includes(`lang="${locale}"`), tag);
  assert.ok(tag?.includes(`dir="${['fa','ar','ku'].includes(locale) ? 'rtl' : 'ltr'}"`), tag);
  assert.ok(html.includes(`<main>${locale}</main>`));
  results.push({ locale, tag });
  assert.ok(!html.includes('name="robots"'));
  for (const [route, expected] of [["search", "noindex, follow"], ["private", "noindex, nofollow"]]) {
    const page = await readFile(resolve(scratch, `.next/server/app/${locale}/${route}.html`), "utf8");
    assert.ok(page.match(/<html[^>]*>/)?.[0].includes(`lang="${locale}"`));
    assert.ok(page.includes(`<meta name="robots" content="${expected}"`), `${locale}/${route}`);
  }
}
const prerender = JSON.parse(await readFile(resolve(scratch, '.next/prerender-manifest.json'), 'utf8'));
for (const locale of locales) assert.equal(prerender.routes[`/${locale}`].initialRevalidateSeconds, 60);
const port = "33189";
const server = spawn(process.execPath, [cli, "start", "-p", port, "-H", "127.0.0.1"], {cwd: scratch, stdio: ["ignore", "pipe", "inherit"]});
try {
  await new Promise((ok, fail) => {
    const timeout = setTimeout(() => fail(new Error("Server startup timed out")), 30000);
    server.on("error", fail);
    server.stdout.on("data", data => { if (data.toString().includes("Ready")) { clearTimeout(timeout); ok(); } });
  });
  for (const [route, status] of [["/en",200],["/fa",200],["/ar",200],["/financial",200],["/unsupported",404],["/missing/path",404],["/en/missing/path",404],["/fa/missing/path",404],["/ar/missing/path",404],["/",404]]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, status, route);
    const html = await response.text();
    const tag = html.match(/<html[^>]*>/)?.[0];
    const locale = route.split('/')[1];
    if (locales.includes(locale)) {
      if (!tag?.includes(`lang="${locale}"`) || !tag?.includes(`dir="${['fa','ar','ku'].includes(locale) ? 'rtl' : 'ltr'}"`)) failures.push({route, tag});
    }
    results.push({route, status, tag});
  }
  // Exercise the installed browser against the production build, if supplied.
  if (process.env.SEO_BROWSER_EXECUTABLE && process.env.SEO_PLAYWRIGHT_MODULE) {
    const {chromium} = await import(process.env.SEO_PLAYWRIGHT_MODULE);
    const browser = await chromium.launch({executablePath: process.env.SEO_BROWSER_EXECUTABLE, headless: true});
    try {
      for (const locale of ['fa','en','ar']) {
       for (const suffix of ['', '/search', '/private']) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => {if (msg.type() === 'error') errors.push(msg.text());});
        await page.goto(`http://127.0.0.1:${port}/${locale}${suffix}`);
        await page.locator('button[data-ready="true"]').waitFor();
        assert.equal(await page.locator('button').textContent(), locale);
        assert.equal(await page.locator('html').getAttribute('lang'), locale);
        assert.deepEqual(errors, [], `${locale} hydration`);
        results.push({locale, suffix, hydration: 'passed'});
        await page.close();
       }
      }
    } finally {await browser.close();}
  }
  for (const locale of locales) {
    for (const [route, keys] of [["n/app/mobile/shop/category/fixture", ["sort","page","brand","inStockOnly","onSale","minRating","minPrice","maxPrice"]], ["type/fixture", ["search","countryCode","cityCode","attributeFilters"]]]) {
      for (const key of [null, "utm_source", ...keys]) {
        const response = await fetch(`http://127.0.0.1:${port}/${locale}/${route}${key ? `?${key}=fixture` : ''}`);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("x-robots-tag"), keys.includes(key) ? "noindex, follow" : null, `${locale}/${route}?${key}`);
        await response.text();
      }
    }
  }
} finally { server.kill(); }
await writeFile(resolve(scratch, "results.json"), JSON.stringify({results, failures}, null, 2));
console.log(JSON.stringify({ verdict: failures.length ? "BLOCKED: locale 404 document attributes lost" : "PASS", results, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
