import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { listDestinations, parseTourSearch, searchTours, wishlistIds } from "@/features/tours/server/platform/catalog";
import { DestinationDetail } from "@/features/tours/ui/customer/destinations-grid";

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const destination = (await listDestinations(content, { limit: 500 })).find((d) => d.slug === slug);
  if (!destination) notFound();
  const search = { ...parseTourSearch(await searchParams), destination: slug };
  const actor = await currentActor();
  const [results, saved] = await Promise.all([
    searchTours(search, content),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
  ]);
  return <DestinationDetail destination={destination} tours={results.items} total={results.total} savedIds={saved} />;
}
