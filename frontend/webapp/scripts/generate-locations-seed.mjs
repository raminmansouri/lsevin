#!/usr/bin/env node
/**
 * Generates the country / province / city seed migration for category.locations.
 *
 * The catalogue is three tiers — country (location_type_id 1) → province (3) → city (2).
 * Countries with no subdivisions in the source data parent their cities directly to the
 * country, so consumers must resolve "the country of a city" as the nearest ancestor of
 * type Country rather than assuming a single hop.
 *
 * Sources (both redistributable):
 *   - GeoNames dumps (CC BY 4.0): countryInfo.txt, admin1CodesASCII.txt, cities15000.txt
 *     and the per-country alternatenames/<CC>.zip files, for localized place names.
 *   - ICU via Intl.DisplayNames, for country names in every supported app locale.
 *
 * Usage (from frontend/webapp):
 *   node scripts/generate-locations-seed.mjs                 download sources, then emit
 *   node scripts/generate-locations-seed.mjs --data-dir DIR  reuse an existing download
 *   node scripts/generate-locations-seed.mjs --out FILE       write somewhere else
 *
 * The emitted SQL is idempotent: rows are inserted only when absent, and existing rows
 * keep the translations they already have (the seed only fills in missing locales), so
 * re-running it never clobbers anything edited from the admin panel.
 *
 * Nothing here talks to the database. Apply the output with `pnpm migrate`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// category."LocationType"
const TYPE_COUNTRY = 1;
const TYPE_CITY = 2;
const TYPE_PROVINCE = 3;

// category.locations.code is character varying(10) — every generated code must fit.
const MAX_CODE_LENGTH = 10;

// Locale keys written into value_translations, matching LocalizedString tags used by
// the .NET module and the `locale` values the Next.js resolvers normalize to.
const LOCALES = [
  { key: "en-US", intl: "en" },
  { key: "fa-IR", intl: "fa" },
  { key: "ar-SA", intl: "ar" },
  { key: "tr-TR", intl: "tr" },
];

// GeoNames ships localized names per country. Downloading all 250 files costs far more
// than it returns, so only the markets whose visitors actually read fa/ar/tr get them;
// everywhere else falls back to the English name (and then the code), exactly as the
// value_translations coalesce chain in the app already does.
const LOCALIZED_COUNTRIES = [
  "IR", "AE", "TR", "IQ", "OM", "QA", "SA", "KW", "BH", "AZ",
  "AM", "GE", "AF", "SY", "LB", "EG", "JO", "PK", "IN", "TH",
  "MY", "DE", "GB", "US", "FR", "IT", "ES", "RU", "CN", "CA",
];

// How many cities to keep. The full cities15000 dump is ~34k rows; that is more noise
// than a destination picker can use, so keep the ones people actually search for.
const MIN_CITY_POPULATION = 50_000;
const MAX_CITIES_PER_COUNTRY = 60;
const MAX_CITIES_PER_LOCALIZED_COUNTRY = 250;

const GEONAMES_BASE = "https://download.geonames.org/export/dump";

function parseArgs(argv) {
  const args = { dataDir: null, out: path.join(APP_ROOT, "db", "migrations", "0006_seed_world_locations.sql") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--data-dir") args.dataDir = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
  }
  return args;
}

function download(url, target) {
  if (fs.existsSync(target)) return;
  execFileSync("curl", ["-sSfL", "--max-time", "600", "-o", target, url], { stdio: ["ignore", "ignore", "inherit"] });
}

function unzipInto(zipPath, dir) {
  execFileSync("unzip", ["-o", "-q", zipPath, "-d", dir], { stdio: ["ignore", "ignore", "inherit"] });
}

function readTsv(file) {
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("\t"));
}

function ensureSources(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });

  download(`${GEONAMES_BASE}/countryInfo.txt`, path.join(dataDir, "countryInfo.txt"));
  download(`${GEONAMES_BASE}/admin1CodesASCII.txt`, path.join(dataDir, "admin1CodesASCII.txt"));

  const citiesZip = path.join(dataDir, "cities15000.zip");
  download(`${GEONAMES_BASE}/cities15000.zip`, citiesZip);
  if (!fs.existsSync(path.join(dataDir, "cities15000.txt"))) unzipInto(citiesZip, dataDir);

  const altDir = path.join(dataDir, "alt");
  fs.mkdirSync(altDir, { recursive: true });

  for (const cc of LOCALIZED_COUNTRIES) {
    const zip = path.join(altDir, `${cc}.zip`);
    try {
      download(`${GEONAMES_BASE}/alternatenames/${cc}.zip`, zip);
      if (!fs.existsSync(path.join(altDir, `${cc}.txt`))) unzipInto(zip, altDir);
    } catch {
      console.warn(`  ! localized names unavailable for ${cc}; falling back to English`);
    }
  }

  return { altDir };
}

/**
 * geonameId -> { "fa": name, "ar": name, ... } for the localized country set.
 * GeoNames marks one name per language as preferred; prefer it, else take the first,
 * and skip the pseudo-languages (link, wkdt, iata, …) that are not human names.
 */
