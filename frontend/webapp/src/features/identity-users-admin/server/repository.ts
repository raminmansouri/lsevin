import "server-only";
import { db } from "@/features/booking-admin-shared/server/db";

export async function getIdentityUsers() {
  return db<any[]>`
    select u.*, c.id as "customerId"
    from identity.asp_net_users u
    left join customer.customers c on lower(c.email) = lower(u.email)
    order by u.created_at desc
    limit 300
  `;
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
