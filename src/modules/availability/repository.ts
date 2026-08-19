import "server-only";
import { AVAILABILITY_GAP_QUEUE_LIMIT, AVAILABILITY_MARKET_WINDOW_DAYS, AVAILABILITY_UPCOMING_WINDOW_DAYS, type AvailabilityCoverageMode, type ProviderAvailabilityConversionPulse } from "./marketTypes";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";
import type {
  AdminAvailabilityRuleItem,
  AdminAvailabilitySummary,
  AdminOperatingHourItem,
  AdminResourceItem,
  AvailabilityAdminActionItem,
  AvailabilityRule,
  BookableResource,
  OperatingHour,
} from "./types";

export async function listOperatingHours(providerId: string) {
  return sql<OperatingHour[]>`
    select id::text, day_of_week as "dayOfWeek", opens_at::text as "opensAt", closes_at::text as "closesAt", is_closed as "isClosed", slot_interval_minutes as "slotIntervalMinutes"
    from provider_portal.provider_operating_hours
    where service_provider_id = ${providerId}::uuid
    order by day_of_week asc
  `;
}

export async function saveOperatingHour(input: { providerId: string; dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean; slotIntervalMinutes: number }) {
  await sql.begin(async (tx) => {
    const updated = await tx`
      update provider_portal.provider_operating_hours
         set opens_at = nullif(${input.opensAt}, '')::time,
             closes_at = nullif(${input.closesAt}, '')::time,
             is_closed = ${input.isClosed},
             slot_interval_minutes = ${input.slotIntervalMinutes},
             last_modified_date = now()
       where service_provider_id = ${input.providerId}::uuid
         and day_of_week = ${input.dayOfWeek}
      returning id
    `;

    if (updated.count === 0) {
      await tx`
        insert into provider_portal.provider_operating_hours (service_provider_id, day_of_week, opens_at, closes_at, is_closed, slot_interval_minutes, metadata, create_date, last_modified_date)
        values (${input.providerId}::uuid, ${input.dayOfWeek}, nullif(${input.opensAt}, '')::time, nullif(${input.closesAt}, '')::time, ${input.isClosed}, ${input.slotIntervalMinutes}, '{}'::jsonb, now(), now())
      `;
    }
  });
}

export async function deleteOperatingHour(providerId: string, operatingHourId: string) {
  await sql`delete from provider_portal.provider_operating_hours where service_provider_id = ${providerId}::uuid and id = ${operatingHourId}::uuid`;
}

export async function listBookableResources(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<BookableResource[]>`
    select
      br.id::text,
      br.name_translations as "nameTranslations",
      br.resource_type as "resourceType",
      br.total_capacity as "totalCapacity",
      br.is_active as "isActive",
      br.provider_service_id::text as "providerServiceId"
    from provider_portal.bookable_resources br
    where br.service_provider_id = ${providerId}::uuid
    order by ${translationSql(sql`br.name_translations`, locale)} asc
  `;
}

export async function upsertBookableResource(input: { id?: string; providerId: string; providerServiceId?: string; resourceType: string; code?: string; nameTranslations: Record<string, string>; descriptionTranslations: Record<string, string>; totalCapacity: number; isActive: boolean }) {
  const rows = await sql<{ id: string }[]>`
    insert into provider_portal.bookable_resources (
      id, service_provider_id, provider_service_id, resource_type, code, name_translations, description_translations,
      total_capacity, is_active, metadata, create_date, last_modified_date
    ) values (
      coalesce(nullif(${input.id ?? ""}, '')::uuid, public.uuid_generate_v4()),
      ${input.providerId}::uuid,
      nullif(${input.providerServiceId ?? ""}, '')::uuid,
      ${input.resourceType},
      nullif(${input.code ?? ""}, ''),
      ${sql.json(input.nameTranslations)},
      ${sql.json(input.descriptionTranslations)},
      ${input.totalCapacity},
      ${input.isActive},
      '{}'::jsonb,
      now(),
      now()
    ) on conflict (id) do update set
      provider_service_id = excluded.provider_service_id,
      resource_type = excluded.resource_type,
      code = excluded.code,
      name_translations = excluded.name_translations,
      description_translations = excluded.description_translations,
      total_capacity = excluded.total_capacity,
      is_active = excluded.is_active,
      last_modified_date = now()
    returning id::text
  `;
  return rows[0].id;
}

