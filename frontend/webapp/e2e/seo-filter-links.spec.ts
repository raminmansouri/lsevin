import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Listing links carry slugs, never database ids (reported 2026-11-10):
 *
 *   /fa/categories?parent=<uuid>              -> /fa/categories/<slug>
 *   /fa/map?categoryId=<uuid>&view=list       -> /fa/categories/<slug>/providers
 *   /fa/explore?providerTypeId=<uuid>         -> /fa/specialties/<slug>
 *
 * Walks the pages a visitor reaches from home, checks every link they render,
 * follows the category and provider-type links with real clicks, refreshes and
 * goes back, and checks that the old id links answer one permanent redirect.
 *
 *   LINKS_BASE_URL=http://127.0.0.1:3143 \
 *   LINKS_DATABASE_URL=postgres://…@127.0.0.1:<port>/<the server's db> \
 *   npx playwright test -c playwright.seo-filter-links.config.ts
 *
 * The database is only read (to find a category and a type to test with).
 */

const BASE = process.env.LINKS_BASE_URL || "http://localhost:3000";
const DB_URL = process.env.LINKS_DATABASE_URL || "";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const ID_QUERY = /[?&](parent|categoryId|providerTypeId)=/;

type Fixture = {
  parent: { id: string; slug: string };
  leaf: { id: string; slug: string };
  type: { id: string; slug: string };
};

let fixture: Fixture;

test.beforeAll(async () => {
  test.skip(!DB_URL, "Set LINKS_DATABASE_URL to the database the server under test reads.");
  const sql = postgres(DB_URL, { max: 1, prepare: false });
  try {
    // A category with active children that hold providers, and one of those children.
    const [pair] = await sql<{ parentId: string; parentSlug: string; leafId: string; leafSlug: string }[]>`
      select p.id::text as "parentId", p.slug as "parentSlug", c.id::text as "leafId", c.slug as "leafSlug"
        from category.categories p
        join category.categories c on c.parent_id = p.id and c.is_active = true
       where p.is_active = true and p.parent_id is null and p.slug is not null and c.slug is not null
         and not exists (select 1 from category.categories g where g.parent_id = c.id and g.is_active = true)
         and exists (select 1 from category.service_providers sp where sp.category_id = c.id and sp.is_active = true)
         and lower(p.name_translations ->> 'en-US') <> 'tourism'
       order by p.display_order, c.display_order
       limit 1`;
    const [type] = await sql<{ id: string; slug: string }[]>`
      select pt.id::text as id, pt.slug from category.provider_types pt
       where pt.is_active = true and pt.slug is not null and category.provider_type_is_public(pt.id)
         and exists (select 1 from category.service_providers sp where sp.provider_type_id = pt.id and sp.is_active = true)
       order by pt.slug limit 1`;
    expect(pair, "a category with subcategories and providers").toBeTruthy();
    expect(type, "a provider type with providers").toBeTruthy();
    fixture = {
      parent: { id: pair.parentId, slug: pair.parentSlug },
      leaf: { id: pair.leafId, slug: pair.leafSlug },
      type,
    };
  } finally {
    await sql.end();
  }
});

async function settle(page: Page) {
  // Some image hosts never settle locally; idle or 15 s, whichever is first.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
}

async function linksOn(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href") || "")
      .filter((href) => href.startsWith("/") || href.includes("lsevincare.com"))
  );
}

function listingLinkProblems(hrefs: string[]) {
  return hrefs.filter((href) => {
    const path = href.replace(/^https?:\/\/[^/]+/, "");
    // Private flows (booking, profile, cart...) may carry ids; listings may not.
    if (/\/n\/app\/mobile\/(booking|bookings|profile|shop|notifications|support|search)/.test(path)) return false;
    return ID_QUERY.test(path) || (/^\/[a-z]{2}\/(categories|explore|map|offers|specialties)\b/.test(path) && UUID.test(path));
  });
}

