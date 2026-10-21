import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { getTourDetail, listDepartures } from "@/features/tours/server/platform/catalog";
import { BookingFlow } from "@/features/tours/ui/customer/booking/booking-flow";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.booking" });
  const detail = await getTourDetail(slug, contentLocaleFor(locale)).catch(() => null);
  return { title: t("title", { title: detail?.text.title?.value ?? slug }), robots: { index: false } };
}

/**
 * Booking flow (C-081..C-096, booking_process_1..4.png). Selection lives in the
 * URL (departure/option/travelers) so it is shareable and survives sign-in and
 * language changes; personal data stays in sessionStorage only.
 */
export default async function BookPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const detail = await getTourDetail(slug, contentLocaleFor(locale));
  if (!detail) notFound();
  const [departures, actor, sp] = await Promise.all([listDepartures(detail.id), currentActor(), searchParams]);
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const travelers: Record<string, number> = {};
  for (const cls of ["adult", "child", "infant", "student", "senior"]) {
    const n = Number(one(cls));
    if (Number.isInteger(n) && n >= 0 && n <= 50) travelers[cls] = n;
  }
  return (
    <BookingFlow
      detail={detail}
      departures={departures}
      signedIn={Boolean(actor.userId)}
      initial={{ departureId: one("departure") ?? null, optionId: one("option") ?? null, travelers }}
    />
  );
}
