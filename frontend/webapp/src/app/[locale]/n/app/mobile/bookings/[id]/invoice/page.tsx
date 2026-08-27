"use client";
import { useParams } from "next/navigation";
import { AlertCircle, ChevronLeft, Loader2, Printer } from "lucide-react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { useFetchGetBookingById } from "@/features/service-providers/api/client/fetch-getBookingById";
import type { BookingRecord } from "@/features/service-providers/types";
import { useRouter } from "@/i18n/navigation";

function normalizeStatus(value?: string | null) {
  return String(value || "pending").trim().toLowerCase();
}

function formatMoney(amount?: number | null, currency?: string | null) {
  const code = String(currency || "USD").trim().toUpperCase();
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${code}`;
  }
}

function LineItem({ name, meta, amount, currency }: { name: string; meta?: string | null; amount: number; currency?: string | null }) {
  return (
    <tr className="border-b border-dashed border-gray-200 last:border-0">
      <td className="py-2 pr-3 align-top">
        <div className="font-semibold text-gray-900">{name}</div>
        {meta ? <div className="text-xs text-gray-500">{meta}</div> : null}
      </td>
      <td className="whitespace-nowrap py-2 text-left align-top font-semibold text-gray-900" dir="ltr">
        {formatMoney(amount, currency)}
      </td>
    </tr>
  );
}

function InvoiceContent({ booking }: { booking: BookingRecord }) {
  const tBooking = useTranslations("Booking");
  const imageSrc = resolveHomeMediaUrl(booking.providerImage || booking.image);
  const normalizedPaymentStatus = normalizeStatus(booking.paymentStatus);
  const isPaid = ["paid", "succeeded", "captured", "completed"].includes(normalizedPaymentStatus);
  const currency = booking.currency;

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 print:max-w-full print:px-0 print:py-0">
      <div className="flex items-center justify-between print:hidden">
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
          className="flex h-10 items-center gap-2 rounded-xl bg-[#083f30] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a5a44]"
        >
          <Printer size={16} />
          {tBooking("downloadInvoicePdf")}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm print:mt-0 print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b-2 border-[#083f30] bg-[#083f30]/5 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-[#083f30]">LSevin</div>
              <div className="text-xs text-gray-500">{tBooking("invoiceTitle")}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{tBooking("printDate")}</div>
              <div className="text-sm font-semibold text-gray-800">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date())}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#083f30]/20 bg-white px-4 py-3">
            <div className="text-xs text-gray-500">{tBooking("trackingNumber")}</div>
            <div className="mt-0.5 font-mono text-xl font-extrabold tracking-wider text-[#083f30]" dir="ltr">
              {booking.confirmationCode || booking.id}
            </div>
          </div>
        </div>

        <div className={`px-6 py-3 text-sm font-semibold ${isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {tBooking("paymentStatus")}
          {booking.paymentStatus || tBooking("pending")}
          {booking.paymentMethod ? ` • ${booking.paymentMethod}` : ""}
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">{tBooking("provider2")}</div>
              <div className="font-semibold text-gray-900">{booking.provider}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{tBooking("date2")}</div>
              <div className="font-semibold text-gray-900">
                {booking.date}
                {booking.time ? ` • ${booking.time}` : ""}
              </div>
            </div>
            {booking.location ? (
              <div>
                <div className="text-xs text-gray-500">{tBooking("location")}</div>
                <div className="font-semibold text-gray-900">{booking.location}</div>
              </div>
            ) : null}
            {booking.agent?.name ? (
              <div>
                <div className="text-xs text-gray-500">{tBooking("yourSpecialist")}</div>
                <div className="font-semibold text-gray-900">{booking.agent.name}</div>
              </div>
            ) : null}
          </div>

          {imageSrc ? (
            <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gray-100 print:hidden">
              <ImageWithFallback fill src={imageSrc} alt={booking.service} className="object-cover" sizes="100vw" />
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-bold text-gray-900">{tBooking("bookingSummary")}</h3>
            <table className="w-full text-sm">
              <tbody>
                <LineItem name={booking.service} meta={booking.provider} amount={Number(booking.price || 0)} currency={currency} />
                {(booking.addons || []).map((addon) => (
                  <LineItem
                    key={addon.id}
                    name={addon.name}
                    meta={`${tBooking("quantity")}${addon.quantity}`}
                    amount={Number(addon.unitPrice || 0) * Number(addon.quantity || 1)}
                    currency={addon.currency || currency}
                  />
                ))}
                {(booking.childBookings || []).map((child) => (
                  <LineItem key={child.id} name={child.service} meta={child.provider} amount={0} currency={currency} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{tBooking("totalAmount")}</span>
                <span className="font-semibold text-gray-900" dir="ltr">{formatMoney(booking.price, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{tBooking("paidAmount")}</span>
                <span className="font-semibold text-green-700" dir="ltr">-{formatMoney(booking.deposit || 0, currency)}</span>
              </div>
              <div className="my-2 h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">{tBooking("remaining")}</span>
                <span className="text-xl font-extrabold text-[#083f30]" dir="ltr">{formatMoney(booking.remaining || 0, currency)}</span>
              </div>
            </div>
          </div>

          {booking.notes ? (
            <div>
              <h3 className="mb-1 text-sm font-bold text-gray-900">{tBooking("notes")}</h3>
              <p className="text-sm text-gray-600">{booking.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-500">
          {tBooking("bookingID2")}
          {booking.id}
          <br />
          {tBooking("invoiceFooterNote")}
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {error ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">{tBooking("bookingCouldNotBeLoaded")}</h3>
          <button
            type="button"
            onClick={() => router.push(`/n/app/mobile/bookings/${id}`)}
            className="rounded-xl bg-[#083f30] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0a5a44]"
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
