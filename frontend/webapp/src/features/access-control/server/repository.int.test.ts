import { randomUUID } from "node:crypto";

import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Real-Postgres checks for admin access control: roles, permissions, membership, the staff
 * lifecycle, and what `loadAdminAccess` then reports. Opt-in: needs ACCOUNTING_TEST_DATABASE_URL
 * pointing at a LOCAL database with migration 0110 applied (`pnpm test:local-env --suite admin-access`).
 * Every row it creates is removed.
 */

const actor = vi.hoisted(() => ({ allowed: true, userId: "" }));
vi.mock("@/lib/auth/admin-guard", () => ({
  assertAdmin: vi.fn(async () => {
    if (!actor.allowed) throw new Error("Forbidden: admin access is required.");
    return { userId: actor.userId, isAdmin: true };
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

const tag = `it-access-${Date.now().toString(36)}`;
const ids = { actor: randomUUID(), member: randomUUID(), plain: randomUUID(), superadmin: randomUUID() };
const createdRoles: string[] = [];
let repo: typeof import("./repository");
let store: typeof import("@/lib/admin/access/store");
let actions: typeof import("./actions");
let adminRoleId = "";
let superRoleId = "";

async function makeUser(id: string, label: string) {
  const s = sql!;
  await s`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
          values (${id}, ${label}, ${tag}, '98', ${`${tag}-${label}`}, ${`${tag}-${label}`.toUpperCase()}, ${`${tag}-${label}@example.com`}, ${`${tag}-${label}@EXAMPLE.COM`.toUpperCase()}, true, ${`9${Math.floor(Math.random() * 1e9).toString().padStart(9, "0")}`}, true, false, false, 0)`;
}

const hasIdentityRole = async (userId: string, roleId: string) =>
  (await sql!`select 1 from identity.asp_net_user_roles where user_id = ${userId} and role_id = ${roleId}`).length > 0;

d("admin access control (real database)", () => {
  beforeAll(async () => {
    const s = sql!;
    adminRoleId = (await s<{ id: string }[]>`select id::text as id from identity.asp_net_roles where lower(name) = 'admin'`)[0]?.id;
    superRoleId = (await s<{ id: string }[]>`select id::text as id from identity.asp_net_roles where lower(name) = 'superadmin'`)[0]?.id;
    expect(adminRoleId, "identity role 'admin' must exist in the test database").toBeTruthy();
    for (const [key, label] of [["actor", "actor"], ["member", "member"], ["plain", "plain"], ["superadmin", "super"]] as const) {
      await makeUser(ids[key], label);
    }
    // `plain` is an ordinary unmanaged admin; `superadmin` is a super admin.
    await s`insert into identity.asp_net_user_roles (user_id, role_id) values (${ids.plain}, ${adminRoleId})`;
    if (superRoleId) await s`insert into identity.asp_net_user_roles (user_id, role_id) values (${ids.superadmin}, ${superRoleId})`;
    actor.userId = ids.actor;
    repo = await import("./repository");
    store = await import("@/lib/admin/access/store");
    actions = await import("./actions");
  });

  beforeEach(async () => {
    actor.allowed = true;
    // Every test starts with `member` as a plain non-admin and `plain` as an unmanaged admin,
    // whatever earlier tests did to them.
    const s = sql!;
    await s`delete from auth.user_roles where user_id in (${ids.member}, ${ids.plain})`;
    await s`delete from auth.staff_members where user_id in (${ids.member}, ${ids.plain})`;
    await s`delete from identity.asp_net_user_roles where user_id = ${ids.member} and role_id = ${adminRoleId}`;
    store.invalidateAdminAccess();
  });

  afterAll(async () => {
    const s = sql;
    if (!s) return;
    const users = Object.values(ids);
    await s`delete from auth.admin_access_audit where actor_user_id in ${s(users)} or target_user_id in ${s(users)}`;
    await s`delete from auth.user_roles where user_id in ${s(users)}`;
    if (createdRoles.length) await s`delete from auth.roles where id in ${s(createdRoles)}`;
    await s`delete from auth.staff_members where user_id in ${s(users)}`;
    await s`delete from identity.asp_net_user_roles where user_id in ${s(users)}`;
    await s`delete from identity.asp_net_users where id in ${s(users)}`;
    await s.end();
  });

  const newRole = async (name: string) => {
    const { id } = await repo.createRole(ids.actor, { name: `${tag} ${name}`, description: "integration test" });
    createdRoles.push(id);
    return id;
  };

  describe("roles", () => {
    it("creates, reads back, renames and lists a role", async () => {
      const id = await newRole("Support");
      const detail = await repo.getRoleDetail(id);
      expect(detail?.role.name).toBe(`${tag} Support`);
      expect(detail?.grants).toEqual({});

      await repo.updateRole(ids.actor, id, { name: `${tag} Support L2`, description: null });
      expect((await repo.getRoleDetail(id))?.role).toMatchObject({ name: `${tag} Support L2`, description: null });
      expect((await repo.listRoles()).some((r) => r.id === id)).toBe(true);
    });

    it("rejects invalid, reserved and duplicate names with structured errors (not infrastructure errors)", async () => {
      await expect(repo.createRole(ids.actor, { name: "x" })).rejects.toMatchObject({ code: "validation" });
      await expect(repo.createRole(ids.actor, { name: "Admin" })).rejects.toMatchObject({ code: "validation" });
      await expect(repo.createRole(ids.actor, { name: "superadmin" })).rejects.toMatchObject({ code: "validation" });
      await newRole("Dupe");
      await expect(repo.createRole(ids.actor, { name: `${tag} DUPE` })).rejects.toMatchObject({ code: "conflict" });
    });

    it("built-in roles are invisible to the management API", async () => {
      const [system] = await sql!<{ id: string }[]>`select id::text as id from auth.roles where is_system = true limit 1`;
      if (!system) return; // fresh database: 0001 may not have mirrored them
      expect(await repo.getRoleDetail(system.id)).toBeNull();
      await expect(repo.updateRole(ids.actor, system.id, { name: "Renamed" })).rejects.toMatchObject({ code: "not_found" });
      await expect(repo.deleteRole(ids.actor, system.id)).rejects.toMatchObject({ code: "not_found" });
      expect((await repo.listRoles()).some((r) => r.id === system.id)).toBe(false);
    });
  });

  describe("permissions", () => {
    it("saves, replaces and persists a permission set", async () => {
      const id = await newRole("Perms");
      await repo.setRolePermissions(ids.actor, id, [
        { resourceKey: "bookings", level: "view" },
        { resourceKey: "customers", level: "manage" },
      ]);
      expect((await repo.getRoleDetail(id))?.grants).toEqual({ bookings: "view", customers: "manage" });

      await repo.setRolePermissions(ids.actor, id, [{ resourceKey: "bookings", level: "manage" }]);
      expect((await repo.getRoleDetail(id))?.grants).toEqual({ bookings: "manage" });

      await repo.setRolePermissions(ids.actor, id, []);
      expect((await repo.getRoleDetail(id))?.grants).toEqual({});
    });

    it("refuses keys that do not exist, privileged areas, pending areas and bad levels — and saves nothing", async () => {
      const id = await newRole("Bad perms");
      await repo.setRolePermissions(ids.actor, id, [{ resourceKey: "bookings", level: "view" }]);
      const bad = [
        { resourceKey: "no-such-area", level: "view" },
        { resourceKey: "access-control", level: "manage" },
        { resourceKey: "identity-users", level: "view" },
        { resourceKey: "table-browser", level: "view" },
        { resourceKey: "tours-platform.tours", level: "view" },
        { resourceKey: "bookings", level: "owner" },
      ];
      for (const entry of bad) {
        await expect(repo.setRolePermissions(ids.actor, id, [{ resourceKey: "customers", level: "view" }, entry])).rejects.toMatchObject({ code: "validation" });
      }
      // Previous set untouched by any of the failed attempts.
      expect((await repo.getRoleDetail(id))?.grants).toEqual({ bookings: "view" });
    });

    it("a malformed key cannot be stored even around the application checks (database constraint)", async () => {
      const id = await newRole("Constraint");
      await expect(
        sql!`insert into auth.role_admin_permissions (role_id, resource_key, level) values (${id}, 'Bad Key!', 'view')`
      ).rejects.toThrow();
      await expect(
        sql!`insert into auth.role_admin_permissions (role_id, resource_key, level) values (${id}, 'bookings', 'owner')`
      ).rejects.toThrow();
    });
  });

  describe("who has what access", () => {
    it("superadmin is unlimited; an unmanaged admin is unlimited; a customer has none", async () => {
      expect(await store.loadAdminAccess(ids.superadmin, ["superadmin", "admin"])).toEqual({ kind: "unlimited", reason: "superadmin" });
      expect(await store.loadAdminAccess(ids.plain, ["admin"])).toEqual({ kind: "unlimited", reason: "admin" });
      expect((await store.loadAdminAccess(ids.member, ["user"])).kind).toBe("none");
    });

    it("adding a member makes them a limited admin with exactly the role's grants — and gives them the admin role", async () => {
      const id = await newRole("Limited");
      await repo.setRolePermissions(ids.actor, id, [{ resourceKey: "bookings", level: "view" }]);
      expect(await hasIdentityRole(ids.member, adminRoleId)).toBe(false);

      await repo.addMember(ids.actor, id, ids.member);

      expect(await hasIdentityRole(ids.member, adminRoleId)).toBe(true);
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({ kind: "limited", grants: { bookings: "view" } });
      expect((await repo.getRoleDetail(id))?.members.map((m) => m.userId)).toEqual([ids.member]);
    });

    it("changes show up immediately on this process (cache invalidated), and union across roles takes the higher level", async () => {
      const a = await newRole("Union A");
      const b = await newRole("Union B");
      await repo.setRolePermissions(ids.actor, a, [{ resourceKey: "bookings", level: "view" }]);
      await repo.setRolePermissions(ids.actor, b, [{ resourceKey: "bookings", level: "manage" }, { resourceKey: "customers", level: "view" }]);
      await repo.addMember(ids.actor, a, ids.member);
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({ kind: "limited", grants: { bookings: "view" } });

      await repo.addMember(ids.actor, b, ids.member);
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({
        kind: "limited",
        grants: { bookings: "manage", customers: "view" },
      });

      await repo.setRolePermissions(ids.actor, b, []);
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({ kind: "limited", grants: { bookings: "view" } });
    });

    it("removing the last role leaves them limited with NO access — never unlimited", async () => {
      const id = await newRole("Last role");
      await repo.setRolePermissions(ids.actor, id, [{ resourceKey: "bookings", level: "manage" }]);
      await repo.addMember(ids.actor, id, ids.member);
      await repo.removeMember(ids.actor, id, ids.member);
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({ kind: "limited", grants: {} });
    });

    it("deleting a role removes its grants from everyone, and members keep no access", async () => {
      const id = await newRole("Doomed");
      await repo.setRolePermissions(ids.actor, id, [{ resourceKey: "customers", level: "manage" }]);
      await repo.addMember(ids.actor, id, ids.member);
      await repo.deleteRole(ids.actor, id);
      createdRoles.splice(createdRoles.indexOf(id), 1);

      expect(await repo.getRoleDetail(id)).toBeNull();
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({ kind: "limited", grants: {} });
      expect(await sql!`select 1 from auth.role_admin_permissions where role_id = ${id}`).toHaveLength(0);
    });

    it("an existing admin can be limited (and starts with no access), disabled, re-enabled, and released to unlimited", async () => {
      await repo.manageAdmin(ids.actor, ids.plain);
      expect(await store.loadAdminAccess(ids.plain, ["admin"])).toEqual({ kind: "limited", grants: {} });

      await repo.setStaffStatus(ids.actor, ids.plain, "disabled");
      expect(await store.loadAdminAccess(ids.plain, ["admin"])).toEqual({ kind: "none", reason: "disabled" });

      await repo.setStaffStatus(ids.actor, ids.plain, "active");
      expect((await store.loadAdminAccess(ids.plain, ["admin"])).kind).toBe("limited");

      await repo.releaseStaff(ids.actor, ids.plain, "unlimited");
      expect(await store.loadAdminAccess(ids.plain, ["admin"])).toEqual({ kind: "unlimited", reason: "admin" });
      // Their own pre-existing admin role was never ours to take away.
      expect(await hasIdentityRole(ids.plain, adminRoleId)).toBe(true);
    });

    it("revoke disables, and takes back the admin role only if this feature granted it", async () => {
      const id = await newRole("Revoke");
      await repo.addMember(ids.actor, id, ids.member); // member had no admin role -> auto-granted
      expect(await hasIdentityRole(ids.member, adminRoleId)).toBe(true);

      await repo.releaseStaff(ids.actor, ids.member, "revoke");
      expect(await hasIdentityRole(ids.member, adminRoleId)).toBe(false);
      // A stale token that still says "admin" gets nothing, because the staff row is disabled.
      expect(await store.loadAdminAccess(ids.member, ["admin"])).toEqual({ kind: "none", reason: "disabled" });

      // Re-adding re-activates and re-grants what the revoke removed.
      await repo.addMember(ids.actor, id, ids.member);
      expect(await hasIdentityRole(ids.member, adminRoleId)).toBe(true);
      expect((await store.loadAdminAccess(ids.member, ["admin"])).kind).toBe("limited");
    });
  });

  describe("safety rules", () => {
    it("you cannot limit, disable or release yourself", async () => {
      const id = await newRole("Self");
      await expect(repo.addMember(ids.actor, id, ids.actor)).rejects.toMatchObject({ code: "forbidden" });
      await expect(repo.manageAdmin(ids.actor, ids.actor)).rejects.toMatchObject({ code: "forbidden" });
      await expect(repo.setStaffStatus(ids.actor, ids.actor, "disabled")).rejects.toMatchObject({ code: "forbidden" });
    });

    it("a super admin can never be limited", async () => {
      if (!superRoleId) return;
      const id = await newRole("Not super");
      await expect(repo.addMember(ids.actor, id, ids.superadmin)).rejects.toMatchObject({ code: "forbidden" });
      await expect(repo.manageAdmin(ids.actor, ids.superadmin)).rejects.toMatchObject({ code: "forbidden" });
    });

    it("unknown users and roles are not-found errors; removing a non-member is a not-found error", async () => {
      const id = await newRole("Missing");
      await expect(repo.addMember(ids.actor, id, randomUUID())).rejects.toMatchObject({ code: "not_found" });
      await expect(repo.addMember(ids.actor, randomUUID(), ids.member)).rejects.toMatchObject({ code: "not_found" });
      await expect(repo.removeMember(ids.actor, id, ids.member)).rejects.toMatchObject({ code: "not_found" });
    });

    it("adding the same member twice is idempotent (no duplicate rows)", async () => {
      const id = await newRole("Twice");
      await repo.addMember(ids.actor, id, ids.member);
      await repo.addMember(ids.actor, id, ids.member);
      expect(await sql!`select 1 from auth.user_roles where role_id = ${id} and user_id = ${ids.member}`).toHaveLength(1);
    });

    it("concurrent adds of the same member do not fail or duplicate", async () => {
      const id = await newRole("Race");
      await Promise.all([repo.addMember(ids.actor, id, ids.member), repo.addMember(ids.actor, id, ids.member)]);
      expect(await sql!`select 1 from auth.user_roles where role_id = ${id} and user_id = ${ids.member}`).toHaveLength(1);
      expect(await sql!`select 1 from auth.staff_members where user_id = ${ids.member}`).toHaveLength(1);
    });

    it("user search finds people by name, flags admins, and ignores wildcard characters", async () => {
      const hits = await repo.searchUsers(`${tag}-plain`);
      expect(hits.map((h) => h.userId)).toContain(ids.plain);
      expect(hits.find((h) => h.userId === ids.plain)?.isAdmin).toBe(true);
      expect(await repo.searchUsers("%")).toEqual([]);
      expect(await repo.searchUsers("a")).toEqual([]);
    });

    it("every mutation leaves an audit row naming who did what", async () => {
      const id = await newRole("Audited");
      await repo.setRolePermissions(ids.actor, id, [{ resourceKey: "customers", level: "view" }]);
      await repo.addMember(ids.actor, id, ids.member);
      const rows = await sql!<{ action: string }[]>`
        select action from auth.admin_access_audit where actor_user_id = ${ids.actor} and (role_id = ${id}) order by created_at`;
      expect(rows.map((r) => r.action)).toEqual(["role.created", "role.permissions_set", "member.added"]);
    });
  });

  describe("server actions", () => {
    it("refuse non-unlimited callers without touching data", async () => {
      actor.allowed = false;
      const result = await actions.createRoleAction({ name: `${tag} sneaky` });
      expect(result).toMatchObject({ ok: false, error: { code: "unauthorized" } });
      expect(await sql!`select 1 from auth.roles where name = ${`${tag} sneaky`}`).toHaveLength(0);
    });

    it("return structured results: success with data, validation/conflict codes, and no leaked exceptions", async () => {
      const created = await actions.createRoleAction({ name: `${tag} via action`, description: "d" });
      expect(created.ok).toBe(true);
      const id = (created as { data: { id: string } }).data.id;
      createdRoles.push(id);

      expect(await actions.createRoleAction({ name: `${tag} VIA ACTION` })).toMatchObject({ ok: false, error: { code: "conflict" } });
      expect(await actions.createRoleAction({ name: 1 })).toMatchObject({ ok: false, error: { code: "validation" } });
      expect(await actions.setRolePermissionsAction(id, [{ resourceKey: "nope", level: "view" }])).toMatchObject({ ok: false, error: { code: "validation" } });
      expect(await actions.setRolePermissionsAction("not-a-guid", [])).toMatchObject({ ok: false, error: { code: "validation" } });
      expect(await actions.setRolePermissionsAction(id, [{ resourceKey: "bookings", level: "view" }])).toMatchObject({ ok: true, data: { saved: 1 } });
    });

    it("an unexpected failure is reported as server_error, never as a validation message", async () => {
      // A NUL byte passes our validation (length, reserved names) but PostgreSQL refuses it
      // (22021) — an infrastructure-level failure the caller cannot fix by editing the form.
      const result = await actions.createRoleAction({ name: `${tag} nul\u0000byte` });
      expect(result).toMatchObject({ ok: false, error: { code: "server_error" } });
      expect(JSON.stringify(result)).not.toMatch(/invalid byte|22021|postgres/i);
      expect(await sql!`select 1 from auth.roles where name like ${`${tag} nul%`}`).toHaveLength(0);
    });
  });
});
