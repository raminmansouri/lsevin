import "server-only";

import db from "@/config/database/db";

/**
 * One booking per hotel per night, held in provider_portal.hotel_date_availability.
 *
 * A row means the night is taken; no row means it is free. The unique index on
 * (service_provider_id, stay_date) is the guard, so the conflict is detected by the
 * database inside the caller's transaction rather than by a check that two
 * simultaneous checkouts can both pass.
 */

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

export class HotelDatesUnavailableError extends Error {
  readonly dates: string[];

  constructor(dates: string[]) {
    super("HOTEL_DATES_UNAVAILABLE");
    this.name = "HotelDatesUnavailableError";
    this.dates = dates;
  }
}

/** Every night from checkIn up to, but not including, checkOut. */
export function eachStayDate(checkIn: string, checkOut: string): string[] {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates: string[] = [];
  for (let d = start; d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Take every night of the stay for this hotel. Must run inside the same transaction
 * as the booking insert: on a clash the unique index raises, this throws, and the
 * whole checkout rolls back with no partial hold left behind.
 */
export async function reserveHotelDates(
  tx: typeof db,
  input: { serviceProviderId: string; bookingId: string; checkIn: string; checkOut: string },
): Promise<string[]> {
  const dates = eachStayDate(input.checkIn, input.checkOut);
  if (!dates.length) return [];

  try {
    await tx`
      insert into provider_portal.hotel_date_availability
        (service_provider_id, stay_date, status, booking_id)
      select ${input.serviceProviderId}::uuid, d::date, 'booked', ${input.bookingId}::uuid
      from unnest(${dates}::date[]) as d
    `;
  } catch (error) {
    if ((error as { code?: string })?.code === UNIQUE_VIOLATION) {
      throw new HotelDatesUnavailableError(dates);
    }
    throw error;
  }

  return dates;
}

/** Cancelling frees the nights again. */
export async function releaseHotelDatesForBooking(bookingId: string): Promise<void> {
  await db`
    delete from provider_portal.hotel_date_availability
    where booking_id = ${bookingId}::uuid
  `;
}

/**
 * The nights a hotel cannot take, so the date picker can grey them out instead of
 * letting a guest pick one and fail at checkout.
 */
export async function listHotelUnavailableDates(input: {
  serviceProviderId: string;
  fromDate: string;
  toDate: string;
}): Promise<string[]> {
  const rows = await db<{ stayDate: string }[]>`
    select to_char(stay_date, 'YYYY-MM-DD') as "stayDate"
    from provider_portal.hotel_date_availability
    where service_provider_id = ${input.serviceProviderId}::uuid
      and stay_date >= ${input.fromDate}::date
      and stay_date <= ${input.toDate}::date
    order by stay_date asc
  `;
  return rows.map((row) => row.stayDate);
}

/** An admin closing or reopening a night by hand. */
export async function setHotelDateBlocked(input: {
  serviceProviderId: string;
  stayDate: string;
  blocked: boolean;
  note?: string | null;
}): Promise<{ ok: boolean; reason?: "booked" }> {
  if (!input.blocked) {
    // Only ever release an admin block. A night held by a real booking has to be
    // freed by cancelling that booking, not by clearing the calendar.
    await db`
      delete from provider_portal.hotel_date_availability
      where service_provider_id = ${input.serviceProviderId}::uuid
        and stay_date = ${input.stayDate}::date
        and status = 'blocked'
    `;
    return { ok: true };
  }

  const rows = await db<{ id: string }[]>`
    insert into provider_portal.hotel_date_availability
      (service_provider_id, stay_date, status, note)
    values (${input.serviceProviderId}::uuid, ${input.stayDate}::date, 'blocked', ${input.note ?? null})
    on conflict (service_provider_id, stay_date) do nothing
    returning id::text as id
  `;

  return rows.length ? { ok: true } : { ok: false, reason: "booked" };
}
