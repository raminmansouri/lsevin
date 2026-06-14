import "server-only";

import { randomUUID } from "node:crypto";

import sql from "@/config/database/db";

export type GenericAvailabilityTargetType = "provider" | "provider_service" | "service_definition" | "staff" | "provider_staff" | "bookable_resource";

export type LookupOption = {
  value: string;
  label: string;
  description?: string | null;
  group?: string | null;
  serviceProviderId?: string | null;
  providerServiceId?: string | null;
  serviceDefinitionId?: string | null;
  staffId?: string | null;
  targetType?: GenericAvailabilityTargetType;
};

export type GenericAvailabilityRule = {
  id?: string;
  targetType: GenericAvailabilityTargetType;
  targetId: string;
  targetLabel?: string | null;
  serviceProviderId?: string | null;
  serviceProviderLabel?: string | null;
  providerServiceId?: string | null;
  providerServiceLabel?: string | null;
  providerServiceDescription?: string | null;
  targetDescription?: string | null;
  resourceId?: string | null;
  resourceLabel?: string | null;
  dayOfWeek?: number | null;
  dayOfWeeks?: number[] | null;
  specificDate?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isAvailable: boolean;
  isActive?: boolean;
  capacity?: number | null;
  slotIntervalMinutes?: number | null;
  minBookingMinutes?: number | null;
  maxBookingMinutes?: number | null;
  priority?: number;
  timezoneId?: string;
  metadata?: Record<string, unknown>;
};

export type BookableResource = {
  id?: string;
  serviceProviderId: string;
  serviceProviderLabel?: string | null;
  providerServiceId?: string | null;
  providerServiceLabel?: string | null;
  resourceType: "generic" | "room" | "bed" | "seat" | "table" | "vehicle" | "equipment" | "unit";
  code?: string | null;
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
  totalCapacity: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  rulesCount?: number;
};

export type AvailabilityAdminData = {
  rules: GenericAvailabilityRule[];
  resources: BookableResource[];
  lookups: AvailabilityLookups;
  stats: {
    activeRules: number;
    blockRules: number;
    resources: number;
    inactiveResources: number;
  };
};

export type AvailabilityLookups = {
  providers: LookupOption[];
  providerServices: LookupOption[];
  serviceDefinitions: LookupOption[];
  staff: LookupOption[];
  providerStaff: LookupOption[];
  resources: LookupOption[];
  targetOptions: LookupOption[];
};

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function asUuid(value?: string | null) {
  const trimmed = String(value || "").trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function emptyObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function localeOrDefault(locale?: string | null) {
  const raw = String(locale || "fa-IR").trim().replace("_", "-");
  const map: Record<string, string> = {
    en: "en-US",
    fa: "fa-IR",
    ar: "ar-SA",
    tr: "tr-TR",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    ku: "ku-KU",
  };
  return map[raw.toLowerCase()] || raw || "fa-IR";
}

function getAvailabilityGroupId(metadata: unknown, fallback?: string | null) {
  const value = metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>).availabilityGroupId
    : null;
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback || null;
}

function normalizeDayArray(days: unknown[]) {
  return Array.from(new Set(days.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 1 && value <= 7)))
    .sort((a, b) => a - b);
}

function ruleCompositeKey(rule: Partial<GenericAvailabilityRule>) {
  return [
    rule.targetType || "",
    rule.targetId || "",
    rule.serviceProviderId || "",
    rule.providerServiceId || "",
    rule.resourceId || "",
    rule.specificDate || "",
    rule.startsAt || "",
    rule.endsAt || "",
    rule.isAvailable ? "1" : "0",
    rule.capacity ?? "",
    rule.slotIntervalMinutes ?? "",
    rule.minBookingMinutes ?? "",
    rule.maxBookingMinutes ?? "",
    rule.priority ?? 100,
    rule.timezoneId || "UTC",
  ].join("|");
}

