import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as llmsTxt } from "@/app/llms.txt/route";
import { allGuides, findGuide, guideLocales } from "@/features/guides/registry";
import { GUIDE_LOCALES } from "@/features/guides/types";
import { routing } from "@/i18n/routing";

import { languageAlternates } from "./alternates";
import { breadcrumbList, businessTypeFor, personSchema, providerSchema, serviceSchema } from "./entity-schema";
import { contentLanguageFor } from "./language-tags";
import { indexableLocalesFromKeys } from "./locale-eligibility";
import { buildPublicMetadata } from "./metadata";
import { toSeoPlainText } from "./plain-text";

vi.mock("@/config/database/db", () => ({ default: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => (key === "title" ? "LSevin" : "Health travel platform"),
}));

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com"));
afterEach(() => vi.unstubAllEnvs());

describe("indexable locales", () => {
  it("always keeps Persian and adds only locales present in the data", () => {
    expect(indexableLocalesFromKeys(["fa-IR", "en-US", "ar-SA"]).sort()).toEqual(["ar", "en", "fa"]);
    expect(indexableLocalesFromKeys([])).toEqual(["fa"]);
    expect(indexableLocalesFromKeys(null)).toEqual(["fa"]);
    // Short-form keys some rows carry ("ru") are not the catalog keys and do not count.
    expect(indexableLocalesFromKeys(["ru", "zh-CN"]).sort()).toEqual(["fa", "zh"]);
  });

  it("noindexes a locale left out of the eligible set and narrows hreflang", async () => {
    const english = await buildPublicMetadata({
      locale: "en",
      path: "/n/app/mobile/service/s",
      title: "Rhinoplasty",
      eligibleLocales: ["fa"],
    });
    expect(english.robots).toEqual({ index: false, follow: true });
    expect(Object.keys(english.alternates!.languages!).sort()).toEqual(["fa", "x-default"]);

    const persian = await buildPublicMetadata({
      locale: "fa",
      path: "/n/app/mobile/service/s",
      title: "عمل بینی",
      eligibleLocales: ["fa", "en"],
    });
    expect(persian.robots).toBeUndefined();
    expect(persian.alternates!.canonical).toBe("https://lsevincare.com/fa/n/app/mobile/service/s");
  });

  it("keeps pages indexable when no eligibility is supplied", async () => {
    const meta = await buildPublicMetadata({ locale: "tr", path: "/consulting", title: "Danışmanlık" });
    expect(meta.robots).toBeUndefined();
  });
});

describe("language tags", () => {
  it("publishes Sorani as ckb while URLs keep /ku", () => {
    expect(contentLanguageFor("ku")).toBe("ckb");
    expect(contentLanguageFor("fa")).toBe("fa");
    const languages = languageAlternates("/consulting");
    expect(languages.ckb).toBe("https://lsevincare.com/ku/consulting");
    expect(languages.ku).toBeUndefined();
    expect(Object.keys(languages)).toHaveLength(routing.locales.length + 1);
  });
});

describe("plain text", () => {
  it("treats placeholder punctuation as missing so a fallback is used", () => {
    expect(toSeoPlainText(".")).toBe("");
    expect(toSeoPlainText(" - ")).toBe("");
    expect(toSeoPlainText("کلینیک زیبایی")).toBe("کلینیک زیبایی");
  });
});

