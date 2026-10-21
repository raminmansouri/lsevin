import { expect, test } from "@playwright/test";

const adminState = process.env.ADMIN_E2E_STATE;

test.describe("admin floating bug reporter", () => {
  test.skip(
    !adminState,
    "ADMIN_E2E_STATE is required for authenticated admin verification."
  );
  test.use({ storageState: adminState });

  test("captures context, validates the explanation, and opens from any admin page", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
        configurable: true,
        value: async () => {
          throw new DOMException(
            "Capture cancelled by test",
            "NotAllowedError"
          );
        },
      });
    });

    await page.goto("/en/admin/bug-reports");
    // Regression: the trigger used to be a large fixed bottom-corner pill that
    // covered data-table rows/pagination. It now lives in the sticky header.
    // The header sits inside SidebarInset's <main>, so it has no banner role.
    const trigger = page
      .locator("header")
      .getByRole("button", { name: "Report a bug" });
    await expect(trigger).toBeVisible();
    await expect(trigger).not.toHaveCSS("position", "fixed");
    const box = await trigger.boundingBox();
    expect(box?.height ?? 0).toBeLessThanOrEqual(36);
    await trigger.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Screen capture was cancelled/)).toBeVisible();

    await page.getByLabel("Short title").fill("Admin booking form fails");
    await page
      .getByLabel("What happened, and what were you trying to do?")
      .fill("short");
    await page.getByRole("button", { name: "Submit report" }).click();
    await expect(
      page.getByLabel("What happened, and what were you trying to do?")
    ).toHaveAttribute("minlength", "10");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
