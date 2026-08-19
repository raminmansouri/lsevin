import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@core/db/client";
import type { AdminGovernanceSummary, AdminGovernanceUser, AssignableAdminRole, GovernanceEvent, UnifiedAdminAuditItem } from "./types";
import { assignableAdminRoles } from "./types";

const ADMIN_ROLE_SQL = assignableAdminRoles;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_RE.test(value);
}

function normalizeTextArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed === "{}") return [];
  return trimmed
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map((item) => item.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
}

function normalizeGovernanceUser(user: AdminGovernanceUser): AdminGovernanceUser {
  return { ...user, roles: normalizeTextArray(user.roles) };
}

export async function getAdminGovernanceSummary(): Promise<AdminGovernanceSummary> {
  const rows = await sql<AdminGovernanceSummary[]>`
    with role_users as (
      select ur.user_id, array_agg(distinct upper(coalesce(r.normalized_name, r.name, ''))) as roles
      from identity.asp_net_user_roles ur
      join identity.asp_net_roles r on r.id = ur.role_id
      where upper(coalesce(r.normalized_name, r.name, '')) = any(${ADMIN_ROLE_SQL})
      group by ur.user_id
    )
    select
      (select count(*)::int from identity.asp_net_users)::int as "totalUsers",
      (select count(*)::int from identity.asp_net_users where coalesce(user_state, 'Active') = 'Active')::int as "activeUsers",
      (select count(*)::int from role_users)::int as "usersWithAdminRoles",
      (select count(*)::int from role_users where 'SUPERADMIN' = any(roles))::int as superadmins,
      (select count(*)::int from role_users where 'ADMIN' = any(roles))::int as administrators,
      (select count(*)::int from role_users where not ('SUPERADMIN' = any(roles)) and not ('ADMIN' = any(roles)))::int as "scopedAdministrators",
      (select count(*)::int from provider_portal.admin_governance_events where created_at >= now() - interval '30 days')::int as "governanceEvents30d",
      (select count(*)::int from provider_portal.admin_catalog_actions where created_at >= now() - interval '30 days')::int as "catalogActions30d",
      (select count(*)::int from provider_portal.onboarding_application_reviews where created_at >= now() - interval '30 days')::int as "onboardingDecisions30d"
  `;
  return rows[0] ?? {
    totalUsers: 0,
    activeUsers: 0,
    usersWithAdminRoles: 0,
    superadmins: 0,
    administrators: 0,
    scopedAdministrators: 0,
    governanceEvents30d: 0,
    catalogActions30d: 0,
    onboardingDecisions30d: 0,
  };
}

export async function listGovernanceUsers(input: { query?: string; role?: string; state?: string; limit?: number } = {}) {
  const query = input.query?.trim() ?? "";
  const role = input.role?.trim().toUpperCase() ?? "";
  const state = input.state?.trim() ?? "";
  const rows = await sql<AdminGovernanceUser[]>`
    select
      u.id::text as id,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, u.id::text) as "fullName",
      coalesce(u.email, '') as email,
      nullif(trim(concat_ws(' ', u.phone_number_country_code, u.phone_number)), '') as phone,
      coalesce(u.user_state, 'Active') as "userState",
      coalesce(roles.role_names, array[]::text[]) as roles,
      u.last_logged_in_at::text as "lastLoggedInAt",
      coalesce(memberships.membership_count, 0)::int as "providerMemberships"
    from identity.asp_net_users u
    left join lateral (
      select array_agg(distinct upper(coalesce(r.normalized_name, r.name, '')) order by upper(coalesce(r.normalized_name, r.name, ''))) as role_names
      from identity.asp_net_user_roles ur
      join identity.asp_net_roles r on r.id = ur.role_id
      where ur.user_id = u.id
    ) roles on true
    left join lateral (
      select count(*)::int as membership_count
      from provider_portal.provider_members pm
      where pm.user_id = u.id
    ) memberships on true
    where (
      ${query} = ''
      or lower(coalesce(u.email, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) like '%' || lower(${query}) || '%'
      or u.id::text = ${query}
      or lower(coalesce(u.phone_number, '')) like '%' || lower(${query}) || '%'
    )
      and (${state} = '' or lower(coalesce(u.user_state, 'Active')) = lower(${state}))
      and (${role} = '' or ${role} = any(coalesce(roles.role_names, array[]::text[])))
    order by
      case when coalesce(roles.role_names, array[]::text[]) && ${ADMIN_ROLE_SQL} then 0 else 1 end,
      u.last_logged_in_at desc nulls last,
      u.created_at desc
    limit ${input.limit ?? 200}
  `;
  return rows.map(normalizeGovernanceUser);
}

