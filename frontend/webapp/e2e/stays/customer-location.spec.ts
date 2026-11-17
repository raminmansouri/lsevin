/**
 * The 2026-11-17 round, as a guest uses it on a phone:
 *   - "near the shrine" with a radius, nearest first, distance + walking time on every card;
 *   - an empty search offers the change that finds stays (wider radius, remove filters);
 *   - the header back arrow stays inside stays and returns to the same search;
 *   - the date dialog says which date the next tap sets; month arrows point the right way in RTL;
 *   - the filters sheet's close button does not cover its title.
 */
import { expect, test, type Page } from "@playwright/test";

import { db, evidence, isoInDays, seedWorld, settled, skipIntro, watchErrors, type StayWorld } from "./helpers";

const SHRINE = { lat: 29.60971, lng: 52.54302 };

/** A city with a shrine landmark and stays 300 m, 1.5 km and 6 km north of it. */
async function shrineWorld(): Promise<StayWorld> {
  const world = await seedWorld([{ basePrice: 5_000_000 }, { basePrice: 4_000_000 }, { basePrice: 3_000_000 }]);
  const sql = db();
  await sql`insert into stay.landmarks (city_id, slug, kind, name, latitude, longitude, is_quick)
            values (${world.city.id}::uuid, 'haram', 'shrine', ${sql.json({ "fa-IR": "حرم شاهچراغ", "en-US": "Shah Cheragh Shrine" })}, ${SHRINE.lat}, ${SHRINE.lng}, true)`;
  const meters = [300, 1500, 6000];
  for (let i = 0; i < 3; i++) {
    await sql`update stay.properties set latitude = ${SHRINE.lat + meters[i] / 111320}, longitude = ${SHRINE.lng} where id = ${world.stays[i].id}::uuid`;
  }
  return world;
}

async function cards(page: Page) {
  return page.getByTestId("stay-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")));
}

test.describe("stays location search @critical", () => {
  test("near the shrine: radius, nearest first, distance and walking time; survives refresh", async ({ page, context }, testInfo) => {
    const world = await shrineWorld();
    await skipIntro(context);
    const errors = watchErrors(page);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    await expect(page.getByTestId("stay-card")).toHaveCount(3);

    await page.getByTestId("stays-near-haram").click();
    await expect(page).toHaveURL(/near=lm%3A[^&]+%2Fharam/);
    await expect(page).toHaveURL(/r=1000/);
    await expect(page).toHaveURL(/sort=distance/);
    await expect(page.getByTestId("stay-card")).toHaveCount(1);
    await expect(page.getByTestId("stays-anchor")).toContainText("حرم شاهچراغ");
    const distance = page.getByTestId("stay-card-distance");
    await expect(distance).toContainText("تا حرم شاهچراغ");
    await expect(distance).toContainText("دقیقه پیاده");
    await evidence(page, testInfo, "stays__location__01-near-shrine");

    await page.getByTestId("stays-radius-select").selectOption("2000");
    await expect(page.getByTestId("stay-card")).toHaveCount(2);
    expect(await cards(page)).toEqual([world.stays[0].slug, world.stays[1].slug]);

    await page.reload();
    await settled(page);
    expect(await cards(page)).toEqual([world.stays[0].slug, world.stays[1].slug]);
    await expect(page.getByTestId("stays-radius-select")).toHaveValue("2000");

    await page.getByTestId("stays-anchor-clear").click();
    await expect(page).not.toHaveURL(/near=/);
    await expect(page.getByTestId("stay-card")).toHaveCount(3);
    errors.assertClean();
  });

  test("an empty search offers a wider radius with its count, and one tap applies it", async ({ page, context }, testInfo) => {
    const world = await shrineWorld();
    await skipIntro(context);
    // The 300 m stay is in range but has no sauna.
    await page.goto(`/fa/stays/city/${world.city.slug}?near=lm:${world.city.slug}/haram&r=500&sort=distance&amen=sauna`);
    await settled(page);
    const empty = page.getByTestId("stays-empty");
    await expect(empty).toBeVisible();
    await expect(page.getByTestId("stays-empty-clear-filters")).toContainText("۱");
    await expect(page.getByTestId("stays-empty-popular").getByTestId("stay-card").first()).toBeVisible();
    await evidence(page, testInfo, "stays__location__02-empty-suggestions");
    await page.getByTestId("stays-empty-clear-filters").click();
    await expect(page).not.toHaveURL(/amen=/);
    await expect(page).toHaveURL(/near=/); // removing filters keeps the place
    await expect(page.getByTestId("stay-card")).toHaveCount(1);

    // Too tight a radius: the suggestion widens it.
    await db()`update stay.properties set latitude = ${SHRINE.lat + 800 / 111320} where id = ${world.stays[0].id}::uuid`;
    await page.goto(`/fa/stays/city/${world.city.slug}?near=lm:${world.city.slug}/haram&r=500`);
    await settled(page);
    await expect(page.getByTestId("stays-empty-wider")).toContainText("۱");
    await page.getByTestId("stays-empty-wider").click();
    await expect(page).toHaveURL(/r=1000|near=[^&]+$/);
    await expect(page.getByTestId("stay-card")).toHaveCount(1);
  });

  test("quick filters toggle in one tap and show as removable chips", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    await page.getByTestId("stays-quick-bf").click();
    await expect(page).toHaveURL(/bf=1/);
    await expect(page.getByTestId("stays-quick-bf")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("stay-card")).toHaveCount(1); // the seeded rate includes breakfast
    const chip = page.getByTestId("stays-active-filters").getByRole("button", { name: /حذف فیلتر با صبحانه/ });
    await chip.click();
    await expect(page).not.toHaveURL(/bf=1/);
  });
});

