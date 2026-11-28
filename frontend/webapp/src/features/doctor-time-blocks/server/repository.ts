import "server-only";

import { randomUUID } from "node:crypto";

import sql from "@/config/database/db";

import { MINUTES_PER_DAY, minutesToTime, subtractRange, timeToMinutes } from "../lib/ranges";
import {
  TIME_BLOCK_SOURCE,
  type BlockGroup,
  type ConflictingBooking,
  type DayBlock,
  type DoctorOption,
  type DoctorServiceOption,
} from "../types";

/**
 * Doctor time blocks are ordinary rows of `provider_portal.generic_availability_rules`:
 * `target_type = 'staff'`, `is_available = false`, one row per date. The booking availability
 * query (booking-availability.repository.ts) already hides any slot such a row overlaps, for
 * the doctor at every clinic, and checkout re-checks the same list. Nothing here touches that
 * query; this file only reads and writes the rows.
 */

const toTime = (value: string | null) => (value ? String(value).slice(0, 5) : null);

export async function searchDoctors(q: string, locale: string): Promise<DoctorOption[]> {
  const text = q.trim();
  const like = `%${text}%`;
  const rows = await sql<{ id: string; name: string | null; title: string | null }[]>`
    select s.id::text as id,
           common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') as name,
           nullif(common.get_translation_t(s.title_translations, ${locale}, 'fa-IR'), '') as title
    from category.staff s
    where s.is_active = true
      and (
        ${text}::text = ''
        or common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') ilike ${like}
        or s.name_translations::text ilike ${like}
        or coalesce(s.specialty, '') ilike ${like}
      )
    order by 2 asc nulls last
    limit 20
  `;
  return rows.map((row) => ({ id: row.id, name: row.name || row.id, title: row.title }));
}

export async function getDoctor(staffId: string, locale: string): Promise<DoctorOption | null> {
  const [row] = await sql<{ id: string; name: string | null; title: string | null }[]>`
    select s.id::text as id,
           common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') as name,
           nullif(common.get_translation_t(s.title_translations, ${locale}, 'fa-IR'), '') as title
    from category.staff s
    where s.id = ${staffId}::uuid
  `;
  return row ? { id: row.id, name: row.name || row.id, title: row.title } : null;
}

/** The clinic/service pairs a patient can book this doctor for (same links listSpecialists uses). */
export async function listDoctorServices(staffId: string, locale: string): Promise<DoctorServiceOption[]> {
  const rows = await sql<DoctorServiceOption[]>`
    select distinct on (ps.id)
      sp.id::text as "providerId",
      coalesce(nullif(common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR'), ''), sp.id::text) as "providerName",
      ps.id::text as "serviceId",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''),
        ps.id::text
      ) as "serviceName",
      coalesce(nullif(ps.duration_minutes, 0), nullif(sd.duration_minutes, 0), 30)::int as "durationMinutes",
      coalesce(nullif(ps.slot_interval_minutes, 0), 15)::int as "slotIntervalMinutes"
    from category.provider_staffs pst
    join category.service_providers sp on sp.id = pst.service_provider_id and sp.is_active = true
    join category.provider_services ps on ps.service_provider_id = pst.service_provider_id and ps.is_active = true
    join category.staff_services ss on ss.service_definition_id = ps.service_definition_id
     and ss.staff_id = pst.staff_id and ss.is_active = true
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where pst.staff_id = ${staffId}::uuid
      and pst.is_active = true
    order by ps.id
  `;
  return [...rows].sort((a, b) => a.providerName.localeCompare(b.providerName) || a.serviceName.localeCompare(b.serviceName));
}

type RuleRow = {
  id: string;
  specific_date: string | null;
  day_of_week: number | null;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Record<string, unknown> | null;
};

const reasonOf = (metadata: Record<string, unknown> | null) =>
  typeof metadata?.reason === "string" && metadata.reason.trim() ? metadata.reason.trim() : null;

