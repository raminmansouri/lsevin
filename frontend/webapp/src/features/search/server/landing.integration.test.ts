import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import sql from "@/config/database/db";

import { getLanding, listLandingPages } from "./landing";
import { loadLandingPage } from "./landing-page";

/**
 * unified_search.landing_pages and the page loader on a real database (name must end in "_it").
 * Qualifying rule: >= 3 distinct public providers for a treatment in a city LSevin can name,
 * with an unambiguous English slug for the treatment.
 */
const dbName = new URL(
  process.env.DATABASE_URL ?? "postgres://x/none"
).pathname.slice(1);
process.env.NEXT_PUBLIC_URL = "https://example.test";

const id = () => randomUUID();
const def = {
  hair: id(),
  hairTwin: id(),
  nose: id(),
  inactive: id(),
  lonely: id(),
};
let categoryId = "";
let docCounter = 0;

async function addDefinition(
  definitionId: string,
  en: string,
  fa: string,
  active = true
) {
  await sql`
    insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value)
    values (${definitionId}, ${sql.json({ "en-US": en, "fa-IR": fa })}, ${sql.json({})}, ${categoryId}, 60, 'Fixed', ${active}, 'IRR', 1)`;
}

async function addOffer(
  serviceKey: string,
  city: string,
  provider: string,
  opts: { price?: number; isPublic?: boolean; quality?: number } = {}
) {
  docCounter += 1;
  await sql`
    insert into unified_search.documents (doc_type, source_id, title, subtitle, url, city, price_toman, rating, quality, service_key, provider_id, search_text, content_hash, is_public)
    values ('offer', ${`lp-${docCounter}-${provider}`}, ${sql.json({ "fa-IR": "کاشت مو" })}, ${sql.json({ "fa-IR": `کلینیک ${provider}` })},
            ${`/services/lp-${docCounter}`}, ${city}, ${opts.price ?? 40_000_000}, 4.5, ${opts.quality ?? 0.5}, ${serviceKey}, ${provider},
            'x', 'h', ${opts.isPublic ?? true})`;
}

