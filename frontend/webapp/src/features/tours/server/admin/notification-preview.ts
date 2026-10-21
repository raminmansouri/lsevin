import "server-only";

import { CALENDAR_IDS, type CalendarId } from "../../domain/calendar";
import { contentLocaleFor } from "../../domain/content";
import { renderBookingNotice } from "../platform/notifications";
import type { Actor } from "../platform/roles";
import { getTourSettings } from "../platform/settings";

import { assertAdminActor } from "./guard";

/**
 * Per-language previews of the transactional tour notifications (M-024),
 * rendered by the SAME function that sends them, so what the admin reads is
 * what a traveler receives — including the fallback flag when a language has
 * no template yet (S-072).
 */
export const BOOKING_NOTICE_KINDS = ["created", "requested", "accepted", "declined", "confirmed", "cancelled", "request_expired", "reminder"] as const;

export async function notificationPreviews(actor: Actor, opts: { calendar?: CalendarId; sampleStartsAt?: string; timeZone?: string } = {}) {
  assertAdminActor(actor);
  const settings = await getTourSettings();
  const startsAt = opts.sampleStartsAt ? new Date(opts.sampleStartsAt) : new Date(Date.UTC(2026, 2, 20, 4, 30));
  const tz = opts.timeZone ?? "Asia/Tehran";
  const locales = settings.enabledLocales;
  return {
    locales,
    calendars: CALENDAR_IDS,
    startsAt: startsAt.toISOString(),
    timeZone: tz,
    rows: BOOKING_NOTICE_KINDS.map((kind) => ({
      kind,
      byLocale: locales.map((locale) => {
        const base = locale.split("-")[0];
        const calendar = opts.calendar ?? ((settings.defaultCalendarByLocale[base] ?? settings.defaultCalendarByLocale["*"] ?? "gregory") as CalendarId);
        const r = renderBookingNotice(kind, { locale: contentLocaleFor(base), calendar, timeZone: tz, startsAt, voucher: "TR-SAMPLE42", tourTitle: "Persepolis day tour" });
        return { locale, calendar, ...r };
      }),
    })),
  };
}
