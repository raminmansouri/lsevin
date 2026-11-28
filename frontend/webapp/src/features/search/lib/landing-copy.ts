/**
 * Text and structured data of the treatment-in-city landing pages. Persian and English only:
 * other locales render in English and are kept out of the index.
 */
export type LandingFacts = {
  service: string;
  city: string;
  providers: number;
  minPriceToman: number | null;
  maxPriceToman: number | null;
  avgRating: number | null;
};

type Copy = {
  title: (f: LandingFacts) => string;
  h1: (f: LandingFacts) => string;
  description: (f: LandingFacts) => string;
  intro: (f: LandingFacts) => string;
  listHeading: string;
  otherCities: (service: string) => string;
  otherServices: (city: string) => string;
  searchCta: string;
  toman: string;
  perProvider: string;
  reviews: (n: number) => string;
  breadcrumbHome: string;
};

const num = (value: number, locale: string) =>
  value.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");

const range = (
  f: LandingFacts,
  locale: string,
  toman: string,
  from: string,
  to: string
) =>
  f.minPriceToman && f.maxPriceToman
    ? f.minPriceToman === f.maxPriceToman
      ? ` ${num(f.minPriceToman, locale)} ${toman}`
      : ` ${from} ${num(f.minPriceToman, locale)} ${to} ${num(f.maxPriceToman, locale)} ${toman}`
    : "";

const FA: Copy = {
  title: (f) =>
    `${f.service} در ${f.city}؛ مقایسه ${num(f.providers, "fa")} کلینیک و قیمت | السوین`,
  h1: (f) => `${f.service} در ${f.city}`,
  description: (f) => {
    const price = range(f, "fa", "تومان", "قیمت از", "تا");
    return `مقایسه ${num(f.providers, "fa")} مرکز درمانی ارائه‌دهنده‌ی ${f.service} در ${f.city}${price ? ` —${price}` : ""}. نظر بیماران، موقعیت و رزرو آنلاین در السوین.`;
  },
  intro: (f) => {
    const price = range(f, "fa", "تومان", "قیمت‌ها از", "تا");
    const rating = f.avgRating
      ? ` میانگین امتیاز: ${num(Number(f.avgRating.toFixed(1)), "fa")} از ۵.`
      : "";
    return `${num(f.providers, "fa")} مرکز درمانی ${f.service} را در ${f.city} از طریق السوین ارائه می‌دهند.${price ? `${price}.` : ""}${rating}`;
  },
  listHeading: "مراکز و قیمت‌ها",
  otherCities: (service) => `${service} در شهرهای دیگر`,
  otherServices: (city) => `خدمات دیگر در ${city}`,
  searchCta: "جستجوی دقیق‌تر (محله، پزشک، قیمت)",
  toman: "تومان",
  perProvider: "ارائه‌دهنده",
  reviews: (n) => `${num(n, "fa")} نظر`,
  breadcrumbHome: "خانه",
};

const EN: Copy = {
  title: (f) =>
    `${f.service} in ${f.city}: compare ${f.providers} clinics and prices | LSevin`,
  h1: (f) => `${f.service} in ${f.city}`,
  description: (f) => {
    const price = range(f, "en", "Toman", "prices from", "to");
    return `Compare ${f.providers} providers of ${f.service} in ${f.city}${price ? ` —${price}` : ""}. Patient reviews, locations and online booking on LSevin.`;
  },
  intro: (f) => {
    const price = range(f, "en", "Toman", "Prices range from", "to");
    const rating = f.avgRating
      ? ` Average rating: ${f.avgRating.toFixed(1)} out of 5.`
      : "";
    return `${f.providers} providers offer ${f.service} in ${f.city} through LSevin.${price ? `${price}.` : ""}${rating}`;
  },
  listHeading: "Providers and prices",
  otherCities: (service) => `${service} in other cities`,
  otherServices: (city) => `Other treatments in ${city}`,
  searchCta: "Refine your search (neighborhood, doctor, price)",
  toman: "Toman",
  perProvider: "provider",
  reviews: (n) => `${n} review${n === 1 ? "" : "s"}`,
  breadcrumbHome: "Home",
};

export const landingCopy = (locale: string): Copy =>
  locale === "fa" ? FA : EN;

type JsonLdInput = {
  locale: string;
  facts: LandingFacts;
  /** locale-less path -> absolute URL in this locale */
  abs: (path: string) => string;
  pagePath: string;
  offers: { title: string; provider: string; path: string }[];
};

/** BreadcrumbList + ItemList (the providers on the page). Plain data, validated by unit tests. */
export function buildLandingJsonLd({
  locale,
  facts,
  abs,
  pagePath,
  offers,
}: JsonLdInput) {
  const copy = landingCopy(locale);
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: copy.breadcrumbHome,
          item: abs(""),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: copy.h1(facts),
          item: abs(pagePath),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: copy.h1(facts),
      numberOfItems: offers.length,
      itemListElement: offers.map((offer, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: abs(offer.path),
        name: offer.provider
          ? `${offer.title} — ${offer.provider}`
          : offer.title,
      })),
    },
  ];
}
