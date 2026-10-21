import { getTranslations, setRequestLocale } from "next-intl/server";

import { currentActor } from "@/features/tours/server/platform/access";
import { listMyTourBookings } from "@/features/tours/server/platform/booking";
import { BookingsList } from "@/features/tours/ui/customer/bookings/bookings-list";
import { redirect } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.bookings" });
  return { title: t("title"), robots: { index: false } };
}

/** My Bookings (C-095): upcoming / completed / cancelled. */
export default async function MyBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  if (!actor.userId) redirect({ href: `/sign-in?redirectTo=${encodeURIComponent("/tours/bookings")}`, locale });
  const lists = await listMyTourBookings(actor.userId!);
  return <BookingsList lists={lists} />;
}
