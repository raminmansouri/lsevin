import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import postgres from "postgres";

/**
 * SEO tracker T37: Booking, Consultation, FormBuilder, MobileProfile and
 * ProviderOnboarding are no longer in the app shell's translation set; only the
 * routes that read them receive them. A route that lost a namespace it needs
 * renders the raw key path ("MobileProfile.settings.title") instead of text.
 * This opens each affected kind of page in a real browser at phone and desktop
 * width and looks for such key paths, and checks that public pages no longer
 * carry the big namespaces in their HTML.
 *
 *   ROUTE_MESSAGES_BASE_URL=http://127.0.0.1:3140 \
 *   ROUTE_MESSAGES_AUTH_SECRET=<the server's AUTH_SECRET> \
 *   ROUTE_MESSAGES_DATABASE_URL=postgres://…@127.0.0.1:<port>/<the server's db> \
 *   npx playwright test -c playwright.route-messages.config.ts
 *
 * The signed-in part inserts a throwaway user, mints a session cookie for it and
 * deletes the user afterwards; it runs only when the server and database are on
 * localhost.
 */

const BASE = process.env.ROUTE_MESSAGES_BASE_URL || "http://localhost:3000";
const SECRET = process.env.ROUTE_MESSAGES_AUTH_SECRET || "";
const isLocal = (() => {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(BASE).hostname);
  } catch {
    return false;
  }
})();

const RAW_KEY = /\b(?:Booking|Consultation|FormBuilder|MobileProfile|ProviderOnboarding|AdminGenerated)\.[a-zA-Z][\w.]*/;

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

async function expectNoRawKeys(page: Page, path: string, label: string) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /MISSING_MESSAGE/.test(message.text())) errors.push(message.text());
  });
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status(), path).toBeLessThan(400);
  // Some image hosts never settle locally; idle or 15 s, whichever is first.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  // Visible text and the labels assistive technology reads.
  const text = await page.evaluate(() => {
    const parts = [document.body.innerText];
    for (const el of Array.from(document.querySelectorAll("[aria-label],[placeholder],[title],img[alt]"))) {
      for (const attr of ["aria-label", "placeholder", "title", "alt"]) {
        const value = el.getAttribute(attr);
        if (value) parts.push(value);
      }
    }
    return parts.join("\n");
  });
  expect(text.match(RAW_KEY)?.[0] ?? null, `${label} ${path}`).toBeNull();
  expect(errors, `${label} ${path}`).toEqual([]);
}

test.describe("public pages", () => {
  // Pages that read a few Booking/Consultation keys through the subsets.
  const pages = ["/fa", "/en", "/fa/explore", "/en/providers"];

  for (const size of WIDTHS) {
    test(`render their own text, no raw key paths (${size.name})`, async ({ page }, testInfo) => {
      await page.setViewportSize(size);
      for (const path of pages) await expectNoRawKeys(page, path, size.name);
      // A provider page shows the consultation request button (Consultation.cta).
      await page.goto("/en/providers", { waitUntil: "domcontentloaded" });
      const provider = page.locator('a[href^="/en/providers/"]').first();
      if (await provider.count()) {
        const href = await provider.getAttribute("href");
        await expectNoRawKeys(page, href!, size.name);
        // Refresh: the same page rendered from scratch.
        await page.reload({ waitUntil: "domcontentloaded" });
        expect((await page.evaluate(() => document.body.innerText)).match(RAW_KEY)).toBeNull();
      }
      const shot = testInfo.outputPath(`public-${size.name}.png`);
      await page.screenshot({ path: shot });
      await testInfo.attach(`public-${size.name}`, { path: shot, contentType: "image/png" });
    });
  }

  // Soft navigation from home (shell set + subsets) into the consultation route,
  // whose layout adds the whole Consultation namespace, then back and forward.
  test("clicking home's video-consultation link keeps every label", async ({ page }, testInfo) => {
    await page.setViewportSize(WIDTHS[0]);
    await page.goto("/fa", { waitUntil: "domcontentloaded" });
    const link = page.locator('a[href="/fa/n/app/mobile/consultation/doctors"]:visible').first();
    await expect(link).toBeVisible();
    // Hydrated: the soft navigation below needs the router, not a full load.
    await page.waitForFunction(() => typeof (window as unknown as { next?: unknown }).next === "object");
    const before = await page.evaluate(() => performance.getEntriesByType("navigation").length);
    await link.click();
    await page.waitForURL(/\/fa\/n\/app\/mobile\/consultation\/doctors$/);
    await expect(page.locator("main, body").first()).toContainText(/\S/);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    // Same document: the route arrived over the router, not a page load.
    expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(before);
    expect((await page.evaluate(() => document.body.innerText)).match(RAW_KEY), "after click").toBeNull();
    await page.goBack();
    await page.waitForURL(/\/fa$/);
    expect((await page.evaluate(() => document.body.innerText)).match(RAW_KEY), "after back").toBeNull();
    await page.goForward();
    await page.waitForURL(/\/consultation\/doctors$/);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    expect((await page.evaluate(() => document.body.innerText)).match(RAW_KEY), "after forward").toBeNull();
    const shot = testInfo.outputPath("consultation-after-nav.png");
    await page.screenshot({ path: shot });
    await testInfo.attach("consultation-after-nav", { path: shot, contentType: "image/png" });
  });

  test("public HTML no longer carries the route-only namespaces", async ({ request }) => {
    for (const path of ["/fa", "/en/providers", "/fa/explore"]) {
      const html = await (await request.get(path)).text();
      // Distinctive keys of each namespace that public pages never read.
      expect(html, path).not.toContain('\\"doctorPanel\\"'); // Consultation.doctorPanel
      expect(html, path).not.toContain('\\"privacyPolicy\\"'); // MobileProfile.privacyPolicy
      expect(html, path).not.toContain('\\"ProviderOnboarding\\"');
      expect(html, path).not.toContain('\\"FormBuilder\\"');
    }
  });
});

