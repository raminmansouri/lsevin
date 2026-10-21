"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams } from "next/navigation";
import { formatCurrencyAmount } from "@/features/finance/lib/money";
import { AlertCircle, ChevronLeft, Loader2, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { QrCode } from "@/components/ui/qr-code";
import { useFetchGetBookingById } from "@/features/service-providers/api/client/fetch-getBookingById";
import type { BookingRecord } from "@/features/service-providers/types";
import { useRouter } from "@/i18n/navigation";
import { invoiceBreakdown } from "@/features/booking-pro/lib/invoice-breakdown";

const BRAND = "#083f30";

function normalizeStatus(value?: string | null) {
  return String(value || "pending").trim().toLowerCase();
}

function resolveIntlLocale(locale?: string | null) {
  const map: Record<string, string> = {
    fa: "fa-IR", en: "en-US", ar: "ar-SA", tr: "tr-TR", de: "de-DE", fr: "fr-FR",
    es: "es-ES", ku: "ku-KU", ru: "ru-RU", tg: "tg-TJ", zh: "zh-CN",
  };
  const normalized = (locale || "fa").trim().toLowerCase();
  return map[normalized] || normalized || "fa-IR";
}

function formatMoney(amount?: number | null, currency?: string | null, locale?: string) {
  return formatCurrencyAmount(Number(amount || 0), (currency || "USD").toUpperCase(), resolveIntlLocale(locale), { maximumFractionDigits: 2 });
}

function formatDate(value: Date | string | null | undefined, locale: string) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), { dateStyle: "long" }).format(date);
}

// Same raw-code -> label mapping the booking details page uses.
const PAYMENT_METHOD_LABEL_KEYS: Record<string, string> = {
  pay_on_delivery: "paymentMethodPayOnDelivery",
  bank_receipt: "paymentMethodBankReceipt",
  wallet: "wallet",
};
const PAYMENT_STATUS_LABEL_KEYS: Record<string, string> = {
  pending: "pending",
  paid: "paid",
  succeeded: "paid",
  captured: "paid",
  completed: "paid",
  partiallypaid: "partial",
  deposit_paid: "depositPaid",
  refunded: "refunded",
  failed: "failed",
  notrequired: "notRequired",
};

type Tone = "green" | "amber" | "red";
const TONE: Record<Tone, string> = {
  green: "border-green-200 bg-green-50 text-green-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE[tone]}`}>
      {children}
    </span>
  );
}