export async function deleteBookableResource(providerId: string, resourceId: string) {
  await sql`delete from provider_portal.bookable_resources where service_provider_id = ${providerId}::uuid and id = ${resourceId}::uuid`;
}

export async function listAvailabilityRules(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<AvailabilityRule[]>`
    select
      gar.id::text,
      gar.target_type as "targetType",
      gar.target_id::text as "targetId",
      ${translationSql(sql`br.name_translations`, locale)} as "resourceName",
      gar.day_of_week as "dayOfWeek",
      gar.specific_date::text as "specificDate",
      gar.starts_at::text as "startsAt",
      gar.ends_at::text as "endsAt",
      gar.is_available as "isAvailable",
      gar.capacity,
      gar.slot_interval_minutes as "slotIntervalMinutes",
      gar.is_active as "isActive"
    from provider_portal.generic_availability_rules gar
    left join provider_portal.bookable_resources br on br.id = gar.resource_id
    where gar.service_provider_id = ${providerId}::uuid or (gar.target_type = 'provider' and gar.target_id = ${providerId}::uuid)
    order by gar.day_of_week nulls last, gar.specific_date nulls last, gar.starts_at nulls last
  `;
}

export async function upsertAvailabilityRule(input: { id?: string; providerId: string; targetType: string; resourceId?: string; dayOfWeek?: number; specificDate?: string; startsAt?: string; endsAt?: string; isAvailable: boolean; capacity?: number; slotIntervalMinutes?: number; isActive: boolean }) {
  const targetId = input.targetType === "bookable_resource" ? (input.resourceId || input.providerId) : input.providerId;
  await sql`
    insert into provider_portal.generic_availability_rules (
      id, target_type, target_id, service_provider_id, resource_id, day_of_week, specific_date, starts_at, ends_at,
      is_available, capacity, slot_interval_minutes, timezone_id, metadata, is_active, create_date, last_modified_date
    ) values (
      coalesce(nullif(${input.id ?? ""}, '')::uuid, public.uuid_generate_v4()),
      ${input.targetType},
      ${targetId}::uuid,
      ${input.providerId}::uuid,
      nullif(${input.resourceId ?? ""}, '')::uuid,
      nullif(${input.dayOfWeek ? String(input.dayOfWeek) : ""}, '')::smallint,
      nullif(${input.specificDate ?? ""}, '')::date,
      nullif(${input.startsAt ?? ""}, '')::time,
      nullif(${input.endsAt ?? ""}, '')::time,
      ${input.isAvailable},
      nullif(${input.capacity ? String(input.capacity) : ""}, '')::integer,
      nullif(${input.slotIntervalMinutes ? String(input.slotIntervalMinutes) : ""}, '')::integer,
      'UTC',
      '{}'::jsonb,
      ${input.isActive},
      now(),
      now()
    ) on conflict (id) do update set
      target_type = excluded.target_type,
      target_id = excluded.target_id,
      resource_id = excluded.resource_id,
      day_of_week = excluded.day_of_week,
      specific_date = excluded.specific_date,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      is_available = excluded.is_available,
      capacity = excluded.capacity,
      slot_interval_minutes = excluded.slot_interval_minutes,
      is_active = excluded.is_active,
      last_modified_date = now()
  `;
}

export async function deleteAvailabilityRule(providerId: string, ruleId: string) {
  await sql`delete from provider_portal.generic_availability_rules where service_provider_id = ${providerId}::uuid and id = ${ruleId}::uuid`;
}

