import { guide as dental } from "./content/dental";
import { guide as facts } from "./content/facts";
import { guide as fromAfghanistan } from "./content/from-afghanistan";
import { guide as fromGulf } from "./content/from-gulf";
import { guide as fromIraq } from "./content/from-iraq";
import { guide as hairTransplant } from "./content/hair-transplant";
import { guide as hub } from "./content/hub";
import { guide as iranVsTurkey } from "./content/iran-vs-turkey";
import { guide as ivf } from "./content/ivf";
import { guide as licensedHospitals } from "./content/licensed-hospitals";
import { guide as mashhad } from "./content/mashhad";
import { guide as medicalHotels } from "./content/medical-hotels";
import { guide as rhinoplasty } from "./content/rhinoplasty";
import { guide as tehran } from "./content/tehran";
import { guide as visa } from "./content/visa";
import { GUIDE_LOCALES, type Guide, type GuideCopy, type GuideLocale, type GuideSlug } from "./types";

export const GUIDE_BASE_PATH = "/medical-tourism";

// A slug is published only once its content file is registered here.
const GUIDES: Partial<Record<GuideSlug, Guide>> = {
  "": hub,
  visa,
  "medical-hotels": medicalHotels,
  mashhad,
  rhinoplasty,
  "hair-transplant": hairTransplant,
  ivf,
  dental,
  tehran,
  "from-iraq": fromIraq,
  "licensed-hospitals": licensedHospitals,
  "iran-vs-turkey": iranVsTurkey,
  "from-afghanistan": fromAfghanistan,
  "from-gulf": fromGulf,
  facts,
};

export const allGuides = () => Object.values(GUIDES).filter((guide): guide is Guide => Boolean(guide));

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
  if (!isGuideLocale(locale)) return null;
  const guide = GUIDES[slug as GuideSlug];
  const copy = guide?.copy[locale];
  return guide && copy ? { guide, copy, locale } : null;
}
