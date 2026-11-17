import "server-only";

import db from "@/config/database/db";
import { grantableResourceKeys } from "@/lib/admin/access/catalog";
import { type AccessLevel, isAccessLevel } from "@/lib/admin/access/policy";
import { invalidateAdminAccess } from "@/lib/admin/access/store";

/**
 * Persistence for the access-control screens: roles, their permissions, and who holds them.
 *
 * Every mutation runs in one transaction together with its audit row, and clears the in-process
 * access cache afterwards so the change is live on this pod immediately (other pods catch up
 * within ACCESS_CACHE_TTL_MS).
 *
 * Errors the caller can act on are {@link AccessControlError}; anything else is an unexpected
 * infrastructure failure and is rethrown untouched — it must never be shown as a validation message.
 */
export type AccessControlErrorCode = "validation" | "not_found" | "conflict" | "forbidden";

export class AccessControlError extends Error {
  constructor(
    public readonly code: AccessControlErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AccessControlError";
  }
}

export type RoleSummary = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  permissionCount: number;
};

export type RoleMember = {
  userId: string;
  displayName: string;
  userName: string | null;
  email: string | null;
  phone: string | null;
  staffStatus: "active" | "disabled" | null;
};

export type RoleDetail = {
  role: { id: string; name: string; description: string | null };
  grants: Record<string, AccessLevel>;
  members: RoleMember[];
};

