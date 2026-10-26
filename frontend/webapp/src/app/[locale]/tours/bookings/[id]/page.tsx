import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { lines as splitLines } from "@/features/tours/ui/shared/format";
import { listChecklist, listShareLinks } from "@/features/tours/server/actions/customer/state";
import type { LiveView, NoticeView, WeatherView } from "@/features/tours/server/ops/contract";
import { getLiveView } from "@/features/tours/server/ops/live";
import { listNoticesForBooking } from "@/features/tours/server/ops/notices";
import { getTourWeather } from "@/features/tours/server/ops/weather";
import { currentActor } from "@/features/tours/server/platform/access";
import { getMyTourBooking, quoteCustomerCancellation } from "@/features/tours/server/platform/booking";
import { getTourDetail } from "@/features/tours/server/platform/catalog";
import { logUnexpected, ToursError } from "@/features/tours/server/platform/errors";
import { VoucherView } from "@/features/tours/ui/customer/bookings/voucher-view";
import { redirect } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.voucher" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Voucher / booking page (C-094..C-096, C-058, C-073, C-106, C-109, AT-20, AT-29).
 * getMyTourBooking reconciles a paid booking first, so returning from the
 * gateway (or reloading) shows the real status.
 */
export default async function VoucherPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  if (!actor.userId) redirect({ href: `/sign-in?redirectTo=${encodeURIComponent(`/tours/bookings/${id}`)}`, locale });
  const userId = actor.userId!;
  let booking;
  try {
    booking = await getMyTourBooking(userId, id);
  } catch (e) {
    if (e instanceof ToursError && e.kind === "not_found") notFound();
    throw e;
  }
  const content = contentLocaleFor(locale);
  // Optional parts degrade independently: a failure in one never hides the voucher.
  const soft = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      logUnexpected(`voucher.${label}`, e);
      return fallback;
    }
  };
  const detail = await soft("detail", () => getTourDetail(booking.tour.id, content, { revealExactLocation: true, mode: "published" }), null);
  const active = ["confirmed", "requested", "pending_payment", "completed"].includes(booking.status);
  const meeting = booking.contentSnapshot?.meeting ?? detail?.location.meeting ?? null;
  const [notices, live, weather, checklist, shareLinks, cancelQuote] = await Promise.all([
    soft<NoticeView[] | null>("notices", () => listNoticesForBooking(userId, id, content), null),
    active ? soft<LiveView | null>("live", () => getLiveView(actor, booking.departure.id), null) : Promise.resolve(null),
    meeting
      ? soft<WeatherView>("weather", () => getTourWeather({ lat: meeting.lat, lng: meeting.lng, departureLocalIso: booking.departure.localDate, timeZone: booking.departure.timezone }), { status: "unavailable", reason: "provider_error" })
      : Promise.resolve<WeatherView>({ status: "unavailable", reason: "no_location" }),
    active ? soft("checklist", () => listChecklist(userId, id, splitLines(detail?.text.what_to_bring?.value)), []) : Promise.resolve([]),
    active ? soft("shareLinks", () => listShareLinks(userId, id), []) : Promise.resolve([]),
    ["pending_payment", "requested", "confirmed"].includes(booking.status) ? soft("cancelQuote", () => quoteCustomerCancellation(userId, id), null) : Promise.resolve(null),
  ]);

  return (
    <VoucherView
      booking={booking}
      detail={detail}
      notices={notices}
      live={live}
      weather={weather}
      checklist={checklist}
      shareLinks={shareLinks}
      cancelQuote={cancelQuote}
    />
  );
}
