import "server-only";

import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import type { SeoLocale } from "@/lib/seo/alternates";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, organizationId } from "@/lib/seo/entity-schema";
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
export const STAY_INDEXABLE_LOCALES: readonly SeoLocale[] = ["fa", "en"];

/** A property page is indexable in a language only when its own name exists in it. */
export function propertyLocales(nameKeys: string[]): SeoLocale[] {
  const out: SeoLocale[] = [];
  if (nameKeys.some((k) => k.startsWith("fa"))) out.push("fa");
  if (nameKeys.some((k) => k.startsWith("en"))) out.push("en");
  return out.length ? out : ["fa"];
}

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

const abs = (src: string | null | undefined) => {
  if (!src) return undefined;
  try {
    return new URL(resolveMediaUrl(src), seoOrigin()).toString();
  } catch {
    return undefined;
  }
};

function compact<T extends Record<string, unknown>>(node: T): T {
  return Object.fromEntries(Object.entries(node).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))) as T;
}

export function propertySchema(p: PropertyDetail, locale: string, labels: { stays: string; amenities: string[] }) {
  const url = absoluteUrl(locale, `/stays/p/${p.slug}`);
  const name = p.name?.value ?? p.slug;
  const node = compact({
    "@type": TYPE[p.kind],
    "@id": `${url}#lodging`,
    name,
    url,
    description: firstSeoPlainText([p.summary?.value, p.description?.value], 300) || undefined,
    image: p.media.filter((m) => !m.roomTypeId).slice(0, 6).map((m) => abs(m.url)).filter(Boolean),
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
    { name: labels.stays, url: absoluteUrl(locale, "/stays") },
    { name: p.city.name, url: absoluteUrl(locale, `/stays/city/${p.city.slug}`) },
    { name, url },
  ]);
  return { "@context": "https://schema.org", "@graph": [node, crumbs] };
}

export function citySchema(city: CityDetail, items: PropertyCard[], locale: string, labels: { stays: string; title: string }) {
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
        { name: labels.stays, url: absoluteUrl(locale, "/stays") },
        { name: city.name, url },
      ]),
    ],
  };
}
