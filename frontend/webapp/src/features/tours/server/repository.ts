import "server-only";

import db from "@/config/database/db";

import type { TourDeparture, TourDepartureAdminRow, TourDeparturesAdminPageData } from "../types";

type Locale = string;

export async function tourDeparturesSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('tour.departures') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function mapAdminRow(row: any): TourDepartureAdminRow {
  return {
    id: row.id,
    providerServiceId: row.provider_service_id,
    serviceProviderId: row.service_provider_id,
    providerName: row.provider_name || "",
    serviceName: row.service_name || "",
    currency: row.currency,
    price: Number(row.value ?? 0),
    startsOn: toDateOnly(row.starts_on),
    endsOn: toDateOnly(row.ends_on),
    capacity: row.capacity,
    bookedCount: row.booked_count,
    remainingCapacity: Math.max(0, row.capacity - row.booked_count),
    isActive: row.is_active,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

export async function listDeparturesForAdmin(locale: Locale): Promise<TourDepartureAdminRow[]> {
  const rows = await db<any[]>`
    select d.id, d.provider_service_id, d.service_provider_id, d.starts_on, d.ends_on, d.capacity, d.booked_count,
           d.is_active, d.create_date, d.last_modified_date,
           ps.currency, ps.value,
           common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name
    from tour.departures d
    join category.provider_services ps on ps.id = d.provider_service_id
    join category.service_providers sp on sp.id = d.service_provider_id
    order by d.starts_on asc
  `;
  return rows.map(mapAdminRow);
}

export async function getTourDeparturesAdminPageData(locale: Locale): Promise<TourDeparturesAdminPageData> {
  if (!(await tourDeparturesSchemaExists())) {
    return { departures: [], schemaMissing: true };
  }
  const departures = await listDeparturesForAdmin(locale);
  return { departures, schemaMissing: false };
}

/**
 * service_provider_id is derived from the chosen provider_service (not taken from the
 * caller) -- the admin only ever picks a tour listing, never a provider directly, so
 * trusting a client-supplied provider id here would let the two silently disagree.
 */
export async function upsertTourDeparture(input: {
  id?: string;
  providerServiceId: string;
  startsOn: string;
  endsOn: string;
  capacity: number;
  isActive: boolean;
}): Promise<{ id: string }> {
  if (input.id) {
    const rows = await db<{ id: string }[]>`
      update tour.departures
      set provider_service_id = ${input.providerServiceId},
          service_provider_id = (select service_provider_id from category.provider_services where id = ${input.providerServiceId}),
          starts_on = ${input.startsOn},
          ends_on = ${input.endsOn},
          capacity = ${input.capacity},
          is_active = ${input.isActive},
          last_modified_date = now()
      where id = ${input.id} and booked_count <= ${input.capacity}
      returning id
    `;
    if (!rows[0]) throw new Error("DEPARTURE_NOT_FOUND_OR_CAPACITY_BELOW_BOOKED");
    return rows[0];
  }

  const rows = await db<{ id: string }[]>`
    insert into tour.departures (provider_service_id, service_provider_id, starts_on, ends_on, capacity, is_active)
    select ${input.providerServiceId}, ps.service_provider_id, ${input.startsOn}, ${input.endsOn}, ${input.capacity}, ${input.isActive}
    from category.provider_services ps
    where ps.id = ${input.providerServiceId}
    returning id
  `;
  if (!rows[0]) throw new Error("PROVIDER_SERVICE_NOT_FOUND");
  return rows[0];
}

export async function deleteTourDeparture(id: string): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    delete from tour.departures where id = ${id} and booked_count = 0 returning id
  `;
  return rows.length > 0;
}

/** Customer-facing: the departures a customer can actually pick for a given tour
 * listing -- active, not yet started, and (shown, not hidden) even when full so the
 * customer understands why it's disabled rather than it silently disappearing. */
export async function listOpenDeparturesForService(providerServiceId: string): Promise<TourDeparture[]> {
  try {
    const rows = await db<any[]>`
      select id, provider_service_id, starts_on, ends_on, capacity, booked_count, is_active
      from tour.departures
      where provider_service_id = ${providerServiceId} and is_active = true and starts_on >= current_date
      order by starts_on asc
    `;
    return rows.map((row) => ({
      id: row.id,
      providerServiceId: row.provider_service_id,
      startsOn: toDateOnly(row.starts_on),
      endsOn: toDateOnly(row.ends_on),
      capacity: row.capacity,
      bookedCount: row.booked_count,
      remainingCapacity: Math.max(0, row.capacity - row.booked_count),
      isActive: row.is_active,
    }));
  } catch {
    // Migration 0042 hasn't run yet -- no departures rather than a crash.
    return [];
  }
}

/** Batch version for booking-pro's listServices(): does this service have any open
 * departures at all (so the storefront can show "fixed departures" vs. treat it as
 * an ordinary service)? Mirrors listTransferRouteSummaries()'s try/catch guard. */
export async function listServicesWithOpenDepartures(providerServiceIds: string[]): Promise<Set<string>> {
  const result = new Set<string>();
  if (providerServiceIds.length === 0) return result;
  try {
    const rows = await db<{ provider_service_id: string }[]>`
      select distinct provider_service_id
      from tour.departures
      where provider_service_id = any(${providerServiceIds}) and is_active = true and starts_on >= current_date
    `;
    for (const row of rows) result.add(row.provider_service_id);
  } catch {
    // Migration 0042 hasn't run yet.
  }
  return result;
}

/** The overbooking guard, run inside the same transaction as the booking insert --
 * mirrors reserveHotelDates()'s shape, but against a numeric capacity rather than an
 * exclusive per-night reservation (a tour departure is shared by many bookings, a
 * hotel night is not). Throws DEPARTURE_FULL if the conditional UPDATE affects no
 * row, i.e. someone else filled the last spot in the same instant. */
export async function reserveTourDeparture(tx: typeof db, departureId: string): Promise<void> {
  const rows = await tx<{ id: string }[]>`
    update tour.departures
    set booked_count = booked_count + 1, last_modified_date = now()
    where id = ${departureId} and is_active = true and booked_count < capacity
    returning id
  `;
  if (!rows[0]) throw new Error("DEPARTURE_FULL");
}

export async function releaseTourDeparture(departureId: string): Promise<void> {
  await db`
    update tour.departures
    set booked_count = greatest(0, booked_count - 1), last_modified_date = now()
    where id = ${departureId}
  `;
}
