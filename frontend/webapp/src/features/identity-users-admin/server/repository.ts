import "server-only";
import { db } from "@/features/booking-admin-shared/server/db";
import { buildSearchPatterns, USER_LIST_PAGE_SIZE, type UserListParams, type UserListSort } from "@/features/customers-admin/lib/user-list-params";

export type IdentityRole = { id: string; name: string };

export async function getAllRoles() {
  return db<IdentityRole[]>`
    select id, name
    from identity.asp_net_roles
    order by name asc
  `;
}

/** Built per call: postgres.js fragments are not reused across queries. */
function orderBy(sort: UserListSort) {
  switch (sort) {
    case "newest": return db`order by u.created_at desc nulls last, u.id`;
    case "oldest": return db`order by u.created_at asc nulls last, u.id`;
    case "name_asc": return db`order by lower(concat_ws(' ', u.first_name, u.last_name)) asc, u.created_at desc`;
    case "name_desc": return db`order by lower(concat_ws(' ', u.first_name, u.last_name)) desc, u.created_at desc`;
  }
}

/** Paged identity-user list; search covers name, email, username and phone. */
export async function getIdentityUsers({ q, sort, page }: UserListParams) {
  const { text, digits } = buildSearchPatterns(q);
  const offset = (page - 1) * USER_LIST_PAGE_SIZE;
  const rows = await db<any[]>`
    select u.*, c.id as "customerId", count(*) over() as "totalCount"
    from identity.asp_net_users u
    left join customer.customers c on lower(c.email) = lower(u.email)
    ${text ? db`where (
      concat_ws(' ', u.first_name, u.last_name) ilike ${text}
      or u.email ilike ${text}
      or u.user_name ilike ${text}
      or concat(u.phone_number_country_code, u.phone_number) ilike ${text}
      ${digits ? db`or regexp_replace(concat(u.phone_number_country_code, u.phone_number, ' ', u.user_name), '\\D', '', 'g') like ${digits}` : db``}
    )` : db``}
    ${orderBy(sort)}
    limit ${USER_LIST_PAGE_SIZE} offset ${offset}
  `;
  return { items: rows, total: Number(rows[0]?.totalCount ?? 0) };
}

export async function getIdentityUserById(userId: string) {
  const rows = await db<any[]>`
    select
      u.*,
      c.id as "customerId",
      c.first_name as "customerFirstName",
      c.last_name as "customerLastName",
      pref.selected_country_location_id,
      pref.selected_city_location_id,
      pref.preferred_locale,
      pref.preferred_currency_code,
      pref.preferred_theme,
      pref.notifications_enabled,
      pref.marketing_notifications_enabled,
      pref.extra_preferences,
      coalesce((
        select jsonb_agg(jsonb_build_object('roleId', r.id, 'name', r.name) order by r.name asc)
        from identity.asp_net_user_roles ur
        join identity.asp_net_roles r on r.id = ur.role_id
        where ur.user_id = u.id
      ), '[]'::jsonb) as roles
    from identity.asp_net_users u
    left join customer.customers c on lower(c.email) = lower(u.email)
    left join identity.user_preferences pref on pref.user_id = u.id
    where u.id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}