describe.skipIf(!dbName.endsWith("_it"))(
  "landing pages (real database)",
  () => {
    beforeAll(async () => {
      categoryId = (
        await sql`select id::text as id from category.categories limit 1`
      )[0].id;
      await sql`truncate unified_search.documents`;
      await addDefinition(def.hair, "Hair transplant", "کاشت مو");
      await addDefinition(def.hairTwin, "Hair Transplant", "کاشت موی دوقلو"); // same slug -> ambiguous
      await addDefinition(def.nose, "Rhinoplasty", "جراحی بینی");
      await addDefinition(def.inactive, "Old treatment", "قدیمی", false);
      await addDefinition(def.lonely, "Lonely treatment", "تنها");

      // hair x tehran: 3 providers (qualifies) ... but the twin definition shares the slug -> neither is published
      for (const p of ["a", "b", "c"]) await addOffer(def.hair, "tehran", p);
      for (const p of ["d", "e", "f"])
        await addOffer(def.hairTwin, "tehran", p);
      // nose x tehran: 3 providers, one with two offers
      for (const p of ["a", "b", "c", "c"])
        await addOffer(def.nose, "tehran", p, { price: 90_000_000 });
      // nose x isfahan: only 2 providers
      for (const p of ["a", "b"]) await addOffer(def.nose, "isfahan", p);
      // nose x mashhad: 3 providers but one offer is not public
      await addOffer(def.nose, "mashhad", "a");
      await addOffer(def.nose, "mashhad", "b");
      await addOffer(def.nose, "mashhad", "c", { isPublic: false });
      // a city LSevin cannot name
      for (const p of ["a", "b", "c"])
        await addOffer(def.nose, "nowhere-town", p);
      // inactive treatment
      for (const p of ["a", "b", "c"])
        await addOffer(def.inactive, "tehran", p);
      // nose x shiraz: 3 providers -> qualifies, used for linking
      for (const p of ["a", "b", "c"]) await addOffer(def.nose, "shiraz", p);
    });

    afterAll(async () => {
      delete process.env.SEARCH_LANDING_PAGES;
      await sql`truncate unified_search.documents`;
      await sql`delete from category.service_definitions where id = any(${Object.values(def)})`;
      await sql.end({ timeout: 2 });
    });

    it("publishes only combinations with >= 3 distinct public providers, a nameable city and a unique slug", async () => {
      const rows = await sql<
        { service_slug: string; city_slug: string; providers: string }[]
      >`
      select service_slug, city_slug, providers from unified_search.landing_pages order by service_slug, city_slug`;
      expect(
        rows.map((r) => `${r.service_slug}/${r.city_slug}:${r.providers}`)
      ).toEqual(["rhinoplasty/shiraz:3", "rhinoplasty/tehran:3"]);
    });

    it("counts providers, not offers, and reports the price range", async () => {
      process.env.SEARCH_LANDING_PAGES = "1";
      const page = await getLanding("rhinoplasty", "tehran", "fa");
      expect(page?.providers).toBe(3);
      expect(page?.offers.length).toBe(4);
      expect(page?.minPriceToman).toBe(90_000_000);
      expect(page?.cityNames["fa-IR"]).toBe("تهران");
      expect(page?.cityNames["en-US"]).toBe("Tehran");
      expect(page?.otherCities.map((c) => c.citySlug)).toEqual(["shiraz"]);
    });

    it("rejects hostile or malformed slugs without touching the database", async () => {
      for (const [s, c] of [
        ["../etc/passwd", "tehran"],
        ["Rhinoplasty", "tehran"],
        ["rhinoplasty", "TEHRAN"],
        ["a".repeat(200), "tehran"],
        ["rhinoplasty", "te hran"],
        ["'; drop table x; --", "tehran"],
        ["", ""],
      ]) {
        expect(await getLanding(s, c, "fa"), `${s}/${c}`).toBeNull();
      }
    });

    it("the loader is dark until the flag is on, and 404s (null) for anything that does not qualify", async () => {
      delete process.env.SEARCH_LANDING_PAGES;
      expect(await loadLandingPage("fa", "rhinoplasty", "tehran")).toBeNull();
      process.env.SEARCH_LANDING_PAGES = "1";
      expect(
        await loadLandingPage("fa", "rhinoplasty", "tehran")
      ).not.toBeNull();
      expect(await loadLandingPage("fa", "rhinoplasty", "isfahan")).toBeNull(); // 2 providers
      expect(
        await loadLandingPage("fa", "hair-transplant", "tehran")
      ).toBeNull(); // ambiguous slug
      expect(await loadLandingPage("fa", "old-treatment", "tehran")).toBeNull(); // inactive
      expect(await loadLandingPage("zz", "rhinoplasty", "tehran")).toBeNull(); // unknown locale
    });

    it("metadata: canonical per locale, hreflang for fa+en only, other languages noindex", async () => {
      process.env.SEARCH_LANDING_PAGES = "1";
      const fa = (await loadLandingPage("fa", "rhinoplasty", "tehran"))!;
      expect(fa.metadata.alternates?.canonical).toBe(
        "https://example.test/fa/find/rhinoplasty/tehran"
      );
      expect(
        Object.keys(fa.metadata.alternates?.languages ?? {}).sort()
      ).toEqual(["en", "fa", "x-default"]);
      expect(fa.metadata.robots).toBeUndefined(); // indexable
      expect(
        String((fa.metadata.title as { absolute: string }).absolute)
      ).toContain("جراحی بینی");

      const tr = (await loadLandingPage("tr", "rhinoplasty", "tehran"))!;
      expect(tr.metadata.robots).toEqual({ index: false, follow: true });
      expect(tr.metadata.alternates?.languages).toBeUndefined();
    });

    it("JSON-LD lists exactly the providers shown, with absolute URLs", async () => {
      process.env.SEARCH_LANDING_PAGES = "1";
      const page = (await loadLandingPage("en", "rhinoplasty", "tehran"))!;
      const list = page.jsonLd[1] as {
        numberOfItems: number;
        itemListElement: { url: string }[];
      };
      expect(list.numberOfItems).toBe(page.data.offers.length);
      expect(
        list.itemListElement.every((item) =>
          item.url.startsWith("https://example.test/en/services/")
        )
      ).toBe(true);
    });

    it("the sitemap list carries the languages the page text exists in", async () => {
      const pages = await listLandingPages();
      expect(pages.map((p) => `${p.serviceSlug}/${p.citySlug}`).sort()).toEqual(
        ["rhinoplasty/shiraz", "rhinoplasty/tehran"]
      );
      for (const page of pages)
        expect(page.locales.sort()).toEqual(["en", "fa"]);
    });
  }
);
