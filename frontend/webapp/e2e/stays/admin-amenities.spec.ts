/**
 * Hotel and room amenities, end to end: the grouped checklist in the hotel and room editors
 * (with options such as the door lock type), and the amenity catalogue where admins add
 * amenities and options, name them in every language, pick icons or images and switch them off.
 */
import { expect, test, type Page } from "@playwright/test";

import { db, seedWorld, signedInAdmin, skipIntro } from "./helpers";

/** Ticks an amenity in a checklist (retrying a click that lands before hydration). */
async function tick(page: Page, scope: string, code: string) {
  const box = page.locator(`[data-testid="${scope}"] input[data-amenity="${code}"]`);
  await expect(async () => {
    if (!(await box.isChecked())) await box.click();
    await expect(box).toBeChecked({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
}

test("hotel: tick an amenity with options, choose the option; guests see the option, not the parent @regression", async ({ context, page }) => {
  const {
    stays: [stay],
  } = await seedWorld();
  await signedInAdmin(context);
  await skipIntro(context);
  await page.goto(`/en/admin/stays/properties/${stay.id}`);
  const list = page.getByTestId("stays-admin-amenities");
  // Grouped by section, with a search box.
  await expect(list.getByRole("group", { name: /In the room/ })).toBeVisible();
  await list.getByPlaceholder("Search amenities").fill("lock");
  await tick(page, "stays-admin-amenities", "door_lock_type");
  await list.getByTestId("amenity-option-door_lock_type").selectOption("door_lock_type_v2");
  await page.getByTestId("stays-admin-save-details").click();
  await expect
    .poll(async () => (await db()`select amenity_codes from stay.properties where id=${stay.id}::uuid`)[0].amenity_codes)
    .toEqual(expect.arrayContaining(["door_lock_type", "door_lock_type_v2"]));
  await page.reload();
  await expect(page.locator('[data-testid="stays-admin-amenities"] input[data-amenity="door_lock_type"]')).toBeChecked();
  await expect(page.getByTestId("stays-admin-amenities").getByTestId("amenity-option-door_lock_type")).toHaveValue("door_lock_type_v2");

  for (const [lang, option] of [["en", "Key card"], ["de", "Schlüsselkarte"]] as const) {
    await page.goto(`/${lang}/stays/${stay.slug}`);
    await expect(page.getByTestId("stay-amenities-section").getByText(option, { exact: true }).first()).toBeVisible();
  }
  // The parent is not repeated next to its option.
  await page.goto(`/en/stays/${stay.slug}`);
  await expect(page.getByTestId("stay-amenities-section").getByText("Door lock type", { exact: true })).toHaveCount(0);
});

test("room: only room-level sections are offered; an amenity can be ticked and unticked without touching the hotel", async ({ page, context }) => {
  const {
    stays: [stay],
  } = await seedWorld();
  await signedInAdmin(context);
  await page.goto(`/en/admin/stays/properties/${stay.id}?tab=rooms`);
  for (const selected of [true, false]) {
    await expect(async () => {
      await page.getByTestId("stays-admin-room-edit").first().click();
      await expect(page.getByTestId("stays-admin-room-dialog")).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
    const dialog = page.getByTestId("stays-admin-room-dialog");
    const list = dialog.getByTestId("stays-room-amenities");
    // Hotel-wide amenities (lobby, pool) are not offered for a room.
    await expect(list.locator('input[data-amenity="door_lock_type"]')).toBeVisible();
    await expect(list.locator('input[data-amenity="lobby"]')).toHaveCount(0);
    await expect(list.locator('input[data-amenity="pool"]')).toHaveCount(0);
    const box = list.locator('input[data-amenity="door_lock_type"]');
    if ((await box.isChecked()) !== selected) await box.click();
    if (selected) await list.getByTestId("amenity-option-door_lock_type").selectOption("door_lock_type_v3");
    await dialog.getByTestId("stays-admin-room-save").click();
    await expect(dialog).toBeHidden();
    const [row] = await db()`select r.amenity_codes as room, p.amenity_codes as hotel
      from stay.room_types r join stay.properties p on p.id=r.property_id where r.id=${stay.roomTypeId}::uuid`;
    expect(row.room.includes("door_lock_type")).toBe(selected);
    expect(row.room.includes("door_lock_type_v3")).toBe(selected);
    expect(row.hotel).not.toContain("door_lock_type_v3");
    await page.reload();
  }
});

test("catalogue: add an amenity and an option in several languages, pick an icon and an image, switch it off @regression", async ({ page, context }) => {
  const tag = crypto.randomUUID().slice(0, 8);
  const filename = `amenity-${tag}`;
  const [image] = await db()`insert into media.media_library(original_name,stored_name,file_url,mime_type,media_type,is_public)
    values (${filename},${filename},${"/images/stays/type-hotel.webp?qa=" + tag},'image/webp','image',true) returning id`;
  try {
    await signedInAdmin(context);
    await page.goto("/en/admin/stays/amenities");
    await expect(page.getByTestId("stays-amenity-catalog")).toBeVisible();
    const editor = page.getByTestId("amenity-editor");
    await expect(async () => {
      await page.getByTestId("amenity-new").click();
      await expect(editor.getByRole("heading", { name: "New amenity" })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
    await editor.locator('input[lang="en-US"]').fill(`Pillow menu ${tag}`);
    await editor.getByRole("tab", { name: /Deutsch/ }).click();
    await editor.locator('input[lang="de-DE"]').fill(`Kissenmenü ${tag}`);
    await editor.getByTestId("amenity-group").selectOption("room");
    await editor.locator('[data-icon="bed-double"]').click();
    await editor.getByTestId("amenity-save").click();
    await expect(page.locator("[data-sonner-toast]", { hasText: "Amenity added." }).first()).toBeVisible();
    await expect
      .poll(async () => (await db()`select grp, icon, label from stay.amenities where label->>'en-US' = ${`Pillow menu ${tag}`}`)[0])
      .toEqual({ grp: "room", icon: "bed-double", label: { "en-US": `Pillow menu ${tag}`, "de-DE": `Kissenmenü ${tag}` } });
    const [created] = await db()`select code from stay.amenities where label->>'en-US' = ${`Pillow menu ${tag}`}`;

    // An option under it.
    await page.getByTestId("amenity-add-option").click();
    await expect(editor.getByRole("heading", { name: `New option of Pillow menu ${tag}` })).toBeVisible();
    await editor.locator('input[lang="en-US"]').fill(`Buckwheat ${tag}`);
    await editor.getByTestId("amenity-save").click();
    await expect
      .poll(async () => (await db()`select parent_code, grp from stay.amenities where label->>'en-US' = ${`Buckwheat ${tag}`}`)[0])
      .toEqual({ parent_code: created.code, grp: "room" });

    // An image instead of the icon, then switch the amenity off; both survive a reload.
    await page.getByTestId("amenity-search").fill(tag);
    await page.locator(`[data-testid="amenity-row"][data-code="${created.code}"]`).click();
    await editor.getByRole("button", { name: "Pick media" }).click();
    const library = page.getByRole("dialog");
    await library.getByPlaceholder("Search files").fill(filename);
    await library.getByText(filename, { exact: true }).click();
    await expect(library).toBeHidden();
    await editor.getByTestId("amenity-active").click();
    await editor.getByTestId("amenity-save").click();
    await expect
      .poll(async () => (await db()`select image_id::text as image_id, is_active from stay.amenities where code = ${created.code}`)[0])
      .toEqual({ image_id: image.id, is_active: false });
    await page.reload();
    await page.getByTestId("amenity-search").fill(tag);
    await page.locator(`[data-testid="amenity-row"][data-code="${created.code}"]`).click();
    await expect(page.getByTestId("amenity-active")).toHaveAttribute("aria-checked", "false");
    await expect(page.locator('input[name="amenity-image"]')).toHaveValue(image.id);
  } finally {
    await db()`delete from stay.amenities where parent_code in (select code from stay.amenities where label->>'en-US' like ${"%" + tag})`;
    await db()`delete from stay.amenities where label->>'en-US' like ${"%" + tag}`;
    await db()`delete from media.media_library where id=${image.id}`;
  }
});
