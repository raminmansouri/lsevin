"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { isCalendarId, isIsoDate, isoToParts, parseCalendarInput, type CalendarId } from "../../domain/calendar";

import { currencyLabel, OptionSelect, pickLabel, TimezoneSelect, useAdminDates } from "./inputs";
import { CalendarDateField, Field, formatAmount, Section, useErrorText } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Kpis = {
  range: { from: string; to: string; calendar: string; timezone: string };
  bookings: number; byStatus: Record<string, number>; cancellationRate: number | null;
  conversion: { holds: number; converted: number; rate: number | null }; utilization: { booked: number; offered: number; rate: number | null };
  departures: { total: number; cancelled: number; operated: number; onTimeRate: number | null };
  revenue: { currency: string; booked: number; paid: number; refundQuoted: number }[]; refunds: Record<string, number>; supplierResponseHours: number | null;
};

/** The calendar of the CSV's calendar-date column. Admins work in Jalali. */
const EXPORT_CALENDAR: CalendarId = "persian";

/** ISO date written in `calendar` ("1405-08-06"), because the export parses from/to in the calendar it is given. */
function inCalendar(iso: string, calendar: CalendarId): string {
  if (calendar === "gregory") return iso;
  const p = isoToParts(iso, calendar);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** A date filter from the URL as ISO; older links may carry `calendar=persian` with a Jalali date. */
function isoFromFilter(raw: string | undefined, calendar: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (isCalendarId(calendar) && calendar !== "gregory") return parseCalendarInput(v, calendar) ?? "";
  return isIsoDate(v) ? v : "";
}

/**
 * KPIs (M-021) and the CSV export with explicit currency / calendar / timezone (M-022).
 * Range dates are picked on a Jalali calendar and submitted as ISO (no calendar param,
 * read as Gregorian); the export link asks for the Jalali date column.
 */
export function ReportsView({ filters, data, error, providers }: {
  filters: Record<string, string>; data: Kpis | null; error: { kind: string; code: string } | null; providers: { id: string; name: string; names?: Record<string, string> | null }[];
}) {
  const t = useTranslations("TourAdmin.reports");
  const ts = useTranslations("TourShared.bookingStatus");
  const locale = useLocale();
  const dates = useAdminDates();
  const errorText = useErrorText();
  const [from, setFrom] = useState(data?.range.from ?? isoFromFilter(filters.from, filters.calendar));
  const [to, setTo] = useState(data?.range.to ?? isoFromFilter(filters.to, filters.calendar));
  const [tz, setTz] = useState(filters.tz || data?.range.timezone || "Asia/Tehran");
  const [provider, setProvider] = useState(filters.provider ?? "");
  const providerOptions = providers.map((p) => ({ value: p.id, label: pickLabel(p.names, locale, p.name) }));
  const pct = (n: number | null) => (n == null ? "—" : `${new Intl.NumberFormat(locale).format(n)}%`);
  const exportQs = data ? new URLSearchParams({
    from: inCalendar(data.range.from, EXPORT_CALENDAR), to: inCalendar(data.range.to, EXPORT_CALENDAR), calendar: EXPORT_CALENDAR, tz: data.range.timezone,
    ...(filters.provider ? { provider: filters.provider } : {}),
  }).toString() : "";
  return (
    <div className="space-y-4">
      <form method="get" className="grid gap-3 rounded-lg border p-4 md:grid-cols-3 xl:grid-cols-5" aria-label={t("filters")}>
        <CalendarDateField id="rp-from" label={t("from")} value={from} onChange={setFrom} />
        {from ? <input type="hidden" name="from" value={from} /> : null}
        <CalendarDateField id="rp-to" label={t("to")} value={to} onChange={setTo} />
        {to ? <input type="hidden" name="to" value={to} /> : null}
        <Field label={t("timezone")} htmlFor="rp-tz">
          <TimezoneSelect id="rp-tz" value={tz} onChange={setTz} />
          <input type="hidden" name="tz" value={tz} />
        </Field>
        <Field label={t("provider")} htmlFor="rp-provider">
          <OptionSelect id="rp-provider" value={provider} onChange={setProvider} options={providerOptions} placeholder={t("all")} />
          {provider ? <input type="hidden" name="provider" value={provider} /> : null}
        </Field>
        <div className="flex items-end"><Button type="submit">{t("apply")}</Button></div>
      </form>
      {error ? <p role="alert" className="text-destructive text-sm">{errorText(error)}</p> : null}
      {data ? (
        <>
          <p className="text-muted-foreground text-xs">{dates.date(data.range.from)} … {dates.date(data.range.to)} · <span dir="ltr">{data.range.timezone}</span></p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="kpis">
            {[
              [t("bookings"), String(data.bookings)],
              [t("conversion"), `${pct(data.conversion.rate)} (${data.conversion.converted}/${data.conversion.holds})`],
              [t("utilization"), `${pct(data.utilization.rate)} (${data.utilization.booked}/${data.utilization.offered})`],
              [t("cancellationRate"), pct(data.cancellationRate)],
              [t("onTime"), `${pct(data.departures.onTimeRate)} (${data.departures.operated})`],
              [t("departuresCancelled"), `${data.departures.cancelled}/${data.departures.total}`],
              [t("supplierResponse"), data.supplierResponseHours == null ? "—" : t("hours", { n: data.supplierResponseHours })],
              [t("refundRequests"), Object.entries(data.refunds).map(([k, v]) => `${k}: ${v}`).join(", ") || "0"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3"><p className="text-muted-foreground text-xs">{k}</p><p className="text-lg font-semibold tabular-nums">{v}</p></div>
            ))}
          </div>
          <Section id="revenue" title={t("revenue")} description={t("revenueHint")}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("currency")}</th><th className="p-1.5 text-start">{t("booked")}</th><th className="p-1.5 text-start">{t("paid")}</th><th className="p-1.5 text-start">{t("refundQuoted")}</th></tr></thead>
              <tbody>
                {data.revenue.map((r) => (
                  <tr key={r.currency} className="border-t" data-currency={r.currency}><td className="p-1.5">{currencyLabel(r.currency, locale)}</td><td className="p-1.5">{formatAmount(r.booked, r.currency, locale)}</td><td className="p-1.5">{formatAmount(r.paid, r.currency, locale)}</td><td className="p-1.5">{formatAmount(r.refundQuoted, r.currency, locale)}</td></tr>
                ))}
              </tbody>
            </table>
            </div>
          </Section>
          <Section id="by-status" title={t("byStatus")}>
            <ul className="flex flex-wrap gap-3 text-sm">{Object.entries(data.byStatus).map(([k, v]) => <li key={k}>{ts.has(k) ? ts(k) : k}: {v}</li>)}</ul>
          </Section>
          <a href={`/${locale}${TOURS_PLATFORM_BASE}/reports/export?${exportQs}`} className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium" data-testid="export-csv" download>
            {t("export")}
          </a>
          <p className="text-muted-foreground text-xs">{t("exportHint")}</p>
        </>
      ) : null}
    </div>
  );
}
