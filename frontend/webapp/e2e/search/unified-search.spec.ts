import postgres from "postgres";
import { expect, test } from "@playwright/test";

import { loadFixtures } from "../../src/features/search/__testing__/fixtures";

/**
 * Unified search, as a visitor uses it: direct URL, typing, keyboard, filters, refresh,
 * back/forward, outage behaviour. Real browser -> real app -> real Postgres -> real embeddings.
 */
const DB = process.env.SEARCH_E2E_DATABASE_URL || "postgres://lsevin:lsevin@127.0.0.1:55432/lsevin_search_it";
const HARNESS = process.env.SEARCH_E2E_HARNESS === "1";
const Q_EXAMPLE = "کاشت مو قیطریه تهران";

const sql = postgres(DB, { max: 2, onnotice: () => {} });

test.beforeAll(async () => {
  if (!new URL(DB).pathname.endsWith("_it")) throw new Error("SEARCH_E2E_DATABASE_URL must be a throw-away database ending in _it");
  const embeddingUp = await fetch(`${process.env.EMBEDDING_URL ?? "http://127.0.0.1:8089"}/health`).then((r) => r.ok).catch(() => false);
  await loadFixtures(sql, embeddingUp);
  await sql`delete from search.suggestions`;
  await sql`
    insert into search.suggestions (term, display, doc_type, weight) values
      ('کاشت مو', 'کاشت مو', 'offer', 0.8), ('کاشت مو fue', 'کاشت موی FUE', 'offer', 0.7),
      ('تور یزد', 'تور تاریخی یزد', 'tour', 0.6), ('تور تخت جمشید', 'تور یک روزه تخت جمشید', 'tour', 0.6)`;
});
test.afterAll(async () => {
  await sql.end({ timeout: 2 });
});

const results = (page: import("@playwright/test").Page) => page.getByTestId("search-result");
const box = (page: import("@playwright/test").Page) => page.getByRole("combobox");

