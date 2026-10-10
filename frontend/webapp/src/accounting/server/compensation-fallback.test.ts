import { afterAll, describe, expect, it } from "vitest";

import { buildBookingChargeLinesForBooking } from "@/features/commercial/lib/server/compensation-engine";
import { closeTestSql, testSql } from "./__testing__/harness";

/**
 * When no commercial.compensation_policies row matches a booking, checkout used to fall
 * back to a 0% platform fee, so the provider was owed 100% of the booking. It now uses
 * the platform commission set in the financial panel (accounting.settings
 * 'platform_fee_percent').
 */

const created: { providers: string[]; services: string[]; bookings: string[] } = { providers: [], services: [], bookings: [] };
let originalFee: unknown;

afterAll(async () => {
  if (originalFee !== undefined) {
    await testSql`update accounting.settings set value = ${testSql.json(originalFee as never)} where key = 'platform_fee_percent'`;
  }
  await testSql.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    await tx`delete from booking.bookings where id = any(${created.bookings}::uuid[])`;
    await tx`delete from category.provider_services where id = any(${created.services}::uuid[])`;
    await tx`delete from category.service_providers where id = any(${created.providers}::uuid[])`;
  });
  await closeTestSql();
});

async function seedBooking(total: number) {
  return testSql.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    const [{ providerId, serviceId }] = await tx<{ providerId: string; serviceId: string }[]>`
      select gen_random_uuid()::text as "providerId", gen_random_uuid()::text as "serviceId"
    `;
    await tx`
      insert into category.service_providers (
        id, name_translations, description_translations, is_active, provider_type_id,
        city, country, email, phone_number_country_code, phone_number
      ) values (
        ${providerId}, '{}'::jsonb, '{}'::jsonb, true, gen_random_uuid(),
        'Tehran', 'IR', 'fallback@test.local', '+98', '9120000000'
      )
    `;
    await tx`
      insert into category.provider_services (
        id, service_definition_id, display_name_translations, description_translations,
        is_active, service_provider_id, currency, value, create_date
      ) values (
        ${serviceId}, gen_random_uuid(), '{}'::jsonb, '{}'::jsonb,
        true, ${providerId}, 'IRR', ${total}, now()
      )
    `;
    const [booking] = await tx<{ id: string }[]>`
      insert into booking.bookings (
        id, provider_id, service_id, booking_ui_mode, payment_method, booking_status, payment_status,
        currency_code, total_amount, paid_amount, add_ons, upload_files, confirmation_code
      ) values (
        gen_random_uuid(), ${providerId}, ${serviceId}, 'default_slot', 'zarinpal', 'Pending', 'Pending',
        'IRR', ${total}, 0, '[]'::jsonb, '[]'::jsonb, 'FB-' || substr(md5(random()::text), 1, 6)
      ) returning id::text as id
    `;
    created.providers.push(providerId);
    created.services.push(serviceId);
    created.bookings.push(booking.id);
    return booking.id;
  });
}

describe("provider share when no compensation policy matches", () => {
  it("keeps the platform commission from the financial panel settings", async () => {
    const [row] = await testSql<{ value: unknown }[]>`select value from accounting.settings where key = 'platform_fee_percent'`;
    originalFee = row.value;
    await testSql`update accounting.settings set value = '20'::jsonb where key = 'platform_fee_percent'`;
    const [{ n }] = await testSql<{ n: number }[]>`select count(*)::int as n from commercial.compensation_policies where is_active`;
    expect(n).toBe(0);

    const bookingId = await seedBooking(18_000_000);
    const [line] = await buildBookingChargeLinesForBooking(bookingId);

    expect(line.policyId).toBeNull();
    expect(line.netAmount).toBe(18_000_000);
    expect(line.platformFeeAmount).toBe(3_600_000);
    expect(line.providerPayableAmount).toBe(14_400_000);
  });
});
