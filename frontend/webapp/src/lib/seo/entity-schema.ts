import "server-only";

import { absoluteUrl } from "./alternates";
import { seoOrigin } from "./origin";
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

const absoluteMedia = (src: string | null | undefined) => {
  if (!src) return undefined;
  try {
    return new URL(src, seoOrigin()).toString();
  } catch {
    return undefined;
  }
};

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

export const providerUrl = (locale: string, id: string) => absoluteUrl(locale, `/n/app/mobile/provider/${id}`);
export const serviceUrl = (locale: string, id: string) => absoluteUrl(locale, `/n/app/mobile/service/${id}`);
export const specialistUrl = (locale: string, id: string) => absoluteUrl(locale, `/n/app/mobile/specialist/${id}`);

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
  name: string;
  providerType?: string | null;
  description?: unknown;
  image?: string | null;
  images?: string[] | null;
  street?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  languages?: string[] | null;
  services?: { id: string; name: string }[];
  specialists?: { id: string; name: string }[];
}

export function providerSchema(input: ProviderSchemaInput): Node {
  const url = providerUrl(input.locale, input.id);
  const hasGeo =
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude) &&
    !(input.latitude === 0 && input.longitude === 0);
  const images = [input.image, ...(input.images ?? [])].map(absoluteMedia).filter(Boolean) as string[];
  return compact({
    "@type": businessTypeFor(input.providerType, input.name),
    "@id": `${url}#business`,
    name: input.name,
    url,
    description: text(input.description),
    image: [...new Set(images)].slice(0, 5),
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
        "@id": `${serviceUrl(input.locale, service.id)}#service`,
        name: service.name,
        url: serviceUrl(input.locale, service.id),
      },
    })),
    employee: (input.specialists ?? []).slice(0, 20).map((person) => ({
      "@type": "Person",
      "@id": `${specialistUrl(input.locale, person.id)}#person`,
      name: person.name,
      url: specialistUrl(input.locale, person.id),
    })),
  });
}

export interface ServiceSchemaInput {
  locale: string;
  id: string;
  name: string;
  description?: unknown;
  category?: string | null;
  image?: string | null;
  providerId?: string | null;
  providerName?: string | null;
  city?: string | null;
  country?: string | null;
}

export function serviceSchema(input: ServiceSchemaInput): Node {
  const url = serviceUrl(input.locale, input.id);
  return compact({
    "@type": "Service",
    "@id": `${url}#service`,
    name: input.name,
    url,
    description: text(input.description),
    category: input.category || undefined,
    image: absoluteMedia(input.image),
    provider:
      input.providerId && input.providerName
        ? {
            "@type": "LocalBusiness",
            "@id": `${providerUrl(input.locale, input.providerId)}#business`,
            name: input.providerName,
            url: providerUrl(input.locale, input.providerId),
          }
        : undefined,
    areaServed: input.city || input.country ? compact({ "@type": "Place", name: [input.city, input.country].filter(Boolean).join(", ") }) : undefined,
  });
}

export interface PersonSchemaInput {
  locale: string;
  id: string;
  name: string;
  jobTitle?: string | null;
  description?: unknown;
  image?: string | null;
  specialties?: string[];
  providers?: { id: string; name: string }[];
}

export function personSchema(input: PersonSchemaInput): Node {
  const url = specialistUrl(input.locale, input.id);
  return compact({
    "@type": "Person",
    "@id": `${url}#person`,
    name: input.name,
    url,
    jobTitle: input.jobTitle || undefined,
    description: text(input.description),
    image: absoluteMedia(input.image),
    knowsAbout: input.specialties?.filter(Boolean),
    worksFor: (input.providers ?? []).map((provider) => ({
      "@type": "LocalBusiness",
      "@id": `${providerUrl(input.locale, provider.id)}#business`,
      name: provider.name,
      url: providerUrl(input.locale, provider.id),
    })),
  });
}

export const graph = (...nodes: (Node | null | undefined)[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes.filter(Boolean),
});
