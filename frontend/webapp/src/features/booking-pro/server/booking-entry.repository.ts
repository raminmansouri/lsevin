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

export async function resolveBookingEntry(input: {
  locale?: string | null;
  providerId?: Id;
  serviceId?: Id;
  specialistId?: Id;
}): Promise<BookingEntryResolution> {
  const locale = localeToDb(input.locale);
  const explicitProviderId = asUuid(input.providerId);
  const explicitServiceId = asUuid(input.serviceId);
  const explicitSpecialistId = asUuid(input.specialistId);

  let providerId = explicitProviderId;
  const serviceId = explicitServiceId;
  const specialistId = explicitSpecialistId;
  let serviceDefinitionId: string | null = null;

  if (serviceId) {
    const [service] = await sql<{ providerId: string; serviceDefinitionId: string }[]>`
      select service_provider_id::text as "providerId",
             service_definition_id::text as "serviceDefinitionId"
      from category.provider_services
      where id = ${serviceId}::uuid
        and is_active = true
      limit 1
    `;
    providerId = providerId || service?.providerId || null;
    serviceDefinitionId = service?.serviceDefinitionId || null;
  }

  const providerRows = await sql<BookingEntryProvider[]>`
    select distinct
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as name,
      coalesce(
        nullif(sp.image_url, ''),
        (
          select nullif(pgi.url, '')
          from category.provider_gallery_items pgi
          where pgi.service_provider_id = sp.id
          order by pgi.display_order asc, pgi.create_date desc
          limit 1
        )
      ) as image,
      sp.city,
      sp.country,
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount"
    from category.service_providers sp
    left join category.provider_services ps on ps.service_provider_id = sp.id
    left join category.provider_staffs pst on pst.service_provider_id = sp.id and pst.is_active = true
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
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''),
        ''
      ) as name,
      coalesce(
        nullif(common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR'), ''),
        ''
      ) as description,
      coalesce(
        nullif(ps.image_url, ''),
        nullif(sd.image_url, ''),
        (
          select nullif(psgi.url, '')
          from category.provider_service_gallery_items psgi
          where psgi.provider_service_id = ps.id
          order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
          limit 1
        )
      ) as image,
      coalesce(nullif(ps.duration_minutes, 0), nullif(sd.duration_minutes, 0), 30)::int as "durationMinutes",
      coalesce(nullif(ps.slot_interval_minutes, 0), 15)::int as "slotIntervalMinutes",
      coalesce(ps.value, sd.value, 0)::float8 as price,
      coalesce(nullif(ps.currency, ''), nullif(sd.currency, ''), 'USD') as currency
    from category.provider_services ps
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.is_active = true
      and (${providerId}::uuid is null or ps.service_provider_id = ${providerId}::uuid)
      and (${serviceId}::uuid is null or ps.id = ${serviceId}::uuid)
      and (
        ${specialistId}::uuid is null
        or exists (
          select 1
          from category.staff_services ss
          where ss.service_definition_id = ps.service_definition_id
            and ss.staff_id = ${specialistId}::uuid
            and ss.is_active = true
        )
      )
    order by ps.is_popular desc nulls last, ps.rating desc nulls last, ps.create_date desc
    limit 50
  `;

  const specialistRows = await sql<BookingEntrySpecialist[]>`
    select distinct
      s.id::text as id,
      common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') as name,
      common.get_translation_t(s.title_translations, ${locale}, 'fa-IR') as title,
      coalesce(
        nullif(s.profile_image_url, ''),
        (
          select nullif(sgi.url, '')
          from category.staff_gallery_items sgi
          where sgi.staff_id = s.id
          order by sgi.is_primary desc, sgi.display_order asc, sgi.create_date desc
          limit 1
        )
      ) as image,
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
    selectedProviderId: providerId,
    selectedServiceId: serviceId,
    selectedSpecialistId: specialistId,
    providers: providerRows,
    services: serviceRows,
    specialists: specialistRows,
  };
}