function consolidateAvailabilityRules(rows: GenericAvailabilityRule[]) {
  const grouped = new Map<string, GenericAvailabilityRule>();

  for (const row of rows) {
    const groupId = getAvailabilityGroupId(row.metadata, null);
    const key = groupId ? `group:${groupId}` : `legacy:${ruleCompositeKey(row)}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...row,
        dayOfWeeks: normalizeDayArray([row.dayOfWeek ?? null]),
        metadata: { ...(emptyObject(row.metadata) as Record<string, unknown>), availabilityGroupId: groupId || row.id },
      });
      continue;
    }

    existing.dayOfWeeks = normalizeDayArray([...(existing.dayOfWeeks || []), row.dayOfWeek ?? null]);
    if (!existing.specificDate && row.specificDate) existing.specificDate = row.specificDate;
  }

  return Array.from(grouped.values()).map((rule) => ({
    ...rule,
    dayOfWeek: rule.dayOfWeeks?.[0] ?? rule.dayOfWeek ?? null,
  }));
}

async function getAvailabilityRuleGroupFilter(tx: any, ruleId: string) {
  const [row] = await tx<any[]>`
    select
      id::text,
      target_type,
      target_id::text,
      service_provider_id::text,
      provider_service_id::text,
      resource_id::text,
      specific_date::text,
      starts_at::text,
      ends_at::text,
      is_available,
      capacity,
      slot_interval_minutes,
      min_booking_minutes,
      max_booking_minutes,
      priority,
      timezone_id,
      metadata,
      metadata ->> 'availabilityGroupId' as group_id
    from provider_portal.generic_availability_rules
    where id = ${ruleId}::uuid
    limit 1
  `;

  if (!row) return null;
  return {
    id: row.id as string,
    groupId: typeof row.group_id === "string" && row.group_id.trim().length ? row.group_id.trim() : null,
    row,
  };
}

async function deleteAvailabilityRuleGroup(tx: any, ruleId: string) {
  const group = await getAvailabilityRuleGroupFilter(tx, ruleId);
  if (!group) return false;

  if (group.groupId) {
    await tx`
      delete from provider_portal.generic_availability_rules
      where metadata ->> 'availabilityGroupId' = ${group.groupId}
    `;
    return true;
  }

  const r = group.row;
  await tx`
    delete from provider_portal.generic_availability_rules
    where target_type = ${r.target_type}
      and target_id = ${r.target_id}::uuid
      and service_provider_id is not distinct from ${r.service_provider_id}::uuid
      and provider_service_id is not distinct from ${r.provider_service_id}::uuid
      and resource_id is not distinct from ${r.resource_id}::uuid
      and specific_date is not distinct from ${r.specific_date}::date
      and starts_at is not distinct from ${r.starts_at}::time
      and ends_at is not distinct from ${r.ends_at}::time
      and is_available is not distinct from ${r.is_available}
      and capacity is not distinct from ${r.capacity}::int
      and slot_interval_minutes is not distinct from ${r.slot_interval_minutes}::int
      and min_booking_minutes is not distinct from ${r.min_booking_minutes}::int
      and max_booking_minutes is not distinct from ${r.max_booking_minutes}::int
      and priority is not distinct from ${r.priority}::int
      and timezone_id is not distinct from ${r.timezone_id}
  `;
  return true;
}

export async function getAvailabilityLookups(localeInput = "fa-IR"): Promise<AvailabilityLookups> {
  void localeInput;
  const empty: LookupOption[] = [];
  return {
    providers: empty,
    providerServices: empty,
    serviceDefinitions: empty,
    staff: empty,
    providerStaff: empty,
    resources: empty,
    targetOptions: empty,
  };
}

export type AvailabilityLookupType = "providers" | "providerServices" | "serviceDefinitions" | "staff" | "providerStaff" | "resources" | "targets";

type SearchLookupInput = {
  lookupType: AvailabilityLookupType;
  locale?: string | null;
  search?: string | null;
  id?: string | null;
  page?: number | null;
  pageSize?: number | null;
  targetType?: string | null;
  serviceProviderId?: string | null;
  providerServiceId?: string | null;
  resourceId?: string | null;
};

function paging(input?: { page?: number | null; pageSize?: number | null }) {
  const page = Math.max(1, Number(input?.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(input?.pageSize || 20)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function likeSearch(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned ? `%${cleaned.replace(/[%_]/g, "")}%` : null;
}

async function queryAvailabilityLookupItems(input: SearchLookupInput, oneOnly = false): Promise<LookupOption[]> {
  const locale = localeOrDefault(input.locale);
  const { pageSize, offset } = paging(input);
  const limit = oneOnly ? 1 : pageSize + 1;
  const id = asUuid(input.id);
  const providerId = asUuid(input.serviceProviderId);
  const providerServiceId = asUuid(input.providerServiceId);
  const resourceId = asUuid(input.resourceId);
  const search = likeSearch(input.search);
  const targetType = cleanString(input.targetType) as GenericAvailabilityTargetType | null;

  if (input.lookupType === "providers") {
    return sql<LookupOption[]>`
      select
        sp.id::text as value,
        common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as label,
        concat(coalesce(sp.country, ''), case when sp.city is not null then concat(' / ', sp.city) else '' end) as description,
        'Provider' as group,
        sp.id::text as "serviceProviderId",
        'provider'::text as "targetType"
      from category.service_providers sp
      where sp.is_active = true
        and (${id}::uuid is null or sp.id = ${id}::uuid)
        and (
          ${search}::text is null
          or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or coalesce(sp.email, '') ilike ${search}::text
          or coalesce(sp.city, '') ilike ${search}::text
          or coalesce(sp.country, '') ilike ${search}::text
        )
      order by common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') asc
      limit ${limit} offset ${oneOnly ? 0 : offset}
    `;
  }

  if (input.lookupType === "providerServices") {
    return sql<LookupOption[]>`
      select
        ps.id::text as value,
        concat(
          coalesce(
            nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
            nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''),
            ps.id::text
          ),
          ' · ',
          common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR')
        ) as label,
        coalesce(
          nullif(common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'), ''),
          nullif(common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR'), ''),
          concat(coalesce(sd.booking_ui_mode, 'default_slot'), ' · ', coalesce(ps.currency, sd.currency, 'USD'), ' ', coalesce(ps.value, sd.value, 0)::text)
        ) as description,
        'Provider service' as group,
        ps.service_provider_id::text as "serviceProviderId",
        ps.id::text as "providerServiceId",
        ps.service_definition_id::text as "serviceDefinitionId",
        'provider_service'::text as "targetType"
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      left join category.service_definitions sd on sd.id = ps.service_definition_id
      where ps.is_active = true and sp.is_active = true
        and (${id}::uuid is null or ps.id = ${id}::uuid)
        and (${providerId}::uuid is null or ps.service_provider_id = ${providerId}::uuid)
        and (
          ${search}::text is null
          or common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
        )
      order by coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR')) asc
      limit ${limit} offset ${oneOnly ? 0 : offset}
    `;
  }

  if (input.lookupType === "serviceDefinitions") {
    return sql<LookupOption[]>`
      select
        sd.id::text as value,
        common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') as label,
        concat('Mode: ', coalesce(sd.booking_ui_mode, 'default_slot')) as description,
        'Service definition' as group,
        sd.id::text as "serviceDefinitionId",
        'service_definition'::text as "targetType"
      from category.service_definitions sd
      where sd.is_active = true
        and (${id}::uuid is null or sd.id = ${id}::uuid)
        and (${search}::text is null or common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') ilike ${search}::text)
      order by common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') asc
      limit ${limit} offset ${oneOnly ? 0 : offset}
    `;
  }

  if (input.lookupType === "staff") {
    return sql<LookupOption[]>`
      select
        s.id::text as value,
        common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') as label,
        common.get_translation_t(s.title_translations, ${locale}, 'fa-IR') as description,
        'Staff' as group,
        s.id::text as "staffId",
        'staff'::text as "targetType"
      from category.staff s
      where s.is_active = true
        and (${id}::uuid is null or s.id = ${id}::uuid)
        and (${search}::text is null or common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') ilike ${search}::text)
      order by common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') asc
      limit ${limit} offset ${oneOnly ? 0 : offset}
    `;
  }

  if (input.lookupType === "providerStaff") {
    return sql<LookupOption[]>`
      select
        pst.id::text as value,
        concat(common.get_translation_t(s.name_translations, ${locale}, 'fa-IR'), ' · ', common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR')) as label,
        common.get_translation_t(pst.notes_translations, ${locale}, 'fa-IR') as description,
        'Provider staff relation' as group,
        pst.service_provider_id::text as "serviceProviderId",
        'provider_staff'::text as "targetType",
        pst.staff_id::text as "staffId"
      from category.provider_staffs pst
      join category.staff s on s.id = pst.staff_id
      join category.service_providers sp on sp.id = pst.service_provider_id
      where pst.is_active = true and s.is_active = true and sp.is_active = true
        and (${id}::uuid is null or pst.id = ${id}::uuid)
        and (${providerId}::uuid is null or pst.service_provider_id = ${providerId}::uuid)
        and (
          ${search}::text is null
          or common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
        )
      order by common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') asc
      limit ${limit} offset ${oneOnly ? 0 : offset}
    `;
  }

  if (input.lookupType === "resources") {
    return sql<LookupOption[]>`
      select
        br.id::text as value,
        concat(coalesce(nullif(common.get_translation_t(br.name_translations, ${locale}, 'fa-IR'), ''), br.code, br.id::text), ' · ', br.resource_type) as label,
        concat('Capacity ', br.total_capacity::text, ' · ', common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR')) as description,
        'Bookable resource' as group,
        br.service_provider_id::text as "serviceProviderId",
        br.provider_service_id::text as "providerServiceId",
        'bookable_resource'::text as "targetType"
      from provider_portal.bookable_resources br
      join category.service_providers sp on sp.id = br.service_provider_id
      where br.is_active = true
        and (${id}::uuid is null or br.id = ${id}::uuid)
        and (${providerId}::uuid is null or br.service_provider_id = ${providerId}::uuid)
        and (${providerServiceId}::uuid is null or br.provider_service_id = ${providerServiceId}::uuid)
        and (${resourceId}::uuid is null or br.id = ${resourceId}::uuid)
        and (
          ${search}::text is null
          or coalesce(br.code, '') ilike ${search}::text
          or common.get_translation_t(br.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
          or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike ${search}::text
        )
      order by br.resource_type asc, br.code asc nulls last
      limit ${limit} offset ${oneOnly ? 0 : offset}
    `;
  }

  if (input.lookupType === "targets") {
    const mapped: Record<string, AvailabilityLookupType> = {
      provider: "providers",
      provider_service: "providerServices",
      service_definition: "serviceDefinitions",
      staff: "staff",
      provider_staff: "providerStaff",
      bookable_resource: "resources",
    };
    return queryAvailabilityLookupItems({ ...input, lookupType: mapped[targetType || "provider_service"] || "providerServices" }, oneOnly);
  }

  return [];
}

export async function searchAvailabilityLookupOptions(input: SearchLookupInput) {
  const { pageSize } = paging(input);
  const rows = await queryAvailabilityLookupItems(input, false);
  return {
    items: rows.slice(0, pageSize),
    hasMore: rows.length > pageSize,
  };
}

export async function getAvailabilityLookupOptionById(input: SearchLookupInput) {
  const id = asUuid(input.id);
  if (!id) return null;
  const rows = await queryAvailabilityLookupItems(input, true);
  return rows[0] || null;
}

export async function listGenericAvailabilityAdminData(input?: {
  locale?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  providerServiceId?: string | null;
  serviceProviderId?: string | null;
  resourceId?: string | null;
  q?: string | null;
}): Promise<AvailabilityAdminData> {
  const locale = localeOrDefault(input?.locale);
  const targetType = cleanString(input?.targetType);
  const targetId = asUuid(input?.targetId);
  const providerServiceId = asUuid(input?.providerServiceId);
  const serviceProviderId = asUuid(input?.serviceProviderId);
  const resourceId = asUuid(input?.resourceId);
  const q = cleanString(input?.q);

  const [rules, resources, lookups, statsRows] = await Promise.all([
    sql<GenericAvailabilityRule[]>`
      select
        r.id::text,
        r.target_type as "targetType",
        r.target_id::text as "targetId",
        case
          when r.target_type = 'provider' then (select common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') from category.service_providers sp where sp.id = r.target_id)
          when r.target_type = 'provider_service' then (select coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''), ps.id::text) from category.provider_services ps left join category.service_definitions sd on sd.id = ps.service_definition_id where ps.id = r.target_id)
          when r.target_type = 'service_definition' then (select common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') from category.service_definitions sd where sd.id = r.target_id)
          when r.target_type = 'staff' then (select common.get_translation_t(st.name_translations, ${locale}, 'fa-IR') from category.staff st where st.id = r.target_id)
          when r.target_type = 'provider_staff' then (
            select concat(common.get_translation_t(st.name_translations, ${locale}, 'fa-IR'), ' · ', common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR'))
            from category.provider_staffs pst
            join category.staff st on st.id = pst.staff_id
            join category.service_providers sp on sp.id = pst.service_provider_id
            where pst.id = r.target_id
          )
          when r.target_type = 'bookable_resource' then (
            select coalesce(nullif(common.get_translation_t(br.name_translations, ${locale}, 'fa-IR'), ''), br.code, br.id::text)
            from provider_portal.bookable_resources br where br.id = r.target_id
          )
          else r.target_id::text
        end as "targetLabel",
        r.service_provider_id::text as "serviceProviderId",
        common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as "serviceProviderLabel",
        r.provider_service_id::text as "providerServiceId",
        coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), nullif(common.get_translation_t(sd_for_ps.name_translations, ${locale}, 'fa-IR'), ''), ps.id::text) as "providerServiceLabel",
        r.resource_id::text as "resourceId",
        coalesce(nullif(common.get_translation_t(br.name_translations, ${locale}, 'fa-IR'), ''), br.code, br.id::text) as "resourceLabel",
        r.day_of_week as "dayOfWeek",
        r.specific_date::text as "specificDate",
        r.starts_at::text as "startsAt",
        r.ends_at::text as "endsAt",
        r.is_available as "isAvailable",
        coalesce(r.is_active, true) as "isActive",
        r.capacity,
        r.slot_interval_minutes as "slotIntervalMinutes",
        r.min_booking_minutes as "minBookingMinutes",
        r.max_booking_minutes as "maxBookingMinutes",
        r.priority,
        r.timezone_id as "timezoneId",
        r.metadata
      from provider_portal.generic_availability_rules r
      left join category.service_providers sp on sp.id = r.service_provider_id
      left join category.provider_services ps on ps.id = r.provider_service_id
      left join category.service_definitions sd_for_ps on sd_for_ps.id = ps.service_definition_id
      left join provider_portal.bookable_resources br on br.id = r.resource_id
      where (${targetType}::text is null or r.target_type = ${targetType}::text)
        and (${targetId}::uuid is null or r.target_id = ${targetId}::uuid)
        and (${providerServiceId}::uuid is null or r.provider_service_id = ${providerServiceId}::uuid)
        and (${serviceProviderId}::uuid is null or r.service_provider_id = ${serviceProviderId}::uuid)
        and (${resourceId}::uuid is null or r.resource_id = ${resourceId}::uuid or (r.target_type = 'bookable_resource' and r.target_id = ${resourceId}::uuid))
        and (
          ${q}::text is null
          or r.target_type ilike '%' || ${q}::text || '%'
          or coalesce(r.timezone_id, '') ilike '%' || ${q}::text || '%'
          or coalesce(br.code, '') ilike '%' || ${q}::text || '%'
          or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike '%' || ${q}::text || '%'
          or common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') ilike '%' || ${q}::text || '%'
        )
      order by coalesce(r.is_active, true) desc, r.priority asc, r.target_type asc, r.day_of_week nulls last, r.specific_date nulls last, r.starts_at nulls last
      limit 500
    `,
    sql<BookableResource[]>`
      select
        br.id::text,
        br.service_provider_id::text as "serviceProviderId",
        common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as "serviceProviderLabel",
        br.provider_service_id::text as "providerServiceId",
        coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), nullif(common.get_translation_t(sd_for_ps.name_translations, ${locale}, 'fa-IR'), ''), ps.id::text) as "providerServiceLabel",
        br.resource_type as "resourceType",
        br.code,
        br.name_translations as "nameTranslations",
        br.description_translations as "descriptionTranslations",
        br.total_capacity as "totalCapacity",
        br.is_active as "isActive",
        br.metadata,
        (
          select count(*)::int
          from provider_portal.generic_availability_rules r
          where r.resource_id = br.id or (r.target_type = 'bookable_resource' and r.target_id = br.id)
        ) as "rulesCount"
      from provider_portal.bookable_resources br
      join category.service_providers sp on sp.id = br.service_provider_id
      left join category.provider_services ps on ps.id = br.provider_service_id
      left join category.service_definitions sd_for_ps on sd_for_ps.id = ps.service_definition_id
      where (${providerServiceId}::uuid is null or br.provider_service_id = ${providerServiceId}::uuid)
        and (${serviceProviderId}::uuid is null or br.service_provider_id = ${serviceProviderId}::uuid)
        and (${resourceId}::uuid is null or br.id = ${resourceId}::uuid)
        and (
          ${q}::text is null
          or br.resource_type ilike '%' || ${q}::text || '%'
          or coalesce(br.code, '') ilike '%' || ${q}::text || '%'
          or common.get_translation_t(br.name_translations, ${locale}, 'fa-IR') ilike '%' || ${q}::text || '%'
          or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike '%' || ${q}::text || '%'
          or common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') ilike '%' || ${q}::text || '%'
        )
      order by br.is_active desc, br.resource_type asc, br.code asc nulls last, br.create_date desc
      limit 500
    `,
    getAvailabilityLookups(locale),
    sql<{ activeRules: number; blockRules: number; resources: number; inactiveResources: number }[]>`
      select
        (select count(*)::int from provider_portal.generic_availability_rules where coalesce(is_active, true) = true) as "activeRules",
        (select count(*)::int from provider_portal.generic_availability_rules where coalesce(is_active, true) = true and is_available = false) as "blockRules",
        (select count(*)::int from provider_portal.bookable_resources) as "resources",
        (select count(*)::int from provider_portal.bookable_resources where is_active = false) as "inactiveResources"
    `,
  ]);

  return {
    rules: consolidateAvailabilityRules(rules),
    resources,
    lookups,
    stats: statsRows[0] || { activeRules: 0, blockRules: 0, resources: 0, inactiveResources: 0 },
  };
}

export async function getGenericAvailabilityRuleById(id: string, localeInput = "fa-IR") {
  const ruleId = asUuid(id);
  if (!ruleId) return null;
  const locale = localeOrDefault(localeInput);

  const [row] = await sql<GenericAvailabilityRule[]>`
    select
      r.id::text,
      r.target_type as "targetType",
      r.target_id::text as "targetId",
      case
        when r.target_type = 'provider' then (select common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') from category.service_providers sp where sp.id = r.target_id)
        when r.target_type = 'provider_service' then (select coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''), ps.id::text) from category.provider_services ps left join category.service_definitions sd on sd.id = ps.service_definition_id where ps.id = r.target_id)
        when r.target_type = 'service_definition' then (select common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') from category.service_definitions sd where sd.id = r.target_id)
        when r.target_type = 'staff' then (select common.get_translation_t(st.name_translations, ${locale}, 'fa-IR') from category.staff st where st.id = r.target_id)
        when r.target_type = 'provider_staff' then (
          select concat(common.get_translation_t(st.name_translations, ${locale}, 'fa-IR'), ' · ', common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR'))
          from category.provider_staffs pst
          join category.staff st on st.id = pst.staff_id
          join category.service_providers sp on sp.id = pst.service_provider_id
          where pst.id = r.target_id
        )
        when r.target_type = 'bookable_resource' then (
          select coalesce(nullif(common.get_translation_t(br.name_translations, ${locale}, 'fa-IR'), ''), br.code, br.id::text)
          from provider_portal.bookable_resources br where br.id = r.target_id
        )
        else r.target_id::text
      end as "targetLabel",
      case
        when r.target_type = 'provider_service' then (
          select coalesce(
            nullif(common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'), ''),
            nullif(common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR'), '')
          )
          from category.provider_services ps
          left join category.service_definitions sd on sd.id = ps.service_definition_id
          where ps.id = r.target_id
        )
        when r.target_type = 'service_definition' then (select common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR') from category.service_definitions sd where sd.id = r.target_id)
        else null
      end as "targetDescription",
      r.service_provider_id::text as "serviceProviderId",
      common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as "serviceProviderLabel",
      r.provider_service_id::text as "providerServiceId",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd_for_ps.name_translations, ${locale}, 'fa-IR'), ''),
        ps.id::text
      ) as "providerServiceLabel",
      coalesce(
        nullif(common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd_for_ps.description_translations, ${locale}, 'fa-IR'), '')
      ) as "providerServiceDescription",
      r.resource_id::text as "resourceId",
      coalesce(nullif(common.get_translation_t(br.name_translations, ${locale}, 'fa-IR'), ''), br.code, br.id::text) as "resourceLabel",
      r.day_of_week as "dayOfWeek",
      r.specific_date::text as "specificDate",
      r.starts_at::text as "startsAt",
      r.ends_at::text as "endsAt",
      r.is_available as "isAvailable",
      coalesce(r.is_active, true) as "isActive",
      r.capacity,
      r.slot_interval_minutes as "slotIntervalMinutes",
      r.min_booking_minutes as "minBookingMinutes",
      r.max_booking_minutes as "maxBookingMinutes",
      r.priority,
      r.timezone_id as "timezoneId",
      r.metadata
    from provider_portal.generic_availability_rules r
    left join category.service_providers sp on sp.id = r.service_provider_id
    left join category.provider_services ps on ps.id = r.provider_service_id
    left join category.service_definitions sd_for_ps on sd_for_ps.id = ps.service_definition_id
    left join provider_portal.bookable_resources br on br.id = r.resource_id
    where r.id = ${ruleId}::uuid
    limit 1
  `;

  if (!row) return null;

  const groupId = getAvailabilityGroupId(row.metadata, null);
  const siblingRows = groupId
    ? await sql<GenericAvailabilityRule[]>`
        select
          r.id::text,
          r.target_type as "targetType",
          r.target_id::text as "targetId",
          r.service_provider_id::text as "serviceProviderId",
          r.provider_service_id::text as "providerServiceId",
          r.resource_id::text as "resourceId",
          r.day_of_week as "dayOfWeek",
          r.specific_date::text as "specificDate",
          r.starts_at::text as "startsAt",
          r.ends_at::text as "endsAt",
          r.is_available as "isAvailable",
          coalesce(r.is_active, true) as "isActive",
          r.capacity,
          r.slot_interval_minutes as "slotIntervalMinutes",
          r.min_booking_minutes as "minBookingMinutes",
          r.max_booking_minutes as "maxBookingMinutes",
          r.priority,
          r.timezone_id as "timezoneId",
          r.metadata
        from provider_portal.generic_availability_rules r
        where r.metadata ->> 'availabilityGroupId' = ${groupId}
        order by r.day_of_week nulls last, r.specific_date nulls last, r.starts_at nulls last
      `
    : await sql<GenericAvailabilityRule[]>`
        select
          r.id::text,
          r.target_type as "targetType",
          r.target_id::text as "targetId",
          r.service_provider_id::text as "serviceProviderId",
          r.provider_service_id::text as "providerServiceId",
          r.resource_id::text as "resourceId",
          r.day_of_week as "dayOfWeek",
          r.specific_date::text as "specificDate",
          r.starts_at::text as "startsAt",
          r.ends_at::text as "endsAt",
          r.is_available as "isAvailable",
          coalesce(r.is_active, true) as "isActive",
          r.capacity,
          r.slot_interval_minutes as "slotIntervalMinutes",
          r.min_booking_minutes as "minBookingMinutes",
          r.max_booking_minutes as "maxBookingMinutes",
          r.priority,
          r.timezone_id as "timezoneId",
          r.metadata
        from provider_portal.generic_availability_rules r
        where r.target_type = ${row.targetType}
          and r.target_id = ${row.targetId}::uuid
          and r.service_provider_id is not distinct from ${row.serviceProviderId}::uuid
          and r.provider_service_id is not distinct from ${row.providerServiceId}::uuid
          and r.resource_id is not distinct from ${row.resourceId}::uuid
          and r.specific_date is not distinct from ${row.specificDate}::date
          and r.starts_at is not distinct from ${row.startsAt}::time
          and r.ends_at is not distinct from ${row.endsAt}::time
          and r.is_available is not distinct from ${row.isAvailable}
          and r.capacity is not distinct from ${row.capacity}::int
          and r.slot_interval_minutes is not distinct from ${row.slotIntervalMinutes}::int
          and r.min_booking_minutes is not distinct from ${row.minBookingMinutes}::int
          and r.max_booking_minutes is not distinct from ${row.maxBookingMinutes}::int
          and r.priority is not distinct from ${row.priority}::int
          and r.timezone_id is not distinct from ${row.timezoneId}
        order by r.day_of_week nulls last, r.specific_date nulls last, r.starts_at nulls last
      `;

  const consolidated = consolidateAvailabilityRules([row, ...siblingRows]);
  return { ...row, ...(consolidated[0] || {}), id: row.id };
}

export async function getBookableResourceById(id: string, localeInput = "fa-IR") {
  const resourceId = asUuid(id);
  if (!resourceId) return null;
  const locale = localeOrDefault(localeInput);

  const [row] = await sql<BookableResource[]>`
    select
      br.id::text,
      br.service_provider_id::text as "serviceProviderId",
      common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as "serviceProviderLabel",
      br.provider_service_id::text as "providerServiceId",
      common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as "providerServiceLabel",
      br.resource_type as "resourceType",
      br.code,
      br.name_translations as "nameTranslations",
      br.description_translations as "descriptionTranslations",
      br.total_capacity as "totalCapacity",
      br.is_active as "isActive",
      br.metadata,
      (
        select count(*)::int
        from provider_portal.generic_availability_rules r
        where r.resource_id = br.id or (r.target_type = 'bookable_resource' and r.target_id = br.id)
      ) as "rulesCount"
    from provider_portal.bookable_resources br
    join category.service_providers sp on sp.id = br.service_provider_id
    left join category.provider_services ps on ps.id = br.provider_service_id
    left join category.service_definitions sd_for_ps on sd_for_ps.id = ps.service_definition_id
    where br.id = ${resourceId}::uuid
    limit 1
  `;

  return row || null;
}

export async function saveGenericAvailabilityRule(input: GenericAvailabilityRule) {
  const baseMetadata = emptyObject(input.metadata) as Record<string, unknown>;
  const targetId = asUuid(input.targetId);
  if (!targetId) throw new Error("Please select a valid availability target from the searchable selector.");

  const specificDate = cleanString(input.specificDate);
  const selectedDays = normalizeDayArray([
    ...(Array.isArray(input.dayOfWeeks) ? input.dayOfWeeks : []),
    input.dayOfWeek ?? null,
  ]);

  if (!specificDate && selectedDays.length === 0) {
    throw new Error("Select at least one weekday or choose a specific date.");
  }

  const existingId = asUuid(input.id || null);
  const daysToPersist = specificDate ? [null] : selectedDays;
  const ids: string[] = [];

  await sql.begin(async (tx) => {
    let groupId = typeof baseMetadata.availabilityGroupId === "string" && baseMetadata.availabilityGroupId.trim().length
      ? baseMetadata.availabilityGroupId.trim()
      : null;

    if (existingId) {
      const existingGroup = await getAvailabilityRuleGroupFilter(tx, existingId);
      groupId = groupId || existingGroup?.groupId || existingGroup?.id || existingId;
      await deleteAvailabilityRuleGroup(tx, existingId);
    }

    if (!groupId) groupId = randomUUID();

    const metadata = {
      ...baseMetadata,
      availabilityGroupId: groupId,
      selectedWeekdays: selectedDays,
      editorMode: specificDate ? "specific_date" : "weekly_multi_day",
    };

    for (let index = 0; index < daysToPersist.length; index += 1) {
      const day = daysToPersist[index];
      const rowId = index === 0 && existingId ? existingId : null;

      const [row] = await tx<any[]>`
        insert into provider_portal.generic_availability_rules (
          id, target_type, target_id, service_provider_id, provider_service_id, resource_id,
          day_of_week, specific_date, starts_at, ends_at, is_available, is_active, capacity,
          slot_interval_minutes, min_booking_minutes, max_booking_minutes, priority, timezone_id, metadata
        ) values (
          coalesce(${rowId}::uuid, public.uuid_generate_v4()),
          ${input.targetType},
          ${targetId}::uuid,
          ${asUuid(input.serviceProviderId || null)}::uuid,
          ${asUuid(input.providerServiceId || null)}::uuid,
          ${asUuid(input.resourceId || null)}::uuid,
          ${day}::smallint,
          ${specificDate}::date,
          ${cleanString(input.startsAt)}::time,
          ${cleanString(input.endsAt)}::time,
          ${input.isAvailable},
          ${input.isActive ?? true},
          ${input.capacity ?? null}::int,
          ${input.slotIntervalMinutes ?? null}::int,
          ${input.minBookingMinutes ?? null}::int,
          ${input.maxBookingMinutes ?? null}::int,
          coalesce(${input.priority ?? null}::int, 100),
          coalesce(${cleanString(input.timezoneId)}::text, 'UTC'),
          ${JSON.stringify(metadata)}::jsonb
        )
        returning id::text
      `;

      ids.push(row.id as string);
    }
  });

  return { id: ids[0], ids };
}

export async function saveBookableResource(input: BookableResource) {
  const metadata = emptyObject(input.metadata);
  const nameTranslations = emptyObject(input.nameTranslations);
  const descriptionTranslations = emptyObject(input.descriptionTranslations);
  const serviceProviderId = asUuid(input.serviceProviderId);
  if (!serviceProviderId) throw new Error("A valid provider is required.");

  const [row] = await sql<any[]>`
    insert into provider_portal.bookable_resources (
      id, service_provider_id, provider_service_id, resource_type, code,
      name_translations, description_translations, total_capacity, is_active, metadata
    ) values (
      coalesce(${asUuid(input.id || null)}::uuid, public.uuid_generate_v4()),
      ${serviceProviderId}::uuid,
      ${asUuid(input.providerServiceId || null)}::uuid,
      ${input.resourceType || "generic"},
      ${cleanString(input.code)},
      ${JSON.stringify(nameTranslations)}::jsonb,
      ${JSON.stringify(descriptionTranslations)}::jsonb,
      greatest(${input.totalCapacity || 1}::int, 1),
      ${input.isActive ?? true},
      ${JSON.stringify(metadata)}::jsonb
    )
    on conflict (id) do update set
      service_provider_id = excluded.service_provider_id,
      provider_service_id = excluded.provider_service_id,
      resource_type = excluded.resource_type,
      code = excluded.code,
      name_translations = excluded.name_translations,
      description_translations = excluded.description_translations,
      total_capacity = excluded.total_capacity,
      is_active = excluded.is_active,
      metadata = excluded.metadata,
      last_modified_date = now()
    returning id::text
  `;

  return { id: row.id as string };
}

export async function setGenericAvailabilityRuleActive(id: string, isActive: boolean) {
  const ruleId = asUuid(id);
  if (!ruleId) throw new Error("Invalid rule id.");

  await sql.begin(async (tx) => {
    const group = await getAvailabilityRuleGroupFilter(tx, ruleId);
    if (!group) throw new Error("Rule not found.");

    if (group.groupId) {
      await tx`
        update provider_portal.generic_availability_rules
        set is_active = ${isActive}, last_modified_date = now()
        where metadata ->> 'availabilityGroupId' = ${group.groupId}
      `;
      return;
    }

    const r = group.row;
    await tx`
      update provider_portal.generic_availability_rules
      set is_active = ${isActive}, last_modified_date = now()
      where target_type = ${r.target_type}
        and target_id = ${r.target_id}::uuid
        and service_provider_id is not distinct from ${r.service_provider_id}::uuid
        and provider_service_id is not distinct from ${r.provider_service_id}::uuid
        and resource_id is not distinct from ${r.resource_id}::uuid
        and specific_date is not distinct from ${r.specific_date}::date
        and starts_at is not distinct from ${r.starts_at}::time
        and ends_at is not distinct from ${r.ends_at}::time
        and is_available is not distinct from ${r.is_available}
        and capacity is not distinct from ${r.capacity}::int
        and slot_interval_minutes is not distinct from ${r.slot_interval_minutes}::int
        and min_booking_minutes is not distinct from ${r.min_booking_minutes}::int
        and max_booking_minutes is not distinct from ${r.max_booking_minutes}::int
        and priority is not distinct from ${r.priority}::int
        and timezone_id is not distinct from ${r.timezone_id}
    `;
  });

  return { id: ruleId, isActive };
}

export async function deleteGenericAvailabilityRule(id: string) {
  const ruleId = asUuid(id);
  if (!ruleId) throw new Error("Invalid rule id.");

  await sql.begin(async (tx) => {
    await deleteAvailabilityRuleGroup(tx, ruleId);
  });

  return { id: ruleId };
}

export async function setBookableResourceActive(id: string, isActive: boolean) {
  const resourceId = asUuid(id);
  if (!resourceId) throw new Error("Invalid resource id.");

  await sql`
    update provider_portal.bookable_resources
    set is_active = ${isActive}, last_modified_date = now()
    where id = ${resourceId}::uuid
  `;

  return { id: resourceId, isActive };
}

export async function deleteBookableResource(id: string) {
  const resourceId = asUuid(id);
  if (!resourceId) throw new Error("Invalid resource id.");

  const [usage] = await sql<{ count: number }[]>`
    select count(*)::int
    from provider_portal.generic_availability_rules
    where resource_id = ${resourceId}::uuid
       or (target_type = 'bookable_resource' and target_id = ${resourceId}::uuid)
  `;

  if ((usage?.count || 0) > 0) {
    throw new Error("This resource has availability rules. Disable it or delete its rules first.");
  }

  await sql`
    delete from provider_portal.bookable_resources
    where id = ${resourceId}::uuid
  `;

  return { id: resourceId };
}