export async function listStaffAvailabilityRules(staffId: string, providerId: string) {
  return sql<AvailabilityRule[]>`
    select
      gar.id::text,
      gar.target_type as "targetType",
      gar.target_id::text as "targetId",
      null::text as "resourceName",
      gar.day_of_week as "dayOfWeek",
      gar.specific_date::text as "specificDate",
      gar.starts_at::text as "startsAt",
      gar.ends_at::text as "endsAt",
      gar.is_available as "isAvailable",
      gar.capacity,
      gar.slot_interval_minutes as "slotIntervalMinutes",
      gar.is_active as "isActive"
    from provider_portal.generic_availability_rules gar
    where gar.service_provider_id = ${providerId}::uuid
      and gar.target_type = 'staff'
      and gar.target_id = ${staffId}::uuid
    order by gar.day_of_week nulls last, gar.specific_date nulls last, gar.starts_at nulls last
  `;
}

export async function upsertStaffAvailabilityRule(input: { id?: string; staffId: string; providerId: string; dayOfWeek?: number; specificDate?: string; startsAt?: string; endsAt?: string; isAvailable: boolean; slotIntervalMinutes?: number; isActive: boolean }) {
  await sql`
    insert into provider_portal.generic_availability_rules (
      id, target_type, target_id, service_provider_id, day_of_week, specific_date, starts_at, ends_at,
      is_available, slot_interval_minutes, timezone_id, metadata, is_active, create_date, last_modified_date
    ) values (
      coalesce(nullif(${input.id ?? ""}, '')::uuid, public.uuid_generate_v4()),
      'staff', ${input.staffId}::uuid, ${input.providerId}::uuid,
      nullif(${input.dayOfWeek ? String(input.dayOfWeek) : ""}, '')::smallint,
      nullif(${input.specificDate ?? ""}, '')::date,
      nullif(${input.startsAt ?? ""}, '')::time,
      nullif(${input.endsAt ?? ""}, '')::time,
      ${input.isAvailable},
      nullif(${input.slotIntervalMinutes ? String(input.slotIntervalMinutes) : ""}, '')::integer,
      'UTC', '{}'::jsonb, ${input.isActive}, now(), now()
    ) on conflict (id) do update set
      day_of_week = excluded.day_of_week,
      specific_date = excluded.specific_date,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      is_available = excluded.is_available,
      slot_interval_minutes = excluded.slot_interval_minutes,
      is_active = excluded.is_active,
      last_modified_date = now()
    where generic_availability_rules.target_type = 'staff'
      and generic_availability_rules.target_id = ${input.staffId}::uuid
      and generic_availability_rules.service_provider_id = ${input.providerId}::uuid
  `;
}

export async function deleteStaffAvailabilityRule(staffId: string, providerId: string, ruleId: string) {
  await sql`
    delete from provider_portal.generic_availability_rules
    where id = ${ruleId}::uuid
      and target_type = 'staff'
      and target_id = ${staffId}::uuid
      and service_provider_id = ${providerId}::uuid
  `;
}

export async function getAdminAvailabilitySummary(): Promise<AdminAvailabilitySummary> {
  const rows = await sql<AdminAvailabilitySummary[]>`
    select
      (select count(*) from provider_portal.generic_availability_rules)::int as "rulesTotal",
      (select count(*) from provider_portal.generic_availability_rules where is_active)::int as "rulesActive",
      (select count(*) from provider_portal.generic_availability_rules where not is_active)::int as "rulesInactive",
      (select count(*) from provider_portal.generic_availability_rules where is_active and not is_available)::int as "unavailableRules",
      (select count(*) from provider_portal.bookable_resources where is_active)::int as "resourcesActive",
      (select count(*) from provider_portal.provider_operating_hours where is_closed)::int as "closedOperatingHours"
  `;
  return rows[0] ?? { rulesTotal: 0, rulesActive: 0, rulesInactive: 0, unavailableRules: 0, resourcesActive: 0, closedOperatingHours: 0 };
}

