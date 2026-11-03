"use client";

import Image from "next/image";
import { ArrowLeft, BadgeCheck, Calendar, CheckCircle2, Clock, CreditCard, Download, Loader2, Mail, MapPin, MessageCircle, Navigation, Phone, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { BookingRecord } from "@/features/service-providers/types";
import { ContextConversationPanel } from "@/features/support/components/context-conversation-panel";
import { Link } from "@/i18n/navigation";
import type { AvailablePaymentGateway } from "@/payment/actions/get-enabled-payment-gateways/types";
import {
  AddonsList,
  BOOKING_PAYMENT_STATUS_LABEL_KEYS,
  BookingCaseTimeline,
  buildFileUrl,
  ChildBookingsList,
  DescriptionBlock,
  DetailRow,
  DocumentsList,
  formatMoney,
  getStatusBadge,
  normalizeStatus,
  PAYMENT_METHOD_LABEL_KEYS,
  resolveIntlLocale,
  translateWithFallback,
} from "@/app/[locale]/n/app/mobile/bookings/[id]/page";

import { Reveal } from "../components/motion";

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-[26px] bg-white p-7 ring-1 ring-[#e3dccb] [&_.rounded-2xl]:rounded-[18px] [&_.shadow-sm]:shadow-none">
      {title ? <h3 className="mb-4 text-lg font-black text-[#0e1a16]">{title}</h3> : null}
      {children}
    </div>
  );
}