function loadAlternateNames(altDir) {
  const wanted = new Set(LOCALES.map((l) => l.intl));
  const byGeonameId = new Map();

  for (const cc of LOCALIZED_COUNTRIES) {
    const file = path.join(altDir, `${cc}.txt`);
    if (!fs.existsSync(file)) continue;

    for (const cols of readTsv(file)) {
      const [, geonameId, isolanguage, name, isPreferred, , isColloquial, isHistoric] = cols;
      if (!wanted.has(isolanguage) || !name) continue;
      if (isColloquial === "1" || isHistoric === "1") continue;

      let entry = byGeonameId.get(geonameId);
      if (!entry) {
        entry = {};
        byGeonameId.set(geonameId, entry);
      }

      const existing = entry[isolanguage];
      if (!existing || (isPreferred === "1" && !existing.preferred)) {
        entry[isolanguage] = { name: name.trim(), preferred: isPreferred === "1" };
      }
    }
  }

  return byGeonameId;
}

function translationsFor(geonameId, englishName, alternateNames) {
  const alt = alternateNames.get(String(geonameId)) ?? {};
  const out = { "en-US": englishName };

  for (const { key, intl } of LOCALES) {
    if (intl === "en") continue;
    const value = alt[intl]?.name;
    if (value) out[key] = value;
  }

  return out;
}

function countryTranslations(code, fallbackName) {
  const out = {};

  for (const { key, intl } of LOCALES) {
    try {
      const name = new Intl.DisplayNames([intl], { type: "region" }).of(code);
      // Intl echoes the input back when it has no name for the region.
      if (name && name !== code) out[key] = name;
    } catch {
      // Locale not present in this runtime's ICU data; fall through to the default.
    }
  }

  if (!out["en-US"]) out["en-US"] = fallbackName;
  return out;
}

/** Uppercase ASCII-alphanumeric code, truncated to the column width, unique within a scope. */
function makeCode(name, taken, maxLength = MAX_CODE_LENGTH) {
  const base =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, maxLength) || "LOC";

  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }

  for (let n = 2; n < 1_000_000; n += 1) {
    const suffix = String(n);
    const candidate = base.slice(0, maxLength - suffix.length) + suffix;
    if (taken.has(candidate)) continue;
    taken.add(candidate);
    return candidate;
  }

  throw new Error(`Could not derive a unique code for "${name}"`);
}

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const jsonLiteral = (value) => `${quote(JSON.stringify(value))}::jsonb`;