export async function getGovernanceUser(userId: string) {
  if (!isUuid(userId)) return null;
  const rows = await sql<AdminGovernanceUser[]>`
    select
      u.id::text as id,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, u.id::text) as "fullName",
      coalesce(u.email, '') as email,
      nullif(trim(concat_ws(' ', u.phone_number_country_code, u.phone_number)), '') as phone,
      coalesce(u.user_state, 'Active') as "userState",
      coalesce(roles.role_names, array[]::text[]) as roles,
      u.last_logged_in_at::text as "lastLoggedInAt",
      coalesce(memberships.membership_count, 0)::int as "providerMemberships"
    from identity.asp_net_users u
    left join lateral (
      select array_agg(distinct upper(coalesce(r.normalized_name, r.name, '')) order by upper(coalesce(r.normalized_name, r.name, ''))) as role_names
      from identity.asp_net_user_roles ur
      join identity.asp_net_roles r on r.id = ur.role_id
      where ur.user_id = u.id
    ) roles on true
    left join lateral (
      select count(*)::int as membership_count
      from provider_portal.provider_members pm
      where pm.user_id = u.id
    ) memberships on true
    where u.id = ${userId}::uuid
    limit 1
  `;
  return rows[0] ? normalizeGovernanceUser(rows[0]) : null;
}

export async function listGovernanceEvents(input: { targetUserId?: string; limit?: number } = {}) {
  const targetUserId = input.targetUserId?.trim() ?? "";
  if (targetUserId && !isUuid(targetUserId)) return [];
  return sql<GovernanceEvent[]>`
    select
      e.id::text as id,
      e.action,
      e.role_name as "roleName",
      e.reason,
      coalesce(nullif(trim(concat_ws(' ', actor.first_name, actor.last_name)), ''), actor.email, e.actor_user_id::text) as "actorName",
      coalesce(nullif(trim(concat_ws(' ', target.first_name, target.last_name)), ''), target.email, e.target_user_id::text) as "targetName",
      e.target_user_id::text as "targetUserId",
      coalesce(array(select jsonb_array_elements_text(e.previous_roles)), array[]::text[]) as "previousRoles",
      coalesce(array(select jsonb_array_elements_text(e.new_roles)), array[]::text[]) as "newRoles",
      e.created_at::text as "createdAt"
    from provider_portal.admin_governance_events e
    left join identity.asp_net_users actor on actor.id = e.actor_user_id
    left join identity.asp_net_users target on target.id = e.target_user_id
    where (${targetUserId} = '' or e.target_user_id = nullif(${targetUserId}, '')::uuid)
    order by e.created_at desc
    limit ${input.limit ?? 100}
  `;
}

async function listNormalizedRoles(tx: typeof sql, userId: string) {
  const rows = await tx<{ roleName: string }[]>`
    select upper(coalesce(r.normalized_name, r.name, '')) as "roleName"
    from identity.asp_net_user_roles ur
    join identity.asp_net_roles r on r.id = ur.role_id
    where ur.user_id = ${userId}::uuid
    order by "roleName"
  `;
  return rows.map((row) => row.roleName).filter(Boolean);
}

export async function assignAdministrativeRole(input: { actorUserId: string; targetUserId: string; role: AssignableAdminRole; reason: string }) {
  await sql.begin(async (tx) => {
    const target = await tx<{ id: string; userState: string }[]>`
      select id::text as id, coalesce(user_state, 'Active') as "userState"
      from identity.asp_net_users
      where id = ${input.targetUserId}::uuid
      for update
    `;
    if (!target[0]) throw new Error("LSevin user not found.");
    if (target[0].userState.toLowerCase() !== "active") throw new Error("Administrative roles may only be assigned to active LSevin users.");

    const previousRoles = await listNormalizedRoles(tx as unknown as typeof sql, input.targetUserId);
    const roleRows = await tx<{ id: string }[]>`
      insert into identity.asp_net_roles (id, name, normalized_name, concurrency_stamp)
      values (${randomUUID()}::uuid, ${input.role.toLowerCase()}, ${input.role}, ${randomUUID()})
      on conflict (normalized_name) do update set name = excluded.name
      returning id::text as id
    `;
    const roleId = roleRows[0]?.id;
    if (!roleId) throw new Error("Administrative role could not be created or loaded.");
    await tx`
      insert into identity.asp_net_user_roles (user_id, role_id)
      values (${input.targetUserId}::uuid, ${roleId}::uuid)
      on conflict (user_id, role_id) do nothing
    `;
    const newRoles = await listNormalizedRoles(tx as unknown as typeof sql, input.targetUserId);
    if (previousRoles.includes(input.role)) throw new Error("The user already has this role.");
    await tx`
      insert into provider_portal.admin_governance_events (
        actor_user_id, target_user_id, action, role_name, reason, previous_roles, new_roles
      ) values (
        ${input.actorUserId}::uuid, ${input.targetUserId}::uuid, 'assign_role', ${input.role}, ${input.reason},
        ${tx.json(previousRoles)}, ${tx.json(newRoles)}
      )
    `;
  });
}

