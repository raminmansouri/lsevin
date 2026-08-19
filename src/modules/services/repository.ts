import "server-only";
import { normalizePortalLocale } from "@core/i18n/config";
import { SERVICE_MERCH_DESCRIPTION_MIN_CHARS, SERVICE_MERCH_QUEUE_LIMIT, SERVICE_MERCH_REVIEW_PROOF_TARGET, SERVICE_MERCH_WINDOW_DAYS, type ProviderServiceMerchandisingPulse, type ServiceMerchandisingIssue } from "./marketTypes";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";
import { richTextToPlainText } from "@core/rich-text/codec";
import type { AdminServiceItem, AdminServiceSummary, ProviderService, ServiceAdminActionItem, ServiceDefinitionOption, StaffPricedService } from "./types";

export async function listServiceDefinitions(locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ServiceDefinitionOption[]>`
    select id::text as id,
      ${translationSql(sql`name_translations`, locale)} as label,
      currency,
      value::text
    from category.service_definitions
    where is_active = true
    order by label asc
  `;
}

export async function listProviderServices(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderService[]>`
    select
      ps.id::text as id,
      ps.service_definition_id::text as "serviceDefinitionId",
      ${translationSql(sql`sd.name_translations`, locale)} as "serviceDefinitionName",
      ps.display_name_translations as "displayNameTranslations",
      ps.description_translations as "descriptionTranslations",
      ps.is_active as "isActive",
      ps.currency,
      ps.value::text,
      ps.duration_minutes as "durationMinutes",
      ps.slot_interval_minutes as "slotIntervalMinutes",
      ps.image_url as "imageUrl",
      ps.is_popular as "isPopular"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.service_provider_id = ${providerId}::uuid
    order by ps.last_modified_date desc nulls last, ps.create_date desc
  `;
}

