#!/usr/bin/env node
/**
 * Translation pipeline for messages/<locale>.json.
 *
 * The bundles drifted badly: fa/en/ar carry ~8,900 keys each while de/es/fr/ku/tr
 * carry ~1,100, and ru/tg did not exist at all. src/i18n/request.ts merges every
 * locale over English per key, so the gaps render as English rather than breaking —
 * which is why this went unnoticed and why it can be filled incrementally.
 *
 * Commands:
 *   audit                  coverage per locale
 *   extract <locale> [n]   write chunks of untranslated keys to .i18n-work/<locale>/
 *   merge <locale>         fold translated chunks back into messages/<locale>.json
 *   verify                 placeholder/emptiness checks across every bundle
 *
 * Nothing here invents text: extract emits the English (or Persian) source for each
 * missing key, a translator fills the values, and merge validates before writing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES = path.join(ROOT, "messages");
const WORK = path.join(ROOT, ".i18n-work");

/** Every locale the app ships, including the two added for this pass. */
export const LOCALES = ["en", "fa", "tr", "es", "ar", "ku", "de", "fr", "ru", "tg", "zh"];

/** Bundles complete enough to act as a translation source, best first. */
const SOURCES = ["en", "fa"];

const read = (locale) => {
  const file = path.join(MESSAGES, `${locale}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const write = (locale, data) =>
  fs.writeFileSync(path.join(MESSAGES, `${locale}.json`), JSON.stringify(data, null, 2) + "\n");

/** Flattens to `a.b.c` -> string. Arrays are treated as leaves; none exist today. */
function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split(".");
  let node = obj;
  for (const part of parts.slice(0, -1)) {
    if (!node[part] || typeof node[part] !== "object" || Array.isArray(node[part])) node[part] = {};
    node = node[part];
  }
  node[parts.at(-1)] = value;
}

/**
 * The union of every bundle's keys — no single locale is a superset (fa has keys en
 * lacks and vice versa), so anything less would quietly bake the drift in.
 */
function masterKeys() {
  const keys = new Set();
  for (const locale of LOCALES) for (const key of Object.keys(flatten(read(locale)))) keys.add(key);
  return [...keys].sort();
}

/** Source text for a key, preferring English so translators work from one pivot. */
function sourceFor(key, flats) {
  for (const locale of SOURCES) {
    const value = flats[locale][key];
    if (typeof value === "string" && value.trim() !== "") return { text: value, from: locale };
  }
  return null;
}

/**
 * The parts of an ICU message a translation must not change: the argument names and
 * their types. A dropped `{count}` renders a broken string to a user.
 *
 * Deliberately NOT a naive `/\{[^}]*\}/` sweep — that also matches the *branches* of a
 * plural, `{# review}` / `{# reviews}`, which are exactly the text a translator is
 * supposed to rewrite. Comparing those rejects every correct translation of a plural.
 *
 * Branch sets are not compared either: plural categories are language-specific. English
 * needs one/other, Russian needs one/few/many, Turkish is happy with other. Requiring
 * the source's categories would force wrong grammar. We require only that each plural
 * still has the catch-all `other` branch ICU falls back to.
 */
function icuSignature(text) {
  const args = new Set();
  const simple = new Set();
  let match;

  const argRe = /\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*(plural|selectordinal|select|number|date|time)\b/g;
  while ((match = argRe.exec(text))) args.add(`${match[1]}:${match[2]}`);

  const simpleRe = /\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g;
  while ((match = simpleRe.exec(text))) simple.add(match[1]);

  return [...simple].sort().join(",") + "|" + [...args].sort().join(",");
}

/** True when `text` opens a plural/select but has no `other` branch to fall back to. */
function missingOtherBranch(text) {
  return /\{\s*[A-Za-z_][A-Za-z0-9_]*\s*,\s*(plural|selectordinal|select)\b/.test(text) &&
    !/\bother\s*\{/.test(text);
}

function cmd_audit() {
  const flats = Object.fromEntries(LOCALES.map((l) => [l, flatten(read(l))]));
  const master = masterKeys();
  console.log(`master key set: ${master.length}\n`);
  console.log("  locale  translated   missing   coverage");
  for (const locale of LOCALES) {
    const flat = flats[locale];
    const have = master.filter((k) => typeof flat[k] === "string" && flat[k].trim() !== "").length;
    const pct = ((have / master.length) * 100).toFixed(1).padStart(5);
    console.log(
      `  ${locale.padEnd(7)} ${String(have).padEnd(12)} ${String(master.length - have).padEnd(9)} ${pct}%`
    );
  }
}

function cmd_extract(locale, size = 120) {
  if (!LOCALES.includes(locale)) throw new Error(`unknown locale ${locale}`);
  const flats = Object.fromEntries(SOURCES.map((l) => [l, flatten(read(l))]));
  const mine = flatten(read(locale));
  const master = masterKeys();

  const todo = [];
  for (const key of master) {
    const existing = mine[key];
    if (typeof existing === "string" && existing.trim() !== "") continue; // keep human work
    const source = sourceFor(key, flats);
    if (!source) continue; // no source text anywhere — nothing to translate from
    todo.push({ key, source: source.text, from: source.from });
  }

  const dir = path.join(WORK, locale);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  // Chunk along namespace boundaries where possible: a translator seeing a whole
  // screen's strings together picks consistent terminology for them.
  todo.sort((a, b) => a.key.localeCompare(b.key));
  let n = 0;
  for (let i = 0; i < todo.length; i += size) {
    const chunk = todo.slice(i, i + size);
    const payload = Object.fromEntries(chunk.map((e) => [e.key, e.source]));
    fs.writeFileSync(
      path.join(dir, `chunk-${String(++n).padStart(3, "0")}.json`),
      JSON.stringify(payload, null, 2) + "\n"
    );
  }
  console.log(`${locale}: ${todo.length} untranslated keys -> ${n} chunks in .i18n-work/${locale}/`);
}

function cmd_merge(locale) {
  const dir = path.join(WORK, locale);
  if (!fs.existsSync(dir)) throw new Error(`no work dir for ${locale} — run extract first`);
  const flats = Object.fromEntries(SOURCES.map((l) => [l, flatten(read(l))]));
  const bundle = read(locale);

  let applied = 0;
  const problems = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".done.json")).sort()) {
    const done = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    for (const [key, value] of Object.entries(done)) {
      const source = sourceFor(key, flats);
      if (typeof value !== "string" || value.trim() === "") {
        problems.push(`${file}: ${key} is empty`);
        continue;
      }
      if (source) {
        const want = icuSignature(source.text);
        const got = icuSignature(value);
        if (want !== got) {
          problems.push(`${file}: ${key} arguments changed (${want} -> ${got})`);
          continue;
        }
        if (missingOtherBranch(value)) {
          problems.push(`${file}: ${key} plural has no \`other\` branch`);
          continue;
        }
      }
      setDeep(bundle, key, value);
      applied++;
    }
  }

  if (problems.length) {
    console.error(`REFUSING to merge ${locale} — ${problems.length} problem(s):`);
    for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
    process.exitCode = 1;
    return;
  }
  write(locale, bundle);
  console.log(`${locale}: merged ${applied} translations`);
}

function cmd_verify() {
  const flats = Object.fromEntries(SOURCES.map((l) => [l, flatten(read(l))]));
  let bad = 0;
  for (const locale of LOCALES) {
    const flat = flatten(read(locale));
    for (const [key, value] of Object.entries(flat)) {
      if (typeof value !== "string") continue;
      if (value.trim() === "") {
        console.error(`  ${locale}: ${key} is an empty string`);
        bad++;
        continue;
      }
      const source = sourceFor(key, flats);
      if (!source) continue;
      if (icuSignature(source.text) !== icuSignature(value)) {
        console.error(`  ${locale}: ${key} argument mismatch`);
        bad++;
      } else if (missingOtherBranch(value)) {
        console.error(`  ${locale}: ${key} plural has no \`other\` branch`);
        bad++;
      }
    }
  }
  console.log(bad === 0 ? "verify: clean" : `verify: ${bad} problem(s)`);
  if (bad) process.exitCode = 1;
}

const [command, ...rest] = process.argv.slice(2);
const commands = {
  audit: cmd_audit,
  extract: () => cmd_extract(rest[0], rest[1] ? Number(rest[1]) : 120),
  merge: () => cmd_merge(rest[0]),
  verify: cmd_verify,
};
if (!commands[command]) {
  console.error("usage: i18n-tool.mjs audit | extract <locale> [chunkSize] | merge <locale> | verify");
  process.exit(1);
}
commands[command]();
