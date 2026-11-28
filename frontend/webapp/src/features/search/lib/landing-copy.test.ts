import { describe, expect, it } from "vitest";

import {
  buildLandingJsonLd,
  landingCopy,
  type LandingFacts,
} from "./landing-copy";

const facts: LandingFacts = {
  service: "کاشت مو",
  city: "تهران",
  providers: 7,
  minPriceToman: 30_000_000,
  maxPriceToman: 90_000_000,
  avgRating: 4.36,
};
const en: LandingFacts = {
  ...facts,
  service: "Hair transplant",
  city: "Tehran",
};

describe("landing copy", () => {
  it("Persian text carries the numbers in Persian digits and mentions service, city and price range", () => {
    const copy = landingCopy("fa");
    expect(copy.h1(facts)).toBe("کاشت مو در تهران");
    expect(copy.title(facts)).toContain("۷");
    expect(copy.description(facts)).toContain("۳۰٬۰۰۰٬۰۰۰");
    expect(copy.description(facts)).toContain("۹۰٬۰۰۰٬۰۰۰");
    expect(copy.intro(facts)).toContain("۴٫۴");
  });

  it("English text for English and for every other locale", () => {
    for (const locale of ["en", "tr", "ar", "ru"]) {
      expect(landingCopy(locale).h1(en)).toBe("Hair transplant in Tehran");
    }
    expect(landingCopy("en").description(en)).toMatch(
      /Compare 7 providers of Hair transplant in Tehran/
    );
  });

  it("never prints undefined/NaN, even without prices or ratings", () => {
    const bare: LandingFacts = {
      ...facts,
      minPriceToman: null,
      maxPriceToman: null,
      avgRating: null,
    };
    for (const locale of ["fa", "en"]) {
      const copy = landingCopy(locale);
      for (const text of [
        copy.title(bare),
        copy.h1(bare),
        copy.description(bare),
        copy.intro(bare),
      ]) {
        expect(text).not.toMatch(/undefined|NaN|null/);
      }
    }
    expect(
      landingCopy("en").description({
        ...en,
        minPriceToman: 5,
        maxPriceToman: 5,
      })
    ).toContain("5 Toman");
  });

  it("title stays within a sensible length for a result page", () => {
    expect(landingCopy("fa").title(facts).length).toBeLessThanOrEqual(90);
    expect(landingCopy("en").title(en).length).toBeLessThanOrEqual(90);
  });
});

describe("landing JSON-LD", () => {
  const abs = (path: string) => `https://example.test/fa${path}`;
  const data = buildLandingJsonLd({
    locale: "fa",
    facts,
    abs,
    pagePath: "/find/hair-transplant/tehran",
    offers: [
      { title: "کاشت مو", provider: "کلینیک آرتا", path: "/services/a" },
      { title: "کاشت مو", provider: "", path: "/services/b" },
    ],
  });

  it("is a breadcrumb trail ending at this page", () => {
    const crumbs = data[0] as {
      "@type": string;
      itemListElement: { position: number; item: string }[];
    };
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[1].item).toBe(
      "https://example.test/fa/find/hair-transplant/tehran"
    );
  });

  it("lists the providers with absolute URLs and consecutive positions", () => {
    const list = data[1] as {
      "@type": string;
      numberOfItems: number;
      itemListElement: { position: number; url: string; name: string }[];
    };
    expect(list["@type"]).toBe("ItemList");
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement.map((i) => i.url)).toEqual([
      "https://example.test/fa/services/a",
      "https://example.test/fa/services/b",
    ]);
    expect(list.itemListElement[0].name).toBe("کاشت مو — کلینیک آرتا");
    expect(list.itemListElement[1].name).toBe("کاشت مو");
  });

  it("round-trips as JSON", () => {
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });
});
