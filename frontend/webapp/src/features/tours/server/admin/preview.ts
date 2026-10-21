import "server-only";

import db from "@/config/database/db";

import { isCalendarId, type CalendarId } from "../../domain/calendar";
import { currencyDecimals, getTourDetail, listDepartures } from "../platform/catalog";
import { fail } from "../platform/errors";
import type { Actor } from "../platform/roles";
import { getTourSettings } from "../platform/settings";

import { assertAdminActor, LOCALE_RE, requireUuid } from "./guard";

/**
 * Customer-view preview before publishing (M-010, AT-27): the same
 * getTourDetail the customer app uses, in `preview` mode (drafts + pending
 * media), in any enabled language, with the chosen calendar and currency.
 * Fallback is labelled per field by the resolver, never hidden.
 */
export async function previewTour(actor: Actor, input: { tourId: string; locale?: string; calendar?: string; currency?: string }) {
  assertAdminActor(actor);
  const tourId = requireUuid(input.tourId, "tour_not_found");
  const settings = await getTourSettings();
  const locale = input.locale && LOCALE_RE.test(input.locale) ? input.locale : settings.defaultLocale;
  const calendar: CalendarId = isCalendarId(input.calendar) ? input.calendar : "gregory";
  const detail = await getTourDetail(tourId, locale, { mode: "preview", revealExactLocation: true });
  if (!detail) throw fail.notFound("tour_not_found");
  const departures = (await listDepartures(tourId)).slice(0, 12);
  const currencies = await db<{ code: string; decimals: number }[]>`select code, decimal_digits as decimals from finance.currencies where is_active order by code`;
  const target = input.currency && currencies.some((c) => c.code === input.currency) ? input.currency : detail.facts.currency;
  let rate: { value: number; asOf: string } | null = null;
  if (target !== detail.facts.currency) {
    const [r] = await db<any[]>`
      select rate, as_of from finance.exchange_rates
       where base_currency_code = ${detail.facts.currency} and quote_currency_code = ${target} and is_latest
         and (expires_at is null or expires_at > now())`;
    if (r) rate = { value: Number(r.rate), asOf: new Date(r.as_of).toISOString() };
  }
  return {
    detail,
    departures,
    locale,
    calendar,
    enabledLocales: settings.enabledLocales,
    currencies: currencies.map((c) => c.code),
    currency: { base: detail.facts.currency, baseDecimals: await currencyDecimals(detail.facts.currency), target, targetDecimals: currencies.find((c) => c.code === target)?.decimals ?? 2, rate },
  };
}

export type TourPreview = Awaited<ReturnType<typeof previewTour>>;
