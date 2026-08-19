import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { AdminCatalogActionItem, AdminProviderItem, AdminProviderSummary, ProviderProfile } from "./types";

export async function getProviderProfile(providerId: string) {
  const rows = await sql<ProviderProfile[]>`
    select
      id::text,
      name_translations as "nameTranslations",
      description_translations as "descriptionTranslations",
      detail_translations as "detailTranslations",
      street_translations as "streetTranslations",
      email,
      phone_number_country_code as "phoneNumberCountryCode",
      phone_number as "phoneNumber",
      country,
      city,
      zip_code as "zipCode",
      latitude::text,
      longitude::text,
      image_url as "imageUrl",
      timezone_id as "timezoneId",
      languages,
      specialties
    from category.service_providers
    where id = ${providerId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function updateProviderProfile(input: ProviderProfile) {
  await sql`
    update category.service_providers set
      name_translations = ${sql.json(input.nameTranslations)},
      description_translations = ${sql.json(input.descriptionTranslations)},
      detail_translations = ${sql.json(input.detailTranslations ?? {})},
      street_translations = ${sql.json(input.streetTranslations ?? {})},
      email = ${input.email},
      phone_number_country_code = ${input.phoneNumberCountryCode},
      phone_number = ${input.phoneNumber},
      country = ${input.country},
      city = ${input.city},
      zip_code = ${input.zipCode},
      latitude = nullif(${input.latitude}, '')::numeric,
      longitude = nullif(${input.longitude}, '')::numeric,
      image_url = ${input.imageUrl},
      timezone_id = ${input.timezoneId || "Asia/Tehran"},
      languages = ${input.languages ?? []},
      specialties = ${input.specialties ?? []},
      last_modified_date = now()
    where id = ${input.id}::uuid
  `;
}

export async function getAdminProviderSummary(): Promise<AdminProviderSummary> {
  const rows = await sql<AdminProviderSummary[]>`
    select
      count(*)::int as total,
      count(*) filter (where sp.is_active)::int as active,
      count(*) filter (where not sp.is_active)::int as inactive,
      count(*) filter (where coalesce(sp.accredited, false))::int as accredited,
      count(*) filter (where coalesce(sp.is_sponsored, false))::int as sponsored,
      count(*) filter (where not exists (
        select 1 from provider_portal.provider_members pm
        where pm.service_provider_id = sp.id and pm.role = 'owner'
      ))::int as "withoutOwner"
    from category.service_providers sp
  `;
  return rows[0] ?? { total: 0, active: 0, inactive: 0, accredited: 0, sponsored: 0, withoutOwner: 0 };
}

export async function listAdminProviders(input: { query?: string; status?: string; providerTypeId?: string; limit?: number } = {}) {
  const query = input.query?.trim() ?? "";
  const status = input.status?.trim() ?? "";
  const providerTypeId = input.providerTypeId?.trim() ?? "";
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<AdminProviderItem[]>`
    select
      sp.id::text as id,
      ${translationSql(sql`sp.name_translations`, locale)} as name,
      ${translationSql(sql`pt.name_translations`, locale)} as "providerTypeName",
      sp.is_active as "isActive",
      coalesce(sp.accredited, false) as accredited,
      coalesce(sp.is_sponsored, false) as "isSponsored",
      sp.country,
      sp.city,
      sp.email,
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount",
      coalesce(metrics.member_count, 0)::int as "memberCount",
      coalesce(metrics.service_count, 0)::int as "serviceCount",
      coalesce(metrics.active_service_count, 0)::int as "activeServiceCount",
      coalesce(metrics.staff_count, 0)::int as "staffCount",
      coalesce(metrics.open_booking_count, 0)::int as "openBookingCount",
      sp.last_modified_date::text as "lastModifiedAt"
    from category.service_providers sp
    join category.provider_types pt on pt.id = sp.provider_type_id
    left join lateral (
      select
        (select count(*) from provider_portal.provider_members pm where pm.service_provider_id = sp.id) as member_count,
        (select count(*) from category.provider_services ps where ps.service_provider_id = sp.id) as service_count,
        (select count(*) from category.provider_services ps where ps.service_provider_id = sp.id and ps.is_active) as active_service_count,
        (select count(*) from category.provider_staffs pss where pss.service_provider_id = sp.id and pss.is_active) as staff_count,
        (select count(*) from booking.bookings b where b.provider_id = sp.id and b.booking_status not in ('Completed','Cancelled')) as open_booking_count
    ) metrics on true
    where (${query} = '' or lower(coalesce(${translationSql(sql`sp.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(sp.email) like '%' || lower(${query}) || '%'
      or lower(sp.phone_number) like '%' || lower(${query}) || '%')
      and (${status} = '' or (${status} = 'active' and sp.is_active) or (${status} = 'inactive' and not sp.is_active)
        or (${status} = 'accredited' and coalesce(sp.accredited, false))
        or (${status} = 'sponsored' and coalesce(sp.is_sponsored, false)))
      and (${providerTypeId} = '' or sp.provider_type_id = nullif(${providerTypeId}, '')::uuid)
    order by sp.last_modified_date desc nulls last, sp.create_date desc
    limit ${input.limit ?? 200}
  `;
}

export async function listProviderTypeOptions() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<{ id: string; label: string }[]>`
    select id::text as id, ${translationSql(sql`name_translations`, locale)} as label
    from category.provider_types
    order by label asc
  `;
}

export async function listRecentProviderAdminActions(limit = 20) {
  return sql<AdminCatalogActionItem[]>`
    select
      aca.id::text as id,
      aca.entity_type as "entityType",
      aca.entity_id as "entityId",
      aca.action,
      aca.reason,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, aca.actor_user_id::text) as "actorName",
      aca.created_at::text as "createdAt"
    from provider_portal.admin_catalog_actions aca
    left join identity.asp_net_users u on u.id = aca.actor_user_id
    where aca.entity_type = 'provider'
    order by aca.created_at desc
    limit ${limit}
  `;
}

export async function setProviderAdminFlag(input: {
  providerId: string;
  flag: "is_active" | "accredited" | "is_sponsored";
  value: boolean;
  reason?: string;
  actorUserId: string;
}) {
  await sql.begin(async (tx) => {
    const currentRows = await tx<{ isActive: boolean; accredited: boolean; isSponsored: boolean }[]>`
      select is_active as "isActive", coalesce(accredited, false) as accredited, coalesce(is_sponsored, false) as "isSponsored"
      from category.service_providers
      where id = ${input.providerId}::uuid
      for update
    `;
    const current = currentRows[0];
    if (!current) throw new Error("Provider not found.");
    if (input.flag === "is_active") {
      await tx`update category.service_providers set is_active = ${input.value}, last_modified_date = now() where id = ${input.providerId}::uuid`;
    } else if (input.flag === "accredited") {
      await tx`update category.service_providers set accredited = ${input.value}, last_modified_date = now() where id = ${input.providerId}::uuid`;
    } else {
      await tx`update category.service_providers set is_sponsored = ${input.value}, last_modified_date = now() where id = ${input.providerId}::uuid`;
    }
    const previousValue = input.flag === "is_active" ? current.isActive : input.flag === "accredited" ? current.accredited : current.isSponsored;
    await tx`
      insert into provider_portal.admin_catalog_actions (
        entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id
      ) values (
        'provider', ${input.providerId}, ${input.providerId}::uuid, ${`set_${input.flag}`}, nullif(${input.reason || ""}, ''),
        ${tx.json({ [input.flag]: previousValue })}, ${tx.json({ [input.flag]: input.value })}, ${input.actorUserId}::uuid
      )
    `;
  });
}
