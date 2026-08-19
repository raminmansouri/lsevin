import "server-only";
import { z } from "zod";
import { sql } from "@core/db/client";

const uuidSchema = z.string().uuid();

export type LocalDevLoginUser = {
  id: string;
  fullName: string;
  email: string;
  roles: string;
  providerMemberships: number;
};

export function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.PROVIDER_PORTAL_LOCAL_AUTH === "true";
}

export async function listLocalDevLoginUsers(query = "", limit = 40): Promise<LocalDevLoginUser[]> {
  if (!isLocalDevAuthEnabled()) return [];
  const normalizedQuery = query.trim().slice(0, 120);
  const pattern = `%${normalizedQuery}%`;
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.trunc(limit) : 40, 1), 80);

  return sql<LocalDevLoginUser[]>`
    select
      u.id::text as id,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), nullif(u.email, ''), u.id::text) as "fullName",
      coalesce(u.email, '') as email,
      coalesce(
        string_agg(distinct upper(coalesce(r.normalized_name, r.name, '')), ', ')
          filter (where coalesce(r.normalized_name, r.name, '') <> ''),
        ''
      ) as roles,
      count(distinct pm.id)::int as "providerMemberships"
    from identity.asp_net_users u
    left join identity.asp_net_user_roles ur on ur.user_id = u.id
    left join identity.asp_net_roles r on r.id = ur.role_id
    left join provider_portal.provider_members pm
      on pm.user_id = u.id
     and coalesce(pm.status, 'active') = 'active'
    where coalesce(u.user_state, 'Active') = 'Active'
      and (
        ${normalizedQuery} = ''
        or coalesce(u.email, '') ilike ${pattern}
        or coalesce(u.first_name, '') ilike ${pattern}
        or coalesce(u.last_name, '') ilike ${pattern}
        or concat_ws(' ', u.first_name, u.last_name) ilike ${pattern}
        or u.id::text ilike ${pattern}
      )
    group by u.id, u.first_name, u.last_name, u.email
    order by
      case
        when bool_or(upper(coalesce(r.normalized_name, r.name, '')) in ('SUPERADMIN', 'ADMIN', 'ADMIN_PORTAL')) then 0
        when count(distinct pm.id) > 0 then 1
        else 2
      end,
      count(distinct pm.id) desc,
      lower(coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), nullif(u.email, ''), u.id::text))
    limit ${safeLimit}
  `;
}

export async function requireLocalDevLoginUser(userId: string) {
  if (!isLocalDevAuthEnabled()) return null;
  if (!uuidSchema.safeParse(userId).success) return null;
  const rows = await sql<{ id: string }[]>`
    select id::text as id
    from identity.asp_net_users
    where id = ${userId}::uuid
      and coalesce(user_state, 'Active') = 'Active'
    limit 1
  `;
  return rows[0] ?? null;
}