export async function revokeAdministrativeRole(input: { actorUserId: string; targetUserId: string; role: AssignableAdminRole; reason: string }) {
  await sql.begin(async (tx) => {
    const target = await tx<{ id: string }[]>`
      select id::text as id from identity.asp_net_users where id = ${input.targetUserId}::uuid for update
    `;
    if (!target[0]) throw new Error("LSevin user not found.");
    const previousRoles = await listNormalizedRoles(tx as unknown as typeof sql, input.targetUserId);
    if (!previousRoles.includes(input.role)) throw new Error("The user does not have this role.");

    if (input.role === "SUPERADMIN") {
      if (input.actorUserId === input.targetUserId) throw new Error("You cannot remove your own SUPERADMIN role.");
      const countRows = await tx<{ count: number }[]>`
        select count(distinct ur.user_id)::int as count
        from identity.asp_net_user_roles ur
        join identity.asp_net_roles r on r.id = ur.role_id
        join identity.asp_net_users u on u.id = ur.user_id
        where upper(coalesce(r.normalized_name, r.name, '')) = 'SUPERADMIN'
          and coalesce(u.user_state, 'Active') = 'Active'
      `;
      if ((countRows[0]?.count ?? 0) <= 1) throw new Error("The last active SUPERADMIN role cannot be removed.");
    }

    await tx`
      delete from identity.asp_net_user_roles ur
      using identity.asp_net_roles r
      where ur.role_id = r.id
        and ur.user_id = ${input.targetUserId}::uuid
        and upper(coalesce(r.normalized_name, r.name, '')) = ${input.role}
    `;
    const newRoles = await listNormalizedRoles(tx as unknown as typeof sql, input.targetUserId);
    await tx`
      insert into provider_portal.admin_governance_events (
        actor_user_id, target_user_id, action, role_name, reason, previous_roles, new_roles
      ) values (
        ${input.actorUserId}::uuid, ${input.targetUserId}::uuid, 'revoke_role', ${input.role}, ${input.reason},
        ${tx.json(previousRoles)}, ${tx.json(newRoles)}
      )
    `;
  });
}

export async function listUnifiedAdminAudit(input: { source?: string; query?: string; limit?: number } = {}) {
  const source = input.source?.trim() ?? "";
  const query = input.query?.trim() ?? "";
  return sql<UnifiedAdminAuditItem[]>`
    with audit as (
      select
        e.id::text as id,
        'governance'::text as source,
        e.action,
        coalesce(nullif(trim(concat_ws(' ', target.first_name, target.last_name)), ''), target.email, e.target_user_id::text) as entity_label,
        coalesce(nullif(trim(concat_ws(' ', actor.first_name, actor.last_name)), ''), actor.email, e.actor_user_id::text) as actor_name,
        e.reason,
        e.created_at,
        jsonb_build_object('targetUserId', e.target_user_id, 'roleName', e.role_name, 'previousRoles', e.previous_roles, 'newRoles', e.new_roles) as detail
      from provider_portal.admin_governance_events e
      left join identity.asp_net_users actor on actor.id = e.actor_user_id
      left join identity.asp_net_users target on target.id = e.target_user_id

      union all

      select
        a.id::text,
        'catalog'::text,
        a.action,
        concat(a.entity_type, ':', a.entity_id),
        coalesce(nullif(trim(concat_ws(' ', actor.first_name, actor.last_name)), ''), actor.email, a.actor_user_id::text),
        a.reason,
        a.created_at,
        jsonb_build_object('entityType', a.entity_type, 'entityId', a.entity_id, 'providerId', a.service_provider_id, 'previousState', a.previous_state, 'newState', a.new_state)
      from provider_portal.admin_catalog_actions a
      left join identity.asp_net_users actor on actor.id = a.actor_user_id

      union all

      select
        r.id::text,
        'onboarding'::text,
        r.action,
        coalesce(app.application_number, r.application_id::text),
        coalesce(nullif(trim(concat_ws(' ', actor.first_name, actor.last_name)), ''), actor.email, r.reviewer_user_id::text),
        coalesce(r.reason, r.note),
        r.created_at,
        jsonb_build_object('applicationId', r.application_id, 'previousStatus', r.previous_status, 'newStatus', r.new_status, 'providerId', r.service_provider_id)
      from provider_portal.onboarding_application_reviews r
      left join identity.asp_net_users actor on actor.id = r.reviewer_user_id
      left join provider_portal.onboarding_applications app on app.id = r.application_id
    )
    select
      id,
      source::text as source,
      action,
      entity_label as "entityLabel",
      actor_name as "actorName",
      reason,
      created_at::text as "createdAt",
      detail
    from audit
    where (${source} = '' or source = ${source})
      and (
        ${query} = ''
        or lower(action) like '%' || lower(${query}) || '%'
        or lower(coalesce(entity_label, '')) like '%' || lower(${query}) || '%'
        or lower(coalesce(actor_name, '')) like '%' || lower(${query}) || '%'
        or lower(coalesce(reason, '')) like '%' || lower(${query}) || '%'
      )
    order by created_at desc
    limit ${input.limit ?? 250}
  `;
}
