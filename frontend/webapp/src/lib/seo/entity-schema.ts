import "server-only";

import { entityPath } from "@/lib/routes/public-paths";

import { absoluteUrl } from "./alternates";
import { contentLanguageFor } from "./language-tags";
import { seoOrigin } from "./origin";
import { publicMediaUrl } from "./media-url";
import { firstSeoPlainText } from "./plain-text";

/**
 * schema.org builders for public entity pages. Only facts the page itself shows
 * are emitted: no ratings (part of the review set is admin-created, and
 * self-served business stars are not eligible anyway), no prices (display
 * prices are converted per visitor), no credentials the data does not state.
 */
type Node = Record<string, unknown>;

export const organizationId = () => `${seoOrigin()}/#organization`;

const text = (value: unknown, max = 300) => firstSeoPlainText([value], max) || undefined;

// Stored keys live under /files (src/lib/seo/media-url.ts).
const absoluteMedia = (src: string | null | undefined) => publicMediaUrl(src);

/** Drops undefined/empty values so the JSON stays minimal and valid. */
function compact<T extends Node>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
    )
  ) as T;
}

// Ordered: a "hotel clinic" is still a hotel for searchers looking for a stay.
const BUSINESS_TYPES: [RegExp, string][] = [
  [/hotel|هتل|فندق|otel|отел|меҳмонхона|hôtel|酒店|هۆتێل|apartment|اقامت/i, "Hotel"],
  [/hospital|بیمارستان|مستشفى|hastane|больниц|беморхона|hôpital|krankenhaus|医院|نەخۆشخانە/i, "Hospital"],
  [/dent|دندان|أسنان|diş|стомат|牙/i, "Dentist"],
  [/pharm|داروخانه|صيدلي|eczane|аптек|药/i, "Pharmacy"],
  [/gym|fitness|باشگاه|ورزش|نادي|spor|фитнес|健身/i, "ExerciseGym"],
  [/wellness|تندرستی|عافية|sağlıklı yaşam|оздоров/i, "HealthAndBeautyBusiness"],
  [/spa|اسپا|سبا|ماساژ/i, "DaySpa"],
  [/lab|آزمایشگاه|مختبر|laborat|лаборат/i, "DiagnosticLab"],
  [/clinic|کلینیک|مطب|عيادة|klinik|клиник|درمانگاه|诊所|کلینیک/i, "MedicalClinic"],
];

/**
 * The first label that maps to a type wins: pass the provider-type label before
 * the name, so every language version of one provider gets the same type.
 */
export function businessTypeFor(...labels: (string | null | undefined)[]) {
  for (const label of labels) {
    if (!label) continue;
    const match = BUSINESS_TYPES.find(([pattern]) => pattern.test(label));
    if (match) return match[1];
  }
  return "LocalBusiness";
}

/**
 * schema.org's lodging types (Hotel, Motel, LodgingBusiness, ...) make Google
 * validate the page as hotel-price markup for Hotel Center partners, which
 * requires identifier, check-in/out times and priceSpecification; without them
 * Search Console lists the page as an invalid "Hotels" item (Rich Results Test
 * on /fa/providers/miraj-hotel, 2026-11-16: 13 critical issues). A lodging is
 * therefore a LocalBusiness (valid Local business result) that names its kind
 * in additionalType.
 */
export const LODGING_TYPES = new Set(["Hotel", "Motel", "Hostel", "BedAndBreakfast", "LodgingBusiness", "Resort", "Campground"]);
export function lodgingAsLocalBusiness(type: string): { "@type": string; additionalType?: string } {
  return LODGING_TYPES.has(type) ? { "@type": "LocalBusiness", additionalType: `https://schema.org/${type}` } : { "@type": type };
}

/** An entity's public URL: by slug when the data has one, else by id (which redirects to the slug). */
type EntityRef = { id: string; slug?: string | null };

export const providerUrl = (locale: string, ref: EntityRef) => absoluteUrl(locale, entityPath("provider", ref));
export const serviceUrl = (locale: string, ref: EntityRef) => absoluteUrl(locale, entityPath("service", ref));
export const specialistUrl = (locale: string, ref: EntityRef) => absoluteUrl(locale, entityPath("specialist", ref));

