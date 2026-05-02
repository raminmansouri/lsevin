import "server-only";

import sql from "@/config/database/db";

type Id = string | null | undefined;

export type BookingEntryProvider = {
  id: string;
  name: string;
  image: string | null;
  city: string | null;
  country: string | null;
  rating: number;
  reviewCount: number;
};

export type BookingEntryService = {
  id: string;
  providerId: string;
  serviceDefinitionId: string;
  name: string;
  description: string | null;
  image: string | null;
  durationMinutes: number;
  slotIntervalMinutes: number;
  price: number;
  currency: string;
};

export type BookingEntrySpecialist = {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
  rating: number;
  reviewCount: number;
};

export type BookingEntryResolution = {
  selectedProviderId: string | null;
  selectedServiceId: string | null;
  selectedSpecialistId: string | null;
  providers: BookingEntryProvider[];
  services: BookingEntryService[];
  specialists: BookingEntrySpecialist[];
};

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function asUuid(value: Id) {
  const trimmed = String(value || "").trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function localeToDb(locale?: string | null) {
  const raw = String(locale || "en-US").trim().replace("_", "-");
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
  return map[raw.toLowerCase()] || raw;
}

export async function resolveBookingEntry(input: {
  locale?: string | null;
  providerId?: Id;
  serviceId?: Id;
  specialistId?: Id;
}): Promise<BookingEntryResolution> {
  const locale = localeToDb(input.locale);
  let providerId = asUuid(input.providerId);
  let serviceId = asUuid(input.serviceId);
  let specialistId = asUuid(input.specialistId);

  if (serviceId && !providerId) {
    const [service] = await sql<{ providerId: string }[]>`
      select service_provider_id::text as "providerId"
      from category.provider_services
      where id = ${serviceId}::uuid
      limit 1
    `;
    providerId = service?.providerId || null;
  }

  if (specialistId && !providerId) {
    const [membership] = await sql<{ providerId: string }[]>`
      select service_provider_id::text as "providerId"
      from category.provider_staffs
      where staff_id = ${specialistId}::uuid
        and is_active = true
      order by create_date desc
      limit 1
    `;
    providerId = membership?.providerId || null;
  }

  if (providerId && specialistId && !serviceId) {
    const [service] = await sql<{ id: string }[]>`
      select ps.id::text as id
      from category.provider_services ps
      join category.staff_services ss on ss.service_definition_id = ps.service_definition_id
      where ps.service_provider_id = ${providerId}::uuid
        and ss.staff_id = ${specialistId}::uuid
        and ps.is_active = true
        and ss.is_active = true
      order by ps.is_popular desc nulls last, ps.rating desc nulls last, ps.create_date desc
      limit 1
    `;
    serviceId = service?.id || null;
  }

  const serviceDefinitionId = serviceId
    ? (await sql<{ serviceDefinitionId: string }[]>`
        select service_definition_id::text as "serviceDefinitionId"
        from category.provider_services
        where id = ${serviceId}::uuid
        limit 1
      `)[0]?.serviceDefinitionId || null
    : null;

  const providerRows = await sql<BookingEntryProvider[]>`
    select distinct
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as name,
      sp.image_url as image,
      sp.city,
      sp.country,
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount"
    from category.service_providers sp
    left join category.provider_services ps on ps.service_provider_id = sp.id
    left join category.provider_staffs pst on pst.service_provider_id = sp.id
    where sp.is_active = true
      and (${providerId}::uuid is null or sp.id = ${providerId}::uuid)
      and (${serviceDefinitionId}::uuid is null or ps.service_definition_id = ${serviceDefinitionId}::uuid)
      and (${specialistId}::uuid is null or pst.staff_id = ${specialistId}::uuid)
    order by rating desc, "reviewCount" desc, name asc
    limit 30
  `;

  const serviceRows = await sql<BookingEntryService[]>`
    select
      ps.id::text as id,
      ps.service_provider_id::text as "providerId",
      ps.service_definition_id::text as "serviceDefinitionId",
      common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US') as name,
      common.get_translation_t(ps.description_translations, ${locale}, 'en-US') as description,
      ps.image_url as image,
      coalesce(nullif(ps.duration_minutes, 0), nullif(sd.duration_minutes, 0), 30)::int as "durationMinutes",
      coalesce(nullif(ps.slot_interval_minutes, 0), 15)::int as "slotIntervalMinutes",
      coalesce(ps.value, sd.value, 0)::float8 as price,
      coalesce(nullif(ps.currency, ''), nullif(sd.currency, ''), 'USD') as currency
    from category.provider_services ps
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.staff_services ss on ss.service_definition_id = ps.service_definition_id
    where ps.is_active = true
      and (${providerId}::uuid is null or ps.service_provider_id = ${providerId}::uuid)
      and (${serviceId}::uuid is null or ps.id = ${serviceId}::uuid)
      and (${specialistId}::uuid is null or ss.staff_id = ${specialistId}::uuid)
    order by ps.is_popular desc nulls last, ps.rating desc nulls last, ps.create_date desc
    limit 50
  `;

  const specialistRows = await sql<BookingEntrySpecialist[]>`
    select distinct
      s.id::text as id,
      common.get_translation_t(s.name_translations, ${locale}, 'en-US') as name,
      common.get_translation_t(s.title_translations, ${locale}, 'en-US') as title,
      s.profile_image_url as image,
      coalesce(s.rating, 0)::float8 as rating,
      coalesce(s.review_count, 0)::int as "reviewCount"
    from category.staff s
    join category.provider_staffs pst on pst.staff_id = s.id and pst.is_active = true
    left join category.staff_services ss on ss.staff_id = s.id and ss.is_active = true
    where s.is_active = true
      and (${providerId}::uuid is null or pst.service_provider_id = ${providerId}::uuid)
      and (${specialistId}::uuid is null or s.id = ${specialistId}::uuid)
      and (${serviceDefinitionId}::uuid is null or ss.service_definition_id = ${serviceDefinitionId}::uuid)
    order by rating desc, "reviewCount" desc, name asc
    limit 50
  `;

  return {
    selectedProviderId: providerId || providerRows[0]?.id || null,
    selectedServiceId: serviceId || serviceRows[0]?.id || null,
    selectedSpecialistId: specialistId || specialistRows[0]?.id || null,
    providers: providerRows,
    services: serviceRows,
    specialists: specialistRows,
  };
}
