import { expect, test } from "@playwright/test";
import { db, seedWorld, signedInAdmin, skipIntro } from "./helpers";

test("localized Lexical descriptions survive reload and render in each guest language", async ({ page, context }) => {
  const { stays: [stay] } = await seedWorld();
  await signedInAdmin(context);
  await skipIntro(context);
  await page.goto("/en/admin/stays/properties/" + stay.id);
  const editor = page.locator('[contenteditable="true"]:visible').first();
  const tabs = editor.locator('xpath=ancestor::*[@data-slot="tabs" or @data-orientation][.//*[@role="tablist"]][1]');
  const values = [
    { ui: "en", tag: "en-US", tab: /English/, text: "Quiet guest room with garden access", dir: "ltr" },
    { ui: "fa", tag: "fa-IR", tab: /فارسی/, text: "اتاق آرام با دسترسی به باغ", dir: "rtl" },
  ];
  for (const v of values) {
    await tabs.getByRole("tab", { name: v.tab }).click();
    await editor.fill(v.text);
  }
  await page.getByTestId("stays-admin-save-details").click();
  await expect.poll(async () => {
    const [r] = await db()`select description from stay.properties where id=${stay.id}::uuid`;
    return values.every(v => String(r.description[v.tag]).includes(v.text));
  }).toBe(true);
  await page.reload();
  for (const v of values) {
    await tabs.getByRole("tab", { name: v.tab }).click();
    await expect(editor).toHaveText(v.text);
  }
  for (const v of values) {
    await page.goto("/" + v.ui + "/stays/" + stay.slug);
    const rich = page.getByTestId("stay-about").locator("[data-rich-text]");
    await expect(rich).toContainText(v.text);
    await expect(rich).toHaveAttribute("dir", v.dir);
    await expect(rich).toHaveAttribute("lang", v.tag);
  }
});
