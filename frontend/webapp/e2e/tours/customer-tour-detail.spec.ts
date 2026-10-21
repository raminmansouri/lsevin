/**
 * Tour details against seeded published data:
 *   AT-03 6 images, 2-day itinerary, rules, prices and location match; draft text is never shown.
 *   AT-04 stop order is the saved order; no travel time/distance is invented.
 *   AT-33/AT-39 missing translation → labelled fallback, never blank sections or raw keys (de UI).
 *   AT-05 weather (dev server runs TOURS_WEATHER_PROVIDER=fixture): forecast with time + source,
 *         beyond-horizon date shows no numbers, provider failure → stale cached value / unavailable.
 */
import { expect, test } from "@playwright/test";

import { seedCatalog, skipIntro } from "./customer-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// First hits compile routes on the dev server (Turbopack can take minutes).
test.describe.configure({ timeout: 360_000 });
test.beforeEach(async ({ context }) => skipIntro(context));

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Moves a tour's meeting point to a unique spot so weather-cache rows of one test never affect another. */
async function uniqueLocation(tourId: string) {
  const lat = r3(30 + Math.random() * 5);
  const lng = r3(50 + Math.random() * 5);
  await db()`update tour.tours set meeting_lat = ${lat}, meeting_lng = ${lng} where id = ${tourId}::uuid`;
  return { lat, lng };
}

test("AT-03/AT-04: published content, gallery, itinerary order, rules, price, location", async ({ page }) => {
  const c = await seedCatalog([{ days: 2, images: 6, adultPrice: 12_000_000 }]);
  const tour = c.tours[0];
  // Unpublished edits must not leak: a draft-only field and a pending draft over a published title.
  await db()`insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, published_value, status, is_source)
             values (${tour.id}, 'tour', ${tour.id}, 'faq', 'en-US', 'SECRET DRAFT FAQ', null, 'draft', false)`;
  await db()`update tour.content set draft_value = 'UNPUBLISHED TITLE' where entity_id = ${tour.id}::uuid and field_key = 'title' and locale = 'en-US'`;

  await page.goto(`/en/tours/t/${tour.slug}`);
  const detail = page.getByTestId("tour-detail");
  await expect(detail).toBeVisible();
  await expect(page.getByTestId("tour-title")).toHaveText("Persepolis day tour");
  await expect(page.getByText("UNPUBLISHED TITLE")).toHaveCount(0);
  await expect(page.getByText("SECRET DRAFT FAQ")).toHaveCount(0);

  // Gallery: 6 approved images, counter, full-screen lightbox with caption, keyboard + Escape.
  await expect(page.getByTestId("gallery")).toHaveAttribute("data-image-count", "6");
  await expect(page.getByTestId("gallery-counter")).toHaveText("1 / 6");
  await page.getByRole("button", { name: "Open photo 1 of 6 in full screen" }).first().click();
  const lightbox = page.getByTestId("lightbox");
  await expect(lightbox).toBeVisible();
  await expect(page.getByTestId("lightbox-caption")).toHaveText("Photo 1");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("lightbox-counter")).toHaveText("2 / 6");
  await expect(page.getByTestId("lightbox-caption")).toHaveText("Photo 2");
  await page.keyboard.press("Escape");
  await expect(lightbox).toHaveCount(0);

  // Location / destination and provider.
  await expect(page.getByTestId("tour-location")).toContainText(`Shiraz`);
  await expect(page.getByTestId("verified-provider")).toBeVisible();

  // AT-04: two days, stops in the saved order, meeting and finish distinguished.
  const days = page.getByTestId("itinerary-day");
  await expect(days).toHaveCount(2);
  const titles = await page.getByTestId("itinerary-stop").getByTestId("stop-title").allInnerTexts();
  expect(titles.map((s) => s.trim())).toEqual(["Eram Square", "Persepolis", "Naqsh-e Rostam", "Pasargadae", "Return to Shiraz"]);
  const types = await page.getByTestId("itinerary-stop").evaluateAll((els) => els.map((e) => e.getAttribute("data-stop-type")));
  expect(types[0]).toBe("meeting");
  expect(types[types.length - 1]).toBe("finish");
  // No routing data was saved: travel time is labelled as not provided, never invented.
  await expect(page.getByTestId("travel-not-provided").first()).toBeVisible();
  await expect(page.getByTestId("itinerary").getByText(/\d+(\.\d+)?\s?km/)).toHaveCount(0);

  // Rules: the published cancellation table and texts.
  const rules = page.getByTestId("cancellation-rules");
  await expect(rules).toContainText("72 hours");
  await expect(rules).toContainText("100% refund");
  await expect(rules).toContainText("24 hours");
  await expect(rules).toContainText("50% refund");
  await expect(page.getByTestId("policies")).toContainText("No pets.");

  // Prices: "from … per person" on the sticky bar, matching the seeded adult tier.
  const sticky = page.getByTestId("sticky-book-bar");
  await expect(sticky.getByTestId("from-price")).toContainText("12,000,000");
  await expect(sticky.getByTestId("from-price")).toContainText("per person");
  await expect(page.getByTestId("inclusions")).toContainText("Admission tickets");
  await expect(page.getByTestId("exclusions")).toContainText("Tips");

  // Meeting point: exact disclosure → directions link.
  await expect(page.getByTestId("meeting")).toBeVisible();
  await expect(page.getByTestId("approximate-location")).toHaveCount(0);
});

