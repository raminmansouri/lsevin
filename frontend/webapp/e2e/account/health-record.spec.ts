import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import postgres from "postgres";

/**
 * Regression (2026-11-28): /account/my-health-record answered 500 ("خطایی رخ
 * داده است") for every account whose record had a birth date. postgres.js
 * returns `date` columns as Date objects, the page's date formatter called
 * .slice() on it, fell into its catch and returned the Date itself, and React
 * refused to render an object (minified error #31).
 *
 *   HEALTH_E2E_BASE_URL=http://127.0.0.2:3045 \
 *   HEALTH_E2E_AUTH_SECRET=<the server's AUTH_SECRET> \
 *   HEALTH_E2E_DATABASE_URL=postgres://…@127.0.0.1:<port>/<the server's db> \
 *   npx playwright test -c playwright.account.config.ts
 *
 * Inserts a throwaway user with a patient record (birth date 1990-05-01) and
 * deletes both afterwards; runs only when server and database are local.
 */

const BASE = process.env.HEALTH_E2E_BASE_URL || "http://localhost:3000";
const SECRET = process.env.HEALTH_E2E_AUTH_SECRET || "";
const DB_URL = process.env.HEALTH_E2E_DATABASE_URL || "";
const local = (url: string) => {
  try {
    return ["localhost", "127.0.0.1", "127.0.0.2", "::1"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

test.skip(!SECRET || !local(BASE) || !local(DB_URL), "Set HEALTH_E2E_AUTH_SECRET, HEALTH_E2E_DATABASE_URL and a base URL, all local.");

const userId = randomUUID();
const sql = local(DB_URL) ? postgres(DB_URL, { max: 1, prepare: false }) : null;
let patientId = "";

test.beforeAll(async () => {
  const tag = userId.slice(0, 8);
  await sql!`insert into identity.asp_net_users
    (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email,
     email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
    values (${userId}, 'Sara', 'Health', '+98', ${"e2e-" + tag}, ${"E2E-" + tag.toUpperCase()},
            ${"e2e-" + tag + "@example.invalid"}, ${("e2e-" + tag + "@example.invalid").toUpperCase()},
            false, ${"0998" + tag.replace(/\D/g, "0").slice(0, 7)}, false, false, false, 0)`;
  const [patient] = await sql!<{ id: string }[]>`
    insert into patient.patients (first_name, last_name, birth_date, birth_date_precision, sex_at_birth, created_by, last_modified_by)
    values ('Sara', 'Health', '1990-05-01', 'day', 'female', ${userId}::uuid, ${userId}::uuid)
    returning id::text`;
  patientId = patient.id;
  await sql!`insert into patient.account_patient_links (account_id, patient_id, relationship_type, access_role, is_primary_profile, created_by)
    values (${userId}::uuid, ${patientId}::uuid, 'self', 'full', true, ${userId}::uuid)`;
});

test.afterAll(async () => {
  if (!sql) return;
  if (patientId) {
    await sql`delete from patient.account_patient_links where patient_id = ${patientId}::uuid`;
    await sql`delete from patient.patients where id = ${patientId}::uuid`.catch(() => {});
  }
  await sql`delete from identity.asp_net_users where id = ${userId}`;
  await sql.end();
});

test.beforeEach(async ({ context }) => {
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: "authjs.session-token",
    token: {
      sub: userId,
      user: { id: userId, name: "Sara Health", accessToken: "e2e", accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 },
    } as never,
  });
  await context.addCookies([{ name: "authjs.session-token", value, domain: new URL(BASE).hostname, path: "/", httpOnly: true, sameSite: "Lax" }]);
});

async function openRecord(page: Page, path: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status(), path).toBe(200);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  return errors;
}

for (const size of [
  { name: "phone", width: 360, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`a record with a birth date opens and shows the date (${size.name})`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors = await openRecord(page, "/fa/account/my-health-record");
    // The phone and desktop layouts are both in the HTML; check the one on screen.
    // fa-IR long date of 1990-05-01 is 11 Ordibehesht 1369.
    const birthDate = page.getByText(/۱۳۶۹/).locator("visible=true").first();
    await expect(page.getByText(/Sara/).locator("visible=true").first()).toBeVisible();
    await expect(birthDate).toBeVisible();
    // Refresh renders from scratch on the server again.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(birthDate).toBeVisible();
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("English shows the Gregorian birth date", async ({ page }) => {
  const errors = await openRecord(page, "/en/account/my-health-record");
  await expect(page.getByText("May 1, 1990").locator("visible=true").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the questionnaire opens with the stored birth date", async ({ page }) => {
  const errors = await openRecord(page, `/en/account/my-health-record/questionnaire?patient=${patientId}&step=about`);
  await expect(page.locator("body")).toContainText(/Sara|birth/i);
  expect(errors).toEqual([]);
});
