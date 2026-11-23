import { expect, test } from '@playwright/test';

const providerId = process.env.E2E_PROVIDER_ID;
const serviceId = process.env.E2E_SERVICE_ID;
const providerZone = process.env.E2E_PROVIDER_TIMEZONE || 'Asia/Tehran';

test.skip(!providerId || !serviceId, 'Set a provider and service with today’s availability in the local test database.');

test('past provider-local slots cannot be booked from a different browser zone', async ({ page, request }) => {
  const providerClock = new Intl.DateTimeFormat('en-CA', {
    timeZone: providerZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (name: string) => providerClock.find((item) => item.type === name)?.value || '';
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  const nowTime = `${part('hour')}:${part('minute')}`;

  await page.goto(`/api/booking-pro/availability/timeslots?providerId=${providerId}&serviceId=${serviceId}&selectedDate=${date}&locale=en-US`);
  await expect(page.locator('body')).toContainText('timeSlots');

  const response = await request.get(`/api/booking-pro/availability/timeslots?providerId=${providerId}&serviceId=${serviceId}&selectedDate=${date}&locale=en-US`);
  expect(response.status()).toBe(200);
  const payload = await response.json() as { timeSlots: Array<{ time: string; available: boolean }> };
  expect(payload.timeSlots.length).toBeGreaterThan(0);
  expect(payload.timeSlots.filter((slot) => slot.time < nowTime).every((slot) => !slot.available)).toBe(true);
});
