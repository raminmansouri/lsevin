import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import sql from "@/config/database/db";

/**
 * Catalogue write -> trigger -> outbox -> indexer -> unified_search.documents, on a real database.
 * The test database must end in "_it". Everything created here is removed afterwards.
 */
const dbName = new URL(process.env.DATABASE_URL ?? "postgres://x/none").pathname.slice(1);
const APP_ROOT = path.resolve(__dirname, "../../../..");

function runIndexer(...args: string[]) {
  return execFileSync(process.execPath, ["scripts/search-index.mjs", "--no-embed", ...args], {
    cwd: APP_ROOT,
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    encoding: "utf8",
  });
}

const ids = { definition: randomUUID(), provider: randomUUID(), offer: randomUUID(), inactive: randomUUID() };
const slug = `it-${ids.provider.slice(0, 8)}`;
let categoryId = "";
let providerTypeId = "";

async function docs(type: string, id: string) {
  return sql<
    { title: Record<string, string>; city: string | null; search_text: string; service_key: string | null; price_toman: string | null; lat: number | null; indexed_at: Date }[]
  >`select title, city, search_text, service_key, price_toman, lat, indexed_at from unified_search.documents where doc_type = ${type} and source_id = ${id}`;
}

describe.skipIf(!dbName.endsWith("_it"))("search indexer pipeline (real database)", () => {
  beforeAll(async () => {
    categoryId = (await sql`select id::text as id from category.categories limit 1`)[0].id;
    providerTypeId = (await sql`select id::text as id from category.provider_types limit 1`)[0].id;
    await sql`truncate unified_search.outbox`;
    await sql`
      insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value)
      values (${ids.definition}, ${sql.json({ "fa-IR": "آزمونکاشت مو", "en-US": "Ittest hair transplant" })}, ${sql.json({})}, ${categoryId}, 60, 'Fixed', true, 'IRR', 1000)`;
    await sql`
      insert into category.service_providers (id, name_translations, description_translations, is_active, provider_type_id, city, country, email, phone_number_country_code, phone_number, slug, latitude, longitude)
      values (${ids.provider}, ${sql.json({ "fa-IR": "کلینیک آزمون قیطریه" })}, ${sql.json({ "fa-IR": "توضیح" })}, true, ${providerTypeId}, 'Tehran', 'IR', 'it@example.invalid', '98', '9120000000', ${slug}, 35.795, 51.443)`;
    await sql`
      insert into category.provider_services (id, service_definition_id, display_name_translations, description_translations, is_active, service_provider_id, currency, value, create_date, slug, value_toman)
      values (${ids.offer}, ${ids.definition}, ${sql.json({})}, ${sql.json({ "fa-IR": "کاشت مو با روش آزمایشی" })}, true, ${ids.provider}, 'IRR', 450000000, now(), ${slug + "-offer"}, 45000000)`;
  });

  afterAll(async () => {
    const all = Object.values(ids);
    await sql`delete from unified_search.documents where source_id = any(${all})`;
    await sql`delete from unified_search.outbox where source_id = any(${all})`;
    await sql`delete from category.provider_services where service_provider_id = any(${[ids.provider, ids.inactive]})`;
    await sql`delete from category.service_providers where id = any(${[ids.provider, ids.inactive]})`;
    await sql`delete from category.service_definitions where id = ${ids.definition}`;
    await sql.end({ timeout: 2 });
  });

  it("triggers queue the changed provider and its offer", async () => {
    const queued = await sql<{ source_type: string; source_id: string }[]>`
      select source_type, source_id from unified_search.outbox where source_id = any(${Object.values(ids)})`;
    const keys = queued.map((row) => `${row.source_type}:${row.source_id}`);
    expect(keys).toContain(`provider:${ids.provider}`);
    expect(keys).toContain(`offer:${ids.offer}`);
  });

  it("the worker indexes them and empties what it processed", async () => {
    runIndexer();
    const [provider] = await docs("provider", ids.provider);
    const [offer] = await docs("offer", ids.offer);
    expect(provider.city).toBe("tehran");
    expect(provider.lat).toBeCloseTo(35.795);
    expect(offer.service_key).toBe(ids.definition);
    expect(Number(offer.price_toman)).toBe(45_000_000);
    expect(offer.search_text).toContain("آزمونکاشت مو");
    // The provider's name is searchable on its offers.
    expect(offer.search_text).toContain("کلینیک آزمون قیطریه");
    const left = await sql`select 1 from unified_search.outbox where source_id = any(${Object.values(ids)})`;
    expect(left.length).toBe(0);
  });

  it("running again changes nothing (idempotent)", async () => {
    const before = await docs("offer", ids.offer);
    runIndexer("--full", "--type", "offer");
    const after = await docs("offer", ids.offer);
    expect(after[0].indexed_at.getTime()).toBe(before[0].indexed_at.getTime());
  });

  it("a provider change reaches its offers", async () => {
    await sql`update category.service_providers set city = 'Isfahan' where id = ${ids.provider}`;
    runIndexer();
    expect((await docs("provider", ids.provider))[0].city).toBe("isfahan");
    expect((await docs("offer", ids.offer))[0].city).toBe("isfahan");
  });

  it("a treatment rename reaches every offer of that treatment", async () => {
    await sql`update category.service_definitions set name_translations = ${sql.json({ "fa-IR": "نام تازه درمان", "en-US": "Renamed" })} where id = ${ids.definition}`;
    runIndexer();
    const [offer] = await docs("offer", ids.offer);
    expect(offer.search_text).toContain("نام تازه درمان");
    expect(offer.search_text).not.toContain("آزمونکاشت");
  });

  it("an inactive provider is not indexed, and deactivating an offer removes its document", async () => {
    await sql`
      insert into category.service_providers (id, name_translations, description_translations, is_active, provider_type_id, city, country, email, phone_number_country_code, phone_number, slug)
      values (${ids.inactive}, ${sql.json({ "fa-IR": "غیرفعال" })}, ${sql.json({})}, false, ${providerTypeId}, 'Tehran', 'IR', 'x@example.invalid', '98', '9120000001', ${slug + "-off"})`;
    runIndexer();
    expect((await docs("provider", ids.inactive)).length).toBe(0);

    await sql`update category.provider_services set is_active = false where id = ${ids.offer}`;
    runIndexer();
    expect((await docs("offer", ids.offer)).length).toBe(0);
  });

  it("the full reconcile removes documents whose source no longer exists", async () => {
    const orphan = randomUUID();
    await sql`
      insert into unified_search.documents (doc_type, source_id, url, search_text, content_hash)
      values ('offer', ${orphan}, '/services/ghost', 'ghost', 'x')`;
    runIndexer("--full", "--type", "offer");
    expect((await docs("offer", orphan)).length).toBe(0);
  });

  it("a failing trigger cannot break a catalogue write", async () => {
    await sql`alter table unified_search.outbox rename to outbox_tmp`;
    try {
      await expect(sql`update category.service_providers set city = 'Tehran' where id = ${ids.provider}`).resolves.toBeDefined();
    } finally {
      await sql`alter table unified_search.outbox_tmp rename to outbox`;
    }
  });
});