/**
 * Images with Google's image licence metadata (contentUrl plus credit): photos
 * on a provider's pages are supplied by that business, so it is the creator and
 * the credit line. Without a known owner the plain URL is used.
 */
export function imageObjects(sources: (string | null | undefined)[], owner?: string | null, max = 5): (Node | string)[] {
  const urls = [...new Set(sources.map(absoluteMedia).filter(Boolean) as string[])].slice(0, max);
  if (!owner) return urls;
  return urls.map((url) => ({
    "@type": "ImageObject",
    contentUrl: url,
    url,
    creditText: owner,
    creator: { "@type": "Organization", name: owner },
    copyrightNotice: owner,
  }));
}

/** A phone number as schema.org wants it: digits with the country code, e.g. +982188888888. */
export function telephone(value: string | null | undefined): string | undefined {
  const digits = (value || "").replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 7) return undefined;
  return digits.startsWith("+") ? digits : digits.startsWith("00") ? `+${digits.slice(2)}` : digits;
}

export function breadcrumbList(items: { name: string; url: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items
      .filter((item) => item.name)
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
  };
}

export interface ProviderSchemaInput {
  locale: string;
  id: string;
  url?: string;
  name: string;
  providerType?: string | null;
  description?: unknown;
  image?: string | null;
  images?: string[] | null;
  street?: string | null;
  /** The city's name in the page language (src/lib/seo/place-names.ts), not its code. */
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  languages?: string[] | null;
  services?: { id: string; slug?: string | null; name: string }[];
  specialists?: { id: string; slug?: string | null; name: string }[];
}

export function providerSchema(input: ProviderSchemaInput): Node {
  const url = input.url ?? providerUrl(input.locale, input);
  const hasGeo =
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude) &&
    !(input.latitude === 0 && input.longitude === 0);
  const type = businessTypeFor(input.providerType, input.name);
  return compact({
    ...lodgingAsLocalBusiness(type),
    "@id": `${url}#business`,
    name: input.name,
    url,
    description: text(input.description),
    image: imageObjects([input.image, ...(input.images ?? [])], input.name),
    telephone: telephone(input.phone),
    address:
      input.city || input.country || input.street
        ? compact({
            "@type": "PostalAddress",
            streetAddress: input.street || undefined,
            addressLocality: input.city || undefined,
            addressCountry: input.country || undefined,
          })
        : undefined,
    geo: hasGeo ? { "@type": "GeoCoordinates", latitude: input.latitude, longitude: input.longitude } : undefined,
    knowsLanguage: input.languages?.filter(Boolean),
    makesOffer: (input.services ?? []).slice(0, 20).map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        "@id": `${serviceUrl(input.locale, service)}#service`,
        name: service.name,
        url: serviceUrl(input.locale, service),
      },
    })),
    employee: (input.specialists ?? []).slice(0, 20).map((person) => ({
      "@type": "Person",
      "@id": `${specialistUrl(input.locale, person)}#person`,
      name: person.name,
      url: specialistUrl(input.locale, person),
    })),
  });
}

export interface ServiceSchemaInput {
  locale: string;
  id: string;
  url?: string;
  name: string;
  description?: unknown;
  category?: string | null;
  image?: string | null;
  providerId?: string | null;
  providerSlug?: string | null;
  providerName?: string | null;
  city?: string | null;
  country?: string | null;
}

export function serviceSchema(input: ServiceSchemaInput): Node {
  const url = input.url ?? serviceUrl(input.locale, input);
  return compact({
    "@type": "Service",
    "@id": `${url}#service`,
    name: input.name,
    url,
    description: text(input.description),
    category: input.category || undefined,
    image: imageObjects([input.image], input.providerName, 1)[0],
    provider:
      input.providerId && input.providerName
        ? {
            "@type": "LocalBusiness",
            "@id": `${providerUrl(input.locale, { id: input.providerId, slug: input.providerSlug })}#business`,
            name: input.providerName,
            url: providerUrl(input.locale, { id: input.providerId, slug: input.providerSlug }),
          }
        : undefined,
    areaServed: input.city || input.country ? compact({ "@type": "Place", name: [input.city, input.country].filter(Boolean).join(", ") }) : undefined,
  });
}

