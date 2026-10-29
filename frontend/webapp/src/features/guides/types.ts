/**
 * Editorial landing pages under /{locale}/medical-tourism.
 *
 * Content is plain data so it renders fully on the server (crawlers and AI
 * answer engines read the initial HTML) and so FAQ/breadcrumb JSON-LD is built
 * from exactly the text a visitor sees. Only locales with a written version are
 * published; there is no machine fallback to another language.
 */
export const GUIDE_LOCALES = ["fa", "ar", "en"] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

/** "" is the hub page itself (/{locale}/medical-tourism). */
export const GUIDE_SLUGS = [
  "",
  "visa",
  "medical-hotels",
  "mashhad",
  "rhinoplasty",
  "hair-transplant",
  "ivf",
  "dental",
  "tehran",
  "from-iraq",
  "licensed-hospitals",
  "iran-vs-turkey",
  "from-afghanistan",
  "from-gulf",
  "facts",
] as const;
export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export interface GuideTable {
  caption: string;
  columns: string[];
  rows: string[][];
}

export interface GuideSection {
  /** Stable anchor id, ASCII kebab-case. */
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Rendered as an ordered list (and as HowTo steps where the page is a how-to). */
  steps?: string[];
  table?: GuideTable;
}

export interface GuideSource {
  label: string;
  url: string;
}

export interface GuideCopy {
  /** <title>, ~50-60 characters, primary query first. */
  title: string;
  /** Meta description, ~140-160 characters. */
  description: string;
  h1: string;
  /** Short label used in breadcrumbs and cross-links. */
  navLabel: string;
  /** Opening paragraph: answers the main query in the first two sentences. */
  intro: string;
  sections: GuideSection[];
  faq: { question: string; answer: string }[];
  sources: GuideSource[];
  cta: { heading: string; body: string; button: string };
}

export interface Guide {
  slug: GuideSlug;
  /** ISO date the facts were last checked; shown on the page and in dateModified. */
  reviewedAt: string;
  /** Steps in the "steps" sections form a HowTo (visa guide). */
  howTo?: boolean;
  related: GuideSlug[];
  copy: Partial<Record<GuideLocale, GuideCopy>>;
}