export async function listAdminAvailabilityRules(input: { query?: string; status?: string; targetType?: string; limit?: number } = {}) {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  const query = input.query?.trim() ?? "";
  const status = input.status?.trim() ?? "";
  const targetType = input.targetType?.trim() ?? "";
  return sql<AdminAvailabilityRuleItem[]>`
    select
      gar.id::text as id,
      sp.id::text as "providerId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      sp.is_active as "providerActive",
      gar.target_type as "targetType",
      gar.target_id::text as "targetId",
      coalesce(${translationSql(sql`br.name_translations`, locale)}, ${translationSql(sql`ps.display_name_translations`, locale)}, ${translationSql(sql`st.name_translations`, locale)}, gar.target_id::text) as "targetName",
      gar.day_of_week as "dayOfWeek",
      gar.specific_date::text as "specificDate",
      gar.starts_at::text as "startsAt",
      gar.ends_at::text as "endsAt",
      gar.is_available as "isAvailable",
      gar.capacity,
      gar.slot_interval_minutes as "slotIntervalMinutes",
      gar.timezone_id as "timezoneId",
      gar.is_active as "isActive",
      gar.last_modified_date::text as "lastModifiedAt"
    from provider_portal.generic_availability_rules gar
    join category.service_providers sp on sp.id = gar.service_provider_id
    left join provider_portal.bookable_resources br on br.id = gar.resource_id
    left join category.provider_services ps on gar.target_type = 'provider_service' and ps.id = gar.target_id
    left join category.staff st on gar.target_type = 'staff' and st.id = gar.target_id
    where (${query} = '' or lower(coalesce(${translationSql(sql`sp.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`br.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`ps.display_name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`st.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%')
      and (${status} = '' or (${status} = 'active' and gar.is_active) or (${status} = 'inactive' and not gar.is_active)
        or (${status} = 'blocked' and gar.is_active and not gar.is_available))
      and (${targetType} = '' or gar.target_type = ${targetType})
    order by gar.last_modified_date desc, gar.create_date desc
    limit ${input.limit ?? 250}
  `;
}

export async function listAdminResources(limit = 100) {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<AdminResourceItem[]>`
    select
      br.id::text as id,
      sp.id::text as "providerId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      ${translationSql(sql`ps.display_name_translations`, locale)} as "serviceName",
      coalesce(${translationSql(sql`br.name_translations`, locale)}, br.code, br.id::text) as "resourceName",
      br.resource_type as "resourceType",
      br.total_capacity as "totalCapacity",
      br.is_active as "isActive",
      br.last_modified_date::text as "lastModifiedAt"
    from provider_portal.bookable_resources br
    join category.service_providers sp on sp.id = br.service_provider_id
    left join category.provider_services ps on ps.id = br.provider_service_id
    order by br.last_modified_date desc
    limit ${limit}
  `;
}

export async function listAdminOperatingHours(limit = 100) {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<AdminOperatingHourItem[]>`
    select
      poh.id::text as id,
      sp.id::text as "providerId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      poh.day_of_week as "dayOfWeek",
      poh.opens_at::text as "opensAt",
      poh.closes_at::text as "closesAt",
      poh.is_closed as "isClosed",
      poh.slot_interval_minutes as "slotIntervalMinutes",
      poh.last_modified_date::text as "lastModifiedAt"
    from provider_portal.provider_operating_hours poh
    join category.service_providers sp on sp.id = poh.service_provider_id
    order by poh.last_modified_date desc
    limit ${limit}
  `;
}

export async function listRecentAvailabilityAdminActions(limit = 20) {
  return sql<AvailabilityAdminActionItem[]>`
    select aca.id::text as id, aca.entity_id as "entityId", aca.action, aca.reason,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, aca.actor_user_id::text) as "actorName", aca.created_at::text as "createdAt"
    from provider_portal.admin_catalog_actions aca
    left join identity.asp_net_users u on u.id = aca.actor_user_id
    where aca.entity_type in ('availability_rule', 'bookable_resource', 'operating_hour')
    order by aca.created_at desc
    limit ${limit}
  `;
}

