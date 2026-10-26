#!/usr/bin/env node
/**
 * Fill in missing Arabic for shop product features (attributes).
 *
 * Feature values were saved without Arabic (the admin value form had no AR field) and
 * free-text features were stored in one language, so the /ar storefront shows English.
 *
 *   node scripts/shop-arabic-labels.mjs export   writes shop-arabic-labels.json: every
 *                                                feature name / value / free-text value
 *                                                that has no Arabic, with an empty "ar"
 *   (fill in the "ar" fields)
 *   node scripts/shop-arabic-labels.mjs apply    writes the non-empty "ar" fields back,
 *                                                merged into the existing translations
 *
 * DATABASE_URL is read the same way as scripts/migrate.mjs. Apply needs migration 0076.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const postgres = require("postgres");

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(APP_ROOT, "shop-arabic-labels.json");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of [".env.local", ".env"]) {
    const full = path.join(APP_ROOT, file);
    if (!fs.existsSync(full)) continue;
    const match = fs.readFileSync(full, "utf8").match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("DATABASE_URL is not set (checked the environment, .env.local and .env).");
}

const noAr = (col) => `coalesce(nullif(btrim(${col} ->> 'ar'), ''), '') = ''`;

async function exportMissing(sql) {
  const attributes = await sql.unsafe(`
    select id::text as id, slug, name_translations ->> 'en' as en, name_translations ->> 'fa' as fa, '' as ar
    from shop.attributes where ${noAr("name_translations")} order by slug`);
  const values = await sql.unsafe(`
    select v.id::text as id, a.slug as attribute, v.value,
      v.display_name_translations ->> 'en' as en, v.display_name_translations ->> 'fa' as fa, '' as ar
    from shop.attribute_values v join shop.attributes a on a.id = v.attribute_id
    where ${noAr("v.display_name_translations")} order by a.slug, v.value`);
  const [{ has }] = await sql`
    select exists (select 1 from information_schema.columns
      where table_schema = 'shop' and table_name = 'product_attributes' and column_name = 'text_value_translations') as has`;
  if (!has) console.warn("Migration 0076 is not applied yet: run `pnpm migrate` first, then export again for free-text values.");
  const texts = has
    ? await sql.unsafe(`
        select pa.product_id::text as "productId", pa.attribute_id::text as "attributeId", p.slug as product, a.slug as attribute,
          coalesce(nullif(pa.text_value_translations ->> 'en', ''), pa.text_value) as en,
          pa.text_value_translations ->> 'fa' as fa, '' as ar
        from shop.product_attributes pa
        join shop.attributes a on a.id = pa.attribute_id
        join shop.products p on p.id = pa.product_id
        where nullif(btrim(pa.text_value), '') is not null and ${noAr("pa.text_value_translations")}
        order by p.slug, a.slug`)
    : [];
  fs.writeFileSync(FILE, JSON.stringify({ attributes, values, texts }, null, 2) + "\n");
  console.log(`Wrote ${path.relative(process.cwd(), FILE)}: ${attributes.length} names, ${values.length} values, ${texts.length} free-text values without Arabic.`);
}

async function apply(sql) {
  const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const filled = (rows) => (rows ?? []).filter((r) => String(r.ar ?? "").trim());
  let n = 0;
  await sql.begin(async (tx) => {
    for (const r of filled(data.attributes)) {
      await tx`update shop.attributes set name_translations = coalesce(name_translations, '{}'::jsonb) || jsonb_build_object('ar', ${r.ar.trim()}::text) where id = ${r.id}::uuid`;
      n++;
    }
    for (const r of filled(data.values)) {
      await tx`update shop.attribute_values set display_name_translations = coalesce(display_name_translations, '{}'::jsonb)
        || jsonb_build_object('en', coalesce(nullif(display_name_translations ->> 'en', ''), value), 'ar', ${r.ar.trim()}::text)
        where id = ${r.id}::uuid`;
      n++;
    }
    for (const r of filled(data.texts)) {
      await tx`update shop.product_attributes set text_value_translations = coalesce(text_value_translations, '{}'::jsonb)
        || jsonb_build_object('en', coalesce(nullif(text_value_translations ->> 'en', ''), text_value), 'ar', ${r.ar.trim()}::text)
        where product_id = ${r.productId}::uuid and attribute_id = ${r.attributeId}::uuid`;
      n++;
    }
  });
  console.log(`Saved Arabic for ${n} row(s). Product pages are cached: redeploy or save any product in admin to refresh them.`);
}

const mode = process.argv[2];
if (mode !== "export" && mode !== "apply") {
  console.error("Usage: node scripts/shop-arabic-labels.mjs export|apply");
  process.exit(1);
}
const sql = postgres(readDatabaseUrl(), { max: 1, prepare: false });
try {
  await (mode === "export" ? exportMissing(sql) : apply(sql));
} finally {
  await sql.end();
}
