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
    expect(results).toContainEqual(expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "stale_update" }) }));
    const [row] = await sql`select label,icon,revision from stay.amenities where code=${code}`;
    expect(row).toMatchObject({ label: { "fa-IR": "Persian label", "en-US": "Updated" }, icon: "coffee", revision: 2 });
    const events = await sql`select action from stay.audit_log where entity_type='amenity' and detail->>'code'=${code}`;
    expect(events).toHaveLength(1);
  });
});
