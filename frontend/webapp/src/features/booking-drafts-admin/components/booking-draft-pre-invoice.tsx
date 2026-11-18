"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { formatClock, formatDateTime, formatDay, formatMoney, formatNumber } from "../lib/format";
import type { BookingDraftPreInvoice, PreInvoiceLine } from "../server/pre-invoice";
import { draftStatusKey, paymentMethodKey } from "./draft-labels";

const BRAND = "#083f30";
const DASH = "—";

function Field({ label, value, ltr }: { label: string; value?: ReactNode; ltr?: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-gray-900" dir={ltr && !empty ? "ltr" : undefined}>
        {empty ? DASH : value}
      </dd>
    </div>
  );
}

function PreInvoiceDocument({ draft }: { draft: BookingDraftPreInvoice }) {
  const locale = useLocale();
  const t = useTranslations("BookingDraftsAdmin");
  const money = (amount: number | null | undefined, currency = draft.currency) => formatMoney(amount, currency, locale) ?? DASH;
  const n = (value: number | null | undefined) => formatNumber(value, locale);

  const statusKey = draftStatusKey(draft.status);
  const statusLabel = statusKey ? t(`status.${statusKey}`) : draft.status;
  const methodKey = paymentMethodKey(draft.paymentMethod);
  const methodLabel = methodKey ? t(`paymentMethods.${methodKey}`) : draft.paymentMethod;
  const reference = draft.id.slice(0, 8).toUpperCase();
  const isStay = draft.bookingUiMode === "date_range";

  const timeRange = draft.selectedTimeFrom && draft.selectedTimeTo
    ? `${formatClock(draft.selectedTimeFrom, locale)} – ${formatClock(draft.selectedTimeTo, locale)}`
    : formatClock(draft.selectedTime ?? draft.selectedTimeFrom, locale);

  const lineDetails = (line: PreInvoiceLine) => {
    const parts: string[] = [];
    if (line.provider) parts.push(line.provider);
    if (line.dateFrom && line.dateTo) parts.push(`${formatDay(line.dateFrom, locale)} → ${formatDay(line.dateTo, locale)}`);
    else if (line.dateFrom) parts.push(formatDay(line.dateFrom, locale) ?? "");
    if (line.time) parts.push(formatClock(line.time, locale) ?? "");
    if (line.nights) parts.push(t("nightsCount", { count: line.nights }));
    const guests = [
      line.adults ? t("adultsCount", { count: line.adults }) : null,
      line.children ? t("childrenCount", { count: line.children }) : null,
      line.infants ? t("infantsCount", { count: line.infants }) : null,
      line.rooms ? t("roomsCount", { count: line.rooms }) : null,
    ].filter(Boolean) as string[];
    if (guests.length) parts.push(guests.join(locale === "fa" || locale === "ar" ? "، " : ", "));
    return parts.filter(Boolean).join(" · ");
  };

  const isFullPayment =
    draft.totalAmount > 0 &&
    draft.dueNowAmount !== null &&
    draft.dueNowAmount >= draft.totalAmount &&
    (draft.remainingAmount ?? 0) <= 0;

  const hasForeignLine =draft.lines.some((line) => line.currency !== draft.currency && line.amount !== null);

  return (
    <article className="pre-invoice overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <header className="flex items-start justify-between gap-4 px-7 py-6 text-white" style={{ backgroundColor: BRAND }}>
        <div>
          <div className="text-xl font-extrabold tracking-[0.35em] text-[#e2c27d]" dir="ltr">L SEVIN</div>
          <div className="mt-1 text-xs text-white/70" dir="ltr">appmain.lsevin.com</div>
        </div>
        <div className="text-end">
          <h1 className="text-lg font-extrabold">{t("preInvoiceTitle")}</h1>
          <div className="mt-1 font-mono text-sm tracking-wider text-white/85" dir="ltr">#{reference}</div>
        </div>
      </header>

      <div
        role="note"
        data-testid="pre-invoice-marker"
        className="border-b border-amber-200 bg-amber-50 px-7 py-3 text-center text-sm font-bold text-amber-900"
      >
        {t("notFinalInvoice")}
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-7 py-4 sm:grid-cols-4">
        <Field label={t("draftReference")} value={reference} ltr />
        <Field label={t("createdAt")} value={formatDateTime(draft.createdAt, locale)} />
        <Field label={t("statusLabel")} value={statusLabel} />
        <Field label={t("currentStep")} value={n(draft.currentStep)} />
      </div>

      <section className="grid gap-6 border-b border-gray-200 px-7 py-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-extrabold" style={{ color: BRAND }}>{t("customer")}</h2>
          <dl className="grid grid-cols-1 gap-y-3">
            <Field label={t("name")} value={draft.customer.name} />
            <Field label={t("phone")} value={draft.customer.phone} ltr />
            <Field label={t("email")} value={draft.customer.email} ltr />
          </dl>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-extrabold" style={{ color: BRAND }}>{t("bookingDetails")}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label={t("provider")} value={draft.providerName} />
            <Field label={t("service")} value={draft.serviceName} />
            <Field label={t("specialist")} value={draft.specialistName} />
            <Field label={t("paymentMethod")} value={methodLabel} />
            {isStay ? (
              <>
                <Field label={t("checkIn")} value={formatDay(draft.selectedDateFrom, locale)} />
                <Field label={t("checkOut")} value={formatDay(draft.selectedDateTo, locale)} />
                <Field label={t("nights")} value={n(draft.nights)} />
              </>
            ) : (
              <>
                <Field label={t("date")} value={formatDay(draft.selectedDate ?? draft.selectedDateFrom, locale)} />
                <Field label={t("time")} value={timeRange} />
              </>
            )}
            <Field label={t("adults")} value={n(draft.adults)} />
            <Field label={t("children")} value={n(draft.children)} />
            <Field label={t("infants")} value={n(draft.infants)} />
            <Field label={t("rooms")} value={n(draft.rooms)} />
            <Field label={t("currency")} value={draft.currency} ltr />
          </dl>
        </div>
      </section>

      <section className="px-7 pt-5">
        <h2 className="mb-3 text-sm font-extrabold" style={{ color: BRAND }}>{t("items")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 text-start font-semibold">{t("item")}</th>
                <th className="w-16 px-3 py-2 text-center font-semibold">{t("quantity")}</th>
                <th className="w-32 px-3 py-2 text-end font-semibold">{t("unitPrice")}</th>
                <th className="w-36 px-3 py-2 text-end font-semibold">{t("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {draft.lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">{t("noItems")}</td>
                </tr>
              ) : (
                draft.lines.map((line) => {
                  const details = lineDetails(line);
                  return (
                    <tr key={line.key} className="border-b border-gray-100 align-top" data-testid={`pre-invoice-line-${line.kind}`}>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-gray-900">
                          {line.name || DASH}
                          <span className="ms-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                            {line.kind === "main" ? t("lineKind.main") : line.category || t(`lineKind.${line.kind}`)}
                          </span>
                        </div>
                        {details ? <div className="mt-0.5 text-xs text-gray-500">{details}</div> : null}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700">{n(line.quantity) ?? DASH}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-end text-gray-700" dir="ltr">
                        {line.unitPrice === null ? t("priceUnavailable") : money(line.unitPrice, line.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-end font-semibold" dir="ltr">
                        {line.amount === null ? t("priceUnavailable") : money(line.amount, line.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {hasForeignLine ? <p className="mt-2 text-[11px] text-gray-500">{t("lineCurrencyNote")}</p> : null}
      </section>

      <section className="flex justify-end px-7 py-5">
        <dl className="w-full space-y-2 text-sm sm:w-1/2">
          <Row label={t("serviceSubtotal")} value={money(draft.subtotalAmount)} />
          <Row label={t("addonsSubtotal")} value={money(draft.addonsAmount)} />
          <Row label={t("subtotal")} value={money(draft.grossAmount)} strong />
          {draft.discount ? (
            <Row
              label={draft.discount.code ? t("discountWithCode", { code: draft.discount.code }) : t("discount")}
              value={`-${money(draft.discount.amount)}`}
              tone="text-green-700"
            />
          ) : (
            <Row label={t("discount")} value={DASH} />
          )}
          {draft.surcharge ? (
            <Row label={t("payInPlaceFee", { percent: draft.surcharge.percent })} value={money(draft.surcharge.amount)} />
          ) : null}
          <Row label={t("total")} value={money(draft.totalAmount)} strong />
          {isFullPayment ? (
            // Nothing is left for later, so this is a full payment, not a deposit with a 0 balance.
            <div className="flex items-center justify-between rounded-xl px-4 py-3 text-white" style={{ backgroundColor: BRAND }} data-testid="pre-invoice-full-payment">
              <dt className="font-bold">{t("fullPaymentDueNow")}</dt>
              <dd className="text-lg font-extrabold" dir="ltr">{money(draft.dueNowAmount)}</dd>
            </div>
          ) : (
            <>
              <Row label={t("dueNow")} value={money(draft.dueNowAmount)} tone="text-green-700" />
              <div className="flex items-center justify-between rounded-xl px-4 py-3 text-white" style={{ backgroundColor: BRAND }}>
                <dt className="font-bold">{t("remaining")}</dt>
                <dd className="text-lg font-extrabold" dir="ltr">{money(draft.remainingAmount)}</dd>
              </div>
            </>
          )}
          <p className="text-[11px] leading-4 text-gray-500" data-testid="pre-invoice-terms-note">{t(`paymentTermsNote.${draft.paymentTermsSource}`)}</p>
          <p className="text-[11px] leading-4 text-gray-500">{t("dueNowEstimate")}</p>
        </dl>
      </section>

      {draft.notes ? (
        <section className="mx-7 mb-5 rounded-2xl bg-gray-50 px-4 py-3">
          <div className="text-xs font-bold text-gray-700">{t("notes")}</div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{draft.notes}</p>
        </section>
      ) : null}

      <footer className="border-t border-gray-200 px-7 py-4 text-center text-[11px] leading-5 text-gray-500">
        <div>{t("footerNote")}</div>
        <div className="mt-1">{t("issuedAt", { date: formatDateTime(new Date().toISOString(), locale) ?? "" })}</div>
        <div className="mt-1 font-mono text-gray-400" dir="ltr">{draft.id}</div>
      </footer>
    </article>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-bold text-gray-900" : "text-gray-600"}>{label}</dt>
      <dd className={`${strong ? "font-extrabold" : "font-semibold"} ${tone ?? ""}`} dir="ltr">{value}</dd>
    </div>
  );
}

// The admin chrome (sidebar, header, floating buttons) must not reach paper, so a copy
// of the document is mounted directly under <body> and print CSS hides everything else.
// Same approach as the customer invoice (n/app/mobile/bookings/[id]/invoice).
const PRINT_CSS = `
.pre-invoice-print-root { display: none; }
@media print {
  @page { size: A4; margin: 10mm; }
  html, body { background: #fff !important; }
  body > *:not(.pre-invoice-print-root) { display: none !important; }
  .pre-invoice-print-root { display: block; }
  .pre-invoice-print-root, .pre-invoice-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pre-invoice-print-root .pre-invoice { border-radius: 0; box-shadow: none; }
}`;

export function BookingDraftPreInvoiceView({ draft }: { draft: BookingDraftPreInvoice }) {
  const t = useTranslations("BookingDraftsAdmin");
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "pre-invoice-print-root";
    document.body.appendChild(el);
    setPrintRoot(el);
    return () => el.remove();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <style>{PRINT_CSS}</style>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/booking-drafts">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("backToDrafts")}
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/booking-drafts/${draft.id}/update`}>{t("openDraft")}</Link>
          </Button>
          <Button type="button" size="sm" onClick={() => window.print()} data-testid="pre-invoice-print">
            <Printer className="size-4" />
            {t("print")}
          </Button>
        </div>
      </div>
      <PreInvoiceDocument draft={draft} />
      {printRoot ? createPortal(<PreInvoiceDocument draft={draft} />, printRoot) : null}
    </div>
  );
}
