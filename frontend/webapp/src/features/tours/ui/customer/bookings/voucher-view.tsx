"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Clock, LifeBuoy, MapPin, Navigation, Phone, WifiOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

import { directionOf } from "../../../domain/content";
import type { RefundQuote } from "../../../domain/cancellation";
import type { ChecklistItem, ShareLink } from "../../../server/actions/customer/state";
import type { LiveView, NoticeView, WeatherView } from "../../../server/ops/contract";
import type { MyTourBooking } from "../../../server/platform/booking";
import type { TourDetail } from "../../../server/platform/catalog";
import { Bdi } from "../../shared/bidi";
import { formatClock, formatNumber, languageName } from "../../shared/format";
import { LocalizedText, type LocalizedValue } from "../../shared/localized-text";
import { encodeQr, qrPath } from "../../shared/qr";
import { QrCode } from "../../shared/qr-code";
import { TourMap } from "../../shared/tour-map";
import { PaymentPanel } from "../booking/payment-panel";
import { TourPrice, useTourDateFormat } from "../common";
import { Itinerary, directionsHref } from "../detail/itinerary";
import { WeatherCard } from "../weather-card";

import { StatusBadge } from "./bookings-list";
import { CancelBooking } from "./cancel-booking";
import { Checklist } from "./checklist";
import { LiveCard } from "./live-card";
import { readOfflineVoucher, registerToursServiceWorker, saveOfflineVoucher, type OfflineVoucher } from "./offline";
import { ReviewForm } from "./review-form";
import { ShareLinks } from "./share-links";

