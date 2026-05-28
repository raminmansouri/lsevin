import "server-only";

import sql from "@/config/database/db";
import type { BookingCalendar } from "@/features/booking-pro/lib/calendar";

export type BookingCalendarSettings = {
  id?: string;
  scopeType: "global" | "provider_type" | "provider" | "service_definition" | "provider_service";
  scopeId: string | null;
  defaultCalendar: BookingCalendar;
  enabledCalendars: BookingCalendar[];
  timezoneId: string;
  weekStartsOn: number;
  isActive: boolean;
};

function normalizeScopeId(value?: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed.length ? trimmed : null;
}

export async function listBookingCalendarSettings() {
  return sql<BookingCalendarSettings[]>`
    select
      id::text,
      scope_type as "scopeType",
      scope_id as "scopeId",
      default_calendar as "defaultCalendar",
      enabled_calendars as "enabledCalendars",
      timezone_id as "timezoneId",
      week_starts_on::int as "weekStartsOn",
      is_active as "isActive"
    from booking.booking_calendar_settings
    order by
      case scope_type
        when 'global' then 0
        when 'provider_type' then 1
        when 'provider' then 2
        when 'service_definition' then 3
        when 'provider_service' then 4
        else 9
      end,
      created_at desc
  `;
}

export async function getEffectiveBookingCalendarSettings(input?: {
  providerTypeId?: string | null;
  providerId?: string | null;
  serviceDefinitionId?: string | null;
  providerServiceId?: string | null;
}) {
  const candidates: Array<[BookingCalendarSettings["scopeType"], string | null]> = [
    ["provider_service", normalizeScopeId(input?.providerServiceId)],
    ["service_definition", normalizeScopeId(input?.serviceDefinitionId)],
    ["provider", normalizeScopeId(input?.providerId)],
    ["provider_type", normalizeScopeId(input?.providerTypeId)],
    ["global", null],
  ];

  for (const [scopeType, scopeId] of candidates) {
    const normalizedScopeId = normalizeScopeId(scopeId);
    const [settings] = await sql<BookingCalendarSettings[]>`
      select
        id::text,
        scope_type as "scopeType",
        scope_id as "scopeId",
        default_calendar as "defaultCalendar",
        enabled_calendars as "enabledCalendars",
        timezone_id as "timezoneId",
        week_starts_on::int as "weekStartsOn",
        is_active as "isActive"
      from booking.booking_calendar_settings
      where is_active = true
        and scope_type = ${scopeType}
        and (
          (${normalizedScopeId}::text is null and scope_id is null)
          or scope_id::text = ${normalizedScopeId}::text
        )
      limit 1
    `;

    if (settings) return settings;
  }

  return {
    scopeType: "global" as const,
    scopeId: null,
    defaultCalendar: "gregorian" as const,
    enabledCalendars: ["gregorian", "jalali"] as BookingCalendar[],
    timezoneId: "UTC",
    weekStartsOn: 6,
    isActive: true,
  };
}

export async function saveBookingCalendarSettings(input: Omit<BookingCalendarSettings, "id">) {
  const scopeId = normalizeScopeId(input.scopeId);
  const enabledCalendars = input.enabledCalendars?.length ? input.enabledCalendars : ["gregorian", "jalali"];

  const [settings] = await sql<BookingCalendarSettings[]>`
    insert into booking.booking_calendar_settings (
      scope_type,
      scope_id,
      default_calendar,
      enabled_calendars,
      timezone_id,
      week_starts_on,
      is_active
    ) values (
      ${input.scopeType},
      ${scopeId},
      ${input.defaultCalendar},
      ${enabledCalendars},
      ${input.timezoneId || "UTC"},
      ${input.weekStartsOn ?? 6},
      ${input.isActive ?? true}
    )
    on conflict (scope_type, (coalesce(scope_id, ''))) do update set
      default_calendar = excluded.default_calendar,
      enabled_calendars = excluded.enabled_calendars,
      timezone_id = excluded.timezone_id,
      week_starts_on = excluded.week_starts_on,
      is_active = excluded.is_active,
      updated_at = now()
    returning
      id::text,
      scope_type as "scopeType",
      scope_id as "scopeId",
      default_calendar as "defaultCalendar",
      enabled_calendars as "enabledCalendars",
      timezone_id as "timezoneId",
      week_starts_on::int as "weekStartsOn",
      is_active as "isActive"
  `;

  return settings;
}