/** The doctor's own block rules that apply on `date` (one-off and weekly). */
export async function listDayBlocks(staffId: string, date: string): Promise<DayBlock[]> {
  const rows = await sql<RuleRow[]>`
    select id::text, specific_date::text, day_of_week, starts_at::text, ends_at::text, metadata
    from provider_portal.generic_availability_rules
    where target_type = 'staff'
      and target_id = ${staffId}::uuid
      and is_available = false
      and is_active = true
      and (specific_date = ${date}::date or (specific_date is null and day_of_week = extract(isodow from ${date}::date)::int))
    order by starts_at nulls first
  `;
  return rows.map((row) => ({
    id: row.id,
    startsAt: toTime(row.starts_at),
    endsAt: toTime(row.ends_at),
    recurring: row.specific_date == null,
    reason: reasonOf(row.metadata),
  }));
}

/** Upcoming blocks (today onward, plus weekly ones), rules created together grouped as one row. */
export async function listUpcomingBlockGroups(staffId: string, today: string): Promise<BlockGroup[]> {
  const rows = await sql<RuleRow[]>`
    select id::text, specific_date::text, day_of_week, starts_at::text, ends_at::text, metadata
    from provider_portal.generic_availability_rules
    where target_type = 'staff'
      and target_id = ${staffId}::uuid
      and is_available = false
      and is_active = true
      and (specific_date >= ${today}::date or specific_date is null)
    order by specific_date nulls last, starts_at nulls first
    limit 1000
  `;

  const groups = new Map<string, BlockGroup>();
  for (const row of rows) {
    const groupId = typeof row.metadata?.timeBlockGroupId === "string" ? row.metadata.timeBlockGroupId : null;
    const key = groupId ?? row.id;
    const startsAt = toTime(row.starts_at);
    const endsAt = toTime(row.ends_at);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        key,
        ruleIds: [row.id],
        fromDate: row.specific_date ? row.specific_date.slice(0, 10) : null,
        toDate: row.specific_date ? row.specific_date.slice(0, 10) : null,
        dayOfWeek: row.specific_date ? null : row.day_of_week,
        startsAt,
        endsAt,
        mixedTimes: false,
        days: 1,
        reason: reasonOf(row.metadata),
        createdHere: row.metadata?.source === TIME_BLOCK_SOURCE,
      });
      continue;
    }
    existing.ruleIds.push(row.id);
    const day = row.specific_date ? row.specific_date.slice(0, 10) : null;
    if (day && (!existing.fromDate || day < existing.fromDate)) existing.fromDate = day;
    if (day && (!existing.toDate || day > existing.toDate)) existing.toDate = day;
    if (startsAt !== existing.startsAt || endsAt !== existing.endsAt) existing.mixedTimes = true;
  }
  for (const group of groups.values()) {
    if (group.fromDate && group.toDate) {
      group.days = Math.round((Date.parse(group.toDate) - Date.parse(group.fromDate)) / 86_400_000) + 1;
    }
  }
  return [...groups.values()];
}

/** One block rule per date, all sharing one `timeBlockGroupId`. Whole day = null times. */
export async function createBlocks(input: {
  staffId: string;
  dates: string[];
  startsAt: string | null;
  endsAt: string | null;
  reason: string | null;
  createdBy: string | null;
}): Promise<string> {
  const groupId = randomUUID();
  const metadata = JSON.stringify({
    source: TIME_BLOCK_SOURCE,
    timeBlockGroupId: groupId,
    reason: input.reason || null,
    createdBy: input.createdBy,
  });
  await sql.begin(async (tx) => {
    for (const date of input.dates) {
      await tx`
        insert into provider_portal.generic_availability_rules
          (target_type, target_id, specific_date, starts_at, ends_at, is_available, priority, metadata, is_active)
        values
          ('staff', ${input.staffId}::uuid, ${date}::date, ${input.startsAt}::time, ${input.endsAt}::time, false, 100, ${metadata}::jsonb, true)
      `;
    }
  });
  return groupId;
}

export type UnblockOutcome = {
  /** Rules that were removed or trimmed. */
  changed: number;
  /** A weekly block covers the slot; it can't be lifted for one date from here. */
  recurringBlock: boolean;
};

/**
 * Lifts the doctor's one-off blocks from `[start, end)` on `date`: a rule wholly inside is
 * deleted, a larger one is trimmed or split into the pieces before and after (the pieces keep
 * the rule's metadata, so they still belong to the same group).
 */