function Card({ title, children, testId, icon }: { title: string; children: React.ReactNode; testId?: string; icon?: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid={testId}>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function VoucherView({
  booking,
  detail,
  notices,
  live,
  weather,
  checklist,
  shareLinks,
  cancelQuote,
}: {
  booking: MyTourBooking;
  detail: TourDetail | null;
  notices: NoticeView[] | null;
  live: LiveView | null;
  weather: WeatherView;
  checklist: ChecklistItem[];
  shareLinks: ShareLink[];
  cancelQuote: { status: string; refund: RefundQuote; currency: string } | null;
}) {
  const t = useTranslations("TourApp.voucher");
  const tShared = useTranslations("TourShared");
  const locale = useLocale();
  const router = useRouter();
  const fmt = useTourDateFormat();
  const [offline, setOffline] = useState(false);
  const [saved, setSaved] = useState<OfflineVoucher | null>(null);
  const snap = booking.contentSnapshot ?? {};
  const title = (snap.title as LocalizedValue) ?? null;
  const meeting = (snap.meeting as { lat: number; lng: number; exact?: boolean } | null) ?? detail?.location.meeting ?? null;
  const meetingText = (snap.meetingInstructions as LocalizedValue) ?? detail?.text.meeting_instructions ?? null;
  const tz = booking.departure.timezone;
  const dep = booking.departure;
  const departureText = `${fmt.date(dep.localDate, "full")}${dep.localTime ? ` · ${formatClock(dep.localTime, locale)}` : ""}`;
  const isActive = ["confirmed", "requested", "pending_payment", "completed"].includes(booking.status);
  const refund = booking.refundQuote as RefundQuote | null;

  // Keep a copy for offline use (AT-29) and register the Tours service worker.
  useEffect(() => {
    if (!isActive) return;
    let qr: OfflineVoucher["qr"] = null;
    if (booking.qrToken) {
      try {
        qr = qrPath(encodeQr(booking.qrToken, "M"));
      } catch {
        qr = null;
      }
    }
    const savedAt = new Date().toISOString();
    void saveOfflineVoucher({
      bookingId: booking.bookingId,
      savedAt,
      lang: locale,
      dir: directionOf(locale),
      labels: {
        banner: t("offline.banner", { time: fmt.instant(savedAt, Intl.DateTimeFormat().resolvedOptions().timeZone, false) }),
        voucherCode: t("voucherCode"),
        departure: t("departure"),
        timezone: `${t("timezone", { zone: tz })} · ${t("calendarName", { calendar: fmt.calendarName() })}`,
        meetingPoint: t("meetingPoint"),
        attendees: t("attendees"),
        liveUnavailable: t("offline.liveUnavailable"),
        qr: t("qrLabel", { code: booking.voucherCode }),
      },
      title: title?.value ?? booking.tour.slug,
      status: booking.status,
      voucherCode: booking.voucherCode,
      departure: departureText,
      timezone: tz,
      meetingText: meetingText?.value ?? null,
      meetingCoords: meeting ? `${meeting.lat.toFixed(5)}, ${meeting.lng.toFixed(5)}` : null,
      attendees: booking.participants.map((p) => `${p.firstName} ${p.lastName}`),
      qr,
    });
    registerToursServiceWorker(locale);
  }, [booking.bookingId, booking.status, locale]);

  useEffect(() => {
    const update = () => {
      const off = !navigator.onLine;
      setOffline(off);
      if (off) setSaved(readOfflineVoucher(booking.bookingId));
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [booking.bookingId]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4 pb-10 sm:px-6" data-testid="voucher" data-booking-id={booking.bookingId} data-status={booking.status}>
      {offline ? (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" data-testid="offline-banner">
          <WifiOff className="size-4" aria-hidden="true" />
          {saved ? t("offline.banner", { time: fmt.instant(saved.savedAt, Intl.DateTimeFormat().resolvedOptions().timeZone, false) }) : tShared("common.offline")}
        </p>
      ) : null}

      <header className="rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-xs text-white/80">
            {t("bookingId")}: <Bdi dir="ltr" testId="booking-id">{booking.bookingId.slice(0, 8).toUpperCase()}</Bdi>
          </span>
        </div>
        <h1 className="mt-3 text-xl font-bold">
          <LocalizedText text={title} placeholder={booking.tour.slug} badgeClassName="bg-white/90" />
        </h1>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-slate-900 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-start">
            <p className="text-xs text-slate-500">{t("voucherCode")}</p>
            <p className="text-2xl font-extrabold tracking-wider">
              <Bdi dir="ltr" testId="voucher-code">{booking.voucherCode}</Bdi>
            </p>
            {booking.qrToken ? <p className="mt-1 text-xs text-slate-500">{t("qrHint")}</p> : null}
          </div>
          {booking.qrToken ? (
            <QrCode value={booking.qrToken} label={t("qrLabel", { code: booking.voucherCode })} size={168} />
          ) : (
            <p className="max-w-48 text-center text-xs text-slate-500" data-testid="qr-pending">
              {t("qrPending")}
            </p>
          )}
        </div>
      </header>

      {booking.status === "pending_payment" && !offline ? (
        <PaymentPanel
          bookingId={booking.bookingId}
          amount={Math.max(booking.totalAmount - booking.paidAmount, 0)}
          currency={booking.currency}
          deadline={booking.paymentDeadlineAt}
          timeZone={tz}
          onPaid={() => router.refresh()}
        />
      ) : null}
      {booking.status === "requested" && booking.requestExpiresAt ? (
        <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900" data-testid="request-pending" suppressHydrationWarning>
          {t("requestPending", { time: fmt.instant(booking.requestExpiresAt, tz) })}
        </p>
      ) : null}

      <Card title={t("departure")} icon={<Clock className="size-4 text-emerald-700" aria-hidden="true" />} testId="voucher-departure">
        <p className="text-base font-semibold text-slate-900" suppressHydrationWarning data-testid="voucher-date">
          {departureText}
        </p>
        <p className="text-xs text-slate-500" suppressHydrationWarning>
          {t("calendarName", { calendar: fmt.calendarName() })} · {t("timezone", { zone: tz })}
        </p>
        {dep.delayMinutes > 0 ? <p className="mt-1 text-sm font-semibold text-orange-700">{t("delayed", { minutes: formatNumber(dep.delayMinutes, locale) })}</p> : null}
        {dep.status !== "scheduled" ? <p className="mt-1 text-xs text-slate-600">{tShared(`departureStatus.${dep.status}`)}</p> : null}
        <a href={`/api/tours/bookings/${booking.bookingId}/ics?locale=${locale}`} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-700" data-testid="add-to-calendar">
          <CalendarPlus className="size-4" aria-hidden="true" />
          {t("addToCalendar")}
        </a>
      </Card>

      <Card title={t("meetingPoint")} icon={<MapPin className="size-4 text-emerald-700" aria-hidden="true" />} testId="voucher-meeting">
        {meeting ? (
          <>
            {!offline ? (
              <TourMap points={[{ id: "m", lat: meeting.lat, lng: meeting.lng, label: t("meetingPoint"), kind: "meeting", exact: true }]} labels={{ region: t("meetingPoint"), unavailable: t("offline.liveUnavailable"), approximate: "" }} height={200} />
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              <Bdi dir="ltr">
                {meeting.lat.toFixed(5)}, {meeting.lng.toFixed(5)}
              </Bdi>
            </p>
            <a href={directionsHref(meeting.lat, meeting.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-700">
              <Navigation className="size-4" aria-hidden="true" />
              {t("openMap")}
            </a>
          </>
        ) : null}
        {meetingText ? <LocalizedText text={meetingText} as="p" className="text-sm leading-6 text-slate-700" /> : null}
      </Card>

      <Card title={t("attendees")} testId="voucher-attendees">
        <ol className="space-y-1 text-sm text-slate-800">
          {booking.participants.map((p) => (
            <li key={p.position}>
              {formatNumber(p.position, locale)}.{" "}
              <Bdi>
                {p.firstName} {p.lastName}
              </Bdi>{" "}
              <span className="text-xs text-slate-500">({tShared(`traveler.${p.travelerClass}`)})</span>
            </li>
          ))}
        </ol>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 pt-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">{t("total")}</dt>
            <dd className="font-semibold">
              <TourPrice amount={booking.totalAmount} currency={booking.currency} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{t("paid")}</dt>
            <dd className="font-semibold">
              <TourPrice amount={booking.paidAmount} currency={booking.currency} />
            </dd>
          </div>
        </dl>
      </Card>

      {isActive && !offline ? <LiveCard live={live} departureId={booking.departure.id} timeZone={tz} /> : null}

      {notices ? (
        <Card title={t("notices.title")} testId="voucher-notices">
          {notices.length === 0 ? (
            <p className="text-sm text-slate-500">{t("notices.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm" data-testid="notice">
                  <p className="font-semibold text-slate-900" dir="auto">
                    {n.title}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-700" dir="auto">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500" suppressHydrationWarning>
                    {fmt.instant(n.effectiveAt, tz)}
                    {n.fellBack ? ` · ${t("notices.translated", { language: languageName(n.localeUsed, locale) })}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {!offline ? <WeatherCard view={weather} date={dep.localDate} /> : null}

      {isActive ? <Checklist bookingId={booking.bookingId} initial={checklist} /> : null}

      {detail && detail.itinerary.length > 0 ? (
        <details className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="voucher-itinerary">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-slate-900">{t("itinerary")}</summary>
          <div className="mt-3">
            <Itinerary stops={detail.itinerary} timezone={tz} />
          </div>
        </details>
      ) : null}

      {isActive && !offline ? <ShareLinks bookingId={booking.bookingId} initial={shareLinks} /> : null}

      {booking.status === "completed" ? <ReviewForm bookingId={booking.bookingId} /> : null}

      {refund ? (
        <Card title={t("refund.title")} testId="refund-history">
          <p className="text-sm text-slate-800">
            {t("refund.refunded", { percent: formatNumber(refund.refundPercent, locale) })}: <TourPrice amount={refund.refundAmount} currency={booking.currency} className="font-semibold" />
          </p>
          {refund.feeAmount > 0 ? (
            <p className="text-xs text-slate-500">
              {t("refund.fee")}: <TourPrice amount={refund.feeAmount} currency={booking.currency} />
            </p>
          ) : null}
          {booking.cancelledAt ? (
            <p className="text-xs text-slate-500" suppressHydrationWarning>
              {fmt.instant(booking.cancelledAt, tz)}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card title={t("support")} icon={<LifeBuoy className="size-4 text-emerald-700" aria-hidden="true" />} testId="voucher-support">
        <p className="text-sm text-slate-700">{t("supportBody", { code: booking.voucherCode })}</p>
        <Link href="/n/app/mobile/support" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700">
          {t("supportLink")}
        </Link>
        {live?.emergency ? (
          <p className="mt-2 flex items-center gap-2 text-sm">
            <Phone className="size-4 text-red-600" aria-hidden="true" />
            {t("emergency")}: {live.emergency.label} —{" "}
            <a href={`tel:${live.emergency.phone}`} className="font-semibold text-red-700">
              <Bdi dir="ltr">{live.emergency.phone}</Bdi>
            </a>
          </p>
        ) : null}
      </Card>

      {cancelQuote && !offline ? (
        <CancelBooking bookingId={booking.bookingId} quote={cancelQuote} policyVersion={booking.policyVersion} onDone={() => router.refresh()} />
      ) : null}
    </div>
  );
}
