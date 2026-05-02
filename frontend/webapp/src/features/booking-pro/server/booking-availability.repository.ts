import "server-only";

import sql from "@/config/database/db";
import { formatBookingDate, normalizeBookingCalendar } from "@/features/booking-pro/lib/calendar";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type Id = string | null | undefined;

export type AvailableDate = {
  date: string;
  day: string;
  available: boolean;
  displayDate: string;
};

export type TimeSlot = {
  time: string;
  endTime: string;
  label: string;
  endLabel: string;
  available: boolean;
  remainingCapacity?: number;
};

export type DateRangeAvailability = {
  available: boolean;
  startDate: string;
  endDate: string;
  requestedUnits: number;
  remainingCapacity: number;
  unavailableDates: string[];
  message?: string;
};

function asUuid(value: Id) {
  const trimmed = String(value || "").trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function toIsoDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return "";
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function normalizeLocale(locale?: string | null) {
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

function formatTimeLabel(time: string, locale: string) {
  const normalizedTime = String(time || "00:00").slice(0, 5);
  const date = new Date(`2026-01-01T${normalizedTime}:00Z`);
  return new Intl.DateTimeFormat(locale.toLowerCase().startsWith("fa") ? "fa-IR" : locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

async function resolveAvailabilityContext(input: { providerId?: Id; serviceId?: Id; specialistId?: Id }) {
  const providerIdInput = asUuid(input.providerId);
  const serviceId = asUuid(input.serviceId);
  const specialistId = asUuid(input.specialistId);

  const [row] = await sql<{
    providerId: string | null;
    serviceId: string | null;
    serviceDefinitionId: string | null;
    providerTypeId: string | null;
    specialistId: string | null;
    providerStaffId: string | null;
    bookingUiMode: "default_slot" | "date_range" | "custom_form";
    durationMinutes: number;
    slotIntervalMinutes: number;
    timezoneId: string;
    resourceCapacity: number;
  }[]>`
    with selected_service as (
      select
        ps.id,
        ps.service_provider_id,
        ps.service_definition_id,
        coalesce(nullif(ps.duration_minutes, 0), nullif(sd.duration_minutes, 0), 30)::int as duration_minutes,
        coalesce(nullif(ps.slot_interval_minutes, 0), 15)::int as slot_interval_minutes,
        coalesce(sd.booking_ui_mode, 'default_slot') as booking_ui_mode
      from category.provider_services ps
      left join category.service_definitions sd on sd.id = ps.service_definition_id
      where (${serviceId}::uuid is null or ps.id = ${serviceId}::uuid)
        and (${providerIdInput}::uuid is null or ps.service_provider_id = ${providerIdInput}::uuid)
        and ps.is_active = true
      order by ps.is_popular desc nulls last, ps.rating desc nulls last, ps.create_date desc
      limit 1
    ), selected_provider as (
      select sp.id, sp.provider_type_id, sp.timezone_id
      from category.service_providers sp
      where sp.id = coalesce(${providerIdInput}::uuid, (select service_provider_id from selected_service))
        and sp.is_active = true
      limit 1
    ), provider_staff_match as (
      select pst.id
      from category.provider_staffs pst
      where pst.service_provider_id = (select id from selected_provider)
        and pst.staff_id = ${specialistId}::uuid
        and pst.is_active = true
      order by pst.create_date desc
      limit 1
    ), resource_capacity as (
      select coalesce(sum(br.total_capacity) filter (where br.is_active = true), 0)::int as capacity
      from provider_portal.bookable_resources br
      where br.provider_service_id = (select id from selected_service)
    )
    select
      (select id::text from selected_provider) as "providerId",
      (select id::text from selected_service) as "serviceId",
      (select service_definition_id::text from selected_service) as "serviceDefinitionId",
      (select provider_type_id::text from selected_provider) as "providerTypeId",
      ${specialistId}::text as "specialistId",
      (select id::text from provider_staff_match) as "providerStaffId",
      coalesce((select booking_ui_mode from selected_service), 'default_slot') as "bookingUiMode",
      coalesce((select duration_minutes from selected_service), 30)::int as "durationMinutes",
      coalesce((select slot_interval_minutes from selected_service), 15)::int as "slotIntervalMinutes",
      coalesce((select timezone_id from selected_provider), 'UTC') as "timezoneId",
      coalesce((select capacity from resource_capacity), 0)::int as "resourceCapacity"
  `;

  return row;
}

export async function getBookingAvailableDatesFromDb(input: {
  providerId?: Id;
  serviceId?: Id;
  specialistId?: Id;
  startDate?: string | null;
  endDate?: string | null;
  locale?: string | null;
  calendar?: string | null;
}): Promise<{ dates: AvailableDate[] }> {
  const locale = normalizeLocale(input.locale);
  const calendar = normalizeBookingCalendar(input.calendar, locale);
  const startDate = toIsoDate(input.startDate) || new Date().toISOString().slice(0, 10);
  const endDate = toIsoDate(input.endDate) || addDays(new Date(`${startDate}T00:00:00Z`), 60);
  const ctx = await resolveAvailabilityContext(input);

  if (!ctx?.providerId || !ctx.serviceId) return { dates: [] };

  const rows = await sql<{ date: string; available: boolean }[]>`
    with ctx as (
      select
        ${ctx.providerId}::uuid as provider_id,
        ${ctx.serviceId}::uuid as service_id,
        ${ctx.serviceDefinitionId}::uuid as service_definition_id,
        ${ctx.specialistId}::uuid as specialist_id,
        ${ctx.providerStaffId}::uuid as provider_staff_id,
        ${ctx.durationMinutes}::int as duration_minutes,
        ${ctx.slotIntervalMinutes}::int as slot_interval_minutes,
        greatest(${ctx.resourceCapacity}::int, 0) as resource_capacity
    ), days as (
      select generate_series(${startDate}::date, ${endDate}::date, interval '1 day')::date as selected_date
    ), generic_positive as (
      select
        d.selected_date,
        r.starts_at,
        r.ends_at,
        coalesce(r.capacity, nullif(ctx.resource_capacity, 0), 1)::int as capacity,
        coalesce(r.slot_interval_minutes, ctx.slot_interval_minutes)::int as slot_interval_minutes,
        r.priority
      from days d
      cross join ctx
      join provider_portal.generic_availability_rules r on r.is_active = true and r.is_available = true
       and (
          (r.target_type = 'provider' and r.target_id = ctx.provider_id)
          or (r.target_type = 'provider_service' and r.target_id = ctx.service_id)
          or (r.target_type = 'service_definition' and r.target_id = ctx.service_definition_id)
          or (r.target_type = 'bookable_resource' and exists (
            select 1 from provider_portal.bookable_resources br
            where br.id = r.target_id and br.provider_service_id = ctx.service_id and br.is_active = true
          ))
       )
       and ((r.specific_date is not null and r.specific_date = d.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from d.selected_date)::int))
       and r.starts_at is not null and r.ends_at is not null and r.starts_at < r.ends_at
    ), has_generic_positive as (
      select d.selected_date, exists(select 1 from generic_positive gp where gp.selected_date = d.selected_date) as has_rules
      from days d
    ), base_windows as (
      select selected_date, starts_at, ends_at, capacity, slot_interval_minutes
      from generic_positive
      union all
      select
        d.selected_date,
        oh.opens_at as starts_at,
        oh.closes_at as ends_at,
        greatest(ctx.resource_capacity, 1)::int as capacity,
        coalesce(nullif(oh.slot_interval_minutes, 0), ctx.slot_interval_minutes)::int as slot_interval_minutes
      from days d
      cross join ctx
      join has_generic_positive hgp on hgp.selected_date = d.selected_date and hgp.has_rules = false
      join provider_portal.provider_operating_hours oh
        on oh.service_provider_id = ctx.provider_id
       and oh.day_of_week = extract(isodow from d.selected_date)::int
       and oh.is_closed = false
       and oh.opens_at is not null
       and oh.closes_at is not null
       and oh.opens_at < oh.closes_at
    ), generated_slots as (
      select
        bw.selected_date,
        gs as slot_start,
        gs + make_interval(mins => ctx.duration_minutes) as slot_end,
        bw.capacity,
        ctx.provider_id,
        ctx.service_id,
        ctx.specialist_id,
        ctx.provider_staff_id,
        ctx.duration_minutes
      from base_windows bw
      cross join ctx
      cross join lateral generate_series(
        bw.selected_date + bw.starts_at,
        bw.selected_date + bw.ends_at - make_interval(mins => ctx.duration_minutes),
        make_interval(mins => greatest(bw.slot_interval_minutes, 1))
      ) gs
    ), generic_blocks as (
      select d.selected_date, r.starts_at, r.ends_at
      from days d
      cross join ctx
      join provider_portal.generic_availability_rules r on r.is_active = true and r.is_available = false
       and (
          (r.target_type = 'provider' and r.target_id = ctx.provider_id)
          or (r.target_type = 'provider_service' and r.target_id = ctx.service_id)
          or (r.target_type = 'service_definition' and r.target_id = ctx.service_definition_id)
          or (r.target_type = 'staff' and r.target_id = ctx.specialist_id)
          or (r.target_type = 'provider_staff' and r.target_id = ctx.provider_staff_id)
          or (r.target_type = 'bookable_resource' and exists (
            select 1 from provider_portal.bookable_resources br
            where br.id = r.target_id and br.provider_service_id = ctx.service_id and br.is_active = true
          ))
       )
       and ((r.specific_date is not null and r.specific_date = d.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from d.selected_date)::int))
    ), staff_rule_presence as (
      select d.selected_date,
        exists (
          select 1 from provider_portal.generic_availability_rules r
          cross join ctx
          where ctx.specialist_id is not null
            and r.is_active = true
            and r.is_available = true
            and ((r.target_type = 'staff' and r.target_id = ctx.specialist_id) or (r.target_type = 'provider_staff' and r.target_id = ctx.provider_staff_id))
            and ((r.specific_date is not null and r.specific_date = d.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from d.selected_date)::int))
        ) as has_generic_staff_rules
      from days d
    ), valid_slots as (
      select s.*
      from generated_slots s
      join staff_rule_presence srp on srp.selected_date = s.selected_date
      where not exists (
          select 1 from generic_blocks gb
          where gb.selected_date = s.selected_date
            and (
              gb.starts_at is null or gb.ends_at is null
              or tsrange(s.selected_date + gb.starts_at, s.selected_date + gb.ends_at, '[)') && tsrange(s.slot_start, s.slot_end, '[)')
            )
        )
        and (
          s.specialist_id is null
          or (
            srp.has_generic_staff_rules = true and exists (
              select 1 from provider_portal.generic_availability_rules r
              where r.is_active = true
                and r.is_available = true
                and ((r.target_type = 'staff' and r.target_id = s.specialist_id) or (r.target_type = 'provider_staff' and r.target_id = s.provider_staff_id))
                and ((r.specific_date is not null and r.specific_date = s.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from s.selected_date)::int))
                and r.starts_at is not null and r.ends_at is not null
                and r.starts_at <= s.slot_start::time and r.ends_at >= s.slot_end::time
            )
          )
          or (
            srp.has_generic_staff_rules = false and exists (
              select 1
              from category.staff_availabilities sa
              left join category.staff_availability_statuses sas on sas.id = sa.availability_status_id
              where sa.staff_id = s.specialist_id
                and ((sa.specific_date is not null and sa.specific_date::date = s.selected_date) or (sa.is_recurring = true and sa.day_of_week = extract(isodow from s.selected_date)::int))
                and sa.start_time <= (s.slot_start::time - time '00:00')
                and sa.end_time >= (s.slot_end::time - time '00:00')
                and coalesce(lower(sas.name), 'available') not in ('unavailable', 'busy', 'blocked', 'inactive', 'disabled')
            )
          )
        )
        and (
          select coalesce(sum(greatest(coalesce(b.rooms, 1), 1)), 0)
          from booking.bookings b
          where b.provider_id = s.provider_id
            and b.service_id = s.service_id
            and b.selected_date = s.selected_date
            and (s.specialist_id is null or b.specialist_id = s.specialist_id)
            and lower(coalesce(b.booking_status, '')) in ('pending', 'confirmed')
            and tsrange(
              b.selected_date + coalesce(b.selected_time_from, b.selected_time, time '00:00'),
              b.selected_date + coalesce(b.selected_time_to, b.selected_time_from, b.selected_time, time '00:00') + interval '1 minute',
              '[)'
            ) && tsrange(s.slot_start, s.slot_end, '[)')
        ) < case when s.specialist_id is not null then 1 else s.capacity end
    )
    select
      d.selected_date::text as date,
      exists(select 1 from valid_slots vs where vs.selected_date = d.selected_date) as available
    from days d
    order by d.selected_date asc
  `;

  return {
    dates: rows.map((row) => ({
      date: String(row.date).slice(0, 10),
      day: new Intl.DateTimeFormat(locale.toLowerCase().startsWith("fa") ? "fa-IR" : locale, { weekday: "short", timeZone: "UTC" }).format(new Date(`${String(row.date).slice(0, 10)}T12:00:00Z`)),
      displayDate: formatBookingDate(String(row.date).slice(0, 10), { locale, calendar, timeZone: "UTC" }),
      available: Boolean(row.available),
    })),
  };
}

export async function getBookingAvailableTimeSlotsFromDb(input: {
  selectedDate?: string | null;
  providerId?: Id;
  serviceId?: Id;
  specialistId?: Id;
  locale?: string | null;
}): Promise<{ timeSlots: TimeSlot[] }> {
  const selectedDate = toIsoDate(input.selectedDate);
  if (!selectedDate) return { timeSlots: [] };

  const locale = normalizeLocale(input.locale);
  const ctx = await resolveAvailabilityContext(input);
  if (!ctx?.providerId || !ctx.serviceId) return { timeSlots: [] };

  const rows = await sql<{ time: string; endTime: string; available: boolean; remainingCapacity: number }[]>`
    with ctx as (
      select
        ${ctx.providerId}::uuid as provider_id,
        ${ctx.serviceId}::uuid as service_id,
        ${ctx.serviceDefinitionId}::uuid as service_definition_id,
        ${ctx.specialistId}::uuid as specialist_id,
        ${ctx.providerStaffId}::uuid as provider_staff_id,
        ${ctx.durationMinutes}::int as duration_minutes,
        ${ctx.slotIntervalMinutes}::int as slot_interval_minutes,
        greatest(${ctx.resourceCapacity}::int, 0) as resource_capacity,
        ${selectedDate}::date as selected_date
    ), generic_positive as (
      select
        r.starts_at,
        r.ends_at,
        coalesce(r.capacity, nullif(ctx.resource_capacity, 0), 1)::int as capacity,
        coalesce(r.slot_interval_minutes, ctx.slot_interval_minutes)::int as slot_interval_minutes,
        r.priority
      from ctx
      join provider_portal.generic_availability_rules r on r.is_active = true and r.is_available = true
       and (
          (r.target_type = 'provider' and r.target_id = ctx.provider_id)
          or (r.target_type = 'provider_service' and r.target_id = ctx.service_id)
          or (r.target_type = 'service_definition' and r.target_id = ctx.service_definition_id)
          or (r.target_type = 'bookable_resource' and exists (
            select 1 from provider_portal.bookable_resources br
            where br.id = r.target_id and br.provider_service_id = ctx.service_id and br.is_active = true
          ))
       )
       and ((r.specific_date is not null and r.specific_date = ctx.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from ctx.selected_date)::int))
       and r.starts_at is not null and r.ends_at is not null and r.starts_at < r.ends_at
    ), base_windows as (
      select starts_at, ends_at, capacity, slot_interval_minutes from generic_positive
      union all
      select
        oh.opens_at,
        oh.closes_at,
        greatest(ctx.resource_capacity, 1)::int as capacity,
        coalesce(nullif(oh.slot_interval_minutes, 0), ctx.slot_interval_minutes)::int as slot_interval_minutes
      from ctx
      join provider_portal.provider_operating_hours oh
        on oh.service_provider_id = ctx.provider_id
       and oh.day_of_week = extract(isodow from ctx.selected_date)::int
       and oh.is_closed = false
       and oh.opens_at is not null
       and oh.closes_at is not null
       and oh.opens_at < oh.closes_at
      where not exists (select 1 from generic_positive)
    ), generated_slots as (
      select
        ctx.selected_date,
        gs as slot_start,
        gs + make_interval(mins => ctx.duration_minutes) as slot_end,
        bw.capacity,
        ctx.provider_id,
        ctx.service_id,
        ctx.specialist_id,
        ctx.provider_staff_id
      from base_windows bw
      cross join ctx
      cross join lateral generate_series(
        ctx.selected_date + bw.starts_at,
        ctx.selected_date + bw.ends_at - make_interval(mins => ctx.duration_minutes),
        make_interval(mins => greatest(bw.slot_interval_minutes, 1))
      ) gs
    ), grouped_slots as (
      select selected_date, slot_start, slot_end, max(capacity)::int as capacity, provider_id, service_id, specialist_id, provider_staff_id
      from generated_slots
      group by selected_date, slot_start, slot_end, provider_id, service_id, specialist_id, provider_staff_id
    ), generic_blocks as (
      select r.starts_at, r.ends_at
      from ctx
      join provider_portal.generic_availability_rules r on r.is_active = true and r.is_available = false
       and (
          (r.target_type = 'provider' and r.target_id = ctx.provider_id)
          or (r.target_type = 'provider_service' and r.target_id = ctx.service_id)
          or (r.target_type = 'service_definition' and r.target_id = ctx.service_definition_id)
          or (r.target_type = 'staff' and r.target_id = ctx.specialist_id)
          or (r.target_type = 'provider_staff' and r.target_id = ctx.provider_staff_id)
          or (r.target_type = 'bookable_resource' and exists (
            select 1 from provider_portal.bookable_resources br
            where br.id = r.target_id and br.provider_service_id = ctx.service_id and br.is_active = true
          ))
       )
       and ((r.specific_date is not null and r.specific_date = ctx.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from ctx.selected_date)::int))
    ), staff_rule_presence as (
      select exists (
        select 1 from provider_portal.generic_availability_rules r
        cross join ctx
        where ctx.specialist_id is not null
          and r.is_active = true
          and r.is_available = true
          and (
            (r.target_type = 'staff' and r.target_id = ctx.specialist_id)
            or (r.target_type = 'provider_staff' and r.target_id = ctx.provider_staff_id)
          )
          and ((r.specific_date is not null and r.specific_date = ctx.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from ctx.selected_date)::int))
      ) as has_generic_staff_rules
    ), assessed as (
      select
        s.*,
        (
          select coalesce(sum(greatest(coalesce(b.rooms, 1), 1)), 0)::int
          from booking.bookings b
          where b.provider_id = s.provider_id
            and b.service_id = s.service_id
            and b.selected_date = s.selected_date
            and (s.specialist_id is null or b.specialist_id = s.specialist_id)
            and lower(coalesce(b.booking_status, '')) in ('pending', 'confirmed')
            and tsrange(
              b.selected_date + coalesce(b.selected_time_from, b.selected_time, time '00:00'),
              b.selected_date + coalesce(b.selected_time_to, b.selected_time_from, b.selected_time, time '00:00') + interval '1 minute',
              '[)'
            ) && tsrange(s.slot_start, s.slot_end, '[)')
        ) as booked_units,
        not exists (
          select 1 from generic_blocks gb
          where gb.starts_at is null or gb.ends_at is null
             or tsrange(s.selected_date + gb.starts_at, s.selected_date + gb.ends_at, '[)') && tsrange(s.slot_start, s.slot_end, '[)')
        ) as not_blocked,
        (
          s.specialist_id is null
          or (
            (select has_generic_staff_rules from staff_rule_presence) = true and exists (
              select 1 from provider_portal.generic_availability_rules r
              where r.is_active = true
                and r.is_available = true
                and ((r.target_type = 'staff' and r.target_id = s.specialist_id) or (r.target_type = 'provider_staff' and r.target_id = s.provider_staff_id))
                and ((r.specific_date is not null and r.specific_date = s.selected_date) or (r.specific_date is null and r.day_of_week = extract(isodow from s.selected_date)::int))
                and r.starts_at is not null and r.ends_at is not null
                and r.starts_at <= s.slot_start::time and r.ends_at >= s.slot_end::time
            )
          )
          or (
            (select has_generic_staff_rules from staff_rule_presence) = false and exists (
              select 1
              from category.staff_availabilities sa
              left join category.staff_availability_statuses sas on sas.id = sa.availability_status_id
              where sa.staff_id = s.specialist_id
                and ((sa.specific_date is not null and sa.specific_date::date = s.selected_date) or (sa.is_recurring = true and sa.day_of_week = extract(isodow from s.selected_date)::int))
                and sa.start_time <= (s.slot_start::time - time '00:00')
                and sa.end_time >= (s.slot_end::time - time '00:00')
                and coalesce(lower(sas.name), 'available') not in ('unavailable', 'busy', 'blocked', 'inactive', 'disabled')
            )
          )
        ) as staff_available
      from grouped_slots s
    )
    select
      to_char(slot_start, 'HH24:MI') as time,
      to_char(slot_end, 'HH24:MI') as "endTime",
      (not_blocked and staff_available and booked_units < case when specialist_id is not null then 1 else capacity end) as available,
      greatest((case when specialist_id is not null then 1 else capacity end) - booked_units, 0)::int as "remainingCapacity"
    from assessed
    order by slot_start asc
  `;

  return {
    timeSlots: rows.map((row) => ({
      time: row.time,
      endTime: row.endTime,
      label: formatTimeLabel(row.time, locale),
      endLabel: formatTimeLabel(row.endTime, locale),
      available: Boolean(row.available),
      remainingCapacity: Number(row.remainingCapacity ?? 0),
    })),
  };
}

export async function getBookingDateRangeAvailabilityFromDb(input: {
  startDate?: string | null;
  endDate?: string | null;
  providerId?: Id;
  serviceId?: Id;
  requestedUnits?: number | null;
}): Promise<DateRangeAvailability> {
  const startDate = toIsoDate(input.startDate);
  const endDate = toIsoDate(input.endDate);
  const requestedUnits = Math.max(1, Number(input.requestedUnits || 1));

  if (!startDate || !endDate || startDate >= endDate) {
    return { available: false, startDate, endDate, requestedUnits, remainingCapacity: 0, unavailableDates: [], message: "Please select a valid date range." };
  }

  const ctx = await resolveAvailabilityContext({ providerId: input.providerId, serviceId: input.serviceId });
  if (!ctx?.providerId || !ctx.serviceId) {
    return { available: false, startDate, endDate, requestedUnits, remainingCapacity: 0, unavailableDates: [], message: "Provider/service could not be resolved." };
  }

  const [row] = await sql<{ available: boolean; remainingCapacity: number; unavailableDates: string[] }[]>`
    with ctx as (
      select
        ${ctx.providerId}::uuid as provider_id,
        ${ctx.serviceId}::uuid as service_id,
        ${ctx.serviceDefinitionId}::uuid as service_definition_id,
        greatest(${ctx.resourceCapacity}::int, 0) as resource_capacity,
        ${requestedUnits}::int as requested_units
    ), nights as (
      select generate_series(${startDate}::date, ${endDate}::date - interval '1 day', interval '1 day')::date as stay_date
    ), capacity_by_day as (
      select
        n.stay_date,
        coalesce(
          (
            select max(coalesce(r.capacity, nullif(ctx.resource_capacity, 0), 1))::int
            from provider_portal.generic_availability_rules r
            where r.is_available = true
              and (
                (r.target_type = 'provider' and r.target_id = ctx.provider_id)
                or (r.target_type = 'provider_service' and r.target_id = ctx.service_id)
                or (r.target_type = 'service_definition' and r.target_id = ctx.service_definition_id)
                or (r.target_type = 'bookable_resource' and exists (
                  select 1 from provider_portal.bookable_resources br
                  where br.id = r.target_id and br.provider_service_id = ctx.service_id and br.is_active = true
                ))
              )
              and ((r.specific_date is not null and r.specific_date = n.stay_date) or (r.specific_date is null and r.day_of_week = extract(isodow from n.stay_date)::int))
          ),
          nullif(ctx.resource_capacity, 0),
          1
        )::int as capacity,
        exists (
          select 1 from provider_portal.generic_availability_rules r
          where r.is_available = false
            and (
              (r.target_type = 'provider' and r.target_id = ctx.provider_id)
              or (r.target_type = 'provider_service' and r.target_id = ctx.service_id)
              or (r.target_type = 'service_definition' and r.target_id = ctx.service_definition_id)
              or (r.target_type = 'bookable_resource' and exists (
                select 1 from provider_portal.bookable_resources br
                where br.id = r.target_id and br.provider_service_id = ctx.service_id and br.is_active = true
              ))
            )
            and ((r.specific_date is not null and r.specific_date = n.stay_date) or (r.specific_date is null and r.day_of_week = extract(isodow from n.stay_date)::int))
        ) as blocked
      from nights n
      cross join ctx
    ), usage_by_day as (
      select
        n.stay_date,
        coalesce(sum(greatest(coalesce(b.rooms, 1), 1)), 0)::int as booked_units
      from nights n
      cross join ctx
      left join booking.bookings b
        on b.provider_id = ctx.provider_id
       and b.service_id = ctx.service_id
       and lower(coalesce(b.booking_status, '')) in ('pending', 'confirmed')
       and coalesce(nullif(b.metadata ->> 'selectedDateFrom', '')::date, b.selected_date) < ${endDate}::date
       and coalesce(nullif(b.metadata ->> 'selectedDateTo', '')::date, b.selected_date + interval '1 day') > n.stay_date
      group by n.stay_date
    ), assessed as (
      select
        c.stay_date,
        c.capacity,
        u.booked_units,
        c.blocked,
        greatest(c.capacity - u.booked_units, 0)::int as remaining
      from capacity_by_day c
      join usage_by_day u on u.stay_date = c.stay_date
    )
    select
      bool_and(not blocked and remaining >= (select requested_units from ctx)) as available,
      coalesce(min(remaining), 0)::int as "remainingCapacity",
      coalesce(array_agg(stay_date::text order by stay_date) filter (where blocked or remaining < (select requested_units from ctx)), array[]::text[]) as "unavailableDates"
    from assessed
  `;

  const unavailableDates = (row?.unavailableDates || []).map((value) => String(value).slice(0, 10));
  const available = Boolean(row?.available) && unavailableDates.length === 0;

  return {
    available,
    startDate,
    endDate,
    requestedUnits,
    remainingCapacity: Number(row?.remainingCapacity || 0),
    unavailableDates,
    message: available ? undefined : "Selected date range does not have enough available capacity.",
  };
}

export async function assertDraftAvailabilityBeforeCheckout(draftId: string) {
  const rows = await sql<any[]>`
    select 'main' as kind,
           d.id::text as id,
           d.provider_id::text as "providerId",
           d.service_id::text as "serviceId",
           d.specialist_id::text as "specialistId",
           coalesce(sd.booking_ui_mode, d.metadata ->> 'bookingUiMode', 'default_slot') as "bookingUiMode",
           d.selected_date::text as "selectedDate",
           coalesce(d.metadata ->> 'selectedDateFrom', d.selected_date::text) as "selectedDateFrom",
           coalesce(d.metadata ->> 'selectedDateTo', d.selected_date::text) as "selectedDateTo",
           coalesce(d.selected_time_from::text, d.selected_time::text) as "selectedTimeFrom",
           d.selected_time_to::text as "selectedTimeTo",
           greatest(coalesce((d.metadata ->> 'rooms')::int, 1), 1) as rooms
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where d.id = ${draftId}

    union all

    select 'child' as kind,
           c.id::text as id,
           c.provider_id::text as "providerId",
           c.service_id::text as "serviceId",
           c.specialist_id::text as "specialistId",
           coalesce(c.booking_ui_mode, sd.booking_ui_mode, 'default_slot') as "bookingUiMode",
           c.selected_date::text as "selectedDate",
           c.selected_date_from::text as "selectedDateFrom",
           c.selected_date_to::text as "selectedDateTo",
           coalesce(c.selected_time_from::text, c.selected_time::text) as "selectedTimeFrom",
           c.selected_time_to::text as "selectedTimeTo",
           greatest(coalesce(c.rooms, 1), 1) as rooms
    from booking.booking_draft_child_bookings c
    left join category.provider_services ps on ps.id = c.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where c.parent_draft_id = ${draftId}
  `;

  for (const item of rows) {
    if (!item.providerId || !item.serviceId || item.bookingUiMode === "custom_form") continue;

    if (item.bookingUiMode === "date_range") {
      const result = await getBookingDateRangeAvailabilityFromDb({
        providerId: item.providerId,
        serviceId: item.serviceId,
        startDate: item.selectedDateFrom,
        endDate: item.selectedDateTo,
        requestedUnits: item.rooms,
      });
      if (!result.available) {
        throw new Error(`${item.kind === "child" ? "Add-on" : "Booking"} date range is no longer available. Please select another date range.`);
      }
      continue;
    }

    if (!item.selectedDate || !item.selectedTimeFrom || !item.selectedTimeTo) {
      throw new Error(`${item.kind === "child" ? "Add-on" : "Booking"} needs a valid date and time before checkout.`);
    }

    const slots = await getBookingAvailableTimeSlotsFromDb({
      providerId: item.providerId,
      serviceId: item.serviceId,
      specialistId: item.specialistId,
      selectedDate: item.selectedDate,
      locale: "en-US",
    });
    const selected = slots.timeSlots.find((slot) => slot.time === String(item.selectedTimeFrom).slice(0, 5) && slot.endTime === String(item.selectedTimeTo).slice(0, 5));
    if (!selected?.available) {
      throw new Error(`${item.kind === "child" ? "Add-on" : "Booking"} time slot is no longer available. Please select another time.`);
    }
  }
}