export async function getProviderService(providerId: string, serviceId: string) {
  const rows = await sql<ProviderService[]>`
    select
      ps.id::text as id,
      ps.service_definition_id::text as "serviceDefinitionId",
      sd.name_translations->>'en-US' as "serviceDefinitionName",
      ps.display_name_translations as "displayNameTranslations",
      ps.description_translations as "descriptionTranslations",
      ps.is_active as "isActive",
      ps.currency,
      ps.value::text,
      ps.duration_minutes as "durationMinutes",
      ps.slot_interval_minutes as "slotIntervalMinutes",
      ps.image_url as "imageUrl",
      ps.is_popular as "isPopular"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.service_provider_id = ${providerId}::uuid and ps.id = ${serviceId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function upsertProviderService(input: {
  id?: string;
  providerId: string;
  serviceDefinitionId: string;
  displayNameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  isActive: boolean;
  currency: string;
  value: number;
  durationMinutes: number;
  slotIntervalMinutes: number;
  imageUrl?: string;
  isPopular: boolean;
}) {
  const rows = await sql<{ id: string }[]>`
    insert into category.provider_services (
      id, service_provider_id, service_definition_id, display_name_translations, description_translations,
      is_active, currency, value, duration_minutes, slot_interval_minutes, image_url, is_popular,
      create_date, last_modified_date
    ) values (
      coalesce(nullif(${input.id ?? ""}, '')::uuid, public.uuid_generate_v4()), ${input.providerId}::uuid, ${input.serviceDefinitionId}::uuid,
      ${sql.json(input.displayNameTranslations)}, ${sql.json(input.descriptionTranslations)},
      ${input.isActive}, ${input.currency}, ${input.value}, ${input.durationMinutes}, ${input.slotIntervalMinutes}, ${input.imageUrl || null}, ${input.isPopular},
      now(), now()
    )
    on conflict (id) do update set
      service_definition_id = excluded.service_definition_id,
      display_name_translations = excluded.display_name_translations,
      description_translations = excluded.description_translations,
      is_active = excluded.is_active,
      currency = excluded.currency,
      value = excluded.value,
      duration_minutes = excluded.duration_minutes,
      slot_interval_minutes = excluded.slot_interval_minutes,
      image_url = excluded.image_url,
      is_popular = excluded.is_popular,
      last_modified_date = now()
    returning id::text
  `;
  return rows[0].id;
}

export async function deleteProviderService(providerId: string, serviceId: string) {
  await sql`delete from category.provider_services where service_provider_id = ${providerId}::uuid and id = ${serviceId}::uuid`;
}

export async function listStaffPricedServices(staffId: string, providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<StaffPricedService[]>`
    select
      ps.id::text as "providerServiceId",
      ps.service_definition_id::text as "serviceDefinitionId",
      coalesce(${translationSql(sql`ps.display_name_translations`, locale)}, ${translationSql(sql`sd.name_translations`, locale)}, ps.id::text) as "serviceName",
      ps.currency,
      ps.value::text,
      ps.is_active as "isActive"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    join category.provider_staffs pstaff on pstaff.service_provider_id = ps.service_provider_id and pstaff.staff_id = ${staffId}::uuid and pstaff.is_active
    join category.staff_services ss on ss.staff_id = pstaff.staff_id and ss.service_definition_id = ps.service_definition_id and ss.is_active
    where ps.service_provider_id = ${providerId}::uuid
    order by "serviceName" asc
  `;
}

export async function updateAssignedStaffServicePrice(input: { staffId: string; providerId: string; providerServiceId: string; currency: string; value: number }) {
  const rows = await sql<{ id: string }[]>`
    update category.provider_services ps
    set currency = ${input.currency}, value = ${input.value}, last_modified_date = now()
    where ps.id = ${input.providerServiceId}::uuid
      and ps.service_provider_id = ${input.providerId}::uuid
      and exists (
        select 1
        from category.provider_staffs pstaff
        join category.staff_services ss on ss.staff_id = pstaff.staff_id and ss.is_active
        where pstaff.service_provider_id = ps.service_provider_id
          and pstaff.staff_id = ${input.staffId}::uuid
          and pstaff.is_active
          and ss.service_definition_id = ps.service_definition_id
      )
    returning ps.id::text
  `;
  if (!rows[0]) throw new Error("This service is not assigned to the approved staff profile.");
}

export async function getAdminServiceSummary(): Promise<AdminServiceSummary> {
  const rows = await sql<AdminServiceSummary[]>`
    select
      count(*)::int as total,
      count(*) filter (where ps.is_active)::int as active,
      count(*) filter (where not ps.is_active)::int as inactive,
      count(*) filter (where coalesce(ps.is_popular, false))::int as popular,
      count(*) filter (where not sp.is_active)::int as "inactiveProvider"
    from category.provider_services ps
    join category.service_providers sp on sp.id = ps.service_provider_id
  `;
  return rows[0] ?? { total: 0, active: 0, inactive: 0, popular: 0, inactiveProvider: 0 };
}

export async function listAdminServices(input: { query?: string; status?: string; providerId?: string; limit?: number } = {}) {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  const query = input.query?.trim() ?? "";
  const status = input.status?.trim() ?? "";
  const providerId = input.providerId?.trim() ?? "";
  return sql<AdminServiceItem[]>`
    select
      ps.id::text as id,
      sp.id::text as "providerId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      sp.is_active as "providerActive",
      ${translationSql(sql`sd.name_translations`, locale)} as "serviceDefinitionName",
      coalesce(${translationSql(sql`ps.display_name_translations`, locale)}, ${translationSql(sql`sd.name_translations`, locale)}, ps.id::text) as "displayName",
      ps.is_active as "isActive",
      coalesce(ps.is_popular, false) as "isPopular",
      ps.currency,
      ps.value::text,
      ps.duration_minutes as "durationMinutes",
      ps.slot_interval_minutes as "slotIntervalMinutes",
      coalesce(ps.rating, 0)::float8 as rating,
      coalesce(ps.review_count, 0)::int as "reviewCount",
      ps.last_modified_date::text as "lastModifiedAt"
    from category.provider_services ps
    join category.service_providers sp on sp.id = ps.service_provider_id
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where (${query} = '' or lower(coalesce(${translationSql(sql`ps.display_name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`sd.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`sp.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%')
      and (${status} = '' or (${status} = 'active' and ps.is_active) or (${status} = 'inactive' and not ps.is_active)
        or (${status} = 'popular' and coalesce(ps.is_popular, false))
        or (${status} = 'inactive_provider' and not sp.is_active))
      and (${providerId} = '' or sp.id = nullif(${providerId}, '')::uuid)
    order by ps.last_modified_date desc nulls last, ps.create_date desc
    limit ${input.limit ?? 250}
  `;
}

export async function listServiceProviderOptions() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<{ id: string; label: string }[]>`
    select id::text as id, ${translationSql(sql`name_translations`, locale)} as label
    from category.service_providers
    order by label asc
  `;
}

export async function listRecentServiceAdminActions(limit = 20) {
  return sql<ServiceAdminActionItem[]>`
    select aca.id::text as id, aca.entity_id as "entityId", aca.action, aca.reason,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, aca.actor_user_id::text) as "actorName", aca.created_at::text as "createdAt"
    from provider_portal.admin_catalog_actions aca
    left join identity.asp_net_users u on u.id = aca.actor_user_id
    where aca.entity_type = 'provider_service'
    order by aca.created_at desc
    limit ${limit}
  `;
}

export async function setProviderServiceAdminFlag(input: {
  serviceId: string;
  flag: "is_active" | "is_popular";
  value: boolean;
  reason?: string;
  actorUserId: string;
}) {
  await sql.begin(async (tx) => {
    const currentRows = await tx<{ providerId: string; isActive: boolean; isPopular: boolean }[]>`
      select service_provider_id::text as "providerId", is_active as "isActive", coalesce(is_popular, false) as "isPopular"
      from category.provider_services where id = ${input.serviceId}::uuid for update
    `;
    const current = currentRows[0];
    if (!current) throw new Error("Provider service not found.");
    if (input.flag === "is_active") {
      await tx`update category.provider_services set is_active = ${input.value}, last_modified_date = now() where id = ${input.serviceId}::uuid`;
    } else {
      await tx`update category.provider_services set is_popular = ${input.value}, last_modified_date = now() where id = ${input.serviceId}::uuid`;
    }
    const previousValue = input.flag === "is_active" ? current.isActive : current.isPopular;
    await tx`
      insert into provider_portal.admin_catalog_actions (
        entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id
      ) values (
        'provider_service', ${input.serviceId}, ${current.providerId}::uuid, ${`set_${input.flag}`}, nullif(${input.reason || ""}, ''),
        ${tx.json({ [input.flag]: previousValue })}, ${tx.json({ [input.flag]: input.value })}, ${input.actorUserId}::uuid
      )
    `;
  });
}


export async function searchServiceDefinitionOptions(input:{query?:string;selected?:string;locale?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||"fa-IR"; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select sd.id::text as value, coalesce(${translationSql(sql`sd.name_translations`,locale)},sd.id::text) as label,
      nullif(trim(concat_ws(' · ',sd.currency,sd.value::text)), '') as description
    from category.service_definitions sd where sd.is_active=true
      and (${query}='' or sd.id::text ilike '%'||${query}||'%' or exists(select 1 from jsonb_each_text(coalesce(sd.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when sd.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}
export async function searchServiceProviderOptions(input:{query?:string;selected?:string;locale?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||"fa-IR"; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select sp.id::text as value, coalesce(${translationSql(sql`sp.name_translations`,locale)},sp.id::text) as label,
      nullif(trim(concat_ws(' · ',sp.email,sp.phone)), '') as description
    from category.service_providers sp
    where (${query}='' or sp.id::text ilike '%'||${query}||'%' or coalesce(sp.email,'') ilike '%'||${query}||'%'
      or exists(select 1 from jsonb_each_text(coalesce(sp.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when sp.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}


type ServiceMerchandisingRow = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  bookings30d: number;
  activeOfferCount: number;
  approvedReviewCount: number;
  averageRating: number;
  galleryItems: number;
  hasImageUrl: boolean;
  positiveServiceRules: number;
};

type ServiceMerchandisingContextRow = {
  openOperatingDays: number;
  activeProviderPositiveRules: number;
};

function exactLocalizedText(value: Record<string, string> | null | undefined, locale?: string | null) {
  const current = normalizePortalLocale(locale);
  for (const key of [current.header, current.locale]) {
    const result = String(value?.[key] ?? "").trim();
    if (result) return result;
  }
  return "";
}

export async function getProviderServiceMerchandisingPulse(providerId: string, locale?: string | null): Promise<ProviderServiceMerchandisingPulse> {
  const contextRows = await sql<ServiceMerchandisingContextRow[]>`
    select
      (select count(*)::int
         from provider_portal.provider_operating_hours poh
        where poh.service_provider_id = ${providerId}::uuid
          and poh.is_closed = false
          and poh.opens_at is not null
          and poh.closes_at is not null) as "openOperatingDays",
      (select count(*)::int
         from provider_portal.generic_availability_rules gar
        where gar.service_provider_id = ${providerId}::uuid
          and gar.target_type = 'provider'
          and gar.target_id = ${providerId}::uuid
          and gar.is_active = true
          and gar.is_available = true) as "activeProviderPositiveRules"
  `;

  const rows = await sql<ServiceMerchandisingRow[]>`
    select
      ps.id::text as "providerServiceId",
      ps.display_name_translations as "nameTranslations",
      ps.description_translations as "descriptionTranslations",
      (select count(*)::int from booking.bookings b
        where b.provider_id = ${providerId}::uuid
          and b.service_id = ps.id
          and b.create_date >= now() - ${SERVICE_MERCH_WINDOW_DAYS}::int * interval '1 day') as "bookings30d",
      (select count(*)::int from marketing.offers o
        where o.provider_service_id = ps.id
          and o.is_active = true
          and o.valid_until > now()
          and (o.usage_limit is null or coalesce(o.used_count, 0) < o.usage_limit)) as "activeOfferCount",
      (select count(*)::int from category.service_provider_comments r
        where r.service_provider_id = ${providerId}::uuid
          and r.provider_service_id = ps.id
          and r.review_target = 'service'
          and r.is_public = true
          and r.moderation_status = 'approved') as "approvedReviewCount",
      coalesce((select avg(r.rating)::float8 from category.service_provider_comments r
        where r.service_provider_id = ${providerId}::uuid
          and r.provider_service_id = ps.id
          and r.review_target = 'service'
          and r.is_public = true
          and r.moderation_status = 'approved'
          and r.rating is not null), 0)::float8 as "averageRating",
      (select count(*)::int from category.provider_service_gallery_items gi
        where gi.provider_service_id = ps.id and nullif(btrim(gi.url), '') is not null) as "galleryItems",
      (nullif(btrim(coalesce(ps.image_url, '')), '') is not null) as "hasImageUrl",
      (select count(*)::int from provider_portal.generic_availability_rules gar
        where gar.service_provider_id = ${providerId}::uuid
          and gar.target_type = 'provider_service'
          and (gar.target_id = ps.id or gar.provider_service_id = ps.id)
          and gar.is_active = true
          and gar.is_available = true) as "positiveServiceRules"
    from category.provider_services ps
    where ps.service_provider_id = ${providerId}::uuid
      and ps.is_active = true
    order by ps.last_modified_date desc nulls last, ps.create_date desc
  `;

  const context = contextRows[0] ?? { openOperatingDays: 0, activeProviderPositiveRules: 0 };
  const services = rows.map((row) => {
    const localizedTitle = exactLocalizedText(row.nameTranslations, locale);
    const localizedDescription = exactLocalizedText(row.descriptionTranslations, locale);
    const hasConfiguredCoverage = row.positiveServiceRules > 0 || context.activeProviderPositiveRules > 0 || context.openOperatingDays > 0;
    const hasMedia = row.hasImageUrl || row.galleryItems > 0;
    const hasLocalizedTitle = localizedTitle.length > 0;
    const localizedDescriptionChars = richTextToPlainText(localizedDescription).length;
    const strongLocalizedContent = hasLocalizedTitle && localizedDescriptionChars >= SERVICE_MERCH_DESCRIPTION_MIN_CHARS;
    const reviewPoints = row.approvedReviewCount >= SERVICE_MERCH_REVIEW_PROOF_TARGET ? 25 : row.approvedReviewCount > 0 ? 10 : 0;
    const contentPoints = strongLocalizedContent ? 25 : (hasLocalizedTitle || localizedDescriptionChars > 0) ? 10 : 0;
    const merchandisingScore = Math.max(0, Math.min(100,
      (hasMedia ? 25 : 0) + contentPoints + (row.activeOfferCount > 0 ? 25 : 0) + reviewPoints
    ));
    const issues: ServiceMerchandisingIssue[] = [];
    if (!hasMedia) issues.push("missing_media");
    if (!strongLocalizedContent) issues.push("weak_localized_content");
    if (row.activeOfferCount < 1) issues.push("no_active_offer");
    if (row.approvedReviewCount < SERVICE_MERCH_REVIEW_PROOF_TARGET) issues.push("low_review_proof");
    return { ...row, hasConfiguredCoverage, hasLocalizedTitle, localizedDescriptionChars, merchandisingScore, issues };
  });

  const bookable = services.filter((item) => item.hasConfiguredCoverage);
  const strong = bookable.filter((item) => item.merchandisingScore === 100);
  const toStrengthen = bookable.filter((item) => item.merchandisingScore < 100);
  const merchandisingStrengthPercent = bookable.length > 0
    ? Math.max(0, Math.min(100, Math.round(bookable.reduce((sum, item) => sum + item.merchandisingScore, 0) / bookable.length)))
    : 0;
  const queue = [...toStrengthen]
    .sort((a, b) => b.bookings30d - a.bookings30d || a.merchandisingScore - b.merchandisingScore)
    .slice(0, SERVICE_MERCH_QUEUE_LIMIT);

  return {
    windowDays: SERVICE_MERCH_WINDOW_DAYS,
    activeServices: services.length,
    bookableServices: bookable.length,
    strongBookableServices: strong.length,
    merchandisingStrengthPercent,
    bookableServicesToStrengthen: toStrengthen.length,
    demandOnServicesToStrengthen30d: toStrengthen.reduce((sum, item) => sum + item.bookings30d, 0),
    queue,
  };
}
