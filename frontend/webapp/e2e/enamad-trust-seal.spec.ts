import { expect, test } from "@playwright/test";

const SEAL_ID = "7764782";
const SEAL_CODE = "XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d";

test("home page shows the current Enamad trust seal", async ({ page }) => {
  await page.goto("/fa/n/app/mobile/home");

  const sealLink = page.locator('a[href^="https://trustseal.enamad.ir/"]');
  await expect(sealLink).toHaveCount(1);
  await expect(sealLink).toHaveAttribute(
    "href",
    `https://trustseal.enamad.ir/?id=${SEAL_ID}&Code=${SEAL_CODE}`
  );
  // Enamad validates the seal by the Referer origin, so both elements must
  // keep referrerpolicy="origin".
  await expect(sealLink).toHaveAttribute("referrerpolicy", "origin");
  await expect(sealLink).toHaveAttribute("target", "_blank");

  const sealImage = sealLink.locator("img");
  await expect(sealImage).toHaveAttribute(
    "src",
    `https://trustseal.enamad.ir/logo.aspx?id=${SEAL_ID}&Code=${SEAL_CODE}`
  );
  await expect(sealImage).toHaveAttribute("referrerpolicy", "origin");
  await expect(sealImage).toHaveAttribute("code", SEAL_CODE);
});
