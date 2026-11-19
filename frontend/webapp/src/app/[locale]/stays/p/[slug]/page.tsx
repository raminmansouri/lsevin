import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { parseStaySearch } from "@/features/stays/domain/search";
import { getRoomOffers, wishlistIds } from "@/features/stays/server/catalog";
import { cachedPropertyDetail, cachedPropertyExtras } from "@/features/stays/server/cache";
import { propertyLocales, propertySchema } from "@/features/stays/server/seo";
import { PropertyView } from "@/features/stays/ui/detail/property-view";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Shared by generateMetadata and the page; the catalogue part is cached across visitors. */
const loadProperty = cache((slug: string, content: string) => cachedPropertyDetail(slug, content));

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await loadProperty(slug, contentLocaleFor(locale)).catch(() => null);
  if (!p) return { robots: { index: false, follow: true } };
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  const name = p.name?.value ?? slug;
  const meta = await buildPublicMetadata({
    locale,
    path: `/stays/${slug}`,
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
  const property = await loadProperty(slug, content);
  if (!property) notFound();
  const raw = await searchParams;
  const search = parseStaySearch(raw);
  const room = typeof raw.room === "string" && GUID.test(raw.room) ? raw.room : null;
  const occupancy = { rooms: search.rooms, adults: Math.max(search.adults, search.rooms), childAges: search.childAges };
  const [actor, t, home] = await Promise.all([
    currentActor(),
    getTranslations({ locale, namespace: "StayApp.nav" }),
    getTranslations({ locale, namespace: "LocaleLayout" }),
  ]);
  const [offers, extras, saved] = await Promise.all([
    getRoomOffers(property.id, { checkIn: search.checkIn, checkOut: search.checkOut, occupancy }, content),
    cachedPropertyExtras({ id: property.id, city: property.city, location: property.location }, content),
    actor.userId ? wishlistIds(actor.userId).catch(() => [] as string[]) : Promise.resolve([] as string[]),
  ]);
  const { reviews, stats, similar, landmarks, amenities } = extras;
  return (
    <>
      <JsonLd data={propertySchema(property, locale, { stays: t("stays"), home: home("title"), amenities: property.amenities.map((a) => a.label) })} />
      <PropertyView
        property={property}
        rooms={offers.rooms}
        reviews={reviews}
        reviewStats={stats}
        similar={similar.map((c) => ({ ...c, latitude: null, longitude: null, distanceM: property.location?.approximate ? null : c.distanceM }))}
        landmarks={landmarks}
        amenityLabels={Object.fromEntries(amenities.map((a) => [a.code, { label: a.label, icon: a.icon }]))}
        search={search}
        dateError={offers.dateError}
        saved={saved.includes(property.id)}
        focusRoomId={room}
      />
    </>
  );
}
