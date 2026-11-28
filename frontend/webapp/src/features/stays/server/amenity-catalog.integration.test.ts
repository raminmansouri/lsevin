import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertLocalDatabase, seedStay, seedStayCity, seedStayProvider, seedUser } from "../testing/fixtures";

const identity = vi.hoisted(() => ({ userId: null as string | null, isAdmin: false }));
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => identity.userId ? { user: { id: identity.userId } } : null,
}));
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: async () => ({ isAdmin: identity.isAdmin, roles: identity.isAdmin ? ["admin"] : ["user"] }),
}));
vi.mock("next/cache", async (load) => ({
  ...(await load<typeof import("next/cache")>()),
  revalidatePath: vi.fn(), revalidateTag: vi.fn(),
}));

const url = process.env.STAYS_TEST_DATABASE_URL;
describe.skipIf(!url)("amenity catalog server action with PostgreSQL", () => {
  let sql: postgres.Sql;
  let admin: string;
  let save: typeof import("./actions/admin").saveAmenityAction;
  const code = "qa_" + randomUUID().replaceAll("-", "");
  const payload = { code, revision: 1, label: { "en-US": "Updated" }, imageId: null, icon: "coffee" };

  beforeAll(async () => {
    assertLocalDatabase(url!);
    sql = postgres(url!, { max: 1 });
    admin = (await seedUser(sql as never)).id;
    await sql`insert into stay.amenities (code,grp,label,icon) values
      (${code},'room','{"en-US":"Original","fa-IR":"Persian label"}'::jsonb,'check')`;
    ({ saveAmenityAction: save } = await import("./actions/admin"));
  });

  afterAll(async () => {
    if (sql) {
      await sql`delete from stay.amenities where code=${code}`;
      await sql.end();
    }
  });

  it("checks the actor before accepting a catalog edit", async () => {
    identity.userId = null;
    identity.isAdmin = false;
    expect(await save(payload)).toMatchObject({ ok: false, error: { kind: "authentication" } });
    identity.userId = admin;
    expect(await save(payload)).toMatchObject({ ok: false, error: { kind: "authorization" } });
  });

  it("rejects invalid languages, missing images, and missing amenities", async () => {
    identity.userId = admin;
    identity.isAdmin = true;
    for (const invalid of [{ label: { "xx-XX": "Other" } }, { imageId: randomUUID() }, { label: {} }]) {
      expect(await save({ ...payload, ...invalid })).toMatchObject({ ok: false, error: { kind: "validation" } });
    }
    expect(await save({ ...payload, code: code + "x" })).toMatchObject({ ok: false, error: { kind: "not_found" } });
  });

  it("validates room choices and keeps them independent of the hotel", async () => {
    identity.userId = admin;
    identity.isAdmin = true;
    const { id: providerId } = await seedStayProvider(sql as never, admin);
    const city = await seedStayCity(sql as never);
    const stay = await seedStay(sql as never, { providerId, cityId: city.id });
    const { getPropertyAdmin } = await import("./admin/properties");
    const { saveRoomTypeAction } = await import("./actions/admin");
    const original = await getPropertyAdmin(stay.id);
    const { id: roomId, ...room } = original.rooms[0];
    const update = (amenityCodes: string[]) => saveRoomTypeAction({
      propertyId: stay.id, roomId, data: { ...room, amenityCodes },
    });
    for (const codes of [["no_such_amenity"], ["door_lock_type_v2"], ["door_lock_type", "door_lock_type"], ["door_lock_type", "door_lock_type_v1", "door_lock_type_v2"]]) {
      expect(await update(codes)).toMatchObject({ ok: false, error: { kind: "validation", details: { fields: { amenityCodes: "invalid" } } } });
    }
    const selected = ["door_lock_type", "door_lock_type_v2"];
    expect(await update(selected)).toMatchObject({ ok: true });
    const edited = await getPropertyAdmin(stay.id);
    expect(edited.rooms[0].amenityCodes).toEqual(selected);
    expect(edited.property.amenityCodes).toEqual(original.property.amenityCodes);
    expect(await update([])).toMatchObject({ ok: true });
    expect((await getPropertyAdmin(stay.id)).rooms[0].amenityCodes).toEqual([]);
  });

  it("exposes a public image and restores the default icon when that file is removed", async () => {
    identity.userId = admin;
    identity.isAdmin = true;
    const imageCode = "qa_" + randomUUID().replaceAll("-", "");
    const path = "/images/" + imageCode + ".webp";
    const [image] = await sql`insert into media.media_library(original_name,stored_name,file_url,mime_type,media_type,is_public)
      values (${imageCode},${imageCode},${path},'image/webp','image',false) returning id`;
    try {
      await sql`insert into stay.amenities(code,grp,label,icon) values
        (${imageCode},'room','{"en-US":"Photo"}'::jsonb,'coffee')`;
      const input = { ...payload, code: imageCode, imageId: image.id };
      expect(await save(input)).toMatchObject({ ok: false, error: { kind: "validation" } });
      await sql`update media.media_library set is_public=true where id=${image.id}`;
      expect(await save(input)).toMatchObject({ ok: true });
      const { listAmenities } = await import("./catalog");
      const read = async () => (await listAmenities("en-US")).find(row => row.code === imageCode);
      expect(await read()).toMatchObject({ imageUrl: path, icon: "coffee" });
      await sql`delete from media.media_library where id=${image.id}`;
      expect(await read()).toMatchObject({ imageUrl: null, icon: "coffee" });
    } finally {
      await sql`delete from stay.amenities where code=${imageCode}`;
      await sql`delete from media.media_library where id=${image.id}`;
    }
  });

  it("accepts one concurrent edit, retains other languages, and records one audit event", async () => {
    identity.userId = admin;
    identity.isAdmin = true;
    const results = await Promise.all([save(payload), save(payload)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results).toContainEqual(expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "stale_edit" }) }));
    const [row] = await sql`select label,icon,revision from stay.amenities where code=${code}`;
    expect(row).toMatchObject({ label: { "fa-IR": "Persian label", "en-US": "Updated" }, icon: "coffee", revision: 2 });
    const events = await sql`select action from stay.audit_log where entity_type='amenity' and detail->>'code'=${code}`;
    expect(events).toHaveLength(1);
  });
});