test("approximate meeting point until booking (C-043)", async ({ page }) => {
  const c = await seedCatalog([{ locationPrivacy: "approximate" }]);
  await page.goto(`/en/tours/t/${c.tours[0].slug}`);
  await expect(page.getByTestId("approximate-location")).toBeVisible();
  await expect(page.getByText("Eram Square, in front of the main gate")).toHaveCount(0);
});

test("AT-33/AT-39: German UI shows labelled fallback content, no blanks or raw keys", async ({ page }) => {
  const c = await seedCatalog([{}]);
  await page.goto(`/de/tours/t/${c.tours[0].slug}`);
  await expect(page.getByTestId("tour-detail")).toBeVisible();
  await expect(page.getByTestId("fallback-badge").first()).toBeVisible();
  // Mandatory disclosures still present (source-language content) and no raw message keys.
  await expect(page.getByTestId("cancellation-rules")).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/TourApp\.|TourShared\.|MISSING_MESSAGE/);
  // The same fallback is labelled on Home cards.
  await page.goto(`/de/tours/explore?destination=${c.destination.slug}`);
  await expect(page.getByTestId("tour-card").first().getByTestId("fallback-badge")).toBeVisible();
});

test("AT-05: weather forecast, beyond-horizon, stale and unavailable states", async ({ page }) => {
  // Forecast inside the horizon (first departure in 3 days).
  const near = await seedCatalog([{ firstDepartureInDays: 3 }]);
  const loc = await uniqueLocation(near.tours[0].id);
  await page.goto(`/en/tours/t/${near.tours[0].slug}`);
  const card = page.getByTestId("weather-card");
  await expect(card).toHaveAttribute("data-weather-status", "ok");
  await expect(card).toHaveAttribute("data-weather-mode", "forecast");
  await expect(card.getByTestId("weather-forecast")).toContainText("°");
  await expect(card.getByTestId("weather-updated")).toBeVisible();
  await expect(card).toContainText("Source: Fixture weather (test data)");
  await expect(card.getByTestId("weather-stale")).toHaveCount(0);
  // Values are the provider's (deterministic fixture formula), not copied from a mockup.
  const [{ day }] = await db()<{ day: string }[]>`
    select starts_on::text as day from tour.departures where tour_id = ${near.tours[0].id}::uuid order by starts_at limit 1`;
  const seed = Math.abs(Math.round(loc.lat * 100) + Math.round(loc.lng * 100) + (Number(day.replace(/-/g, "")) % 97));
  const base = 10 + (seed % 20);
  await expect(card.getByTestId("weather-forecast")).toContainText(`${base - 5}° / ${base + 5}°`);

  // Beyond the forecast horizon: no current conditions presented as a forecast.
  const far = await seedCatalog([{ firstDepartureInDays: 40 }]);
  await uniqueLocation(far.tours[0].id);
  await page.goto(`/en/tours/t/${far.tours[0].slug}`);
  await expect(page.getByTestId("weather-card")).toHaveAttribute("data-weather-mode", "climate");
  await expect(page.getByTestId("weather-card").getByTestId("weather-climate")).toBeVisible();
  await expect(page.getByTestId("weather-card").getByText(/°C|° \//)).toHaveCount(0);

  // Provider failure with an older cached value → shown, labelled stale.
  const stale = await seedCatalog([{ firstDepartureInDays: 4 }]);
  const sloc = await uniqueLocation(stale.tours[0].id);
  const [{ target }] = await db()<{ target: string }[]>`
    select starts_on::text as target from tour.departures where tour_id = ${stale.tours[0].id}::uuid order by starts_at limit 1`;
  const key = `daily:${sloc.lat.toFixed(3)},${sloc.lng.toFixed(3)}:${target}`;
  await db()`insert into tour.weather_cache (cache_key, kind, latitude, longitude, target_date, payload, source, fetched_at, expires_at)
             values (${key}, 'daily', ${sloc.lat}, ${sloc.lng}, ${target}::date,
                     ${db().json({ current: null, forecast: { date: target, minC: 3, maxC: 9, condition: "rain", precipitationProbability: 80, windKph: 12 } } as never)},
                     'fixture', now() - interval '10 hours', now() - interval '1 hour')`;
  await db()`insert into tour.weather_cache (cache_key, kind, latitude, longitude, payload, source, fetched_at, expires_at)
             values (${`fixture:fail:${sloc.lat.toFixed(3)},${sloc.lng.toFixed(3)}`}, 'daily', ${sloc.lat}, ${sloc.lng}, '{}'::jsonb, 'fixture', now(), now() + interval '1 day')`;
  await page.goto(`/en/tours/t/${stale.tours[0].slug}`);
  const staleCard = page.getByTestId("weather-card");
  await expect(staleCard).toHaveAttribute("data-weather-freshness", "stale");
  await expect(staleCard.getByTestId("weather-stale")).toBeVisible();
  await expect(staleCard.getByTestId("weather-forecast")).toContainText("3° / 9°");

  // Provider failure and nothing cached → unavailable, no invented values.
  const none = await seedCatalog([{ firstDepartureInDays: 5 }]);
  const nloc = await uniqueLocation(none.tours[0].id);
  await db()`insert into tour.weather_cache (cache_key, kind, latitude, longitude, payload, source, fetched_at, expires_at)
             values (${`fixture:fail:${nloc.lat.toFixed(3)},${nloc.lng.toFixed(3)}`}, 'daily', ${nloc.lat}, ${nloc.lng}, '{}'::jsonb, 'fixture', now(), now() + interval '1 day')`;
  await page.goto(`/en/tours/t/${none.tours[0].slug}`);
  await expect(page.getByTestId("weather-card")).toHaveAttribute("data-weather-status", "unavailable");
  // The booking CTA is unaffected by the weather outage (AT-28).
  await expect(page.getByTestId("book-now")).toBeVisible();
});

test("unpublished / paused / unknown tours answer a real HTTP 404 (regression)", async ({ page }) => {
  const c = await seedCatalog([{}, { status: "draft" }]);
  const [live, draft] = c.tours;
  await db()`update tour.tours set status = 'paused' where id = ${live.id}::uuid`;
  for (const slug of [live.slug, draft.slug, `missing-${live.slug}`]) {
    const res = await page.goto(`/en/tours/t/${slug}`);
    expect(res?.status(), slug).toBe(404);
    await expect(page.getByTestId("tour-not-found")).toBeVisible();
  }
  const res = await page.goto(`/fa/tours/destinations/missing-${c.destination.slug}`);
  expect(res?.status()).toBe(404);
});

test("digits inside provider-authored text are never rewritten on Persian pages (regression)", async ({ page }) => {
  const c = await seedCatalog([{ titles: { "fa-IR": "تور 5e95 سال 2026", "en-US": "Tour 5e95 2026" }, adultPrice: 12_000_000 }]);
  await page.goto(`/fa/tours/t/${c.tours[0].slug}`);
  await expect(page.getByTestId("tour-title")).toHaveText("تور 5e95 سال 2026");
  // Give the platform-wide digit converter (MutationObserver) a chance to run.
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("tour-title")).toHaveText("تور 5e95 سال 2026");
  // Numbers the app formats itself are still localized.
  const price = await page.getByTestId("sticky-book-bar").getByTestId("from-price").innerText();
  expect(price).toMatch(/[۰-۹]/);
  expect(price).not.toMatch(/[0-9]/);
  await page.goto(`/fa/tours/explore?destination=${c.destination.slug}`);
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("tour-card").first().getByTestId("tour-card-link")).toHaveText("تور 5e95 سال 2026");
});
