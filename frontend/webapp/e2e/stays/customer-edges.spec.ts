/**
 * Booking edge cases a real guest can hit: two people racing for the last room,
 * request-to-book answered by an admin, a double-clicked confirm, reviews only
 * after a completed stay (and only once), and the saved list.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { seedStayBooking } from "../../src/features/stays/testing/fixtures";

import { bookingRow, db, evidence, isoInDays, seedWorld, settled, signedInAdmin, signedInCustomer, skipIntro, soldOn, stayQuery } from "./helpers";

async function openBooking(page: Page, slug: string, ci: string, co: string) {
  await page.goto(`/fa/stays/${slug}?${stayQuery(ci, co)}`);
  await settled(page);
  await page.getByTestId("stay-reserve").first().click();
  await expect(page).toHaveURL(/\/book\?/);
}

/** Signed in: the account's name and mobile are the booker's; nothing to fill. */
async function fillDetails(page: Page) {
  await expect(page.getByTestId("stay-booker-name")).toBeVisible();
}

async function guest(browser: { newContext: () => Promise<BrowserContext> }) {
  const ctx = await browser.newContext();
  await skipIntro(ctx);
  await signedInCustomer(ctx);
  return { ctx, page: await ctx.newPage() };
}

test.describe("stays edge cases @regression", () => {
  test("two guests race for the last room: one holds it, the other is told it was just booked", async ({ browser }, testInfo) => {
    const world = await seedWorld([{ units: 1 }]);
    const stay = world.stays[0];
    const ci = isoInDays(50);
    const co = isoInDays(52);
    const a = await guest(browser);
    const b = await guest(browser);
    try {
      await Promise.all([openBooking(a.page, stay.slug, ci, co), openBooking(b.page, stay.slug, ci, co)]);
      const outcomes = await Promise.all(
        [a.page, b.page].map(async (p) => {
          await expect(p.getByTestId("stay-hold-active").or(p.getByTestId("stay-hold-error"))).toBeVisible();
          return (await p.getByTestId("stay-hold-active").count()) > 0 ? "held" : "refused";
        }),
      );
      expect([...outcomes].sort()).toEqual(["held", "refused"]);
      const loser = outcomes[0] === "refused" ? a.page : b.page;
      await expect(loser.getByTestId("stay-hold-error")).toContainText("آخرین اتاق");
      await evidence(loser, testInfo, "stays__race__01-last-room-taken");
      expect(await soldOn(stay.roomTypeId, ci)).toMatchObject({ sold: 0, held: 1 });
    } finally {
      await a.ctx.close();
      await b.ctx.close();
    }
  });

  test("double-clicking confirm creates exactly one booking", async ({ page, context }) => {
    const world = await seedWorld([{ units: 3 }]);
    await skipIntro(context);
    const user = await signedInCustomer(context);
    await openBooking(page, world.stays[0].slug, isoInDays(60), isoInDays(61));
    await expect(page.getByTestId("stay-hold-active")).toBeVisible();
    await fillDetails(page);
    await page.getByTestId("stay-confirm").dblclick();
    await expect(page).toHaveURL(/\/stays\/bookings\//);
    const [{ n }] = await db()<{ n: number }[]>`select count(*)::int as n from stay.bookings where user_id = ${user.id}::uuid`;
    expect(n).toBe(1);
  });

  test("request to book: nothing charged, admin accepts, guest is asked to pay; persisted after refresh", async ({ page, context, browser }, testInfo) => {
    const world = await seedWorld([{ confirmationMode: "request" }]);
    await skipIntro(context);
    await signedInCustomer(context);
    await openBooking(page, world.stays[0].slug, isoInDays(70), isoInDays(72));
    await expect(page.getByTestId("stay-hold-active")).toBeVisible();
    await fillDetails(page);
    await expect(page.getByText("اکنون مبلغی کسر نمی‌شود", { exact: false })).toBeVisible();
    await page.getByTestId("stay-confirm").click();
    await expect(page.getByTestId("stay-request-sent")).toBeVisible();
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "requested");
    await expect(page.getByTestId("stay-payment-panel")).toHaveCount(0);
    const bookingId = page.url().match(/bookings\/([0-9a-f-]{36})/)![1];
    await evidence(page, testInfo, "stays__request__01-sent");

    const adminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    try {
      await signedInAdmin(adminCtx);
      const admin = await adminCtx.newPage();
      await admin.goto(`/fa/admin/stays/bookings/${bookingId}`);
      await admin.getByTestId("stays-admin-accept").click();
      await expect(admin.getByTestId("stays-admin-booking-detail").getByText("در انتظار پرداخت")).toBeVisible();
    } finally {
      await adminCtx.close();
    }
    await page.reload();
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "pending_payment");
    await expect(page.getByTestId("stay-payment-panel")).toBeVisible();
    await evidence(page, testInfo, "stays__request__02-accepted-pay");
    expect((await bookingRow(bookingId)).status).toBe("pending_payment");
  });

  test("a completed stay can be reviewed once; the review appears after moderation", async ({ page, context, browser }, testInfo) => {
    const world = await seedWorld([{}]);
    const stay = world.stays[0];
    await skipIntro(context);
    const user = await signedInCustomer(context);
    const { bookingId } = await seedStayBooking(db() as never, stay, user.id, { checkIn: isoInDays(-5), checkOut: isoInDays(-3), status: "completed" });
    await page.goto(`/fa/stays/bookings/${bookingId}`);
    await expect(page.getByTestId("stay-review-form")).toBeVisible();
    await expect(page.getByTestId("stay-review-submit")).toBeDisabled();
    await page.getByTestId("stay-review-overall").getByRole("radio").nth(4).click();
    await page.getByTestId("stay-review-body").fill("حیاط زیبا و پرسنل مهربان.");
    await page.getByTestId("stay-review-submit").click();
    await expect(page.getByTestId("stay-review-thanks")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("stay-review-form")).toHaveCount(0);

    const adminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    try {
      await signedInAdmin(adminCtx);
      const admin = await adminCtx.newPage();
      await admin.goto("/fa/admin/stays/reviews?status=pending");
      const row = admin.getByTestId("stays-admin-review").filter({ hasText: "حیاط زیبا" });
      await row.getByTestId("stays-admin-review-publish").click();
      // Published reviews leave the "pending" list.
      await expect(row).toHaveCount(0);
    } finally {
      await adminCtx.close();
    }
    await page.goto(`/fa/stays/${stay.slug}`);
    await expect(page.getByTestId("stay-review").filter({ hasText: "حیاط زیبا" })).toBeVisible();
    await expect(page.getByTestId("rating-badge").first()).toContainText("۵");
    await evidence(page, testInfo, "stays__review__01-published");
  });

  test("save a stay, see it in the saved list after refresh, remove it", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await signedInCustomer(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    const toggle = page.getByTestId("stay-card").first().getByTestId("stay-wishlist-toggle");
    const savedOnServer = page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]));
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await savedOnServer;
    await page.goto("/fa/stays/wishlist");
    await expect(page.getByTestId("stay-wishlist").getByTestId("stay-card")).toHaveCount(1);
    await page.reload();
    const saved = page.getByTestId("stay-wishlist").getByTestId("stay-wishlist-toggle");
    const removedOnServer = page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]));
    await saved.click();
    await expect(saved).toHaveAttribute("aria-pressed", "false");
    await removedOnServer;
    await page.reload();
    await expect(page.getByTestId("stay-wishlist-empty")).toBeVisible();
  });

  test("signed-out save sends the guest to sign in", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await page.getByTestId("stay-card").first().getByRole("link", { name: "برای ذخیره اقامتگاه وارد شوید" }).click();
    await expect(page).toHaveURL(/sign-in\?redirectTo=/);
  });
});