describe.skipIf(!url)("amenity catalogue: adding, options, sections and switching off (PostgreSQL)", () => {
  let sql: postgres.Sql;
  let admin: string;
  let actions: typeof import("./actions/admin");
  let catalog: typeof import("./catalog");
  const created: string[] = [];
  const tag = randomUUID().slice(0, 8);

  beforeAll(async () => {
    assertLocalDatabase(url!);
    sql = postgres(url!, { max: 2 });
    admin = (await seedUser(sql as never)).id;
    actions = await import("./actions/admin");
    catalog = await import("./catalog");
    identity.userId = admin;
    identity.isAdmin = true;
  });

  afterAll(async () => {
    if (!sql) return;
    await sql`update stay.properties set amenity_codes = array(select c from unnest(amenity_codes) c where not c = any(${created}::text[]))`;
    await sql`delete from stay.amenities where parent_code = any(${created}::text[])`;
    await sql`delete from stay.amenities where code = any(${created}::text[])`;
    await sql.end();
  });

  const create = async (input: Record<string, unknown>) => {
    const res = (await actions.createAmenityAction({ icon: "check", group: "general", parentCode: null, imageId: null, ...input })) as any;
    if (res.ok) created.push(res.data.code);
    return res;
  };
  const row = async (code: string) => (await sql<any[]>`select * from stay.amenities where code = ${code}`)[0];

  it("adds an amenity with a readable unique code, at the end of its section; non-admins are refused", async () => {
    identity.isAdmin = false;
    expect(await create({ label: { "en-US": `Rooftop pool ${tag}` } })).toMatchObject({ ok: false, error: { kind: "authorization" } });
    identity.isAdmin = true;
    const first = await create({ label: { "en-US": `Rooftop pool ${tag}`, "fa-IR": "استخر روی بام" }, group: "wellness", icon: "waves-ladder" });
    const second = await create({ label: { "en-US": `Rooftop pool ${tag}` }, group: "wellness" });
    expect(first).toMatchObject({ ok: true, data: { code: `rooftop_pool_${tag}` } });
    expect(second).toMatchObject({ ok: true, data: { code: `rooftop_pool_${tag}_2` } });
    const r = await row(first.data.code);
    expect(r).toMatchObject({ grp: "wellness", icon: "waves-ladder", parent_code: null, is_active: true });
    expect(r.label).toEqual({ "en-US": `Rooftop pool ${tag}`, "fa-IR": "استخر روی بام" });
    const [{ max }] = await sql<any[]>`select max(sort_order) as max from stay.amenities where grp = 'wellness' and code <> ${second.data.code}`;
    expect((await row(second.data.code)).sort_order).toBeGreaterThan(Number(max) - 1);
    // A Persian-only name still gets a valid code.
    expect(await create({ label: { "fa-IR": "حوض سنتی" } })).toMatchObject({ ok: true, data: { code: expect.stringMatching(/^amenity(_\d+)?$/) } });
  });

  it("an option takes its parent's section; options cannot have options; an amenity with options cannot become one", async () => {
    const parent = (await create({ label: { "en-US": `Pillow type ${tag}` }, group: "room" })).data.code;
    const option = await create({ label: { "en-US": `Memory foam ${tag}` }, parentCode: parent, group: "wellness" });
    expect(option.ok).toBe(true);
    expect(await row(option.data.code)).toMatchObject({ parent_code: parent, grp: "room" });
    expect(await create({ label: { "en-US": `Nested ${tag}` }, parentCode: option.data.code })).toMatchObject({ ok: false, error: { code: "invalid_parent" } });
    const other = (await create({ label: { "en-US": `Other ${tag}` } })).data.code;
    const p = await row(parent);
    expect(await actions.saveAmenityAction({ code: parent, revision: p.revision, label: {}, icon: "bed-double", imageId: null, parentCode: other })).toMatchObject({ ok: false });
    expect(await actions.saveAmenityAction({ code: parent, revision: p.revision, label: { "en-US": `Pillow type ${tag}` }, icon: "bed-double", imageId: null, parentCode: other })).toMatchObject({ ok: false, error: { code: "amenity_has_options" } });
    // Moving the parent to another section moves its options too.
    expect(await actions.saveAmenityAction({ code: parent, revision: p.revision, label: { "en-US": `Pillow type ${tag}` }, icon: "bed-double", imageId: null, group: "bathroom" })).toMatchObject({ ok: true });
    expect((await row(option.data.code)).grp).toBe("bathroom");
  });

  it("switching an amenity off hides it everywhere but keeps the hotels' selection", async () => {
    const code = (await create({ label: { "en-US": `Ice machine ${tag}` }, group: "general" })).data.code;
    const owner = await seedUser(sql as never);
    const provider = await seedStayProvider(sql as never, owner.id);
    const city = await seedStayCity(sql as never);
    const stay = await seedStay(sql as never, { providerId: provider.id, cityId: city.id });
    await sql`update stay.properties set amenity_codes = amenity_codes || ${[code]}::text[] where id = ${stay.id}::uuid`;
    expect((await catalog.listAmenities("en-US")).some((a) => a.code === code)).toBe(true);
    expect(await catalog.usedAmenityCodes()).toContain(code);
    const r = await row(code);
    expect(await actions.saveAmenityAction({ code, revision: r.revision, label: r.label, icon: "check", imageId: null, isActive: false })).toMatchObject({ ok: true });
    expect((await catalog.listAmenities("en-US")).some((a) => a.code === code)).toBe(false);
    const p = await catalog.getPropertyDetail({ slug: stay.slug }, "en-US");
    expect(p?.amenities.some((a) => a.code === code)).toBe(false);
    const [{ amenity_codes }] = await sql<any[]>`select amenity_codes from stay.properties where id = ${stay.id}::uuid`;
    expect(amenity_codes).toContain(code);
  });

  it("guests see a chosen option instead of its parent (no 'Door lock type' next to 'Key card')", async () => {
    const owner = await seedUser(sql as never);
    const provider = await seedStayProvider(sql as never, owner.id);
    const city = await seedStayCity(sql as never);
    const stay = await seedStay(sql as never, { providerId: provider.id, cityId: city.id });
    await sql`update stay.properties set amenity_codes = '{wifi,door_lock_type,door_lock_type_v2}' where id = ${stay.id}::uuid`;
    const p = await catalog.getPropertyDetail({ slug: stay.slug }, "en-US");
    const codes = p?.amenities.map((a) => a.code) ?? [];
    expect(codes).toContain("door_lock_type_v2");
    expect(codes).not.toContain("door_lock_type");
    expect(codes).toContain("wifi");
  });
});
