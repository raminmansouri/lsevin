import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { encode } from "next-auth/jwt";

/**
 * Editorial pages and FAQs, end to end: the public pages (seeded by migration
 * 0086), the admin → Editorial hub, editing a page and creating/deleting an FAQ
 * through the real forms and server actions, persistence after reload, and the
 * admin guard. Against a real local Postgres with migrations 0085/0086 applied.
 *
 * Needs E2E_BASE_URL, E2E_DATABASE_URL, E2E_AUTH_SECRET — all localhost only
 * (`pnpm test:local-env`). Rows it changes are restored afterwards.
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:3140";
const DB_URL = process.env.E2E_DATABASE_URL || "";
const SECRET = process.env.E2E_AUTH_SECRET || "";
const isLocal = (value: string) => {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};
const RUNNABLE = Boolean(DB_URL && SECRET && isLocal(DB_URL) && isLocal(BASE));
test.skip(!RUNNABLE, "Run through `pnpm test:local-env` (needs a local database with migrations 0085/0086 and AUTH_SECRET).");

const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;
const tag = `qa${Date.now().toString(36).replace(/[0-9]/g, (digit) => "abcdefghij"[Number(digit)])}`;
const adminId = randomUUID();
let pricingBackup: Record<string, unknown> | null = null;

async function attachShot(page: Page, testInfo: TestInfo, name: string) {
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

async function signIn(context: BrowserContext, roles: string[]) {
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: "authjs.session-token",
    token: {
      sub: adminId,
      user: { id: adminId, roles, accessToken: "e2e", accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 },
    } as any,
  });
  await context.addCookies([{ name: "authjs.session-token", value, domain: new URL(BASE).hostname, path: "/", httpOnly: true, sameSite: "Lax" }]);
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1000);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const s = sql!;
  pricingBackup = (await s`select * from content.site_pages where slug = 'pricing-fees'`)[0] ?? null;
  await s`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
          values (${adminId}, 'E2E', 'Editor', '98', ${`${tag}-editor`}, ${`${tag}-EDITOR`}, ${`${tag}@example.com`}, ${`${tag.toUpperCase()}@EXAMPLE.COM`}, true, ${`912${Date.now().toString().slice(-7)}`}, true, false, false, 0)`;
});

test.afterAll(async () => {
  const s = sql;
  if (!s) return;
  await s`delete from content.faq_items where question_translations::text like ${`%${tag}%`}`;
  await s`delete from content.site_pages where slug = 'pricing-fees'`;
  if (pricingBackup) await s`insert into content.site_pages ${s(pricingBackup)}`;
  await s`delete from identity.asp_net_users where id = ${adminId}`;
  await s.end({ timeout: 5 });
});

test("public about page: direct URL, every locale, FAQ, schema, footer link, refresh", async ({ page }, testInfo) => {
  const [about] = await sql!`select is_published, title_translations from content.site_pages where slug = 'about-us'`;
  test.skip(!about?.is_published, "about-us is not published in this database");

  for (const locale of ["fa", "en", "ar", "de", "ku"]) {
    const response = await page.goto(`/${locale}/about-us`);
    expect(response?.status(), locale).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("[data-site-page='about-us'] h1")).toBeVisible();
  }

  await page.goto("/en/about-us");
  await expect(page.locator("[data-site-page='about-us'] h1")).toHaveText(about.title_translations["en-US"]);
  const schemas = await page.$$eval('script[type="application/ld+json"]', (nodes) => nodes.map((node) => node.textContent ?? ""));
  expect(schemas.some((text) => text.includes('"AboutPage"'))).toBe(true);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /\/en\/about-us$/);
  // FAQ block: native details/summary, opened by keyboard.
  const faq = page.locator("#faq");
  if (await faq.count()) {
    const first = faq.locator("summary").first();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(faq.locator("details").first()).toHaveAttribute("open", "");
  }
  await attachShot(page, testInfo, "site-content__about__en");
  await page.reload();
  await expect(page.locator("[data-site-page='about-us'] h1")).toBeVisible();

  // Desktop footer and phone links reach the page.
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/en/n/app/mobile/categories");
  await expect(page.locator("footer").getByRole("link", { name: about.title_translations["en-US"] })).toBeVisible();
});

test("an unpublished page is a 404", async ({ page }) => {
  const [contact] = await sql!`select is_published from content.site_pages where slug = 'contact-us'`;
  test.skip(Boolean(contact?.is_published), "contact-us is published in this database");
  const response = await page.goto("/en/contact-us");
  expect(response?.status()).toBe(404);
});

test("customers cannot open the editorial admin", async ({ page, context }) => {
  await signIn(context, ["customer"]);
  await page.goto("/en/admin/editorial");
  await expect(page.getByTestId("site-pages-table")).toHaveCount(0);
});

test("admin edits and publishes a page; it persists and goes live", async ({ page, context }, testInfo) => {
  await signIn(context, ["superadmin", "admin"]);
  await page.goto("/en/admin/editorial");
  await expect(page.getByTestId("site-pages-table")).toBeVisible();
  await attachShot(page, testInfo, "site-content__admin__hub");
  await page.locator("tr[data-slug='pricing-fees']").getByRole("link").click();
  await expect(page).toHaveURL(/\/admin\/editorial\/pages\/pricing-fees$/);
  await settle(page);

  const form = page.getByTestId("site-page-form");
  const title = `${tag} Pricing and fees`;
  await form.getByLabel(/^Title \(/).fill(title);
  // A body is needed to publish; the seeded draft has one, but type one if this database has none.
  const editor = form.locator("[contenteditable='true']").filter({ visible: true }).first();
  if (!(await editor.innerText()).trim()) {
    await editor.click();
    await page.keyboard.type(`${tag} Prices are shown before you pay.`);
  }
  await form.getByRole("switch", { name: "Published" }).click();
  await form.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible({ timeout: 60_000 });

  await page.reload();
  await settle(page);
  await expect(page.getByTestId("site-page-form").getByLabel(/^Title \(/)).toHaveValue(title);
  const [row] = await sql!`select is_published, title_translations ->> 'en-US' as title from content.site_pages where slug = 'pricing-fees'`;
  expect(row).toMatchObject({ is_published: true, title });

  const response = await page.goto("/en/pricing-fees");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await attachShot(page, testInfo, "site-content__pricing__published");
});

test("admin creates an FAQ for the home page, sees it live, then deletes it", async ({ page, context }, testInfo) => {
  await signIn(context, ["superadmin", "admin"]);
  await page.goto("/en/admin/editorial/faqs/new?scope=search");
  await settle(page);
  const form = page.getByTestId("faq-form");
  const question = `${tag} Can I search without an account?`;
  await form.getByLabel(/^Question \(/).fill(question);
  await form.locator("[contenteditable='true']").filter({ visible: true }).first().click();
  await page.keyboard.type("Yes. Search and browsing are open to guests.");
  await form.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/editorial\/faqs\/[0-9a-f-]{36}$/, { timeout: 60_000 });

  await page.reload();
  await settle(page);
  await expect(page.getByTestId("faq-form").getByLabel(/^Question \(/)).toHaveValue(question);
  await attachShot(page, testInfo, "site-content__faq__saved");

  await page.goto("/en/n/app/mobile/search");
  await expect(page.locator("#faq")).toContainText(question);
  const schemas = await page.$$eval('script[type="application/ld+json"]', (nodes) => nodes.map((node) => node.textContent ?? ""));
  expect(schemas.some((text) => text.includes('"FAQPage"') && text.includes(question))).toBe(true);
  await attachShot(page, testInfo, "site-content__faq__live");

  await page.goto("/en/admin/editorial?tab=faqs&scope=search");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Delete: ${question}` }).click();
  await expect(page.getByText("FAQ deleted.")).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => (await sql!`select count(*)::int as n from content.faq_items where question_translations::text like ${`%${tag}%`}`)[0].n).toBe(0);
  await page.goto("/en/n/app/mobile/search");
  await expect(page.getByText(question)).toHaveCount(0);
});

test("the FAQ form refuses a question without an answer", async ({ page, context }) => {
  await signIn(context, ["superadmin", "admin"]);
  await page.goto("/en/admin/editorial/faqs/new?scope=home");
  await settle(page);
  const form = page.getByTestId("faq-form");
  await form.getByLabel(/^Question \(/).fill(`${tag} unanswered?`);
  await form.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/faqs\/new/);
  await expect(page.getByText(/Add the answer for en-US/).first()).toBeVisible({ timeout: 60_000 });
});
