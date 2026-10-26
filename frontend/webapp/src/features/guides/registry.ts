import { guide as hub } from "./content/hub";
import { guide as mashhad } from "./content/mashhad";
import { guide as medicalHotels } from "./content/medical-hotels";
import { guide as rhinoplasty } from "./content/rhinoplasty";
import { guide as visa } from "./content/visa";
import { GUIDE_LOCALES, type Guide, type GuideCopy, type GuideLocale, type GuideSlug } from "./types";

export const GUIDE_BASE_PATH = "/medical-tourism";

const GUIDES: Record<GuideSlug, Guide> = {
  "": hub,
  visa,
  "medical-hotels": medicalHotels,
  mashhad,
  rhinoplasty,
};

export const allGuides = () => Object.values(GUIDES);

export const isGuideLocale = (locale: string): locale is GuideLocale =>
  (GUIDE_LOCALES as readonly string[]).includes(locale);

export const guidePath = (slug: GuideSlug) => (slug ? `${GUIDE_BASE_PATH}/${slug}` : GUIDE_BASE_PATH);

/** Locales that have a written version of this guide (no cross-language fallback). */
export const guideLocales = (guide: Guide) =>
  GUIDE_LOCALES.filter((locale) => Boolean(guide.copy[locale]));

export function findGuide(
  locale: string,
  slug: string
): { guide: Guide; copy: GuideCopy; locale: GuideLocale } | null {
  if (!isGuideLocale(locale) || !(slug in GUIDES)) return null;
  const guide = GUIDES[slug as GuideSlug];
  const copy = guide.copy[locale];
  return copy ? { guide, copy, locale } : null;
}
