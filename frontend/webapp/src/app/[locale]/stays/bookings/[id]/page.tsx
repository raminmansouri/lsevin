import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { ToursError } from "@/features/tours/server/platform/errors";
import { getMyStayBooking, reconcileStayBooking } from "@/features/stays/server/booking";
import { logUnexpected } from "@/features/stays/server/errors";
import { BookingDetail } from "@/features/stays/ui/bookings/bookings-view";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * One booking (H08/H09). Owner only: another account's id is a 404. Every visit
 * reconciles payment first, so a return from the gateway, a refresh or a second
 * device all show the confirmed state exactly once.
 */
export default async function StayBookingPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  if (!actor.userId) {
    const t = await getTranslations({ locale, namespace: "StayApp.bookings" });
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center" data-testid="stay-bookings-signin">
        <h1 className="text-xl font-bold">{t("signInTitle")}</h1>
        <Link href={`/sign-in?redirectTo=${encodeURIComponent(`/${locale}/stays/bookings/${id}`)}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
          {t("signIn")}
        </Link>
      </div>
    );
  }
  const content = contentLocaleFor(locale);
  let booking;
  try {
    booking = await getMyStayBooking(actor.userId, id, content);
  } catch (e) {
    if (e instanceof ToursError && e.kind === "not_found") notFound();
    throw e;
  }
  if (booking.status === "pending_payment") {
    const after = await reconcileStayBooking(id).catch((e) => {
      logUnexpected("stays.reconcile", e);
      return null;
    });
    if (after && after !== booking.status) booking = await getMyStayBooking(actor.userId, id, content);
  }
  const { new: isNew } = await searchParams;
  return <BookingDetail booking={booking} justCreated={isNew === "1"} />;
}
