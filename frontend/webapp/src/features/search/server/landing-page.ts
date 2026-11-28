import "server-only";

import type { Metadata } from "next";

import { routing } from "@/i18n/routing";
import {
  absoluteUrl,
  languageAlternates,
  type SeoLocale,
} from "@/lib/seo/alternates";

import {
  buildLandingJsonLd,
  landingCopy,
  type LandingFacts,
} from "../lib/landing-copy";
import { getLanding, landingPagesEnabled, type LandingData } from "./landing";
import { pickText } from "./search";

export type LoadedLanding = {
  data: LandingData;
  jsonLd: unknown[];
  metadata: Metadata;
};

/** Locales whose text exists for this page: the only ones that may be indexed. */
function eligibleLocales(data: LandingData): SeoLocale[] {
  const has = (tag: string) =>
    Boolean(data.serviceNames?.[tag] && data.cityNames?.[tag]);
  return (["fa", "en"] as const).filter((locale) =>
    has(locale === "fa" ? "fa-IR" : "en-US")
  );
}

/**
 * Everything a landing page needs, or null (-> 404) when the feature is off, the locale is
 * unknown or the combination has too little behind it. Shared by the real page and test harness.
 */
export async function loadLandingPage(
  locale: string,
  serviceSlug: string,
  citySlug: string
): Promise<LoadedLanding | null> {
  if (!landingPagesEnabled()) return null;
  if (!(routing.locales as readonly string[]).includes(locale)) return null;
  const data = await getLanding(serviceSlug, citySlug, locale);
  if (!data) return null;

  const facts: LandingFacts = {
    service: pickText(data.serviceNames, locale),
    city: pickText(data.cityNames, locale),
    providers: data.providers,
    minPriceToman: data.minPriceToman,
    maxPriceToman: data.maxPriceToman,
    avgRating: data.avgRating,
  };
  const copy = landingCopy(locale);
  const pagePath = `/find/${serviceSlug}/${citySlug}`;
  const eligible = eligibleLocales(data);
  const indexable = (eligible as readonly string[]).includes(locale);
  const canonical = absoluteUrl(locale, pagePath);

  const metadata: Metadata = {
    title: { absolute: copy.title(facts) },
    description: copy.description(facts),
    alternates: {
      canonical,
      languages: indexable ? languageAlternates(pagePath, eligible) : undefined,
    },
    // A language without its own text is a fallback rendering: crawlable for its links, kept out of the index.
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: copy.title(facts),
      description: copy.description(facts),
      url: canonical,
      type: "website",
    },
  };

  const jsonLd = buildLandingJsonLd({
    locale,
    facts,
    abs: (path) => absoluteUrl(locale, path),
    pagePath,
    offers: data.offers.map((offer) => ({
      title: offer.title,
      provider: offer.provider,
      path: offer.path,
    })),
  });

  return { data, jsonLd, metadata };
}