export async function setAvailabilityRuleActiveByAdmin(input: { ruleId: string; value: boolean; reason?: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; isActive: boolean }[]>`
      select service_provider_id::text as "providerId", is_active as "isActive" from provider_portal.generic_availability_rules where id = ${input.ruleId}::uuid for update
    `;
    const current = rows[0];
    if (!current) throw new Error("Availability rule not found.");
    await tx`update provider_portal.generic_availability_rules set is_active = ${input.value}, last_modified_date = now() where id = ${input.ruleId}::uuid`;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id)
      values ('availability_rule', ${input.ruleId}, ${current.providerId}::uuid, 'set_is_active', nullif(${input.reason || ""}, ''), ${tx.json({ is_active: current.isActive })}, ${tx.json({ is_active: input.value })}, ${input.actorUserId}::uuid)
    `;
  });
}

export async function setBookableResourceActiveByAdmin(input: { resourceId: string; value: boolean; reason?: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; isActive: boolean }[]>`
      select service_provider_id::text as "providerId", is_active as "isActive" from provider_portal.bookable_resources where id = ${input.resourceId}::uuid for update
    `;
    const current = rows[0];
    if (!current) throw new Error("Bookable resource not found.");
    await tx`update provider_portal.bookable_resources set is_active = ${input.value}, last_modified_date = now() where id = ${input.resourceId}::uuid`;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id)
      values ('bookable_resource', ${input.resourceId}, ${current.providerId}::uuid, 'set_is_active', nullif(${input.reason || ""}, ''), ${tx.json({ is_active: current.isActive })}, ${tx.json({ is_active: input.value })}, ${input.actorUserId}::uuid)
    `;
  });
}

