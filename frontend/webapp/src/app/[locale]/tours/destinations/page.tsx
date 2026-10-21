import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { listDestinations } from "@/features/tours/server/platform/catalog";
import { DestinationsGrid } from "@/features/tours/ui/customer/destinations-grid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.destinations" });
  return { title: t("title") };
}

/** "See all" of the Popular Destinations rail (C-011). Only published destinations with published tours. */
export default async function DestinationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const destinations = await listDestinations(contentLocaleFor(locale), { limit: 200 });
  return <DestinationsGrid destinations={destinations} />;
}