test.describe("signed-in routes that receive the namespaces", () => {
  const DB_URL = process.env.ROUTE_MESSAGES_DATABASE_URL || "";
  const dbIsLocal = (() => {
    try {
      return ["localhost", "127.0.0.1", "::1"].includes(new URL(DB_URL).hostname);
    } catch {
      return false;
    }
  })();
  test.skip(
    !SECRET || !isLocal || !dbIsLocal,
    "Set ROUTE_MESSAGES_AUTH_SECRET, ROUTE_MESSAGES_DATABASE_URL and a base URL, all on localhost."
  );
  // The profile pages load the signed-in user's row, so the session needs a real one.
  const id = randomUUID();
  const sql = dbIsLocal ? postgres(DB_URL, { max: 1, prepare: false }) : null;

  test.beforeAll(async () => {
    const tag = id.slice(0, 8);
    await sql!`insert into identity.asp_net_users
      (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email,
       email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
      values (${id}, 'E2E', 'Messages', '+98', ${"e2e-" + tag}, ${"E2E-" + tag.toUpperCase()},
              ${"e2e-" + tag + "@example.invalid"}, ${("e2e-" + tag + "@example.invalid").toUpperCase()},
              false, ${"0999" + tag.replace(/\D/g, "0").slice(0, 7)}, false, false, false, 0)`;
  });

  test.afterAll(async () => {
    if (!sql) return;
    await sql`delete from identity.asp_net_users where id = ${id}`;
    await sql.end();
  });

  test.beforeEach(async ({ context }) => {
    const now = Date.now();
    const value = await encode({
      secret: SECRET,
      salt: "authjs.session-token",
      token: {
        sub: id,
        user: { id, name: "E2E Messages", accessToken: "e2e", accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 },
      } as never,
    });
    await context.addCookies([
      { name: "authjs.session-token", value, domain: new URL(BASE).hostname, path: "/", httpOnly: true, sameSite: "Lax" },
    ]);
  });

  const routes = [
    "/fa/n/app/mobile/profile",
    "/fa/n/app/mobile/profile/settings",
    "/en/n/app/mobile/profile/my-health-record",
    "/fa/n/app/mobile/profile/consultations",
    "/fa/n/app/mobile/bookings",
    "/en/n/app/mobile/consultation/doctors",
  ];

  for (const size of WIDTHS) {
    test(`profile, bookings and consultation render their labels (${size.name})`, async ({ page }, testInfo) => {
      await page.setViewportSize(size);
      for (const path of routes) await expectNoRawKeys(page, path, size.name);
      const shot = testInfo.outputPath(`signed-in-${size.name}.png`);
      await page.screenshot({ path: shot });
      await testInfo.attach(`signed-in-${size.name}`, { path: shot, contentType: "image/png" });
    });
  }
});
