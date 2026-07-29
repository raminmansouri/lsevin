#!/usr/bin/env node
/**
 * One-off: lift the metadata admin's labels out of a hardcoded Persian dictionary
 * and into the next-intl bundles, so all eleven locales get them instead of one.
 *
 * src/lib/admin/label-localization.ts gated every lookup behind isPersian(), so
 * ten of the eleven shipped languages saw raw humanized English ("Booking Draft
 * Child Bookings"), and even Persian only covered 24 of 232 tables. Schema group
 * headings ("booking", "provider_portal") were never localized at all.
 *
 * Reads the table/column inventory captured from the database and writes three
 * namespaces into messages/en.json and messages/fa.json:
 *   AdminSchema  — 14 group headings
 *   AdminTable   — 232 entity names
 *   AdminColumn  — 882 field names
 *
 * English values reproduce inferFieldLabel()'s humanization, so the bundle is a
 * faithful snapshot of what the admin renders today; Persian values are carried
 * over from the existing dictionaries so no prior translation work is lost.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES = path.join(ROOT, "messages");

/** Mirrors inferFieldLabel() in src/lib/admin/inference.ts. */
const humanize = (name) =>
  name
    .replace(/_translations$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Pulls `key: "value"` pairs out of one `const NAME: Record<...> = { ... }` block. */
function extractDict(source, constName) {
  const start = source.indexOf(`const ${constName}`);
  if (start === -1) throw new Error(`${constName} not found`);
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = source.slice(open + 1, end);
  const out = {};
  const re = /^\s*([A-Za-z0-9_]+)\s*:\s*"([^"]*)"\s*,?\s*$/gm;
  let m;
  while ((m = re.exec(body))) out[m[1]] = m[2];
  return out;
}

const localization = fs.readFileSync(path.join(ROOT, "src/lib/admin/label-localization.ts"), "utf8");
const TABLE_FA = extractDict(localization, "TABLE_FA");
const COLUMN_FA = extractDict(localization, "COLUMN_FA");

const tableRows = fs
  .readFileSync("/tmp/admin-tables.txt", "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.split("|"));

const columns = fs
  .readFileSync("/tmp/admin-columns.txt", "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

const schemas = [...new Set(tableRows.map(([s]) => s))].sort();
const tables = [...new Set(tableRows.map(([, t]) => t))].sort();

// Schema headings are product areas, not table names — humanizing "notify" to
// "Notify" reads like a verb, so these few get written out properly.
const SCHEMA_EN = {
  booking: "Bookings",
  category: "Catalog",
  commercial: "Commercial",
  common: "Common",
  customer: "Customers",
  finance: "Finance",
  form_builder: "Form Builder",
  loyalty: "Loyalty",
  marketing: "Marketing",
  media: "Media",
  notify: "Notifications",
  provider_portal: "Provider Portal",
  shop: "Shop",
  support: "Support",
};

const en = { AdminSchema: {}, AdminTable: {}, AdminColumn: {} };
const fa = { AdminSchema: {}, AdminTable: {}, AdminColumn: {} };

for (const s of schemas) en.AdminSchema[s] = SCHEMA_EN[s] ?? humanize(s);
for (const t of tables) en.AdminTable[t] = humanize(t);
for (const c of columns) en.AdminColumn[c] = humanize(c);

for (const t of tables) if (TABLE_FA[t]) fa.AdminTable[t] = TABLE_FA[t];
for (const c of columns) if (COLUMN_FA[c]) fa.AdminColumn[c] = COLUMN_FA[c];

for (const [locale, add] of [["en", en], ["fa", fa]]) {
  const file = path.join(MESSAGES, `${locale}.json`);
  const bundle = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [ns, entries] of Object.entries(add)) {
    bundle[ns] = { ...(bundle[ns] ?? {}), ...entries };
  }
  fs.writeFileSync(file, JSON.stringify(bundle, null, 2) + "\n");
}

console.log(`schemas: ${schemas.length}, tables: ${tables.length}, columns: ${columns.length}`);
console.log(`carried over from the Persian dictionary: ${Object.keys(fa.AdminTable).length} tables, ${Object.keys(fa.AdminColumn).length} columns`);