export type UserHit = {
  userId: string;
  displayName: string;
  userName: string | null;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export type StaffRow = {
  userId: string;
  displayName: string;
  userName: string | null;
  email: string | null;
  status: "active" | "disabled";
  roles: { id: string; name: string }[];
};

const RESERVED_NAMES = new Set(["admin", "superadmin", "user", "financeadmin", "accountant"]);

type Sql = typeof db;

/** Serializes every change that can take full access away from someone. */
const ACCESS_CHANGE_LOCK = 8_142_337_016;

async function lockAccessChanges(sql: Sql) {
  await sql`select pg_advisory_xact_lock(${ACCESS_CHANGE_LOCK})`;
}

/**
 * Refuse any change that would leave nobody with full access.
 *
 * A person has full access when they hold the identity `superadmin` role, or the identity `admin`
 * role without being under access management. Only a full-access admin can use these screens and
 * nobody can change their own access, so one change cannot empty that set — but two admins limiting
 * each other at the same moment could. The check runs inside the same transaction as the change,
 * after taking {@link ACCESS_CHANGE_LOCK}, so the second of two such requests sees the first one's
 * effect and is rolled back. (Most production admins hold `admin`; there may be no superadmin at all.)
 */
async function assertFullAccessRemains(sql: Sql) {
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from identity.asp_net_users u
    where exists (
            select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
            where ur.user_id = u.id and lower(r.name) = 'superadmin'
          )
       or (
            exists (
              select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
              where ur.user_id = u.id and lower(r.name) = 'admin'
            )
            and not exists (select 1 from auth.staff_members s where s.user_id = u.id)
          )
  `;
  if (n < 1) {
    throw new AccessControlError("forbidden", "At least one full-access admin must remain.");
  }
}

async function audit(
  sql: Sql,
  actorUserId: string,
  action: string,
  fields: { roleId?: string; targetUserId?: string; details?: Record<string, unknown> } = {}
) {
  await sql`
    insert into auth.admin_access_audit (actor_user_id, action, role_id, target_user_id, details)
    values (
      ${actorUserId}::uuid, ${action},
      ${fields.roleId ?? null}::uuid, ${fields.targetUserId ?? null}::uuid,
      ${JSON.stringify(fields.details ?? {})}::jsonb
    )
  `;
}

function normalizeName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 64) {
    throw new AccessControlError("validation", "Role name must be between 2 and 64 characters.");
  }
  if (RESERVED_NAMES.has(name.toLowerCase())) {
    throw new AccessControlError("validation", `"${name}" is a built-in role name and cannot be used.`);
  }
  return name;
}

function normalizeDescription(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (text.length > 500) {
    throw new AccessControlError("validation", "Description must be 500 characters or fewer.");
  }
  return text || null;
}

const isUniqueViolation = (error: unknown) => (error as { code?: string } | null)?.code === "23505";

// ───────────────────────────── roles ─────────────────────────────

export async function listRoles(): Promise<RoleSummary[]> {
  return db<RoleSummary[]>`
    select
      r.id::text as id,
      r.name,
      r.description,
      (select count(*)::int from auth.user_roles ur where ur.role_id = r.id) as "memberCount",
      (select count(*)::int from auth.role_admin_permissions p where p.role_id = r.id) as "permissionCount"
    from auth.roles r
    where r.is_system = false
    order by lower(r.name)
  `;
}

export async function getRoleDetail(roleId: string): Promise<RoleDetail | null> {
  const [role] = await db<{ id: string; name: string; description: string | null }[]>`
    select id::text as id, name, description
    from auth.roles where id = ${roleId}::uuid and is_system = false
  `;
  if (!role) return null;

  const [grantRows, members] = await Promise.all([
    db<{ resourceKey: string; level: string }[]>`
      select resource_key as "resourceKey", level
      from auth.role_admin_permissions where role_id = ${roleId}::uuid
    `,
    db<RoleMember[]>`
      select
        u.id::text as "userId",
        coalesce(nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''), u.user_name, u.email, u.id::text) as "displayName",
        u.user_name as "userName",
        u.email,
        u.phone_number as phone,
        s.status as "staffStatus"
      from auth.user_roles ur
      join identity.asp_net_users u on u.id = ur.user_id
      left join auth.staff_members s on s.user_id = u.id
      where ur.role_id = ${roleId}::uuid
      order by 2
    `,
  ]);

  const grants: Record<string, AccessLevel> = {};
  for (const row of grantRows) if (isAccessLevel(row.level)) grants[row.resourceKey] = row.level;
  return { role, grants, members };
}

export async function createRole(
  actorUserId: string,
  input: { name: unknown; description?: unknown }
): Promise<{ id: string }> {
  const name = normalizeName(input.name);
  const description = normalizeDescription(input.description);
  try {
    const id = await db.begin(async (sql) => {
      const [dupe] = await sql`select 1 from auth.roles where lower(name) = lower(${name}) limit 1`;
      if (dupe) throw new AccessControlError("conflict", `A role named "${name}" already exists.`);
      const [row] = await sql<{ id: string }[]>`
        insert into auth.roles (name, description, is_system)
        values (${name}, ${description}, false)
        returning id::text as id
      `;
      await audit(sql as unknown as Sql, actorUserId, "role.created", { roleId: row.id, details: { name } });
      return row.id;
    });
    invalidateAdminAccess();
    return { id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AccessControlError("conflict", `A role named "${name}" already exists.`);
    }
    throw error;
  }
}

export async function updateRole(
  actorUserId: string,
  roleId: string,
  input: { name: unknown; description?: unknown }
): Promise<void> {
  const name = normalizeName(input.name);
  const description = normalizeDescription(input.description);
  try {
    await db.begin(async (sql) => {
      const [role] = await sql`select 1 from auth.roles where id = ${roleId}::uuid and is_system = false for update`;
      if (!role) throw new AccessControlError("not_found", "Role not found.");
      const [dupe] = await sql`
        select 1 from auth.roles where lower(name) = lower(${name}) and id <> ${roleId}::uuid limit 1
      `;
      if (dupe) throw new AccessControlError("conflict", `A role named "${name}" already exists.`);
      await sql`
        update auth.roles set name = ${name}, description = ${description}, updated_at = now()
        where id = ${roleId}::uuid
      `;
      await audit(sql as unknown as Sql, actorUserId, "role.updated", { roleId, details: { name } });
    });
    invalidateAdminAccess();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AccessControlError("conflict", `A role named "${name}" already exists.`);
    }
    throw error;
  }
}

export async function deleteRole(actorUserId: string, roleId: string): Promise<void> {
  await db.begin(async (sql) => {
    const [role] = await sql<{ name: string }[]>`
      select name from auth.roles where id = ${roleId}::uuid and is_system = false for update
    `;
    if (!role) throw new AccessControlError("not_found", "Role not found.");
    // Members keep their staff row: with no roles left they have no access (never "unlimited").
    // Permissions cascade with the role.
    await sql`delete from auth.user_roles where role_id = ${roleId}::uuid`;
    await sql`delete from auth.roles where id = ${roleId}::uuid`;
    await audit(sql as unknown as Sql, actorUserId, "role.deleted", { roleId, details: { name: role.name } });
  });
  invalidateAdminAccess();
}

// ─────────────────────────── permissions ───────────────────────────

export type PermissionInput = { resourceKey: string; level: string };

/** Replace the whole permission set of a role. Unknown or ungrantable keys are rejected. */
export async function setRolePermissions(
  actorUserId: string,
  roleId: string,
  entries: readonly PermissionInput[]
): Promise<{ saved: number }> {
  const allowed = grantableResourceKeys();
  const seen = new Map<string, AccessLevel>();
  for (const entry of entries) {
    if (!allowed.has(entry.resourceKey)) {
      throw new AccessControlError("validation", `"${entry.resourceKey}" is not a grantable admin area.`);
    }
    if (!isAccessLevel(entry.level)) {
      throw new AccessControlError("validation", `"${entry.level}" is not a valid access level.`);
    }
    seen.set(entry.resourceKey, entry.level);
  }

  await db.begin(async (sql) => {
    const [role] = await sql`select 1 from auth.roles where id = ${roleId}::uuid and is_system = false for update`;
    if (!role) throw new AccessControlError("not_found", "Role not found.");

    const before = await sql<{ resourceKey: string; level: string }[]>`
      select resource_key as "resourceKey", level from auth.role_admin_permissions where role_id = ${roleId}::uuid
    `;
    await sql`delete from auth.role_admin_permissions where role_id = ${roleId}::uuid`;
    for (const [resourceKey, level] of seen) {
      await sql`
        insert into auth.role_admin_permissions (role_id, resource_key, level, granted_by)
        values (${roleId}::uuid, ${resourceKey}, ${level}, ${actorUserId}::uuid)
      `;
    }
    await sql`update auth.roles set updated_at = now() where id = ${roleId}::uuid`;

    const prev = new Map(before.map((b) => [b.resourceKey, b.level]));
    const added = [...seen].filter(([k]) => !prev.has(k)).map(([k, l]) => `${k}:${l}`);
    const removed = [...prev.keys()].filter((k) => !seen.has(k));
    const changed = [...seen].filter(([k, l]) => prev.has(k) && prev.get(k) !== l).map(([k, l]) => `${k}:${l}`);
    await audit(sql as unknown as Sql, actorUserId, "role.permissions_set", {
      roleId,
      details: { added, removed, changed, total: seen.size },
    });
  });
  invalidateAdminAccess();
  return { saved: seen.size };
}

// ───────────────────────────── members ─────────────────────────────

export async function searchUsers(query: string): Promise<UserHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return db<UserHit[]>`
    select
      u.id::text as "userId",
      coalesce(nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''), u.user_name, u.email, u.id::text) as "displayName",
      u.user_name as "userName",
      u.email,
      u.phone_number as phone,
      exists (
        select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
        where ur.user_id = u.id and lower(r.name) in ('admin', 'superadmin')
      ) as "isAdmin",
      exists (
        select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
        where ur.user_id = u.id and lower(r.name) = 'superadmin'
      ) as "isSuperAdmin"
    from identity.asp_net_users u
    where u.user_name ilike ${like} or u.email ilike ${like} or u.phone_number ilike ${like}
       or (coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) ilike ${like}
    order by u.created_at desc
    limit 15
  `;
}

async function assertManageable(sql: Sql, actorUserId: string, userId: string) {
  if (userId === actorUserId) {
    throw new AccessControlError("forbidden", "You cannot change your own access.");
  }
  const [target] = await sql<{ isSuperAdmin: boolean }[]>`
    select exists (
      select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
      where ur.user_id = u.id and lower(r.name) = 'superadmin'
    ) as "isSuperAdmin"
    from identity.asp_net_users u where u.id = ${userId}::uuid
  `;
  if (!target) throw new AccessControlError("not_found", "User not found.");
  if (target.isSuperAdmin) {
    throw new AccessControlError("forbidden", "A super admin always has full access and cannot be limited.");
  }
}

/**
 * Put a person under access management (if they are not already) and give them a role.
 * Anyone who lacks the identity `admin` role gets it — the .NET backend needs it — and that is
 * recorded so removing them from staff can take it back.
 */
async function ensureStaff(sql: Sql, actorUserId: string, userId: string) {
  const [adminRole] = await sql<{ id: string }[]>`
    select id::text as id from identity.asp_net_roles where lower(name) = 'admin' limit 1
  `;
  if (!adminRole) {
    throw new AccessControlError("validation", "The identity role 'admin' does not exist; cannot create staff.");
  }

  // The backend authorizes admin endpoints by this role, so every managed admin must hold it —
  // including someone re-activated after a revoke took it away.
  const [has] = await sql`
    select 1 from identity.asp_net_user_roles where user_id = ${userId}::uuid and role_id = ${adminRole.id}::uuid
  `;
  let grantedNow = false;
  if (!has) {
    await sql`
      insert into identity.asp_net_user_roles (user_id, role_id)
      values (${userId}::uuid, ${adminRole.id}::uuid)
    `;
    grantedNow = true;
  }

  const [staff] = await sql<{ status: string }[]>`
    select status from auth.staff_members where user_id = ${userId}::uuid for update
  `;
  if (staff) {
    await sql`
      update auth.staff_members
         set status = 'active',
             admin_role_auto_granted = admin_role_auto_granted or ${grantedNow},
             updated_at = now()
       where user_id = ${userId}::uuid
    `;
    return;
  }
  await sql`
    insert into auth.staff_members (user_id, status, admin_role_auto_granted, created_by)
    values (${userId}::uuid, 'active', ${grantedNow}, ${actorUserId}::uuid)
  `;
}

export async function addMember(actorUserId: string, roleId: string, userId: string): Promise<void> {
  await db.begin(async (sql) => {
    await lockAccessChanges(sql as unknown as Sql);
    const [role] = await sql`select 1 from auth.roles where id = ${roleId}::uuid and is_system = false for update`;
    if (!role) throw new AccessControlError("not_found", "Role not found.");
    await assertManageable(sql as unknown as Sql, actorUserId, userId);
    await ensureStaff(sql as unknown as Sql, actorUserId, userId);
    await sql`
      insert into auth.user_roles (user_id, role_id)
      values (${userId}::uuid, ${roleId}::uuid)
      on conflict (user_id, role_id) do nothing
    `;
    await assertFullAccessRemains(sql as unknown as Sql);
    await audit(sql as unknown as Sql, actorUserId, "member.added", { roleId, targetUserId: userId });
  });
  invalidateAdminAccess(userId);
}

/**
 * Take a role away from a person. If it was their last role they stay under management with
 * *no* access — they do not silently become unlimited. Use {@link releaseStaff} for that.
 */
export async function removeMember(actorUserId: string, roleId: string, userId: string): Promise<void> {
  await db.begin(async (sql) => {
    const removed = await sql`
      delete from auth.user_roles ur
      using auth.roles r
      where ur.role_id = r.id and r.is_system = false
        and ur.role_id = ${roleId}::uuid and ur.user_id = ${userId}::uuid
      returning 1
    `;
    if (removed.length === 0) throw new AccessControlError("not_found", "That person does not hold this role.");
    await audit(sql as unknown as Sql, actorUserId, "member.removed", { roleId, targetUserId: userId });
  });
  invalidateAdminAccess(userId);
}

// ───────────────────────────── staff ─────────────────────────────

export async function listStaff(): Promise<StaffRow[]> {
  return db<StaffRow[]>`
    select
      u.id::text as "userId",
      coalesce(nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''), u.user_name, u.email, u.id::text) as "displayName",
      u.user_name as "userName",
      u.email,
      s.status,
      coalesce((
        select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name) order by r.name)
        from auth.user_roles ur join auth.roles r on r.id = ur.role_id and r.is_system = false
        where ur.user_id = u.id
      ), '[]'::jsonb) as roles
    from auth.staff_members s
    join identity.asp_net_users u on u.id = s.user_id
    order by s.status, 2
  `;
}

/** Admins nobody has put under management: they have full access today. */
export async function listUnmanagedAdmins(): Promise<Omit<StaffRow, "status" | "roles">[]> {
  return db<Omit<StaffRow, "status" | "roles">[]>`
    select
      u.id::text as "userId",
      coalesce(nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''), u.user_name, u.email, u.id::text) as "displayName",
      u.user_name as "userName",
      u.email
    from identity.asp_net_users u
    where exists (
        select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
        where ur.user_id = u.id and lower(r.name) = 'admin'
      )
      and not exists (
        select 1 from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id
        where ur.user_id = u.id and lower(r.name) = 'superadmin'
      )
      and not exists (select 1 from auth.staff_members s where s.user_id = u.id)
    order by 2
  `;
}

/** Put an existing admin under management with no roles yet (they lose access until given one). */
export async function manageAdmin(actorUserId: string, userId: string): Promise<void> {
  await db.begin(async (sql) => {
    await lockAccessChanges(sql as unknown as Sql);
    await assertManageable(sql as unknown as Sql, actorUserId, userId);
    await ensureStaff(sql as unknown as Sql, actorUserId, userId);
    await assertFullAccessRemains(sql as unknown as Sql);
    await audit(sql as unknown as Sql, actorUserId, "staff.managed", { targetUserId: userId });
  });
  invalidateAdminAccess(userId);
}

export async function setStaffStatus(
  actorUserId: string,
  userId: string,
  status: "active" | "disabled"
): Promise<void> {
  await db.begin(async (sql) => {
    await assertManageable(sql as unknown as Sql, actorUserId, userId);
    const updated = await sql`
      update auth.staff_members set status = ${status}, updated_at = now()
      where user_id = ${userId}::uuid returning 1
    `;
    if (updated.length === 0) throw new AccessControlError("not_found", "That person is not managed staff.");
    await audit(sql as unknown as Sql, actorUserId, `staff.${status}`, { targetUserId: userId });
  });
  invalidateAdminAccess(userId);
}

/**
 * Stop managing someone's access.
 *  - `unlimited`: they become an ordinary full-access admin again.
 *  - `revoke`:    they are disabled, and lose the identity `admin` role if this feature granted it.
 *                 (A stale token keeps working only on the identity side until it refreshes; the
 *                 disabled staff row already shuts the admin panel.)
 */
export async function releaseStaff(
  actorUserId: string,
  userId: string,
  mode: "unlimited" | "revoke"
): Promise<void> {
  await db.begin(async (sql) => {
    await assertManageable(sql as unknown as Sql, actorUserId, userId);
    const [staff] = await sql<{ autoGranted: boolean }[]>`
      select admin_role_auto_granted as "autoGranted" from auth.staff_members
      where user_id = ${userId}::uuid for update
    `;
    if (!staff) throw new AccessControlError("not_found", "That person is not managed staff.");

    await sql`
      delete from auth.user_roles ur using auth.roles r
      where ur.role_id = r.id and r.is_system = false and ur.user_id = ${userId}::uuid
    `;

    if (mode === "unlimited") {
      await sql`delete from auth.staff_members where user_id = ${userId}::uuid`;
    } else {
      await sql`
        update auth.staff_members set status = 'disabled', updated_at = now() where user_id = ${userId}::uuid
      `;
      if (staff.autoGranted) {
        await sql`
          delete from identity.asp_net_user_roles ur using identity.asp_net_roles r
          where ur.role_id = r.id and lower(r.name) = 'admin' and ur.user_id = ${userId}::uuid
        `;
      }
    }
    await audit(sql as unknown as Sql, actorUserId, `staff.released_${mode}`, { targetUserId: userId });
  });
  invalidateAdminAccess(userId);
}

export async function listRecentAudit(limit = 25) {
  return db<
    { id: string; action: string; actor: string | null; target: string | null; roleName: string | null; details: unknown; createdAt: string }[]
  >`
    select
      a.id::text as id, a.action, a.details, a.created_at::text as "createdAt",
      coalesce(au.user_name, au.email) as actor,
      coalesce(tu.user_name, tu.email) as target,
      r.name as "roleName"
    from auth.admin_access_audit a
    left join identity.asp_net_users au on au.id = a.actor_user_id
    left join identity.asp_net_users tu on tu.id = a.target_user_id
    left join auth.roles r on r.id = a.role_id
    order by a.created_at desc
    limit ${limit}
  `;
}
