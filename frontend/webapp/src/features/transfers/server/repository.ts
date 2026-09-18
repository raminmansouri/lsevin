import "server-only";

import db from "@/config/database/db";

import type { TransferRouteAdminRow, TransferRoutesAdminPageData, TransferRouteSummary } from "../types";

type Locale = string;

export async function transferRoutesSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('transfer.routes') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function pickTranslation(translations: Record<string, string> | null | undefined, locale: Locale): string {
  if (!translations) return "";
  return translations[locale] || translations["fa-IR"] || Object.values(translations)[0] || "";
}

function mapAdminRow(row: any, locale: Locale): TransferRouteAdminRow {
  const fromTranslations = row.from_translations || {};
  const toTranslations = row.to_translations || {};
  return {
    id: row.id,
    serviceProviderId: row.service_provider_id,
    providerName: row.provider_name || "",
    providerServiceId: row.provider_service_id,
    serviceDefinitionId: row.service_definition_id,
    serviceDefinitionName: row.service_definition_name || "",
    fromTranslations,
    toTranslations,
    from: pickTranslation(fromTranslations, locale),
    to: pickTranslation(toTranslations, locale),
    vehicleType: row.vehicle_type,
    price: Number(row.value ?? 0),
    currency: row.currency,
    isActive: row.is_active,
    displayNameTranslations: row.display_name_translations || {},
    descriptionTranslations: row.description_translations || {},
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

export async function listTransferRoutesForAdmin(locale: Locale): Promise<TransferRouteAdminRow[]> {
  const rows = await db<any[]>`
    select r.id, r.service_provider_id, r.provider_service_id, r.from_translations, r.to_translations, r.vehicle_type,
           ps.value, ps.currency, ps.is_active, ps.display_name_translations, ps.description_translations,
           ps.service_definition_id,
           r.create_date, r.last_modified_date,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
           common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') as service_definition_name
    from transfer.routes r
    join category.provider_services ps on ps.id = r.provider_service_id
    join category.service_providers sp on sp.id = r.service_provider_id
    join category.service_definitions sd on sd.id = ps.service_definition_id
    order by r.create_date desc
  `;
  return rows.map((row) => mapAdminRow(row, locale));
}

export async function getTransferRoute(id: string, locale: Locale): Promise<TransferRouteAdminRow | null> {
  const rows = await db<any[]>`
    select r.id, r.service_provider_id, r.provider_service_id, r.from_translations, r.to_translations, r.vehicle_type,
           ps.value, ps.currency, ps.is_active, ps.display_name_translations, ps.description_translations,
           ps.service_definition_id,
           r.create_date, r.last_modified_date,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
           common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR') as service_definition_name
    from transfer.routes r
    join category.provider_services ps on ps.id = r.provider_service_id
    join category.service_providers sp on sp.id = r.service_provider_id
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where r.id = ${id}
  `;
  return rows[0] ? mapAdminRow(rows[0], locale) : null;
}

/** The 1:1 enrichment row alongside a provider_services listing (created via
 * the existing saveProviderServiceAction first -- see actions.ts). Upserting
 * by `providerServiceId` rather than `id` alone means re-saving the same
 * listing's route details is idempotent even if the caller lost track of the
 * route row's own id. */
export async function upsertTransferRoute(input: {
  id?: string;
  serviceProviderId: string;
  providerServiceId: string;
  fromTranslations: Record<string, string>;
  toTranslations: Record<string, string>;
  vehicleType?: string;
}): Promise<{ id: string }> {
  const rows = await db<{ id: string }[]>`
    insert into transfer.routes (
      service_provider_id, provider_service_id, from_translations, to_translations, vehicle_type
    ) values (
      ${input.serviceProviderId}, ${input.providerServiceId}, ${JSON.stringify(input.fromTranslations)}::jsonb,
      ${JSON.stringify(input.toTranslations)}::jsonb, ${input.vehicleType ?? null}
    )
    on conflict (provider_service_id) do update
    set from_translations = excluded.from_translations,
        to_translations = excluded.to_translations,
        vehicle_type = excluded.vehicle_type,
        service_provider_id = excluded.service_provider_id,
        last_modified_date = now()
    returning id
  `;
  return rows[0];
}

export async function deleteTransferRoute(id: string): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    delete from transfer.routes where id = ${id} returning id
  `;
  return rows.length > 0;
}

export async function getTransferRoutesAdminPageData(locale: Locale): Promise<TransferRoutesAdminPageData> {
  if (!(await transferRoutesSchemaExists())) {
    return { routes: [], schemaMissing: true };
  }

  const routes = await listTransferRoutesForAdmin(locale);
  return { routes, schemaMissing: false };
}

/** Batch lookup for booking-pro's listServices(): the "From X -> To Y" chip
 * data for every provider_service id in one query, keyed by service id --
 * mirrors listServiceAttributeValues()'s own batching shape exactly (see
 * booking-pro/server/repository.ts). Called on every service listing, so a
 * migration 0040 that hasn't run yet must never break the entire catalogue --
 * caught and treated as "no routes" rather than propagated. */
export async function listTransferRouteSummaries(
  serviceIds: string[],
  locale: Locale
): Promise<Map<string, TransferRouteSummary>> {
  if (serviceIds.length === 0) return new Map();

  try {
    const rows = await db<any[]>`
      select provider_service_id, from_translations, to_translations, vehicle_type
      from transfer.routes
      where provider_service_id = any(${serviceIds})
    `;

    const result = new Map<string, TransferRouteSummary>();
    for (const row of rows) {
      result.set(row.provider_service_id, {
        from: pickTranslation(row.from_translations, locale),
        to: pickTranslation(row.to_translations, locale),
        vehicleType: row.vehicle_type,
      });
    }
    return result;
  } catch {
    return new Map();
  }
}