/** Desktop booking detail (>= 1280px): same props, data and actions as the mobile BookingDetailContent. */
export function DesktopBookingDetailContent({
  booking,
  onCancel,
  onPay,
  isPaying,
  paymentGateway,
}: {
  booking: BookingRecord;
  onCancel: () => void;
  onPay: (gateway: AvailablePaymentGateway) => void;
  isPaying: boolean;
  paymentGateway?: AvailablePaymentGateway | null;
}) {
  const tBooking = useTranslations("Booking");
  const locale = useLocale();
  const image = buildFileUrl(booking.providerImage || booking.image);
  const agentImage = buildFileUrl(booking.agent?.image);
  const statusBadge = getStatusBadge(booking.status, tBooking);
  const StatusIcon = statusBadge.icon;
  const bookingStatus = normalizeStatus(booking.status);
  const paymentStatus = normalizeStatus(booking.paymentStatus);
  const isDepositPaid = paymentStatus === "deposit_paid";
  // Same rules as the mobile view.
  const canCancel = !["cancelled", "canceled", "completed", "done"].includes(bookingStatus);
  const canPay =
    Boolean(paymentGateway) &&
    Number(booking.remaining || 0) > 0 &&
    !["paid", "succeeded", "captured", "completed", "refunded", "deposit_paid"].includes(paymentStatus) &&
    !["cancelled", "canceled", "completed", "done"].includes(bookingStatus);
  const directionsHref = booking.fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.fullAddress)}`
    : undefined;
  const money = (amount?: number | null) => formatMoney(amount, booking.currency, locale);

  return (
    <div className="lsd hidden pb-20 xl:block">
      <div className="lsd-container pt-6">
        {/* Back + status */}
        <div className="flex items-center justify-between gap-6">
          <Link href="/n/app/mobile/bookings" className="group inline-flex items-center gap-2 text-sm font-bold text-[#083f30] hover:text-[#8c6b2c]">
            <ArrowLeft size={16} className="rotate-180 transition-transform group-hover:translate-x-1 ltr:rotate-0" />
            {tBooking("myBookings")}
          </Link>
          <div className={`flex items-center gap-3 rounded-full px-5 py-2 ${statusBadge.color}`}>
            <StatusIcon size={18} />
            <span className="text-sm font-bold">{statusBadge.text}</span>
            {statusBadge.helper ? <span className="text-sm opacity-75">· {statusBadge.helper}</span> : null}
          </div>
        </div>

        {/* The ticket */}
        <Reveal className="mt-6">
          <div className="lsd-ticket-shadow">
            <div className="lsd-ticket grid min-h-[280px] grid-cols-[74fr_26fr] overflow-hidden rounded-[32px] bg-white">
              <div className="flex gap-8 p-8">
                <div className="relative h-[220px] w-[170px] shrink-0 overflow-hidden rounded-b-[22px] rounded-t-full bg-[#0f5a45]">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <Image src="/brand/lsevin-mark-reversed.png" alt="" width={44} height={62} className="opacity-50" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[11px] font-bold tracking-[0.3em] text-[#c9a55a]">{tBooking("bookingDetails")}</span>
                  <h1 className="mt-3 line-clamp-2 text-[32px] font-black leading-snug text-[#0e1a16]">{booking.service}</h1>
                  <p className="mt-2 flex items-center gap-2 text-lg text-[#56675f]">
                    {booking.provider}
                    {booking.verified ? <BadgeCheck size={18} className="text-[#0f5a45]" /> : null}
                  </p>
                  <div className="mt-auto flex items-start justify-between gap-6 pt-6">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-bold text-[#0e1a16]">
                        <MapPin size={17} className="shrink-0 text-[#c9a55a]" />
                        {booking.location}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-[#56675f]">{booking.fullAddress || tBooking("addressWillBeSharedByProvider")}</p>
                    </div>
                    {directionsHref ? (
                      <a href={directionsHref} target="_blank" rel="noreferrer" className="lsd-btn lsd-btn-green h-11 shrink-0 px-5 text-sm">
                        <Navigation size={16} className="text-[#eacb7f]" />
                        {tBooking("openDirections")}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="my-6 flex flex-col justify-between border-s-2 border-dashed border-[#e3dccb] px-7 py-2 text-center">
                <div className="space-y-4">
                  <div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-[#8fa79d]">
                      <Calendar size={13} />
                      {tBooking("date2")}
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#083f30]">{booking.date}</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-[#8fa79d]">
                      <Clock size={13} />
                      {tBooking("time")}
                    </p>
                    <p className="mt-1 text-lg font-black text-[#8c6b2c]">
                      {booking.time}
                      {booking.duration ? <span className="block text-sm font-bold text-[#56675f]">{booking.duration}</span> : null}
                    </p>
                  </div>
                </div>
                {booking.confirmationCode ? (
                  <div>
                    <p className="text-[11px] text-[#8fa79d]">{tBooking("confirmationCode")}</p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-[0.2em] text-[#0e1a16]">{booking.confirmationCode}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Body */}
        <div className="mt-10 grid grid-cols-[1fr_380px] gap-10">
          <div className="min-w-0 space-y-6">
            <Panel>
              <BookingCaseTimeline booking={booking} />
            </Panel>

            {booking.agent ? (
              <Panel title={tBooking("yourSpecialist")}>
                <div className="flex items-center gap-4">
                  <span className="relative h-16 w-16 overflow-hidden rounded-full bg-[#f2f5f3] ring-2 ring-[#eacb7f]/50">
                    {agentImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agentImage} alt={booking.agent.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[#8fa79d]">
                        <UserRound size={26} />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-[#0e1a16]">{booking.agent.name}</p>
                    <p className="text-sm text-[#56675f]">{booking.agent.title}</p>
                    {booking.agent.experience ? (
                      <p className="mt-1 text-xs font-bold text-[#8c6b2c]">
                        {booking.agent.experience}
                        {tBooking("experience2")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Panel>
            ) : null}

            {booking.included?.length ? (
              <Panel title={tBooking("packageIncludes")}>
                <ul className="grid grid-cols-2 gap-3">
                  {booking.included.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="flex items-start gap-2.5 text-[15px] text-[#3d4b45]">
                      <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                      {item.title || item.name}
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            <AddonsList addons={booking.addons} currency={booking.currency} />
            <ChildBookingsList items={booking.childBookings} />
            <DocumentsList documents={booking.documents} />
            <DescriptionBlock title={tBooking("serviceDescription")} content={booking.serviceDescription} />
            <DescriptionBlock title={tBooking("providerDescription")} content={booking.providerDescription} />

            <Panel title={tBooking("bookingInformation")}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <DetailRow label={tBooking("bookingID")} value={booking.id} />
                <DetailRow label={tBooking("confirmationCode")} value={booking.confirmationCode} />
                <DetailRow label={tBooking("bookedOn")} value={booking.bookingDate} />
                <DetailRow label={tBooking("status")} value={booking.status} />
              </div>
            </Panel>

            <ContextConversationPanel contextType="booking" bookingId={booking.id} locale={locale} />
          </div>

          {/* Sticky invoice + actions */}
          <aside>
            <div className="sticky top-28 space-y-5">
              <div className="overflow-hidden rounded-[30px] bg-[#062a20] text-white shadow-[0_40px_80px_-40px_rgba(6,42,32,0.85)]">
                <div className="relative p-7">
                  <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={120} height={170} className="pointer-events-none absolute -bottom-8 -end-6 opacity-10" />
                  <p className="relative flex items-center gap-2 text-sm font-bold text-[#eacb7f]">
                    <CreditCard size={17} />
                    {tBooking("paymentSummary")}
                  </p>
                  <div className="relative mt-5 space-y-3 text-sm">
                    {booking.payInPlaceSurcharge != null && booking.payInPlaceSurcharge > 0 ? (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-white/65">
                          {booking.payInPlaceSurchargePercent != null
                            ? tBooking("receiptPayInPlaceFeePercent", {
                                percent: booking.payInPlaceSurchargePercent.toLocaleString(resolveIntlLocale(locale)),
                              })
                            : tBooking("receiptPayInPlaceFee")}
                        </span>
                        <span className="font-bold">{money(booking.payInPlaceSurcharge)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/65">{tBooking("totalAmount")}</span>
                      <span className="font-bold">{money(booking.price)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/65">{tBooking(isDepositPaid ? "paidOnline" : "paidAmount")}</span>
                      <span className="font-bold text-[#9fd6bf]">−{money(booking.deposit || 0)}</span>
                    </div>
                    <div className="border-t border-dashed border-white/15 pt-4">
                      <p className="text-white/65">{tBooking(isDepositPaid ? "payAtPlace" : "remaining")}</p>
                      <p className="mt-1 text-[28px] font-black text-[#eacb7f] [overflow-wrap:anywhere]">{money(booking.remaining || 0)}</p>
                    </div>
                  </div>
                  <p className="relative mt-4 rounded-2xl bg-white/5 px-4 py-3 text-xs leading-6 text-white/70">
                    <b className="text-white">{tBooking("paymentStatus")}</b>{" "}
                    {translateWithFallback(tBooking, BOOKING_PAYMENT_STATUS_LABEL_KEYS, booking.paymentStatus) || tBooking("pending")}
                    {booking.paymentMethod ? ` · ${translateWithFallback(tBooking, PAYMENT_METHOD_LABEL_KEYS, booking.paymentMethod)}` : ""}
                    {isDepositPaid ? (
                      <span className="mt-1 block">
                        {tBooking("depositPaidHint", { paid: money(booking.deposit || 0), due: money(booking.remaining || 0) })}
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="space-y-3 border-t border-white/10 p-7">
                  {canPay ? (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={() => paymentGateway && onPay(paymentGateway)}
                      className="lsd-btn lsd-btn-gold h-14 w-full disabled:opacity-70"
                    >
                      {isPaying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                      {paymentGateway ? tBooking("payWithGateway", { gateway: paymentGateway.displayName }) : tBooking("paymentUnavailable")}
                    </button>
                  ) : null}
                  <Link
                    href={`/n/app/mobile/bookings/${booking.id}/invoice?print=1`}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-bold transition hover:bg-white/20"
                  >
                    <Download size={17} />
                    {tBooking("downloadConfirmation")}
                  </Link>
                  <Link
                    href="/n/app/mobile/support"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-sm font-bold text-white/85 transition hover:bg-white/10"
                  >
                    <MessageCircle size={17} />
                    {tBooking("contactSupport")}
                  </Link>
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="h-11 w-full rounded-full text-sm font-bold text-[#f0a3a3] transition hover:bg-[#a33a3a]/20"
                    >
                      {tBooking("cancelBooking")}
                    </button>
                  ) : null}
                </div>
              </div>

              {booking.contact?.phone || booking.contact?.email ? (
                <div className="rounded-[24px] bg-white p-6 ring-1 ring-[#e3dccb]">
                  <p className="mb-3 text-sm font-black text-[#0e1a16]">{tBooking("contactProvider")}</p>
                  <div className="space-y-2.5 text-sm">
                    {booking.contact?.phone ? (
                      <a href={`tel:${booking.contact.phone}`} className="flex items-center gap-3 text-[#3d4b45] transition hover:text-[#8c6b2c]">
                        <Phone size={16} className="text-[#c9a55a]" />
                        <span dir="ltr">{booking.contact.phone}</span>
                      </a>
                    ) : null}
                    {booking.contact?.email ? (
                      <a href={`mailto:${booking.contact.email}`} className="flex items-center gap-3 text-[#3d4b45] transition hover:text-[#8c6b2c]">
                        <Mail size={16} className="text-[#c9a55a]" />
                        <span className="truncate">{booking.contact.email}</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}