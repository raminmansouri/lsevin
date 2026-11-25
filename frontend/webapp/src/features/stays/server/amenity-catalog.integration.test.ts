import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertLocalDatabase, seedUser } from "../testing/fixtures";

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
