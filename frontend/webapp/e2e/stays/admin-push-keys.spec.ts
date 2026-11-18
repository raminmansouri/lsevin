/**
 * Admin → notification channels → push: "Generate push keys" creates the VAPID pair on the
 * server (the private key is stored, never shown) so web push can be switched on in one step.
 */
import { expect, test } from "@playwright/test";

import { db, signedInAdmin } from "./helpers";

test.describe("notification channels: push keys @regression", () => {
  test("an admin generates push keys; the private key is stored but never sent to the browser", async ({ page, context }) => {
    // Start from a push channel without keys (test database only).
    await db()`update notify.channels set settings = settings - 'vapidPublicKey' - 'vapidPrivateKey' where code = 'push'`;
    await signedInAdmin(context);
    await page.goto("/fa/admin/notification-channels/push");
    const box = page.getByTestId("push-generate-keys");
    await expect(box).toBeVisible();
    const privateLeaks: string[] = [];
    page.on("response", async (r) => {
      if (r.request().method() === "POST") privateLeaks.push(await r.text().catch(() => ""));
    });
    await box.getByRole("button").click();
    await expect(box).toHaveCount(0);
    const [row] = await db()<{ settings: Record<string, string> }[]>`select settings from notify.channels where code = 'push'`;
    expect(row.settings.vapidPublicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    expect(row.settings.vapidPrivateKey).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(privateLeaks.join("\n")).not.toContain(row.settings.vapidPrivateKey);
    await expect(page.locator('input[name="settings.vapidPublicKey"]')).toHaveValue(row.settings.vapidPublicKey);
  });
});
