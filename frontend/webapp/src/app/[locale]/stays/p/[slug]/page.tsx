import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { parseStaySearch } from "@/features/stays/domain/search";
import { getPropertyDetail, getRoomOffers, listCities, listReviews, wishlistIds } from "@/features/stays/server/catalog";
import { propertyLocales, propertySchema } from "@/features/stays/server/seo";
import { PropertyView } from "@/features/stays/ui/detail/property-view";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPropertyDetail({ slug }, contentLocaleFor(locale)).catch(() => null);
  if (!p) return { robots: { index: false, follow: true } };
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  const name = p.name?.value ?? slug;
  const meta = await buildPublicMetadata({
    locale,
    path: `/stays/p/${slug}`,
    title: `${name} · ${p.city.name}`,
    descriptions: [p.summary?.value, p.description?.value, t("propertyDescription", { name, city: p.city.name })],
    image: p.media[0]?.url ?? null,
    eligibleLocales: propertyLocales(p.nameLocales),
  });
  // Dated/party variants of a property page are the same page: canonical (from metadata) points
  // at the plain URL; mark them noindex so crawlers do not collect every date combination.
  const dated = Object.keys(await searchParams).length > 0;
  return dated ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/** Property page (H04/H05): rooms are priced for the dates and party in the URL. */
export default async function StayPropertyPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const property = await getPropertyDetail({ slug }, content);
  if (!property) notFound();
  const search = parseStaySearch(await searchParams);
  const occupancy = { rooms: search.rooms, adults: Math.max(search.adults, search.rooms), childAges: search.childAges };
  const actor = await currentActor();
  const t = await getTranslations({ locale, namespace: "StayApp.nav" });
  const home = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const [offers, reviews, saved, cities] = await Promise.all([
    getRoomOffers(property.id, { checkIn: search.checkIn, checkOut: search.checkOut, occupancy }, content),
    listReviews(property.id, { limit: 10 }),
    actor.userId ? wishlistIds(actor.userId).catch(() => [] as string[]) : Promise.resolve([] as string[]),
    listCities(content).catch(() => []),
  ]);
  return (
    <>
      <JsonLd data={propertySchema(property, locale, { stays: t("stays"), home, amenities: property.amenities.map((a) => a.label) })} />
      <PropertyView
        property={property}
        rooms={offers.rooms}
        reviews={reviews}
        search={search}
        dateError={offers.dateError}
        saved={saved.includes(property.id)}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name, region: c.region }))}
      />
    </>
  );
}