function Field({ label, value, ltr }: { label: string; value?: React.ReactNode; ltr?: boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-gray-900" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

function Receipt({ booking, bookingUrl }: { booking: BookingRecord; bookingUrl: string }) {
  const locale = useLocale();
  const t = useTranslations("Booking");
  const tShop = useTranslations("Shop");
  const breakdown = invoiceBreakdown(booking);
  const currency = booking.currency;

  const tr = (map: Record<string, string>, raw?: string | null) => {
    const key = map[normalizeStatus(raw)];
    return key ? t(key as never) : raw || "";
  };

  const status = normalizeStatus(booking.status);
  const statusPill: { tone: Tone; label: string } = ["confirmed", "completed", "done"].includes(status)
    ? { tone: "green", label: status === "confirmed" ? t("confirmed") : t("completed") }
    : ["cancelled", "canceled", "rejected"].includes(status)
      ? { tone: "red", label: status === "rejected" ? t("rejected") : t("cancelled") }
      : { tone: "amber", label: t("pendingConfirmation") };

  const paymentStatus = normalizeStatus(booking.paymentStatus);
  const isDepositPaid = paymentStatus === "deposit_paid";
  const isPaid = ["paid", "succeeded", "captured", "completed"].includes(paymentStatus);
  const paymentTone: Tone = isPaid || isDepositPaid ? "green" : ["failed", "refunded"].includes(paymentStatus) ? "red" : "amber";

  const receiptNo = booking.confirmationCode || booking.id.slice(0, 8).toUpperCase();
  const lines = [
    { key: "main", name: booking.service, meta: booking.provider, qty: 1, amount: breakdown.main, currency },
    ...(booking.addons || []).map((addon) => ({
      key: `addon-${addon.id}`,
      name: addon.name,
      meta: null as string | null,
      qty: Number(addon.quantity ?? 1),
      amount: Number(addon.unitPrice ?? 0) * Number(addon.quantity ?? 0),
      currency: addon.currency || currency,
    })),
    ...(booking.childBookings || []).map((child) => ({
      key: `child-${child.id}`,
      name: child.service,
      meta: child.provider,
      qty: 1,
      amount: child.subtotal == null ? null : Number(child.subtotal),
      currency: child.currency || currency,
    })),
    // Pay-in-place plan addition: part of the total, so it must be a line too or the
    // lines don't add up to the total (e.g. 960 + 5% = 1,008).
    ...(breakdown.surcharge != null
      ? [{
          key: "pay-in-place",
          name: breakdown.surchargePercent != null
            ? t("receiptPayInPlaceFeePercent", { percent: breakdown.surchargePercent.toLocaleString(resolveIntlLocale(locale)) })
            : t("receiptPayInPlaceFee"),
          meta: null as string | null,
          qty: 1,
          amount: breakdown.surcharge as number | null,
          currency,
        }]
      : []),
  ];

  return (
    <article className="receipt overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 px-7 py-6 text-white" style={{ backgroundColor: BRAND }}>
        <div>
          <div className="text-xl font-extrabold tracking-[0.35em] text-[#e2c27d]" dir="ltr">L SEVIN</div>
          <div className="mt-1 text-xs text-white/70" dir="ltr">appmain.lsevin.com</div>
        </div>
        <div className="text-end">
          <h1 className="text-lg font-extrabold">{t("receiptTitle")}</h1>
          <div className="mt-1 font-mono text-sm tracking-wider text-white/85" dir="ltr">#{receiptNo}</div>
        </div>
      </header>

      {/* Meta strip */}
      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-7 py-4 sm:grid-cols-4">
        <Field label={t("receiptNumber")} value={receiptNo} ltr />
        <Field label={t("issueDate")} value={formatDate(new Date(), locale)} />
        <Field label={t("bookingStatus")} value={<Pill tone={statusPill.tone}>{statusPill.label}</Pill>} />
        <Field label={t("receiptPaymentStatus")} value={<Pill tone={paymentTone}>{tr(PAYMENT_STATUS_LABEL_KEYS, booking.paymentStatus) || t("pending")}</Pill>} />
      </div>

      {/* Details + QR */}
      <section className="grid gap-6 px-7 py-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <h2 className="mb-3 text-sm font-extrabold" style={{ color: BRAND }}>{t("receiptReservationDetails")}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label={t("service")} value={booking.service} />
            <Field label={t("receiptProvider")} value={booking.provider} />
            <Field label={t("date2")} value={booking.date} />
            <Field label={t("receiptTime")} value={booking.time} />
            <Field label={t("duration")} value={booking.duration} />
            <Field label={t("location")} value={booking.fullAddress || booking.location} />
            <Field label={t("yourSpecialist")} value={booking.agent?.name} />
            <Field label={t("bookedOn")} value={formatDate(booking.bookingDate, locale)} />
            <Field label={t("receiptPaymentMethod")} value={tr(PAYMENT_METHOD_LABEL_KEYS, booking.paymentMethod)} />
          </dl>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-4 text-center">
          {bookingUrl ? (
            <QrCode value={bookingUrl} size={132} title={t("receiptScanTitle")} />
          ) : (
            <div className="h-[132px] w-[132px] animate-pulse rounded-lg bg-gray-100" />
          )}
          <div className="mt-2 text-xs font-bold text-gray-900">{t("receiptScanTitle")}</div>
          <div className="mt-1 text-[11px] leading-4 text-gray-500">{t("receiptScanHint")}</div>
        </div>
      </section>

      {/* Line items */}
      <section className="px-7">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2 text-start font-semibold">{t("receiptItem")}</th>
              <th className="w-16 px-3 py-2 text-center font-semibold">{t("receiptQty")}</th>
              <th className="w-36 px-3 py-2 text-end font-semibold">{t("receiptAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-b border-gray-100 align-top">
                <td className="px-3 py-3">
                  <div className="font-semibold text-gray-900">{line.name}</div>
                  {line.meta ? <div className="text-xs text-gray-500">{line.meta}</div> : null}
                </td>
                <td className="px-3 py-3 text-center text-gray-700">{line.qty.toLocaleString(resolveIntlLocale(locale))}</td>
                <td className="whitespace-nowrap px-3 py-3 text-end font-semibold" dir="ltr">
                  {line.amount == null || !Number.isFinite(line.amount) ? tShop("priceUnavailable") : formatMoney(line.amount, line.currency, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="flex justify-end px-7 py-5">
        <div className="w-full space-y-2 text-sm sm:w-1/2">
          {breakdown.discount != null && breakdown.discount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{tShop("discount")}</span>
              <span className="font-semibold" dir="ltr">-{formatMoney(breakdown.discount, currency, locale)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t("totalAmount")}</span>
            <span className="font-semibold" dir="ltr">{formatMoney(booking.price, currency, locale)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t(isDepositPaid ? "paidOnline" : "paidAmount")}</span>
            <span className="font-semibold text-green-700" dir="ltr">{formatMoney(booking.deposit || 0, currency, locale)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-white" style={{ backgroundColor: BRAND }}>
            <span className="font-bold">{t(isDepositPaid ? "payAtPlace" : "remaining")}</span>
            <span className="text-lg font-extrabold" dir="ltr">{formatMoney(booking.remaining || 0, currency, locale)}</span>
          </div>
        </div>
      </section>

      {booking.notes ? (
        <section className="mx-7 mb-5 rounded-2xl bg-gray-50 px-4 py-3">
          <div className="text-xs font-bold text-gray-700">{t("notes")}</div>
          <p className="mt-1 text-sm text-gray-600">{booking.notes}</p>
        </section>
      ) : null}

      <footer className="border-t border-gray-200 px-7 py-4 text-center text-[11px] leading-5 text-gray-500">
        <div>{t("invoiceFooterNote")}</div>
        <div>{t("receiptSupport")}</div>
        <div className="mt-1 font-mono text-gray-400" dir="ltr">{t("bookingID2")} {booking.id}</div>
      </footer>
    </article>
  );
}

const PRINT_CSS = `
.receipt-print-root { display: none; }
@media print {
  @page { size: A4; margin: 10mm; }
  html, body { background: #fff !important; }
  body > *:not(.receipt-print-root) { display: none !important; }
  .receipt-print-root { display: block; }
  .receipt-print-root, .receipt-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .receipt-print-root .receipt { border-radius: 0; box-shadow: none; border-color: #e5e7eb; break-inside: avoid; }
}`;

function InvoiceContent({ booking }: { booking: BookingRecord }) {
  const locale = useLocale();
  const t = useTranslations("Booking");
  const searchParams = useSearchParams();
  const [bookingUrl, setBookingUrl] = useState("");
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    setBookingUrl(`${window.location.origin}/${locale}/n/app/mobile/bookings/${booking.id}`);
  }, [locale, booking.id]);

  // The app shell (header, bottom nav) must not end up on paper, so a copy of the
  // receipt is mounted directly under <body> and print CSS hides everything else.
  useEffect(() => {
    const el = document.createElement("div");
    el.className = "receipt-print-root";
    document.body.appendChild(el);
    setPrintRoot(el);
    return () => el.remove();
  }, []);

  // "Download confirmation" on the booking page lands here with ?print=1.
  useEffect(() => {
    if (autoPrinted.current || !bookingUrl || !printRoot || searchParams?.get("print") !== "1") return;
    autoPrinted.current = true;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [bookingUrl, printRoot, searchParams]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{PRINT_CSS}</style>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={22} className="text-gray-700 rtl:rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          <Printer size={16} />
          {t("downloadInvoicePdf")}
        </button>
      </div>

      <Receipt booking={booking} bookingUrl={bookingUrl} />
      {printRoot ? createPortal(<Receipt booking={booking} bookingUrl={bookingUrl} />, printRoot) : null}
    </div>
  );
}

export default function BookingInvoicePage() {
  const tBooking = useTranslations("Booking");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "").trim();
  const { data, error, isFetching } = useFetchGetBookingById({ id });
  const booking = data?.booking;

  return (
    <div className="min-h-screen bg-gray-50">
      {error ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">{tBooking("bookingCouldNotBeLoaded")}</h3>
          <button
            type="button"
            onClick={() => router.push(`/n/app/mobile/bookings/${id}`)}
            className="rounded-xl px-6 py-3 font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            {tBooking("bookingDetails")}
          </button>
        </div>
      ) : isFetching && !booking ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#083f30]" />
        </div>
      ) : booking ? (
        <InvoiceContent booking={booking} />
      ) : null}
    </div>
  );
}
