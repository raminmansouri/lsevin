import { expect, test } from "@playwright/test";
import { db, seedWorld, signedInAdmin, skipIntro } from "./helpers";

test("hotel lock option persists and is visible to guests @regression", async ({ context, page }) => {
  const { stays: [stay] } = await seedWorld();
  await signedInAdmin(context);
  await skipIntro(context);
  await page.goto("/en/admin/stays/properties/" + stay.id);
  await page.getByTestId("stays-admin-amenities").click();
  await page.getByRole("option", { name: "Door lock type", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByLabel("Door lock type", { exact: true }).selectOption("door_lock_type_v2");
  await page.getByTestId("stays-admin-save-details").click();
  await expect.poll(async () => {
    const [row] = await db()`select amenity_codes from stay.properties where id=${stay.id}::uuid`;
    return row.amenity_codes;
  }).toContain("door_lock_type_v2");
  await page.reload();
  await expect(page.getByLabel("Door lock type", { exact: true })).toHaveValue("door_lock_type_v2");
  await page.goto("/en/stays/" + stay.slug);
  await expect(page.getByText("Key card", { exact: true }).first()).toBeVisible();
});

test("a room amenity can be selected and removed without changing the hotel", async ({ page, context }) => {
  const { stays: [stay] } = await seedWorld();
  await signedInAdmin(context);
  await page.goto(`/en/admin/stays/properties/${stay.id}?tab=rooms`);
  for (const selected of [true, false]) {
    await page.getByTestId("stays-admin-room-edit").first().click();
    const dialog = page.getByTestId("stays-admin-room-dialog");
    await dialog.getByTestId("stays-room-amenities").click();
    await page.getByRole("option", { name: "Door lock type", exact: true }).click();
    await page.keyboard.press("Escape");
    if (selected) await dialog.getByLabel("Door lock type", { exact: true }).selectOption("door_lock_type_v3");
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
