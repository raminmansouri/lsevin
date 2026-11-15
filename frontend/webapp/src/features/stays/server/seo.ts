import "server-only";

import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, imageObjects, organizationId } from "@/lib/seo/entity-schema";
import { publicMediaUrl } from "@/lib/seo/media-url";
import { seoOrigin } from "@/lib/seo/origin";
import { firstSeoPlainText } from "@/lib/seo/plain-text";

import type { PropertyKind } from "../domain/search";
import type { CityDetail, PropertyCard, PropertyDetail } from "../types";

/**
 * SEO for stays (requirement 5). Indexable locales are the ones the UI is fully
 * written in (fa, en); other locales render with English fallbacks and are
 * served noindex,follow so they never compete with the real versions.
 * Structured data states only what the page itself shows.
 */
export { propertyLocales, STAY_INDEXABLE_LOCALES } from "../domain/seo-locales";

const TYPE: Record<PropertyKind, string> = {
  hotel: "Hotel",
  hotel_apartment: "Hotel",
  boutique: "Hotel",
  traditional: "BedAndBreakfast",
  motel: "Motel",
  hostel: "Hostel",
  guesthouse: "BedAndBreakfast",
  villa: "LodgingBusiness",
  apartment: "LodgingBusiness",
  suite: "LodgingBusiness",
  cottage: "LodgingBusiness",
  ecolodge: "LodgingBusiness",
};

// Stored keys and our own files host resolve onto the public domain (lib/seo/media-url).
const abs = (src: string | null | undefined) => {
  if (!src) return undefined;
  return publicMediaUrl(src) ?? (() => {
    try {
      return new URL(resolveMediaUrl(src), seoOrigin()).toString();
    } catch {
      return undefined;
    }
  })();
};

/** Home > Stays > ...: /stays sends first visits (and crawlers) to its intro, the stays landing. */
const staysCrumbs = (locale: string, labels: { stays: string; home?: string }) => [
  ...(labels.home ? [{ name: labels.home, url: absoluteUrl(locale) }] : []),
  { name: labels.stays, url: absoluteUrl(locale, "/stays/intro") },
];

function compact<T extends Record<string, unknown>>(node: T): T {
  return Object.fromEntries(Object.entries(node).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))) as T;
}

export function propertySchema(p: PropertyDetail, locale: string, labels: { stays: string; amenities: string[]; home?: string }) {
  const url = absoluteUrl(locale, `/stays/p/${p.slug}`);
  const name = p.name?.value ?? p.slug;
  const node = compact({
    "@type": TYPE[p.kind],
    "@id": `${url}#lodging`,
    name,
    url,
    description: firstSeoPlainText([p.summary?.value, p.description?.value], 300) || undefined,
    // Image licence metadata: the photos are supplied by the property.
    image: imageObjects(p.media.filter((m) => !m.roomTypeId).slice(0, 6).map((m) => abs(m.url)), name, 6),
    starRating: p.starRating ? { "@type": "Rating", ratingValue: p.starRating } : undefined,
    // Reviews come only from guests with a completed booking (stay.reviews, one per booking).
    aggregateRating: p.ratingAvg != null && p.reviewCount > 0 ? { "@type": "AggregateRating", ratingValue: p.ratingAvg, reviewCount: p.reviewCount, bestRating: 5, worstRating: 1 } : undefined,
    address: compact({
      "@type": "PostalAddress",
      addressLocality: p.city.name,
      addressRegion: p.city.region ?? undefined,
      addressCountry: "IR",
      streetAddress: p.location && !p.location.approximate ? p.address?.value : undefined,
    }),
    geo: p.location && !p.location.approximate ? { "@type": "GeoCoordinates", latitude: p.location.latitude, longitude: p.location.longitude } : undefined,
    checkinTime: p.checkInTime,
    checkoutTime: p.checkOutTime,
    petsAllowed: p.rules.pets,
    smokingAllowed: p.rules.smoking,
    amenityFeature: labels.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
    provider: { "@id": organizationId() },
  });
  const crumbs = breadcrumbList([
    ...staysCrumbs(locale, labels),
    { name: p.city.name, url: absoluteUrl(locale, `/stays/city/${p.city.slug}`) },
    { name, url },
  ]);
  return { "@context": "https://schema.org", "@graph": [node, crumbs] };
}

export function citySchema(city: CityDetail, items: PropertyCard[], locale: string, labels: { stays: string; title: string; home?: string }) {
  const url = absoluteUrl(locale, `/stays/city/${city.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      compact({
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: labels.title,
        url,
        image: abs(city.coverUrl),
        about: { "@type": "City", name: city.name },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.slice(0, 30).map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(locale, `/stays/p/${c.slug}`),
            name: c.name,
          })),
        },
      }),
      breadcrumbList([
        ...staysCrumbs(locale, labels),
        { name: city.name, url },
      ]),
    ],
  };
}
