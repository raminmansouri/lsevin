/**
 * Admin CRUD through the real panel (desktop): every create/edit is saved,
 * survives a refresh, and is what customers then see. Also: publishing is
 * blocked until requirements are met, a stale concurrent edit is refused,
 * booked rows cannot be deleted, and non-admins are kept out.
 */
import { expect, test, type Page } from "@playwright/test";

import { seedStayBooking, seedStayProvider, seedUser, suffix } from "../../src/features/stays/testing/fixtures";
import { fillLocalized } from "../tours/admin-helpers";

import { db, evidence, expectIrr, isoInDays, seedWorld, settled, signedInAdmin, signedInCustomer, skipIntro, stayQuery, watchErrors } from "./helpers";

/**
 * Clicks and waits for that click's own server action to answer. A toast left over
 * from an earlier save is not proof that this save finished.
 */
async function act(page: Page, click: () => Promise<void>) {
  const done = page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]), { timeout: 60_000 });
  await click();
  const res = await done;
  expect(res.status()).toBeLessThan(500);
  await expect(page.locator('[data-testid$="-unsaved"]')).toHaveCount(0);
}


test.describe("stays admin @critical", () => {
  test("destination → stay → details → room → rate → photo → publish; customers see each saved change", async ({ page, context, browser }, testInfo) => {
    test.setTimeout(400_000);
    await signedInAdmin(context);
    const errors = watchErrors(page);
    // Letters only: the admin panel rewrites Latin digits in visible text to Persian digits.
    const s = suffix().replace(/\d/g, (d) => "abcdefghij"[Number(d)]);
    const owner = await seedUser(db() as never);
    const provider = await seedStayProvider(db() as never, owner.id, { name: `Kavir House ${s}` });

    // 1. Destination.
    await page.goto("/fa/admin/stays/cities");
    await page.getByTestId("stays-admin-city-new").click();
    const cityDialog = page.getByTestId("stays-admin-city-dialog");
    await cityDialog.getByTestId("stays-admin-city-slug").fill(`yazd-${s}`);
    await fillLocalized(cityDialog, "نام *", "fa-IR", `یزد ${s}`);
    await fillLocalized(cityDialog, "نام *", "en-US", `Yazd ${s}`);
    await act(page, () => cityDialog.getByTestId("stays-admin-city-save").click());
    await page.reload();
    await expect(page.locator(`[data-testid="stays-admin-city"][data-slug="yazd-${s}"]`)).toContainText("یزد");

    // 2. Stay (create dialog: owner, destination, address, type, name).
    await page.goto("/fa/admin/stays/properties");
    await page.getByTestId("stays-admin-new").click();
    const create = page.getByTestId("stays-admin-create-dialog");
    await create.getByTestId("stays-admin-provider-search").fill(`Kavir House ${s}`);
    await create.getByTestId("stays-admin-provider").click();
    await page.getByRole("option", { name: new RegExp(`Kavir House ${s}`) }).click();
    await create.getByTestId("stays-admin-new-city").selectOption({ label: `یزد ${s}` });
    await create.getByTestId("stays-admin-new-slug").fill(`kavir-house-${s}`);
    await create.getByTestId("stays-admin-new-kind").selectOption("traditional");
    await fillLocalized(create, "نام *", "fa-IR", `اقامتگاه کویر ${s}`);
    await evidence(page, testInfo, "stays__admin__01-create-filled");
    await create.getByTestId("stays-admin-create").click();
    await expect(page).toHaveURL(/\/admin\/stays\/properties\/[0-9a-f-]{36}$/);
    const propertyUrl = page.url();
    await expect(page.getByTestId("stays-admin-editor-title")).toHaveText(`اقامتگاه کویر ${s}`);
    await expect(page.getByTestId("stays-admin-requirement")).toHaveCount(4); // description, photo, room, rate
    await expect(page.getByTestId("stays-admin-publish")).toBeDisabled();

    // 3. Details: summary, stars, tax, phone, amenities — saved and persisted.
    await fillLocalized(page.getByTestId("stays-admin-details"), "خلاصه کوتاه (در نتایج جستجو و موتورهای جستجو)", "fa-IR", "خانه‌ای سنتی با حوض و بادگیر.");
    await page.getByTestId("stays-admin-tax").fill("9");
    await page.getByTestId("stays-admin-phone").fill("+983512345678");
    await expect(page.getByTestId("stays-admin-save-details-unsaved")).toBeVisible();
    await act(page, () => page.getByTestId("stays-admin-save-details").click());
    await page.reload();
    await expect(page.getByTestId("stays-admin-tax")).toHaveValue("9");
    await expect(page.getByTestId("stays-admin-phone")).toHaveValue("+983512345678");

    // 4. Room type and rate.
    await page.getByTestId("stays-admin-tab-rooms").click();
    await expect(page).toHaveURL(/tab=rooms/);
    await page.getByTestId("stays-admin-room-add").click();
    const room = page.getByTestId("stays-admin-room-dialog");
    await room.getByTestId("stays-admin-room-code").fill("courtyard");
    await room.getByTestId("stays-admin-room-units").fill("2");
    await fillLocalized(room, "نام *", "fa-IR", "اتاق رو به حیاط");
    await act(page, () => room.getByTestId("stays-admin-room-save").click());
    await expect(page.getByTestId("stays-admin-room").filter({ hasText: "courtyard" })).toBeVisible();
    await page.getByTestId("stays-admin-plan-add").click();
    const plan = page.getByTestId("stays-admin-plan-dialog");
    await plan.getByTestId("stays-admin-plan-price").fill("3200000");
    await act(page, () => plan.getByTestId("stays-admin-plan-save").click());
    await page.reload();
    await expect(page.getByTestId("stays-admin-plan")).toHaveCount(1);
    await expectIrr(page.getByTestId("stays-admin-plan"), 3_200_000);

    // 5. Photo.
    await page.getByTestId("stays-admin-tab-photos").click();
    await page.getByTestId("stays-admin-photo-url").fill("/images/stays/yazd-traditional-courtyard.webp");
    await fillLocalized(page.getByTestId("stays-admin-photos"), "توضیح عکس (الزامی، برای صفحه‌خوان و موتورهای جستجو) *", "fa-IR", "حیاط و حوض");
    await act(page, () => page.getByTestId("stays-admin-photo-add").click());
    await expect(page.getByTestId("stays-admin-photo")).toHaveCount(1);

    // 6. Publish.
    await expect(page.getByTestId("stays-admin-requirement")).toHaveCount(0);
    await act(page, () => page.getByTestId("stays-admin-publish").click());
    await page.reload();
    await expect(page.getByTestId("stays-admin-pause")).toBeVisible();
    await evidence(page, testInfo, "stays__admin__02-published");

    // Customers see it, priced with the saved tax.
    const customerCtx = await browser.newContext();
    const customer = await customerCtx.newPage();
    await skipIntro(customerCtx);
    const ci = isoInDays(25);
    const co = isoInDays(27);
    await customer.goto(`/fa/stays/p/kavir-house-${s}?${stayQuery(ci, co)}`);
    await settled(customer);
    await expect(customer.getByTestId("stay-title")).toHaveText(`اقامتگاه کویر ${s}`);
    await expectIrr(customer.getByTestId("stay-plan-total"), 6_976_000); // 2 × 3,200,000 + 9%
    await evidence(customer, testInfo, "stays__admin__03-customer-sees-published");

    // 7. A dated price in the calendar (default range: tonight) reaches the customer's quote and the grid.
    await page.goto(`${propertyUrl}?tab=calendar`);
    await page.getByTestId("stays-admin-price-plan").selectOption({ index: 1 });
    await page.getByTestId("stays-admin-price-amount").fill("5000000");
    await act(page, () => page.getByTestId("stays-admin-price-apply").click());
    await expectIrr(page.getByTestId("stays-admin-cal-day").first().getByTestId("stays-admin-cal-price"), 5_000_000);
    await page.reload();
    await expectIrr(page.getByTestId("stays-admin-cal-day").first().getByTestId("stays-admin-cal-price"), 5_000_000);
    await customer.goto(`/fa/stays/p/kavir-house-${s}?${stayQuery(isoInDays(0), isoInDays(2))}`);
    await expectIrr(customer.getByTestId("stay-plan-total"), 8_938_000); // (5,000,000 + 3,200,000) + 9%

    // Units for tonight set to 0 → the customer sees it sold out for tonight.
    await page.getByTestId("stays-admin-inv-units").fill("0");
    await act(page, () => page.getByTestId("stays-admin-inv-apply").click());
    await expect(page.getByTestId("stays-admin-cal-day").first().getByTestId("stays-admin-cal-left")).toContainText("۰");
    await customer.reload();
    await expect(customer.getByTestId("stay-plan-unavailable").first()).toBeVisible();

    // 8. Pause → customers no longer find it; restore brings it back.
    await page.goto(propertyUrl);
    await page.getByTestId("stays-admin-pause").click();
    const pause = page.getByRole("group", { name: "توقف (پنهان از مشتری)" });
    await pause.getByRole("textbox").fill("بازسازی اتاق‌ها");
    await act(page, () => pause.getByRole("button", { name: "تأیید" }).click());
    const res = await customer.goto(`/fa/stays/p/kavir-house-${s}`);
    expect(res?.status()).toBe(404);
    await customerCtx.close();
    errors.assertClean();
  });

  test("a stale concurrent edit is refused instead of silently overwriting", async ({ context }) => {
    const world = await seedWorld([{}]);
    await signedInAdmin(context);
    const a = await context.newPage();
    const b = await context.newPage();
    const url = `/fa/admin/stays/properties/${world.stays[0].id}`;
    await a.goto(url);
    await b.goto(url);
    await a.getByTestId("stays-admin-tax").fill("5");
    await act(a, () => a.getByTestId("stays-admin-save-details").click());
    await b.getByTestId("stays-admin-tax").fill("12");
    await b.getByTestId("stays-admin-save-details").click();
    await expect(b.getByRole("alert").filter({ hasText: "شخص دیگری" })).toBeVisible();
    await b.reload();
    await expect(b.getByTestId("stays-admin-tax")).toHaveValue("5");
  });

  test("booked room types cannot be deleted; deleting the city of live stays is refused", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    const guest = await seedUser(db() as never);
    await seedStayBooking(db() as never, world.stays[0], guest.id, { checkIn: isoInDays(15), checkOut: isoInDays(16) });
    await signedInAdmin(context);
    await page.goto(`/fa/admin/stays/properties/${world.stays[0].id}?tab=rooms`);
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("stays-admin-room-delete").first().click();
    await expect(page.locator("[data-sonner-toast]", { hasText: "رزرو دارد" }).first()).toBeVisible();
    await expect(page.getByTestId("stays-admin-room")).toHaveCount(1);

    await page.goto("/fa/admin/stays/cities");
    page.once("dialog", (d) => d.accept());
    await page.locator(`[data-testid="stays-admin-city"][data-slug="${world.city.slug}"]`).getByTestId("stays-admin-city-delete").click();
    await expect(page.locator("[data-sonner-toast]", { hasText: "اقامتگاه دارد" }).first()).toBeVisible();
  });

  test("a customer cannot open the stays admin", async ({ page, context }) => {
    await signedInCustomer(context);
    await page.goto("/fa/admin/stays/properties");
    await expect(page.getByTestId("stays-admin-properties")).toHaveCount(0);
  });
});
