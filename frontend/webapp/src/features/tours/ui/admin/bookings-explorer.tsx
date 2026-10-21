"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import { CALENDAR_IDS, formatIsoDate, type CalendarId } from "../../domain/calendar";

import { CalendarDateField, EmptyState, Field, formatAmount, NativeSelect, StatusBadge, useErrorText } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Row = {
  bookingId: string; voucher: string; status: string; seats: number; currency: string; total: number; paid: number; commissionPercent: number | null;
  createdAt: string | null; tourId: string; slug: string; departureId: string; localDate: string | null; localTime: string | null; timezone: string;
  paymentStatus: string; refundState: string | null; payoutState: string | null; providerName: string; openDisputes: number;
  buyer: { name: string; email: string | null; phone: string | null };
};

/** Booking, payment, refund and payout state shown independently (M-016); contact data masked (M-020). */
export function BookingsExplorer({ filters, result, error, providers }: {
  filters: Record<string, string>; result: { rows: Row[]; total: number; page: number } | null; error: { kind: string; code: string } | null; providers: { id: string; name: string }[];
}) {
  const t = useTranslations("TourAdmin.bookings");
  const ts = useTranslations("TourShared");
  const tc = useTranslations("TourShared.calendar");
  const locale = useLocale();
  const errorText = useErrorText();
  const [calendar, setCalendar] = useState<CalendarId>((CALENDAR_IDS as readonly string[]).includes(filters.calendar) ? (filters.calendar as CalendarId) : locale === "fa" ? "persian" : "gregory");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  return (
    <div className="space-y-4">
      <form method="get" className="grid gap-3 rounded-lg border p-4 md:grid-cols-4" aria-label={t("filters")}>
        {filters.departure ? <input type="hidden" name="departure" value={filters.departure} /> : null}
        <Field label={t("search")} htmlFor="b-q"><Input id="b-q" name="q" dir="ltr" defaultValue={filters.q ?? ""} /></Field>
        <Field label={t("status")} htmlFor="b-status">
          <NativeSelect id="b-status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">{t("all")}</option>
            {["pending_payment", "requested", "confirmed", "completed", "cancelled", "declined", "expired", "no_show"].map((s) => <option key={s} value={s}>{ts(`bookingStatus.${s}`)}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("paymentStatus")} htmlFor="b-pay">
          <NativeSelect id="b-pay" name="payment" defaultValue={filters.payment ?? ""}>
            <option value="">{t("all")}</option>
            {["Pending", "Paid", "PartiallyPaid", "NotRequired", "Refunded", "Cancelled", "Failed"].map((s) => <option key={s} value={s}>{s}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("provider")} htmlFor="b-provider">
          <NativeSelect id="b-provider" name="provider" defaultValue={filters.provider ?? ""}>
            <option value="">{t("all")}</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label={tc("label")} htmlFor="b-cal">
          <NativeSelect id="b-cal" name="calendar" value={calendar} onChange={(e) => setCalendar(e.target.value as CalendarId)}>
            {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
          </NativeSelect>
        </Field>
        <CalendarDateField id="b-from" label={t("departureFrom")} value={from} onChange={setFrom} calendar={calendar} />
        <input type="hidden" name="from" value={from} />
        <CalendarDateField id="b-to" label={t("departureTo")} value={to} onChange={setTo} calendar={calendar} />
        <input type="hidden" name="to" value={to} />
        <div className="flex items-end"><Button type="submit">{t("apply")}</Button></div>
      </form>
      {error ? <p role="alert" className="text-destructive text-sm">{errorText(error)}</p> : null}
      {result && result.rows.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : null}
      {result && result.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="bookings-table">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-start">{t("voucher")}</th><th className="p-2 text-start">{t("tour")}</th><th className="p-2 text-start">{t("departure")}</th>
                <th className="p-2 text-start">{t("buyer")}</th><th className="p-2 text-start">{t("bookingState")}</th><th className="p-2 text-start">{t("paymentState")}</th>
                <th className="p-2 text-start">{t("refundState")}</th><th className="p-2 text-start">{t("payoutState")}</th><th className="p-2 text-start">{t("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.bookingId} className="border-t align-top" data-booking-id={r.bookingId}>
                  <td className="p-2"><Link href={`${TOURS_PLATFORM_BASE}/bookings/${r.bookingId}`} className="font-mono hover:underline" dir="ltr">{r.voucher}</Link>
                    {r.openDisputes ? <div className="text-xs text-amber-700">{t("openDisputes", { n: r.openDisputes })}</div> : null}</td>
                  <td className="p-2"><span dir="ltr" className="font-mono text-xs">{r.slug}</span><div className="text-muted-foreground text-xs">{r.providerName}</div></td>
                  <td className="p-2 text-xs">{r.localDate ? formatIsoDate(r.localDate, { locale, calendar }) : "—"} <span dir="ltr">{r.localTime}</span><div className="text-muted-foreground">{r.timezone}</div></td>
                  <td className="p-2 text-xs">{r.buyer.name}<div className="text-muted-foreground" dir="ltr">{r.buyer.phone ?? r.buyer.email ?? ""}</div></td>
                  <td className="p-2"><StatusBadge status={r.status} label={ts(`bookingStatus.${r.status}`)} /></td>
                  <td className="p-2 text-xs">{r.paymentStatus}</td>
                  <td className="p-2 text-xs">{r.refundState ?? "—"}</td>
                  <td className="p-2 text-xs" dir="ltr">{r.payoutState ?? "—"}</td>
                  <td className="p-2 text-xs tabular-nums">{formatAmount(r.total, r.currency, locale)}<div className="text-muted-foreground">{t("paid")}: {formatAmount(r.paid, r.currency, locale)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
