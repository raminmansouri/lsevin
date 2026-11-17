import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { listMyStayBookings } from "@/features/stays/server/booking";
import { BookingsList } from "@/features/stays/ui/bookings/bookings-view";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StayBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  const t = await getTranslations({ locale, namespace: "StayApp.bookings" });
  if (!actor.userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center" data-testid="stay-bookings-signin">
        <h1 className="text-xl font-bold">{t("signInTitle")}</h1>
        <Link href={`/sign-in?redirectTo=${encodeURIComponent(`/${locale}/stays/bookings`)}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
          {t("signIn")}
        </Link>
      </div>
    );
  }
  const groups = await listMyStayBookings(actor.userId, contentLocaleFor(locale));
  return <BookingsList groups={groups} />;
}
