import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { duplicateServiceProvider } from "./duplicate-provider";

/**
 * Regression: duplicating a provider failed with
 * `duplicate key value violates unique constraint "service_providers_slug_uq"`
 * because the copy kept the source slug. Real Postgres (local only); the fixture
 * provider and every copy are removed afterwards.
 */

const url = process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

const tag = `dup${Date.now().toString(36)}`;
const sourceId = randomUUID();
const created: string[] = [];

async function slugOf(id: string) {
  const [row] = await sql!<{ slug: string | null }[]>`select slug from category.service_providers where id = ${id}::uuid`;
  return row?.slug ?? null;
}

d("duplicateServiceProvider slug (real database)", () => {
  beforeAll(async () => {
    const s = sql!;
    const [type] = await s<{ id: string }[]>`select provider_type_id::text as id from category.service_providers limit 1`;
    await s`
      insert into category.service_providers (id, is_active, provider_type_id, city, country, email, phone_number_country_code, phone_number,
        name_translations, description_translations, slug)
      values (${sourceId}::uuid, true, ${type.id}::uuid, 'Tehran', 'IR', ${`${tag}@example.test`}, '+98', '9120000000',
        ${s.json({ "fa-IR": `کلینیک ${tag}`, "en-US": `${tag} clinic` })}, ${s.json({})}, ${`${tag}-clinic`})
    `;
    const [def] = await s<{ id: string }[]>`select id::text as id from category.service_definitions limit 1`;
    await s`
      insert into category.provider_services (id, service_definition_id, display_name_translations, description_translations,
        is_active, service_provider_id, currency, value, create_date)
      values (${randomUUID()}::uuid, ${def.id}::uuid, ${s.json({ "en-US": `${tag} service` })}, ${s.json({})},
        true, ${sourceId}::uuid, 'IRR', 1000, now())
    `;
  });

  afterAll(async () => {
    if (!sql) return;
    const ids = [...created, sourceId];
    await sql`delete from category.provider_services where service_provider_id in ${sql(ids)}`;
    await sql`delete from category.service_providers where id in ${sql(ids)}`;
    await sql.end();
  });

  it("gives each copy (and its services) a fresh unique slug instead of colliding", async () => {
    const copies = [];
    for (const from of [sourceId, sourceId, null]) {
      const copy = await duplicateServiceProvider(from ?? copies[0].id);
      created.push(copy.id);
      copies.push(copy);
    }
    const slugs = await Promise.all(copies.map((c) => slugOf(c.id)));
    for (const slug of slugs) {
      expect(slug).toBeTruthy();
      expect(slug).not.toBe(`${tag}-clinic`);
    }
    expect(new Set(slugs).size).toBe(3);

    // Services were copied too, each with its own slug (provider_services_slug_uq).
    const services = await sql!<{ slug: string | null }[]>`
      select slug from category.provider_services where service_provider_id in ${sql!([sourceId, ...created])}`;
    expect(services).toHaveLength(4);
    expect(new Set(services.map((r) => r.slug)).size).toBe(4);

    // Source is untouched and copies start hidden.
    expect(await slugOf(sourceId)).toBe(`${tag}-clinic`);
    const [copy] = await sql!<{ is_active: boolean }[]>`select is_active from category.service_providers where id = ${copies[0].id}::uuid`;
    expect(copy.is_active).toBe(false);
  });
});