export interface PersonSchemaInput {
  locale: string;
  id: string;
  url?: string;
  name: string;
  jobTitle?: string | null;
  description?: unknown;
  image?: string | null;
  specialties?: string[];
  providers?: { id: string; slug?: string | null; name: string }[];
}

export function personSchema(input: PersonSchemaInput): Node {
  const url = input.url ?? specialistUrl(input.locale, input);
  return compact({
    "@type": "Person",
    "@id": `${url}#person`,
    name: input.name,
    url,
    jobTitle: input.jobTitle || undefined,
    description: text(input.description),
    // A specialist's photo is supplied by the business they work for.
    image: imageObjects([input.image], input.providers?.[0]?.name, 1)[0],
    knowsAbout: input.specialties?.filter(Boolean),
    worksFor: (input.providers ?? []).map((provider) => ({
      "@type": "LocalBusiness",
      "@id": `${providerUrl(input.locale, provider)}#business`,
      name: provider.name,
      url: providerUrl(input.locale, provider),
    })),
  });
}

export const graph = (...nodes: (Node | null | undefined)[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes.filter(Boolean),
});

export interface ListedItem {
  url: string;
  name: string;
  image?: string | null;
}

/**
 * A listing page (explore, a specialty, trusted providers, tours) as a
 * CollectionPage whose main entity is the ItemList of what it shows, in order.
 * Google reads ItemList only for its carousel types (course, movie, recipe,
 * restaurant), so this is for understanding the page, not a rich result; links
 * point at pages that carry their own full markup.
 */
export function collectionPage(input: {
  url: string;
  name: string;
  description?: unknown;
  locale: string;
  items: ListedItem[];
  about?: Node;
  /** "WebPage" for a page that is not a listing as such (the home page). */
  type?: "CollectionPage" | "WebPage";
}): Node {
  const seen = new Set<string>();
  const items = input.items.filter((item) => item.url && item.name && !seen.has(item.url) && seen.add(item.url)).slice(0, 50);
  return compact({
    "@type": input.type ?? "CollectionPage",
    "@id": `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: text(input.description),
    inLanguage: contentLanguageFor(input.locale),
    isPartOf: { "@id": `${seoOrigin()}/#website` },
    about: input.about,
    mainEntity: items.length
      ? {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((item, index) =>
            compact({ "@type": "ListItem", position: index + 1, url: item.url, name: item.name, image: absoluteMedia(item.image) })
          ),
        }
      : undefined,
  });
}

export interface VideoFacts {
  url: string | null | undefined;
  name?: string | null;
  description?: string | null;
  uploadDate?: string | null;
  durationSeconds?: number | null;
}

/** ISO 8601 duration ("PT1M35S") from seconds. */
export function isoDuration(seconds: number | null | undefined): string | undefined {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return undefined;
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s || (!h && !m) ? `${s}S` : ""}`;
}

/**
 * VideoObject for videos played on the page (Google video best practices:
 * name, thumbnailUrl and uploadDate are required; contentUrl lets Google fetch
 * the file for previews and key moments). Uploads have no poster frame of their
 * own, so the thumbnail is the page's main photo; a video without a file, a date
 * or any thumbnail is left out rather than marked up incompletely.
 */
export function videoObjects(
  videos: VideoFacts[],
  context: { name: string; thumbnail?: string | null; owner?: string | null; description?: unknown },
  max = 5
): Node[] {
  const thumbnail = absoluteMedia(context.thumbnail);
  if (!thumbnail) return [];
  const seen = new Set<string>();
  return videos
    .map((video) => ({ ...video, contentUrl: absoluteMedia(video.url) }))
    .filter((video) => video.contentUrl && video.uploadDate && !seen.has(video.contentUrl) && seen.add(video.contentUrl))
    .slice(0, max)
    .map((video, index) =>
      compact({
        "@type": "VideoObject",
        name: text(video.name, 100) || (index ? `${context.name} (${index + 1})` : context.name),
        description: text(video.description) || text(context.description) || context.name,
        thumbnailUrl: [thumbnail],
        uploadDate: new Date(video.uploadDate as string).toISOString(),
        contentUrl: video.contentUrl,
        duration: isoDuration(video.durationSeconds),
        ...(context.owner ? { creator: { "@type": "Organization", name: context.owner } } : {}),
      })
    );
}