test.describe("stays navigation and dialogs @regression", () => {
  test("header back stays inside stays and returns to the same search (regression: it went to the Lsevin home)", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    const search = `/fa/stays/explore?city=${world.city.slug}&free=1`;
    await page.goto(search);
    await settled(page);
    await page.getByTestId("stay-card-link").first().click();
    await expect(page).toHaveURL(new RegExp(`/stays/${world.stays[0].slug}`));
    await settled(page);
    const back = page.getByTestId("stays-back");
    await expect(back).toHaveAttribute("href", /\/stays\/explore\?city=.*free=1/);
    await back.click();
    await expect(page).toHaveURL(/\/stays\/explore\?city=.*free=1/);
    await settled(page);
    await page.getByTestId("stays-back").click();
    await expect(page).toHaveURL(/\/fa\/stays$/);
    // The stays home offers to reopen that search and starts the form from it.
    await expect(page.getByTestId("stays-continue-search")).toBeVisible();
    await expect(page.getByTestId("stays-back-to-lsevin")).toBeVisible();
  });

  test("date dialog: step chips say which date is next; month arrows point outward in RTL", async ({ page, context }, testInfo) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    await page.getByTestId("stay-dates-button").click();
    const dialog = page.getByTestId("stay-dates-dialog");
    await expect(page.getByTestId("stay-dates-step-in")).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("stay-dates-prompt")).toContainText("ورود");

    // Pick by date, turning the month when the day is not on the visible page.
    const pick = async (iso: string) => {
      const day = dialog.locator(`[data-testid="stay-range-calendar"] button[data-iso="${iso}"]`);
      if ((await day.count()) === 0) await dialog.getByRole("button", { name: "ماه بعد" }).click();
      await day.click();
    };
    await pick(isoInDays(2));
    await expect(page.getByTestId("stay-dates-step-out")).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("stay-dates-prompt")).toContainText("حالا روز خروج را انتخاب کنید");
    await expect(page.getByTestId("stay-dates-step-in")).not.toContainText("انتخاب نشده");
    await pick(isoInDays(5));
    await expect(page.getByTestId("stay-dates-prompt")).toContainText("شب اقامت");
    await evidence(page, testInfo, "stays__dates__01-steps");

    // RTL: "next month" sits on the left and its chevron points left (regression: arrows were reversed).
    const prev = dialog.getByRole("button", { name: "ماه قبل" });
    const next = dialog.getByRole("button", { name: "ماه بعد" });
    const [pb, nb] = [await prev.boundingBox(), await next.boundingBox()];
    expect(nb!.x).toBeLessThan(pb!.x);
    const pointsLeft = async (btn: typeof next) =>
      btn.locator("svg").evaluate((svg) => {
        const right = svg.classList.contains("lucide-chevron-right");
        const mirrored = new DOMMatrix(getComputedStyle(svg).transform === "none" ? undefined : getComputedStyle(svg).transform).a < 0;
        return right === mirrored; // a right chevron mirrored, or a left one not mirrored
      });
    expect(await pointsLeft(next)).toBe(true);
    expect(await pointsLeft(prev)).toBe(false);
  });

  test("filters sheet: the close button does not overlap the title", async ({ page, context }, testInfo) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    await page.getByTestId("stays-filters-open").click();
    const sheet = page.getByTestId("stays-filters-sheet");
    await expect(sheet).toBeVisible();
    const title = await sheet.getByRole("heading", { name: "فیلترها" }).boundingBox();
    const close = await sheet.getByRole("button", { name: /close|بستن/i }).boundingBox();
    const overlap = !(close!.x + close!.width <= title!.x || title!.x + title!.width <= close!.x || close!.y + close!.height <= title!.y || title!.y + title!.height <= close!.y);
    await evidence(page, testInfo, "stays__filters__01-sheet-header");
    expect(overlap).toBe(false);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("city page shows its photograph, optimised (AVIF/WebP via next/image)", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await db()`update stay.cities set cover_url = '/images/stays/tabriz-el-goli-night.webp', cover_alt = ${db().json({ "fa-IR": "ائل‌گلی در شب" })} where id = ${world.city.id}::uuid`;
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    const img = page.getByTestId("stays-city-hero").locator("img");
    await expect(img).toHaveAttribute("alt", "ائل‌گلی در شب");
    await expect(img).toHaveAttribute("src", /\/_next\/image\?url=%2Fimages%2Fstays%2Ftabriz-el-goli-night\.webp/);
    const res = await page.request.get(await img.getAttribute("src")!, { headers: { accept: "image/avif,image/webp,*/*" } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/(avif|webp)/);
  });
});