describe("entity schema", () => {
  it("maps provider types to schema.org business types in several languages", () => {
    expect(businessTypeFor("هتل")).toBe("Hotel");
    expect(businessTypeFor("Hospital")).toBe("Hospital");
    expect(businessTypeFor("کلینیک زیبایی")).toBe("MedicalClinic");
    expect(businessTypeFor("عيادة")).toBe("MedicalClinic");
    expect(businessTypeFor("دندانپزشکی")).toBe("Dentist");
    expect(businessTypeFor(null, "Gym Nation")).toBe("ExerciseGym");
    expect(businessTypeFor("Concierge")).toBe("LocalBusiness");
    // Type label beats the name, so all language versions of a provider agree.
    expect(businessTypeFor("Wellness center", "Fixture Clinic 1")).toBe("HealthAndBeautyBusiness");
    expect(businessTypeFor("مرکز تندرستی", "کلینیک آزمایشی ۱")).toBe("HealthAndBeautyBusiness");
    expect(businessTypeFor("نوع ناشناخته", "کلینیک آزمایشی ۱")).toBe("MedicalClinic");
  });

  it("states only page facts: no ratings, no empty fields, absolute URLs", () => {
    const node = providerSchema({
      locale: "fa",
      id: "p1",
      name: "کلینیک نمونه",
      providerType: "کلینیک",
      description: "{\"root\":{\"children\":[{\"text\":\"درمان پوست و مو\"}]}}",
      image: "/files/a.jpg",
      images: ["/files/a.jpg", "https://cdn.example.com/b.jpg"],
      city: "تهران",
      country: "Iran",
      latitude: 0,
      longitude: 0,
      services: [{ id: "s1", name: "لیزر" }],
      specialists: [],
    });
    const json = JSON.stringify(node);
    expect(node["@type"]).toBe("MedicalClinic");
    expect(node.url).toBe("https://lsevincare.com/fa/n/app/mobile/provider/p1");
    expect(node.description).toBe("درمان پوست و مو");
    expect(node.image).toEqual(["https://lsevincare.com/files/a.jpg", "https://cdn.example.com/b.jpg"]);
    expect(node.geo).toBeUndefined(); // 0,0 is a missing location, not the Gulf of Guinea
    expect(node.employee).toBeUndefined();
    expect(json).not.toMatch(/aggregateRating|ratingValue|price/);
  });

  it("links services and people back to their provider entity", () => {
    const service = serviceSchema({ locale: "en", id: "s1", name: "Rhinoplasty", providerId: "p1", providerName: "Clinic" });
    expect((service.provider as Record<string, string>)["@id"]).toBe(
      "https://lsevincare.com/en/n/app/mobile/provider/p1#business"
    );
    const person = personSchema({ locale: "en", id: "d1", name: "Dr. A", providers: [{ id: "p1", name: "Clinic" }] });
    expect((person.worksFor as Record<string, string>[])[0]["@id"]).toBe(service.provider && (service.provider as Record<string, string>)["@id"]);
    const crumbs = breadcrumbList([{ name: "Home", url: "u1" }, { name: "", url: "u2" }, { name: "Dr. A", url: "u3" }]);
    expect((crumbs.itemListElement as unknown[]).length).toBe(2);
  });
});

describe("guides", () => {
  it("every published copy is complete and consistent across languages", () => {
    for (const guide of allGuides()) {
      const locales = guideLocales(guide);
      expect(locales.length).toBeGreaterThan(0);
      const ids = locales.map((locale) => guide.copy[locale]!.sections.map((s) => s.id).join(","));
      expect(new Set(ids).size).toBe(1);
      for (const locale of locales) {
        const copy = guide.copy[locale]!;
        expect(copy.title.length).toBeGreaterThan(20);
        expect(copy.title.length).toBeLessThanOrEqual(70);
        expect(copy.description.length).toBeGreaterThanOrEqual(100);
        expect(copy.description.length).toBeLessThanOrEqual(170);
        expect(copy.h1 && copy.intro && copy.navLabel).toBeTruthy();
        expect(copy.faq.length).toBeGreaterThan(0);
        expect(copy.sources.length).toBeGreaterThan(0);
        for (const source of copy.sources) expect(source.url).toMatch(/^https:\/\//);
        for (const section of copy.sections) {
          expect(section.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
          for (const row of section.table?.rows ?? []) expect(row).toHaveLength(section.table!.columns.length);
        }
        // Plain text only; the page renders strings, not markup.
        expect(JSON.stringify(copy)).not.toMatch(/<[a-z]|\*\*|\]\(/i);
        if (locale === "fa") expect(JSON.stringify(copy)).not.toMatch(/ال سوین/);
      }
      for (const related of guide.related) expect(findGuide(locales[0], related)).not.toBeNull();
    }
  });

  it("has no fallback for languages without a written version", () => {
    expect(findGuide("tr", "")).toBeNull();
    expect(findGuide("fa", "not-a-guide")).toBeNull();
    expect(GUIDE_LOCALES).toEqual(["fa", "ar", "en"]);
  });

  it("lists every guide version in llms.txt on the canonical domain", async () => {
    const text = await llmsTxt().text();
    expect(text).toMatch(/^# LSevin/);
    expect(text).toContain("https://lsevincare.com/sitemap.xml");
    for (const guide of allGuides()) {
      for (const locale of guideLocales(guide)) {
        expect(text).toContain(`https://lsevincare.com/${locale}/medical-tourism${guide.slug ? `/${guide.slug}` : ""})`);
      }
    }
    expect(text).not.toContain("appmain.lsevin.com");
  });
});