export async function setOperatingHourClosedByAdmin(input: { operatingHourId: string; value: boolean; reason?: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; isClosed: boolean }[]>`
      select service_provider_id::text as "providerId", is_closed as "isClosed" from provider_portal.provider_operating_hours where id = ${input.operatingHourId}::uuid for update
    `;
    const current = rows[0];
    if (!current) throw new Error("Operating hour not found.");
    await tx`update provider_portal.provider_operating_hours set is_closed = ${input.value}, last_modified_date = now() where id = ${input.operatingHourId}::uuid`;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id)
      values ('operating_hour', ${input.operatingHourId}, ${current.providerId}::uuid, 'set_is_closed', nullif(${input.reason || ""}, ''), ${tx.json({ is_closed: current.isClosed })}, ${tx.json({ is_closed: input.value })}, ${input.actorUserId}::uuid)
    `;
  });
}


export async function searchAvailabilityStaffOptions(input: { providerId: string; query?: string; selected?: string; locale?: string; limit?: number }) {
  const query = normalizeOptionSearchQuery(input.query);
  const selected = input.selected?.trim() ?? "";
  const locale = input.locale || "fa-IR";
  const limit = normalizeOptionSearchLimit(input.limit);
  return sql<{ value: string; label: string; description: string | null }[]>`
    select st.id::text as value,
      coalesce(${translationSql(sql`st.name_translations`, locale)}, st.id::text) as label,
      nullif(trim(concat_ws(' · ', ${translationSql(sql`st.title_translations`, locale)}, st.specialty)), '') as description
    from category.provider_staffs ps
    join category.staff st on st.id=ps.staff_id and st.is_active=true
    where ps.service_provider_id=${input.providerId}::uuid and ps.is_active=true
      and (${query} = '' or st.id::text ilike '%' || ${query} || '%'
        or coalesce(st.specialty, '') ilike '%' || ${query} || '%'
        or exists (select 1 from jsonb_each_text(coalesce(st.name_translations, '{}'::jsonb)) item where item.value ilike '%' || ${query} || '%')
        or exists (select 1 from jsonb_each_text(coalesce(st.title_translations, '{}'::jsonb)) item where item.value ilike '%' || ${query} || '%'))
    order by case when st.id::text=${selected} then 0 else 1 end, label
    limit ${limit}
  `;
}


type AvailabilityServiceCoverageRow = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  bookings30d: number;
  upcomingBookings30d: number;
  positiveServiceRules: number;
  blockingServiceRules: number;
};

type AvailabilityMarketContextRow = {
  openOperatingDays: number;
  activeProviderPositiveRules: number;
};

export async function getProviderAvailabilityConversionPulse(providerId: string): Promise<ProviderAvailabilityConversionPulse> {
  const contextRows = await sql<AvailabilityMarketContextRow[]>`
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

  const serviceRows = await sql<AvailabilityServiceCoverageRow[]>`
    select
      ps.id::text as "providerServiceId",
      ps.display_name_translations as "nameTranslations",
      count(distinct b.id) filter (
        where b.create_date >= now() - ${AVAILABILITY_MARKET_WINDOW_DAYS}::int * interval '1 day'
      )::int as "bookings30d",
      count(distinct b.id) filter (
        where b.selected_date >= current_date
          and b.selected_date < current_date + ${AVAILABILITY_UPCOMING_WINDOW_DAYS}::int * interval '1 day'
          and lower(coalesce(b.booking_status, '')) not in ('cancelled','noshow')
      )::int as "upcomingBookings30d",
      count(distinct gar.id) filter (
        where gar.is_active = true
          and gar.is_available = true
          and gar.target_type = 'provider_service'
          and (gar.target_id = ps.id or gar.provider_service_id = ps.id)
      )::int as "positiveServiceRules",
      count(distinct gar.id) filter (
        where gar.is_active = true
          and gar.is_available = false
          and gar.target_type = 'provider_service'
          and (gar.target_id = ps.id or gar.provider_service_id = ps.id)
      )::int as "blockingServiceRules"
    from category.provider_services ps
    left join booking.bookings b
      on b.provider_id = ${providerId}::uuid
     and b.service_id = ps.id
    left join provider_portal.generic_availability_rules gar
      on gar.service_provider_id = ${providerId}::uuid
     and gar.target_type = 'provider_service'
     and (gar.target_id = ps.id or gar.provider_service_id = ps.id)
    where ps.service_provider_id = ${providerId}::uuid
      and ps.is_active = true
    group by ps.id, ps.display_name_translations
    order by
      count(distinct b.id) filter (where b.selected_date >= current_date and b.selected_date < current_date + ${AVAILABILITY_UPCOMING_WINDOW_DAYS}::int * interval '1 day' and lower(coalesce(b.booking_status, '')) not in ('cancelled','noshow')) desc,
      count(distinct b.id) filter (where b.create_date >= now() - ${AVAILABILITY_MARKET_WINDOW_DAYS}::int * interval '1 day') desc,
      ps.create_date asc
  `;

  const context = contextRows[0] ?? { openOperatingDays: 0, activeProviderPositiveRules: 0 };
  const services = serviceRows.map((row) => {
    const coverageMode: AvailabilityCoverageMode = row.positiveServiceRules > 0
      ? "service_rule"
      : context.activeProviderPositiveRules > 0
        ? "provider_rule"
        : context.openOperatingDays > 0
          ? "operating_hours"
          : "none";
    return { ...row, coverageMode, hasConfiguredCoverage: coverageMode !== "none" };
  });
  const activeServices = services.length;
  const servicesWithConfiguredCoverage = services.filter((item) => item.hasConfiguredCoverage).length;
  const demandServices30d = services.filter((item) => item.bookings30d > 0).length;
  const demandWithoutCoverage = services.filter((item) => item.bookings30d > 0 && !item.hasConfiguredCoverage).length;
  const upcomingWithoutCoverage = services.filter((item) => item.upcomingBookings30d > 0 && !item.hasConfiguredCoverage).length;
  const coveragePercent = activeServices > 0 ? Math.max(0, Math.min(100, Math.round((servicesWithConfiguredCoverage / activeServices) * 100))) : 0;
  const gapQueue = services
    .filter((item) => !item.hasConfiguredCoverage && (item.bookings30d > 0 || item.upcomingBookings30d > 0))
    .sort((a, b) => b.upcomingBookings30d - a.upcomingBookings30d || b.bookings30d - a.bookings30d)
    .slice(0, AVAILABILITY_GAP_QUEUE_LIMIT);

  return {
    windowDays: AVAILABILITY_MARKET_WINDOW_DAYS,
    upcomingWindowDays: AVAILABILITY_UPCOMING_WINDOW_DAYS,
    activeServices,
    servicesWithConfiguredCoverage,
    coveragePercent,
    demandServices30d,
    demandWithoutCoverage,
    upcomingWithoutCoverage,
    openOperatingDays: context.openOperatingDays,
    activeProviderPositiveRules: context.activeProviderPositiveRules,
    gapQueue,
  };
}
