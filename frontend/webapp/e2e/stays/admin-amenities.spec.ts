import { expect, test } from "@playwright/test";
import { db, seedWorld, signedInAdmin, skipIntro } from "./helpers";

test("hotel lock option persists and is visible to guests @regression", async ({
  context,
  page,
}) => {
  const {
    stays: [stay],
  } = await seedWorld();
  await signedInAdmin(context);
  await skipIntro(context);
  await page.goto("/en/admin/stays/properties/" + stay.id);
  await page.getByTestId("stays-admin-amenities").click();
  await page
    .getByRole("option", { name: "Door lock type", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page
    .getByLabel("Door lock type", { exact: true })
    .selectOption("door_lock_type_v2");
  await page.getByTestId("stays-admin-save-details").click();
  await expect
    .poll(async () => {
      const [row] =
        await db()`select amenity_codes from stay.properties where id=${stay.id}::uuid`;
      return row.amenity_codes;
    })
    .toContain("door_lock_type_v2");
  await page.reload();
  await expect(page.getByLabel("Door lock type", { exact: true })).toHaveValue(
    "door_lock_type_v2",
  );
  await page.goto("/en/stays/" + stay.slug);
  await expect(
    page.getByText("Key card", { exact: true }).first(),
  ).toBeVisible();
});

test("a room amenity can be selected and removed without changing the hotel", async ({
  page,
  context,
}) => {
  const {
    stays: [stay],
  } = await seedWorld();
  await signedInAdmin(context);
  await page.goto(`/en/admin/stays/properties/${stay.id}?tab=rooms`);
  for (const selected of [true, false]) {
    await page.getByTestId("stays-admin-room-edit").first().click();
    const dialog = page.getByTestId("stays-admin-room-dialog");
    await dialog.getByTestId("stays-room-amenities").click();
    await page
      .getByRole("option", { name: "Door lock type", exact: true })
      .click();
    await page.keyboard.press("Escape");
    if (selected)
      await dialog
        .getByLabel("Door lock type", { exact: true })
        .selectOption("door_lock_type_v3");
    await dialog.getByTestId("stays-admin-room-save").click();
    await expect(dialog).toBeHidden();
    const [row] =
      await db()`select r.amenity_codes as room, p.amenity_codes as hotel
      from stay.room_types r join stay.properties p on p.id=r.property_id where r.id=${stay.roomTypeId}::uuid`;
    expect(row.room.includes("door_lock_type")).toBe(selected);
    expect(row.room.includes("door_lock_type_v3")).toBe(selected);
    expect(row.hotel).not.toContain("door_lock_type_v3");
    await page.reload();
  }
});

test("catalog changes preserve other translations and persist the chosen icon", async ({
  page,
  context,
}) => {
  const code = "qa_" + crypto.randomUUID().replaceAll("-", "");
  await db()`insert into stay.amenities(code,grp,label,icon) values
    (${code},'room','{"fa-IR":"QA FA","en-US":"QA EN"}'::jsonb,'check')`;
  const filename = code.slice(-8);
  const imagePath = "/images/stays/yazd-traditional-courtyard.webp?qa=" + code;
  const [image] = await db()`insert into media.media_library(original_name,stored_name,file_url,mime_type,media_type,is_public)
    values (${filename},${filename},${imagePath},'image/webp','image',true) returning id`;
  try {
    await signedInAdmin(context);
    await page.goto("/en/admin/stays/amenities");
    await page.getByRole("combobox", { name: "Amenities" }).selectOption(code);
    await page.locator('input[lang="en-US"]').fill("Edited test amenity");
    await page.getByRole("combobox", { name: "Icon" }).selectOption("coffee");
    await page.getByRole("button", { name: "Pick media" }).click();
    const library = page.getByRole("dialog");
    await library.getByPlaceholder("Search files").fill(filename);
    await library.getByText(filename, { exact: true }).click();
    await expect(library).toBeHidden();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect
      .poll(async () => {
        const [row] =
          await db()`select label,icon,revision,image_id from stay.amenities where code=${code}`;
        return [row.label["en-US"], row.label["fa-IR"], row.icon, row.revision, row.image_id];
      })
      .toEqual(["Edited test amenity", "QA FA", "coffee", 2, image.id]);
    await page.reload();
    await page.getByRole("combobox", { name: "Amenities" }).selectOption(code);
    await expect(page.locator('input[name="amenity-image"]')).toHaveValue(image.id);
    await expect(page.locator('input[lang="en-US"]')).toHaveValue(
      "Edited test amenity",
    );
  } finally {
    await db()`delete from stay.amenities where code=${code}`;
    await db()`delete from media.media_library where id=${image.id}`;
  }
});
