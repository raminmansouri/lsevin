/**
 * 2026-11-18 report: an admin could not remove recurring schedules or departures from a tour's
 * schedule tab. Through the real UI: generate departures from a schedule, remove one unsold
 * departure, remove the schedule (its unsold departures go with it, a booked one stays), and
 * check that generating again recreates nothing; everything survives a reload.
 *   TOURS_E2E_BASE_URL=http://127.0.0.2:3045 npx playwright test --config playwright.tours.config.ts admin-schedule-remove.spec.ts --project desktop
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

import { seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { expectToast, seedBooking, signInAdmin } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
test.describe.configure({ timeout: 300_000 });

const isoIn = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/** ReasonAction: open it, type the reason, confirm (retrying a click that lands before hydration). */
async function confirmWithReason(page: Page, scope: Locator, testId: string, groupName: string, reason: string) {
  await expect(async () => {
    const group = scope.getByRole("group", { name: groupName });
    if (!(await group.isVisible())) await scope.getByTestId(testId).first().click();
    await expect(group).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 120_000 });
  const group = scope.getByRole("group", { name: groupName });
  await group.getByRole("textbox").last().fill(reason);
  await group.getByRole("button", { name: groupName }).click();
}

test("an admin removes a departure, then the whole recurring schedule; booked departures stay; nothing is regenerated", async ({ context, page }) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, departures: 0, capacity: 8 });
  // A daily schedule for days 2..8 (the admin form would create the same row).
  const [rule] = await sql<{ id: string }[]>`
    insert into tour.schedule_rules (tour_id, calendar, kind, weekdays, local_time, start_date, end_date, capacity)
    values (${t.id}::uuid, 'gregory', 'weekly', '{1,2,3,4,5,6,7}', '09:00', ${isoIn(2)}::date, ${isoIn(8)}::date, 8) returning id::text`;
  await signInAdmin(context);
  await page.goto(`/en/admin/tours-platform/tours/${t.id}?tab=schedule`);

  // Generate the departures from the schedule.
  await expect(async () => {
    await page.getByRole("button", { name: "Generate departures" }).click();
    await expect(page.getByTestId("remove-departure").first()).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 120_000 });
  const generated = await sql<{ id: string; starts_at: Date }[]>`
    select id::text, starts_at from tour.departures where schedule_rule_id = ${rule.id}::uuid and is_active order by starts_at`;
  expect(generated.length).toBeGreaterThanOrEqual(6);
  // Someone books the last one.
  const last = generated[generated.length - 1];
  await seedBooking({ ...t, departureIds: [last.id] }, p.id, (await seedUser(sql)).id, 1, last.id);
  await page.reload();

  // Remove the first (unsold) departure.
  const rows = page.locator('section[aria-labelledby="departures-title"] tbody tr');
  await confirmWithReason(page, rows.first(), "remove-departure", "Remove", "Guide unavailable that day");
  await expectToast(page, "Departure removed.");
  await expect(rows).toHaveCount(generated.length - 1);
  // The booked one offers the board, not removal.
  await expect(rows.last().getByTestId("remove-departure")).toHaveCount(0);
  await expect(rows.last().getByRole("link", { name: "Manage on board" })).toBeVisible();

  // Remove the schedule: unsold departures go, the booked one stays with a warning.
  const ruleRow = page.getByTestId("schedule-rule").first();
  await confirmWithReason(page, ruleRow, "remove-rule", "Remove schedule", "Season over for this route");
  await expectToast(page, /1 departure of this schedule has bookings/);
  await expect(page.getByTestId("schedule-rule").first()).toHaveAttribute("data-active", "false");
  await expect(rows).toHaveCount(1);

  // Generating again recreates nothing; all of it survives a reload.
  await page.getByRole("button", { name: "Generate departures" }).click();
  await expectToast(page);
  await page.reload();
  await expect(page.locator('section[aria-labelledby="departures-title"] tbody tr')).toHaveCount(1);
  await expect(page.getByTestId("schedule-rule").first()).toHaveAttribute("data-active", "false");
  const active = await sql<{ id: string }[]>`select id::text from tour.departures where tour_id = ${t.id}::uuid and is_active`;
  expect(active.map((d) => d.id)).toEqual([last.id]);
  const [{ is_active }] = await sql<{ is_active: boolean }[]>`select is_active from tour.schedule_rules where id = ${rule.id}::uuid`;
  expect(is_active).toBe(false);
});
