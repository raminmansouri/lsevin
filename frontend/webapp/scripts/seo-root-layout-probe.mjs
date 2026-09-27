// Isolated pinned-Next production probe. Never writes to the application's .next.
// Usage: node scripts/seo-root-layout-probe.mjs <empty scratch directory>
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
  "package.json": JSON.stringify({ private: true, type: "module" }),
  // Scratch and checkout can be on different Windows drives. Next prefixes
  // cross-drive client entry paths with './'; normalize those fixture entries.
  "next.config.mjs": `import {facetHeaders} from './facet-headers.js'; export default { experimental: { useCache: true }, poweredByHeader: false,
    async headers() {return facetHeaders(${JSON.stringify(locales)});},
    webpack(config) { const entry = config.entry; config.entry = async () => {
      const fix = value => typeof value === 'string' ? value.replace(/^\\.\\/(?=[A-Za-z]:\\/)/, '') : Array.isArray(value) ? value.map(fix) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k,fix(v)])) : value;
      return fix(typeof entry === 'function' ? await entry() : entry);
    }; return config; }
  };`,
  "app/layout.js": `export default async function Layout({children, params}) {
    const p = await params;
    return <html lang={p.locale || 'fa'} dir={['fa','ar','ku'].includes(p.locale || 'fa') ? 'rtl' : 'ltr'} data-root-params={JSON.stringify(p)}><body>{children}</body></html>;
  }`,
  "app/[locale]/layout.js": `import {notFound} from 'next/navigation';
    const locales = ${JSON.stringify(locales)};
    export function generateStaticParams() { return locales.map(locale => ({locale})); }
    export default async function Layout({children, params}) { const {locale} = await params; if (!locales.includes(locale)) notFound(); return children; }`,
  "app/[locale]/page.js": "export const revalidate = 60; export default async function Page({params}) { return <main>{(await params).locale}</main>; }",
  "app/financial/page.js": "export default function Page() { return <main>Financial fixture</main>; }",
  "app/not-found.js": "export default function NotFound() { return <main>Not found</main>; }",
  "app/[locale]/search/layout.js": "export {searchMetadata as metadata} from '../../../robots-policy'; export default function Layout({children}) {return children;}",
  "app/[locale]/search/page.js": "export default function Page() {return <main>Search fixture</main>;}",
  "app/[locale]/private/layout.js": "export {privateMetadata as metadata} from '../../../robots-policy'; export default function Layout({children}) {return children;}",
  "app/[locale]/private/page.js": "export default function Page() {return <main>Private fixture</main>;}",
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
for (const locale of locales) {
  const html = await readFile(resolve(scratch, `.next/server/app/${locale}.html`), "utf8");
  const tag = html.match(/<html[^>]*>/)?.[0];
  assert.ok(tag?.includes('data-root-params="{}"'), tag);
  assert.ok(html.includes(`<main>${locale}</main>`));
  results.push({ locale, tag });
  assert.ok(!html.includes('name="robots"'));
  for (const [route, expected] of [["search", "noindex, follow"], ["private", "noindex, nofollow"]]) {
    const page = await readFile(resolve(scratch, `.next/server/app/${locale}/${route}.html`), "utf8");
    assert.ok(page.includes(`<meta name="robots" content="${expected}"`), `${locale}/${route}`);
  }
}
const port = "33189";
const server = spawn(process.execPath, [cli, "start", "-p", port, "-H", "127.0.0.1"], {cwd: scratch, stdio: ["ignore", "pipe", "inherit"]});
try {
  await new Promise((ok, fail) => {
    const timeout = setTimeout(() => fail(new Error("Server startup timed out")), 30000);
    server.on("error", fail);
    server.stdout.on("data", data => { if (data.toString().includes("Ready")) { clearTimeout(timeout); ok(); } });
  });
  for (const [route, status] of [["/en",200],["/fa",200],["/ar",200],["/financial",200],["/unsupported",404],["/missing/path",404]]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, status, route);
    const html = await response.text();
    results.push({route, status, tag: html.match(/<html[^>]*>/)?.[0]});
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
await writeFile(resolve(scratch, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ verdict: "BLOCKED: root params omit the descendant locale on all 11 statically built pages", results }, null, 2));
