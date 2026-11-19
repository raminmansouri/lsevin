/**
 * Every stays page, customer and admin, in every platform language: no raw message keys, no
 * missing-message errors, no English fallback where a translation exists, and no Persian/Arabic
 * script in Latin, Cyrillic or Chinese pages (a missing translation must fall back to English,
 * never to Persian).
 */
import { expect, test, type Page } from "@playwright/test";

import { seedStayBooking } from "../../src/features/stays/testing/fixtures";

import { db, isoInDays, seedWorld, signedInAdmin, signedInCustomer, skipIntro, watchErrors } from "./helpers";

const LOCALES = ["fa", "en", "ar", "tr", "es", "ku", "de", "fr", "ru", "tg", "zh"] as const;
const ARABIC_SCRIPT_LOCALES = new Set(["fa", "ar", "ku"]);
const ARABIC_SCRIPT = /[؀-ۿ]/;
// A localized word from each language's stays home page, so a silent English fallback is caught.
const HOME_TITLE: Record<string, RegExp> = {
  fa: /[؀-ۿ]/, ar: /[؀-ۿ]/, ku: /[؀-ۿ]/, en: /[A-Za-z]/,
  tr: /[A-Za-zçğıöşüÇĞİÖŞÜ]/, es: /[A-Za-zñáéíóú]/, de: /[A-Za-zäöüß]/, fr: /[A-Za-zéèàç]/,
  ru: /[Ѐ-ӿ]/, tg: /[Ѐ-ӿ]/, zh: /[一-鿿]/,
};

/**
 * `uiOnly`: check interface text only (headings, labels, buttons, table headers, tabs), not data
 * rows — admin lists show every stay, including other tests' Persian-only drafts.
 */
async function checkRegion(page: Page, locale: string, selector: string, where: string, uiOnly = false) {
  const region = page.locator(selector).first();
  await expect(region, `${where} renders`).toBeVisible();
  // Language pickers name each language in its own script ("فارسی"); that is not leaked content.
  const text = (
    await region.evaluate((el, ui) => {
      if (ui) {
        const parts = [...el.querySelectorAll<HTMLElement>("h1, h2, h3, h4, label, button, th, legend, [role=tab], nav a")]
          .filter((n) => !n.closest('[role="tablist"]') || n.closest("nav"))
          .filter((n) => !n.closest("td"));
        return parts.map((n) => n.innerText).join(" | ");
      }
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('[role="tablist"], [data-language-name]').forEach((n) => n.remove());
      document.body.appendChild(copy);
      const out = copy.innerText;
      copy.remove();
      return out;
    }, uiOnly)
  ).replace(/\s+/g, " ");
  expect(text, `${where}: raw message key`).not.toMatch(/\b(StayApp|StayAdmin|TourShared)\.[A-Za-z]/);
  if (!ARABIC_SCRIPT_LOCALES.has(locale)) {
    const leak = text.match(new RegExp(`.{0,30}${ARABIC_SCRIPT.source}+.{0,30}`));
    expect(leak?.[0] ?? null, `${where}: Persian/Arabic text in ${locale}`).toBeNull();
  }
}

test.describe("stays in every language @regression", () => {
  test.setTimeout(240_000);

  for (const locale of LOCALES) {
    test(`customer pages in ${locale}`, async ({ page, context }) => {
      const world = await seedWorld([{}]);
      const stay = world.stays[0];
      await skipIntro(context);
      const user = await signedInCustomer(context, { firstName: "Maria", lastName: "Lopez" });
      const { bookingId } = await seedStayBooking(db() as never, stay, user.id, { checkIn: isoInDays(40), checkOut: isoInDays(42), status: "confirmed", paid: true });
      // Leaving a page mid-request aborts the session fetch ("Failed to fetch", authjs): navigation noise.
      const errors = watchErrors(page, [/authjs\.dev#autherror/]);
      const missing: string[] = [];
      page.on("console", (m) => {
        if (/MISSING_MESSAGE|missing message/i.test(m.text())) missing.push(m.text().slice(0, 200));
      });

      await page.goto(`/${locale}/stays`);
      await checkRegion(page, locale, "#stays-main", "home");
      await expect(page.locator("h1").first()).toHaveText(HOME_TITLE[locale]);
      // Sorani Kurdish is tagged "ckb" (BCP 47), the rest by their own code.
      expect(await page.locator("html").getAttribute("lang")).toMatch(new RegExp(`^${locale === "ku" ? "(ku|ckb)" : locale}`));

      for (const [path, where] of [
        ["/stays/intro", "intro"],
        ["/stays/explore", "explore"],
        [`/stays/city/${world.city.slug}`, "city"],
        [`/stays/${stay.slug}`, "hotel page"],
        [`/stays/${stay.slug}/book?checkIn=${isoInDays(60)}&checkOut=${isoInDays(62)}&adults=2&room=${stay.roomTypeId}&plan=${stay.ratePlanId}`, "checkout"],
        ["/stays/bookings", "my bookings"],
        [`/stays/bookings/${bookingId}`, "booking"],
        ["/stays/wishlist", "saved"],
      ] as const) {
        await page.goto(`/${locale}${path}`);
        await checkRegion(page, locale, "#stays-main", where);
      }
      expect(missing, "missing messages").toEqual([]);
      errors.assertClean();
    });
  }

  for (const locale of LOCALES) {
    test(`admin pages in ${locale}`, async ({ page, context }) => {
      const world = await seedWorld([{}]);
      const stay = world.stays[0];
      await signedInAdmin(context);
      const missing: string[] = [];
      page.on("console", (m) => {
        if (/MISSING_MESSAGE|missing message/i.test(m.text())) missing.push(m.text().slice(0, 200));
      });
      for (const [path, where] of [
        ["/admin/stays", "admin overview"],
        ["/admin/stays/properties", "admin stays"],
        [`/admin/stays/properties/${stay.id}`, "admin editor"],
        ["/admin/stays/cities", "admin destinations"],
        ["/admin/stays/bookings", "admin bookings"],
        ["/admin/stays/reviews", "admin reviews"],
        ["/admin/stays/settings", "admin settings"],
      ] as const) {
        await page.goto(`/${locale}${path}`);
        await checkRegion(page, locale, '[data-testid="stays-admin-area"]', where, true);
      }
      // The content editor offers every language, not three.
      await page.goto(`/${locale}/admin/stays/properties/${stay.id}`);
      const area = page.locator('[data-testid="stays-admin-area"]');
      const languages = area.getByRole("tablist").filter({ has: page.getByRole("tab", { name: /中文/ }) }).first();
      await expect(languages.getByRole("tab"), "the name field offers all 11 languages").toHaveCount(11);
      expect(missing, "missing messages").toEqual([]);
    });
  }
});