function build() {
  const args = parseArgs(process.argv.slice(2));
  const dataDir = args.dataDir ?? path.join(os.tmpdir(), "lsevin-geonames");

  console.log(`Sources: ${dataDir}`);
  const { altDir } = ensureSources(dataDir);

  console.log("Loading localized names…");
  const alternateNames = loadAlternateNames(altDir);

  // ---- Countries -----------------------------------------------------------
  const countries = readTsv(path.join(dataDir, "countryInfo.txt"))
    .filter((cols) => /^[A-Z]{2}$/.test(cols[0] ?? ""))
    .map((cols) => ({ code: cols[0], name: cols[4], geonameId: cols[16] }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const countryByCode = new Map(countries.map((c) => [c.code, c]));

  // ---- Provinces (GeoNames admin1) ----------------------------------------
  const provinceCodesPerCountry = new Map();
  const provinces = [];

  for (const cols of readTsv(path.join(dataDir, "admin1CodesASCII.txt"))) {
    const [key, name, , geonameId] = cols;
    const [countryCode, admin1Code] = (key ?? "").split(".");
    if (!countryCode || !admin1Code || !countryByCode.has(countryCode)) continue;

    let taken = provinceCodesPerCountry.get(countryCode);
    if (!taken) {
      taken = new Set();
      provinceCodesPerCountry.set(countryCode, taken);
    }

    // "IR-26" style: the ISO 3166-2 shape, and short enough for varchar(10).
    const code = makeCode(`${countryCode}${admin1Code}`, taken).replace(
      new RegExp(`^${countryCode}`),
      `${countryCode}-`
    );

    provinces.push({
      countryCode,
      admin1Key: key,
      code: code.slice(0, MAX_CODE_LENGTH),
      translations: translationsFor(geonameId, name, alternateNames),
    });
  }

  const provinceByAdmin1Key = new Map(provinces.map((p) => [p.admin1Key, p]));

  // ---- Cities --------------------------------------------------------------
  const cityRowsByCountry = new Map();

  for (const cols of readTsv(path.join(dataDir, "cities15000.txt"))) {
    const geonameId = cols[0];
    const name = cols[1];
    const countryCode = cols[8];
    const admin1Code = cols[10];
    const population = Number(cols[14]) || 0;

    if (!countryByCode.has(countryCode)) continue;
    if (population < MIN_CITY_POPULATION) continue;

    let list = cityRowsByCountry.get(countryCode);
    if (!list) {
      list = [];
      cityRowsByCountry.set(countryCode, list);
    }

    list.push({ geonameId, name, countryCode, admin1Key: `${countryCode}.${admin1Code}`, population });
  }

  const cities = [];

  for (const [countryCode, list] of cityRowsByCountry) {
    const limit = LOCALIZED_COUNTRIES.includes(countryCode)
      ? MAX_CITIES_PER_LOCALIZED_COUNTRY
      : MAX_CITIES_PER_COUNTRY;

    const taken = new Set();
    const ranked = list.sort((a, b) => b.population - a.population).slice(0, limit);

    for (const [index, city] of ranked.entries()) {
      const province = provinceByAdmin1Key.get(city.admin1Key);

      cities.push({
        countryCode,
        provinceCode: province?.code ?? null,
        code: makeCode(city.name, taken),
        // display_order is an ascending "manual ordering" column everywhere else in
        // the app, so store a POPULATION RANK (1 = largest in the country), not the
        // population itself. Writing the raw population inverted the list and buried
        // capitals under every small town.
        displayOrder: index + 1,
        translations: translationsFor(city.geonameId, city.name, alternateNames),
      });
    }
  }

  // ---- Emit ----------------------------------------------------------------
  const out = [];
  const generatedFrom = `${countries.length} countries, ${provinces.length} provinces, ${cities.length} cities`;

  out.push(`-- Generated by scripts/generate-locations-seed.mjs — do not edit by hand.`);
  out.push(`-- Source: GeoNames (CC BY 4.0) + ICU region names.`);
  out.push(`-- Contents: ${generatedFrom}.`);
  out.push(`--`);
  out.push(`-- Idempotent: a row is inserted only when the same code is absent at that tier,`);
  out.push(`-- and existing rows keep their own translations (the seed only fills gaps), so`);
  out.push(`-- re-running never overwrites anything edited from the admin panel.`);
  out.push(``);

  for (const country of countries) {
    const translations = countryTranslations(country.code, country.name);
    const code = quote(country.code);

    out.push(
      `insert into category.locations (id, code, value_translations, location_type_id, parent_id, create_date)`,
      `select gen_random_uuid(), ${code}, ${jsonLiteral(translations)}, ${TYPE_COUNTRY}, null, now()`,
      `where not exists (select 1 from category.locations where location_type_id = ${TYPE_COUNTRY} and upper(code) = ${code});`,
      `update category.locations set value_translations = ${jsonLiteral(translations)} || value_translations, last_modified_date = now()`,
      `where location_type_id = ${TYPE_COUNTRY} and upper(code) = ${code} and not (value_translations ?& array['en-US','fa-IR','ar-SA','tr-TR']);`,
      ``
    );
  }

  for (const province of provinces) {
    const code = quote(province.code);
    const countryCode = quote(province.countryCode);

    out.push(
      `insert into category.locations (id, code, value_translations, location_type_id, parent_id, create_date)`,
      `select gen_random_uuid(), ${code}, ${jsonLiteral(province.translations)}, ${TYPE_PROVINCE}, c.id, now()`,
      `from category.locations c`,
      `where c.location_type_id = ${TYPE_COUNTRY} and upper(c.code) = ${countryCode}`,
      `  and not exists (select 1 from category.locations p where p.location_type_id = ${TYPE_PROVINCE} and upper(p.code) = ${code});`,
      ``
    );
  }

  for (const city of cities) {
    const code = quote(city.code);
    const countryCode = quote(city.countryCode);
    const translations = jsonLiteral(city.translations);

    // Cities that already existed keep their row (the insert below skips them), which
    // means they never receive the localized names this seed carries — a picker full
    // of raw codes like "tehran" next to properly named neighbours. Merge the seed's
    // names into them, with the existing value winning on every key it already has so
    // nothing edited by hand is overwritten.
    out.push(
      `update category.locations city`,
      `set value_translations = ${translations} || city.value_translations, last_modified_date = now()`,
      `from category.locations c`,
      `left join category.locations mid on mid.parent_id = c.id and mid.location_type_id = ${TYPE_PROVINCE}`,
      `where city.location_type_id = ${TYPE_CITY} and upper(city.code) = ${code}`,
      `  and c.location_type_id = ${TYPE_COUNTRY} and upper(c.code) = ${countryCode}`,
      `  and (city.parent_id = c.id or city.parent_id = mid.id)`,
      `  and not (city.value_translations ?& array['en-US','fa-IR','ar-SA','tr-TR']);`,
      ``
    );

    // "Already present" means anywhere under this country — directly, or under one of
    // its provinces — so a city seeded before the province tier is never duplicated.
    const existsUnderCountry = `
  and not exists (
    select 1
    from category.locations existing
    left join category.locations existing_parent on existing_parent.id = existing.parent_id
    where existing.location_type_id = ${TYPE_CITY}
      and upper(existing.code) = ${code}
      and (existing.parent_id = c.id or existing_parent.parent_id = c.id)
  )`;

    if (city.provinceCode) {
      const provinceCode = quote(city.provinceCode);

      out.push(
        `insert into category.locations (id, code, value_translations, location_type_id, parent_id, create_date, display_order)`,
        `select gen_random_uuid(), ${code}, ${translations}, ${TYPE_CITY}, p.id, now(), ${city.displayOrder}`,
        `from category.locations c`,
        `join category.locations p on p.location_type_id = ${TYPE_PROVINCE} and p.parent_id = c.id and upper(p.code) = ${provinceCode}`,
        `where c.location_type_id = ${TYPE_COUNTRY} and upper(c.code) = ${countryCode}${existsUnderCountry};`,
        // Pull a city that predates the province tier up into its province, so the
        // hierarchy is consistent for rows that were already there.
        `update category.locations city`,
        `set parent_id = p.id, last_modified_date = now()`,
        `from category.locations c`,
        `join category.locations p on p.location_type_id = ${TYPE_PROVINCE} and p.parent_id = c.id and upper(p.code) = ${provinceCode}`,
        `where city.location_type_id = ${TYPE_CITY} and upper(city.code) = ${code} and city.parent_id = c.id`,
        `  and c.location_type_id = ${TYPE_COUNTRY} and upper(c.code) = ${countryCode};`,
        ``
      );
    } else {
      out.push(
        `insert into category.locations (id, code, value_translations, location_type_id, parent_id, create_date, display_order)`,
        `select gen_random_uuid(), ${code}, ${translations}, ${TYPE_CITY}, c.id, now(), ${city.displayOrder}`,
        `from category.locations c`,
        `where c.location_type_id = ${TYPE_COUNTRY} and upper(c.code) = ${countryCode}${existsUnderCountry};`,
        ``
      );
    }
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, out.join("\n"));

  console.log(`Wrote ${args.out}`);
  console.log(`  ${generatedFrom}`);
  console.log(`  ${(fs.statSync(args.out).size / 1024 / 1024).toFixed(1)} MB`);
}

build();
