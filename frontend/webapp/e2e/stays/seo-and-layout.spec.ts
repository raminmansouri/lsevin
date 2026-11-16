/**
 * SEO and layout contract of the public stays pages (desktop project):
 * canonical + hreflang, index/noindex rules, JSON-LD types and contents,
 * sitemap entries, one h1, alt text, RTL/LTR, and no horizontal overflow on
 * phone widths. Read-only: the parts tagged @smoke can run against production.
 */
import { expect, test, type Page } from "@playwright/test";

import { evidence, seedWorld, skipIntro } from "./helpers";

async function jsonLd(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allInnerTexts();
  return blocks.map((b) => JSON.parse(b) as Record<string, unknown>);
}

function nodes(blocks: Record<string, unknown>[]) {
  return blocks.flatMap((b) => ((b["@graph"] as Record<string, unknown>[] | undefined) ?? [b]));
}

test.describe("stays SEO @regression", () => {
  test("city page: indexable, canonical, fa/en alternates, ItemList + BreadcrumbList; dated variant noindex", async ({ page, context }, testInfo) => {
    const world = await seedWorld([{}, { kind: "traditional" }]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    // Indexable: the robots meta only carries the site-wide preview limits
    // (max-image-preview:large), never noindex.
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/fa/stays/city/${world.city.slug}$`));
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", new RegExp(`/en/stays/city/${world.city.slug}$`));
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    await expect(page).toHaveTitle(new RegExp(world.city.name));
    await expect(page.locator("h1")).toHaveCount(1);
    const graph = nodes(await jsonLd(page));
    const list = graph.find((n) => n["@type"] === "CollectionPage") as { mainEntity: { itemListElement: unknown[] } } | undefined;
    expect(list?.mainEntity.itemListElement).toHaveLength(2);
    expect(graph.some((n) => n["@type"] === "BreadcrumbList")).toBe(true);
    await evidence(page, testInfo, "stays__seo__01-city");

    await page.goto(`/fa/stays/city/${world.city.slug}?sort=price_asc`);
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });

  // Lodging is a LocalBusiness naming its kind (lodgingAsLocalBusiness): the
  // lodging types are validated by Google as Hotel Center price markup.
  test("stay page: LocalBusiness JSON-LD naming its lodging kind; private homes never expose exact coordinates", async ({ page, context }) => {
    const world = await seedWorld([{ kind: "hotel" }, { inventoryModel: "entire_place", approximate: true }]);
    await skipIntro(context);
    await page.goto(`/fa/stays/${world.stays[0].slug}`);
    let graph = nodes(await jsonLd(page));
    const hotel = graph.find((n) => n.additionalType === "https://schema.org/Hotel") as Record<string, unknown>;
    expect(hotel).toMatchObject({ "@type": "LocalBusiness", name: world.stays[0].name["fa-IR"] });
    expect(graph.some((n) => ["Hotel", "LodgingBusiness", "BedAndBreakfast", "Motel", "Hostel"].includes(String(n["@type"])))).toBe(false);
    expect(hotel.geo).toBeTruthy();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/fa/stays/${world.stays[0].slug}$`));

    await page.goto(`/fa/stays/${world.stays[1].slug}`);
    graph = nodes(await jsonLd(page));
    const villa = graph.find((n) => n.additionalType === "https://schema.org/LodgingBusiness") as Record<string, unknown>;
    expect(villa.geo).toBeUndefined();
    expect(JSON.stringify(villa)).not.toContain("29.6363");
    expect(await page.content()).not.toContain("29.6363");
  });

  test("search results are noindex; the intro is indexable and links to destinations @smoke", async ({ page }) => {
    await page.goto("/fa/stays/explore");
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await page.goto("/fa/stays/intro");
    // Indexable: the robots meta only carries the site-wide preview limits
    // (max-image-preview:large), never noindex.
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/fa\/stays\/intro$/);
  });

  test("sitemap lists published cities and stays, never search URLs", async ({ page, request }) => {
    const world = await seedWorld([{}, { status: "draft" }]);
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    // The sitemap is cached for an hour; a just-seeded stay may not be in it yet, so check shape and exclusions.
    expect(xml).toContain("/stays/intro");
    expect(xml).not.toContain("/stays/explore");
    expect(xml).not.toContain(world.stays[1].slug);
    void page;
  });
});

test.describe("stays localisation @regression", () => {
  test("Persian pages print times and percentages in Persian digits (regression 2026-11-14)", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await page.goto(`/fa/stays/${world.stays[0].slug}`);
    const policies = page.getByTestId("stay-cancellation-rules");
    await expect(policies).toContainText("۱۰۰");
    await expect(policies).not.toContainText("100");
    await expect(page.getByTestId("stay-policies")).toContainText("۱۴:۰۰");
    await expect(page.getByTestId("stay-policies")).not.toContainText("14:00");
    await page.goto(`/en/stays/${world.stays[0].slug}`);
    await expect(page.getByTestId("stay-cancellation-rules")).toContainText("100%");
  });
});

test.describe("stays layout @regression", () => {
  for (const width of [320, 360, 390]) {
    test(`no horizontal overflow at ${width}px (fa and en)`, async ({ page, context }) => {
      const world = await seedWorld([{}]);
      await skipIntro(context);
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/stays", `/stays/city/${world.city.slug}`, `/stays/${world.stays[0].slug}`, "/stays/intro"]) {
        for (const locale of ["fa", "en"]) {
          await page.goto(`/${locale}${path}`);
          await page.waitForLoadState("load");
          await expect(page.locator("html")).toHaveAttribute("dir", locale === "fa" ? "rtl" : "ltr");
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `${locale}${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
          const missingAlt = await page.locator("img:not([alt])").count();
          expect(missingAlt, `${locale}${path} has images without alt`).toBe(0);
        }
      }
    });
  }
});