test.describe("listing links", () => {
  for (const width of [390, 1440]) {
    test(`pages a visitor reaches link by slug (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const pages = [
        "/fa",
        "/en",
        "/fa/categories",
        `/fa/categories/${fixture.parent.slug}`,
        `/fa/categories/${fixture.leaf.slug}/providers`,
        "/fa/explore",
        `/fa/specialties/${fixture.type.slug}`,
        "/fa/map",
        "/fa/offers",
      ];
      for (const path of pages) {
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(response?.status(), path).toBeLessThan(400);
        await settle(page);
        expect(listingLinkProblems(await linksOn(page)), path).toEqual([]);
      }
    });
  }

  test("home category -> subcategories -> providers, with refresh and back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/fa/categories`, { waitUntil: "domcontentloaded" });
    await settle(page);
    const parentLink = page.locator(`a[href="/fa/categories/${fixture.parent.slug}"]:visible`).first();
    await expect(parentLink).toBeVisible();
    await parentLink.click();
    await page.waitForURL(new RegExp(`/fa/categories/${fixture.parent.slug}$`));
    // The breadcrumb names the category; its subcategories are links by slug.
    const leafLink = page.locator(`a[href="/fa/categories/${fixture.leaf.slug}/providers"]:visible`).first();
    await expect(leafLink).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/fa/categories/${fixture.parent.slug}$`));
    await expect(leafLink).toBeVisible();

    await leafLink.click();
    await page.waitForURL(new RegExp(`/fa/categories/${fixture.leaf.slug}/providers(\\?.*)?$`));
    await settle(page);
    // The map screen opens on the list; providers link by slug.
    await expect(page.locator('a[href*="/providers/"]:visible, [href*="/providers/"]').first()).toBeAttached();
    expect(page.url()).not.toMatch(ID_QUERY);
    expect(page.url()).not.toMatch(UUID);

    await page.goBack();
    await page.waitForURL(new RegExp(`/fa/categories/${fixture.parent.slug}$`));
    await page.goForward();
    await page.waitForURL(new RegExp(`/fa/categories/${fixture.leaf.slug}/providers`));
  });

  test("explore: a provider type opens its page, a category filters by slug", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fa/explore", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForFunction(() => typeof (window as unknown as { next?: unknown }).next === "object");

    const typeCard = page.locator(`a[href="/fa/specialties/${fixture.type.slug}"]:visible`).first();
    await expect(typeCard).toBeVisible();
    await typeCard.click();
    await page.waitForURL(new RegExp(`/fa/specialties/${fixture.type.slug}$`));
    await settle(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/fa/specialties/${fixture.type.slug}$`));

    await page.goto("/fa/explore", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForFunction(() => typeof (window as unknown as { next?: unknown }).next === "object");
    const chip = page.locator('a[href^="/fa/explore?category="]:visible').first();
    await expect(chip).toBeVisible();
    const href = (await chip.getAttribute("href"))!;
    await chip.click();
    await page.waitForURL((url) => url.pathname === "/fa/explore" && url.search === href.slice("/fa/explore".length));
    expect(page.url()).not.toMatch(UUID);
  });

  test("old id links answer one permanent redirect to the slug address", async ({ request }) => {
    const cases: [string, string][] = [
      [`/fa/categories?parent=${fixture.parent.id}`, `/fa/categories/${fixture.parent.slug}`],
      [`/fa/map?categoryId=${fixture.leaf.id}&view=list`, `/fa/categories/${fixture.leaf.slug}/providers`],
      [`/fa/map?categoryId=${fixture.leaf.id}`, `/fa/categories/${fixture.leaf.slug}/providers?view=map`],
      [`/fa/explore?providerTypeId=${fixture.type.id}`, `/fa/specialties/${fixture.type.slug}`],
      [`/fa/explore?categoryId=${fixture.leaf.id}`, `/fa/explore?category=${fixture.leaf.slug}`],
      [`/fa/offers?categoryId=${fixture.leaf.id}`, `/fa/offers?category=${fixture.leaf.slug}`],
      [`/fa/categories/${fixture.parent.id}`, `/fa/categories/${fixture.parent.slug}`],
      [`/fa/categories/${fixture.leaf.slug}`, `/fa/categories/${fixture.leaf.slug}/providers`],
    ];
    for (const [from, to] of cases) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect([301, 307, 308], from).toContain(response.status());
      const location = response.headers()["location"].replace(/^https?:\/\/[^/]+/, "");
      expect(location, from).toBe(to);
      // One hop: the target itself answers 200.
      const final = await request.get(to, { maxRedirects: 0 });
      expect(final.status(), to).toBe(200);
    }
  });

  test("category pages are canonical to themselves and in the sitemap", async ({ request }) => {
    for (const path of [`/fa/categories/${fixture.parent.slug}`, `/fa/categories/${fixture.leaf.slug}/providers`]) {
      const html = await (await request.get(path)).text();
      expect(html, path).toMatch(new RegExp(`<link rel="canonical" href="https?://[^"]+${path}"`));
      expect(html, path).not.toMatch(/<meta name="robots" content="noindex/);
    }
    const filtered = await request.get(`/fa/categories/${fixture.leaf.slug}/providers?view=map`);
    expect(filtered.headers()["x-robots-tag"]).toBe("noindex, follow");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`/fa/categories/${fixture.parent.slug}</loc>`);
    expect(sitemap).toContain(`/fa/categories/${fixture.leaf.slug}/providers</loc>`);
    expect(sitemap).not.toMatch(/categories\?parent=|categoryId=|providerTypeId=/);
  });
});