export async function unblockRange(input: { staffId: string; date: string; start: string; end: string }): Promise<UnblockOutcome> {
  const cut = { start: timeToMinutes(input.start) ?? 0, end: timeToMinutes(input.end) ?? 0 };
  return sql.begin(async (tx) => {
    const rows = await tx<(RuleRow & { priority: number; timezone_id: string })[]>`
      select id::text, specific_date::text, day_of_week, starts_at::text, ends_at::text, metadata, priority, timezone_id
      from provider_portal.generic_availability_rules
      where target_type = 'staff'
        and target_id = ${input.staffId}::uuid
        and is_available = false
        and is_active = true
        and (specific_date = ${input.date}::date or (specific_date is null and day_of_week = extract(isodow from ${input.date}::date)::int))
      for update
    `;
    let changed = 0;
    let recurringBlock = false;
    for (const row of rows) {
      const block = {
        start: row.starts_at ? (timeToMinutes(row.starts_at) ?? 0) : 0,
        end: row.ends_at ? (timeToMinutes(row.ends_at) ?? MINUTES_PER_DAY) : MINUTES_PER_DAY,
      };
      const overlaps = cut.start < block.end && cut.end > block.start;
      if (!overlaps) continue;
      if (row.specific_date == null) {
        recurringBlock = true;
        continue;
      }
      const pieces = subtractRange(block, cut);
      await tx`delete from provider_portal.generic_availability_rules where id = ${row.id}::uuid`;
      for (const piece of pieces) {
        await tx`
          insert into provider_portal.generic_availability_rules
            (target_type, target_id, specific_date, starts_at, ends_at, is_available, priority, timezone_id, metadata, is_active)
          values
            ('staff', ${input.staffId}::uuid, ${input.date}::date, ${minutesToTime(piece.start)}::time, ${minutesToTime(piece.end)}::time,
             false, ${row.priority}, ${row.timezone_id}, ${JSON.stringify(row.metadata ?? {})}::jsonb, true)
        `;
      }
      changed += 1;
    }
    return { changed, recurringBlock };
  });
}

/** Deletes block rules of this doctor by id (only block rules aimed at this doctor are touched). */
export async function deleteBlockRules(staffId: string, ruleIds: string[]): Promise<number> {
  const rows = await sql<{ id: string }[]>`
    delete from provider_portal.generic_availability_rules
    where id = any(${ruleIds}::uuid[])
      and target_type = 'staff'
      and target_id = ${staffId}::uuid
      and is_available = false
    returning id::text
  `;
  return rows.length;
}

/** Pending/confirmed bookings of the doctor on these dates that overlap the time range (null = whole day). */
export async function findConflictingBookings(input: {
  staffId: string;
  dates: string[];
  startsAt: string | null;
  endsAt: string | null;
}): Promise<ConflictingBooking[]> {
  if (input.dates.length === 0) return [];
  const rows = await sql<{
    id: string;
    date: string;
    time_from: string | null;
    time_to: string | null;
    customer_name: string | null;
    confirmation_code: string | null;
    status: string;
  }[]>`
    select b.id::text,
           b.selected_date::text as date,
           coalesce(b.selected_time_from, b.selected_time)::text as time_from,
           b.selected_time_to::text as time_to,
           nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '') as customer_name,
           b.confirmation_code,
           b.booking_status as status
    from booking.bookings b
    left join identity.asp_net_users u on u.id = b.user_id
    where b.specialist_id = ${input.staffId}::uuid
      and b.selected_date = any(${input.dates}::date[])
      and lower(coalesce(b.booking_status, '')) in ('pending', 'confirmed')
      and (
        ${input.startsAt}::time is null
        or tsrange(
             b.selected_date + coalesce(b.selected_time_from, b.selected_time, time '00:00'),
             b.selected_date + coalesce(b.selected_time_to, b.selected_time_from, b.selected_time, time '00:00') + interval '1 minute',
             '[)'
           ) && tsrange(b.selected_date + ${input.startsAt}::time, b.selected_date + ${input.endsAt}::time, '[)')
      )
    order by b.selected_date, coalesce(b.selected_time_from, b.selected_time)
    limit 200
  `;
  return rows.map((row) => ({
    id: row.id,
    date: row.date.slice(0, 10),
    timeFrom: toTime(row.time_from),
    timeTo: toTime(row.time_to),
    customerName: row.customer_name,
    confirmationCode: row.confirmation_code,
    status: row.status,
  }));
}