test.describe("search page", () => {
  test("@critical direct URL: the example query ranks the Gheytarieh clinic first, with distance", async ({ page }) => {
    await page.goto(`/fa/search?q=${encodeURIComponent(Q_EXAMPLE)}`);
    await expect(page.getByTestId("search-page")).toBeVisible();
    await expect(results(page).first()).toContainText("کلینیک زیبایی آرتا");
    await expect(results(page).first()).toContainText("۰٫۱ کیلومتر");
    await expect(page.getByTestId("search-summary")).toContainText("قیطریه");
    // Elahieh (about 2 km) comes before Sadeghieh (about 13 km); the Isfahan clinic is not offered at all.
    const text = await page.getByTestId("search-confident").innerText();
    expect(text.indexOf("مرکز مو و پوست الهیه")).toBeLessThan(text.indexOf("کلینیک دکتر کوچالی"));
    expect(text).not.toContain("اصفهان");
    await expect(box(page)).toHaveValue(Q_EXAMPLE);
  });

  test("@critical refresh keeps the query and the results; back/forward move between searches", async ({ page }) => {
    await page.goto(`/fa/search?q=${encodeURIComponent(Q_EXAMPLE)}`);
    await page.reload();
    await expect(results(page).first()).toContainText("کلینیک زیبایی آرتا");

    await box(page).fill("تور یزد");
    await box(page).press("Enter");
    await expect(page).toHaveURL(/q=%D8%AA%D9%88%D8%B1\+%DB%8C%D8%B2%D8%AF|q=تور(\+|%20)یزد/);
    await expect(results(page).first()).toContainText("یزد");

    await page.goBack();
    await expect(results(page).first()).toContainText("کلینیک زیبایی آرتا");
    await expect(box(page)).toHaveValue(Q_EXAMPLE);
    await page.goForward();
    await expect(results(page).first()).toContainText("یزد");
  });

  test("@critical autocomplete: keyboard selects a suggestion and searches it", async ({ page }) => {
    await page.goto("/fa/search");
    await box(page).click();
    await box(page).pressSequentially("کاشت", { delay: 40 });
    const list = page.getByRole("listbox");
    await expect(list.getByRole("option").first()).toBeVisible();
    await expect(box(page)).toHaveAttribute("aria-expanded", "true");

    await box(page).press("ArrowDown");
    await box(page).press("ArrowDown");
    const active = await box(page).getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    await expect(page.locator(`[id="${active}"]`)).toHaveAttribute("aria-selected", "true");
    const chosen = (await page.locator(`[id="${active}"]`).locator("span").first().innerText()).trim();

    await box(page).press("Enter");
    await expect(page).toHaveURL(/\/fa\/search\?q=/);
    await expect(box(page)).toHaveValue(chosen);
    await expect(results(page).first()).toBeVisible();
  });

  test("@regression Escape closes the suggestions and keeps what was typed (Chrome clears type=search on Escape)", async ({ page }) => {
    await page.goto("/fa/search");
    await box(page).click();
    await box(page).pressSequentially("تور", { delay: 40 });
    await expect(page.getByRole("listbox").getByRole("option").first()).toBeVisible();
    await box(page).press("Escape");
    await expect(box(page)).toHaveAttribute("aria-expanded", "false");
    await expect(box(page)).toHaveValue("تور");
    await box(page).press("Enter");
    await expect(page).toHaveURL(/q=/);
    await expect(page.getByTestId("search-summary")).toContainText("تور");
  });

  test("clicking a suggestion with the mouse searches it", async ({ page }) => {
    await page.goto("/fa/search");
    await box(page).click();
    await box(page).pressSequentially("تور", { delay: 40 });
    await page.getByRole("option", { name: /تور تاریخی یزد/ }).click();
    await expect(page).toHaveURL(/q=/);
    await expect(results(page).first()).toContainText("یزد");
  });

  test("an empty submit does nothing; the intro text shows without a query", async ({ page }) => {
    await page.goto("/fa/search");
    await expect(page.getByTestId("search-page")).toContainText("نام خدمت، شهر یا محله را بنویسید.");
    await page.getByRole("button", { name: "جستجو" }).click();
    await expect(page).toHaveURL(/\/fa\/search$/);
  });

  test("type filter shows only that type and is reflected in the URL", async ({ page }) => {
    await page.goto(`/fa/search?q=${encodeURIComponent("مو")}`);
    await page.getByRole("navigation").getByRole("link", { name: "مقاله", exact: true }).click();
    await expect(page).toHaveURL(/type=article/);
    await expect(results(page).first()).toBeVisible();
    for (const type of await results(page).evaluateAll((els) => els.map((el) => el.getAttribute("data-doc-type")))) {
      expect(type).toBe("article");
    }
    await expect(page.getByRole("navigation").getByRole("link", { name: "مقاله", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("gibberish: says nothing matched exactly and offers the closest options, never an error", async ({ page }) => {
    await page.goto(`/fa/search?q=${encodeURIComponent("qwrtzx plkmn vbnm")}`);
    await expect(page.getByTestId("search-empty")).toBeVisible();
    await expect(page.getByTestId("search-alternatives")).toContainText("نتیجه‌ی دقیقی پیدا نشد.");
  });

  test("hostile input is shown as text and never breaks the page", async ({ page }) => {
    const evil = `<script>window.__pwned=1</script>'; drop table search.documents; --`;
    await page.goto(`/fa/search?q=${encodeURIComponent(evil)}`);
    await expect(page.getByTestId("search-page")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
    await expect(box(page)).toHaveValue(evil.slice(0, 160));
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from search.documents`;
    expect(n).toBeGreaterThan(0);
  });

  test("the suggestion service failing does not break typing or searching", async ({ page }) => {
    await page.route("**/api/search/suggest*", (route) => route.fulfill({ status: 503, body: '{"error":"search_unavailable"}', contentType: "application/json" }));
    await page.goto("/fa/search");
    await box(page).pressSequentially("کاشت مو", { delay: 30 });
    await expect(page.getByRole("listbox")).toBeHidden();
    await box(page).press("Enter");
    await expect(results(page).first()).toBeVisible();
  });

  test("an outage is shown as 'unavailable', not as 'nothing found'", async ({ page }) => {
    test.skip(!HARNESS, "the simulated outage switch (?fail=1) exists only in the harness");
    await page.goto(`/fa/search?q=${encodeURIComponent(Q_EXAMPLE)}&fail=1`);
    await expect(page.getByRole("alert").filter({ hasText: "جستجو موقتاً در دسترس نیست." })).toBeVisible();
    await expect(page.getByTestId("search-empty")).toHaveCount(0);
  });

  test("result pages are not indexed", async ({ page }) => {
    test.skip(HARNESS, "needs the real app's metadata");
    await page.goto(`/fa/search?q=${encodeURIComponent(Q_EXAMPLE)}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("@mobile no horizontal overflow at 360px", async ({ page }) => {
    await page.goto(`/fa/search?q=${encodeURIComponent(Q_EXAMPLE)}`);
    await expect(results(page).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("English interface: left-to-right, English labels", async ({ page }) => {
    await page.goto(`/en/search?q=${encodeURIComponent("hair transplant gheytarieh tehran")}`);
    await expect(page.getByTestId("search-page")).toHaveAttribute("dir", "ltr");
    await expect(page.getByTestId("search-summary")).toContainText("result");
    await expect(results(page).first()).toBeVisible();
  });
});

test.describe("search API", () => {
  test("@critical returns ranked JSON, never cached", async ({ request }) => {
    const response = await request.get(`/api/search?q=${encodeURIComponent(Q_EXAMPLE)}&locale=fa&limit=5`);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const json = await response.json();
    expect(json.results[0].href).toBe("/fa/services/hair-gheytarieh");
    expect(json.place.name).toBe("قیطریه");
    expect(json.results.length).toBeLessThanOrEqual(5);
  });

  test("validation: missing, empty and over-long queries and bad parameters are 400, not 500", async ({ request }) => {
    for (const url of ["/api/search", "/api/search?q=", `/api/search?q=${"a".repeat(500)}`, "/api/search?q=x&limit=9999", "/api/search?q=x&type=nope", "/api/search?q=x&locale=zz", "/api/search?q=x&lat=999&lng=1"]) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(400);
      expect((await response.json()).error).toBe("invalid_query");
    }
  });

  test("autocomplete: too-short input returns no suggestions; long input is rejected cleanly", async ({ request }) => {
    expect((await (await request.get("/api/search/suggest?q=%D9%83")).json()).suggestions).toEqual([]);
    expect((await request.get(`/api/search/suggest?q=${"a".repeat(200)}`)).status()).toBe(200);
  });

  test("rate limit: a burst from one client is answered with 429 and a retry hint", async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 70; i += 1) statuses.push((await request.get(`/api/search?q=${encodeURIComponent("کاشت مو")}&limit=1`)).status());
    expect(statuses).toContain(429);
    const limited = await request.get(`/api/search?q=x`);
    expect(limited.status()).toBe(429);
    expect(limited.headers()["retry-after"]).toBeTruthy();
  });
});
