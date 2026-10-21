"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CALENDAR_IDS, type CalendarId } from "../../domain/calendar";

import { CalendarDateField, Field, formatAmount, NativeSelect, Section, useErrorText } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Kpis = {
  range: { from: string; to: string; calendar: string; timezone: string };
  bookings: number; byStatus: Record<string, number>; cancellationRate: number | null;
  conversion: { holds: number; converted: number; rate: number | null }; utilization: { booked: number; offered: number; rate: number | null };
  departures: { total: number; cancelled: number; operated: number; onTimeRate: number | null };
  revenue: { currency: string; booked: number; paid: number; refundQuoted: number }[]; refunds: Record<string, number>; supplierResponseHours: number | null;
};

/** KPIs (M-021) and the CSV export with explicit currency / calendar / timezone (M-022). */
export function ReportsView({ filters, data, error, providers }: { filters: Record<string, string>; data: Kpis | null; error: { kind: string; code: string } | null; providers: { id: string; name: string }[] }) {
  const t = useTranslations("TourAdmin.reports");
  const tc = useTranslations("TourShared.calendar");
  const ts = useTranslations("TourShared.bookingStatus");
  const locale = useLocale();
  const errorText = useErrorText();
  const [calendar, setCalendar] = useState<CalendarId>((CALENDAR_IDS as readonly string[]).includes(filters.calendar) ? (filters.calendar as CalendarId) : locale === "fa" ? "persian" : "gregory");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const pct = (n: number | null) => (n == null ? "—" : `${new Intl.NumberFormat(locale).format(n)}%`);
  const exportQs = data ? new URLSearchParams({ from: data.range.from, to: data.range.to, calendar: data.range.calendar, tz: data.range.timezone, ...(filters.provider ? { provider: filters.provider } : {}) }).toString() : "";
  return (
    <div className="space-y-4">
      <form method="get" className="grid gap-3 rounded-lg border p-4 md:grid-cols-3 xl:grid-cols-6" aria-label={t("filters")}>
        <Field label={tc("label")} htmlFor="rp-cal">
          <NativeSelect id="rp-cal" name="calendar" value={calendar} onChange={(e) => setCalendar(e.target.value as CalendarId)}>
            {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
          </NativeSelect>
        </Field>
        <CalendarDateField id="rp-from" label={t("from")} value={from} onChange={setFrom} calendar={calendar} />
        <input type="hidden" name="from" value={from} />
        <CalendarDateField id="rp-to" label={t("to")} value={to} onChange={setTo} calendar={calendar} />
        <input type="hidden" name="to" value={to} />
        <Field label={t("timezone")} htmlFor="rp-tz"><Input id="rp-tz" name="tz" dir="ltr" defaultValue={filters.tz || "Asia/Tehran"} /></Field>
        <Field label={t("provider")} htmlFor="rp-provider">
          <NativeSelect id="rp-provider" name="provider" defaultValue={filters.provider ?? ""}>
            <option value="">{t("all")}</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </Field>
        <div className="flex items-end"><Button type="submit">{t("apply")}</Button></div>
      </form>
      {error ? <p role="alert" className="text-destructive text-sm">{errorText(error)}</p> : null}
      {data ? (
        <>
          <p className="text-muted-foreground text-xs" dir="ltr">{data.range.from} … {data.range.to} · {data.range.calendar} · {data.range.timezone}</p>
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
            <table className="w-full text-sm">
              <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("currency")}</th><th className="p-1.5 text-start">{t("booked")}</th><th className="p-1.5 text-start">{t("paid")}</th><th className="p-1.5 text-start">{t("refundQuoted")}</th></tr></thead>
              <tbody>
                {data.revenue.map((r) => (
                  <tr key={r.currency} className="border-t"><td className="p-1.5 font-mono">{r.currency}</td><td className="p-1.5">{formatAmount(r.booked, r.currency, locale)}</td><td className="p-1.5">{formatAmount(r.paid, r.currency, locale)}</td><td className="p-1.5">{formatAmount(r.refundQuoted, r.currency, locale)}</td></tr>
                ))}
              </tbody>
            </table>
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
