import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { assertRefundable, RefundGuardError } from "./refund-guard";
import { closeTestSql, ensureAccountingSchema, testSql } from "./__testing__/harness";

const TOMAN = 10; // IRR per Toman

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await cleanup();
  await closeTestSql();
});

const created = { bookings: [] as string[], requests: [] as string[] };

/**
 * Builds a booking that was paid, so the guard has a real `paid_amount` to work from.
 * booking.bookings has a wide NOT NULL surface; only what the guard reads matters here.
 */
async function seedPaidBooking(paidAmount: string) {
  const [provider] = await testSql<{ id: string }[]>`
    select id::text as id from category.service_providers limit 1
  `;
  const [service] = await testSql<{ id: string }[]>`
    select id::text as id from category.provider_services limit 1
  `;
  if (!provider || !service) return null; // nothing to hang a booking off in this database

  const [booking] = await testSql<{ id: string }[]>`
    insert into booking.bookings (
      id, provider_id, service_id, booking_ui_mode, payment_method,
      booking_status, payment_status, currency_code, total_amount, paid_amount,
      add_ons, upload_files
    ) values (
      gen_random_uuid(), ${provider.id}, ${service.id}, 'default_slot', 'wallet',
      'Confirmed', 'Paid', 'IRR', ${paidAmount}::numeric, ${paidAmount}::numeric,
      '[]'::jsonb, '[]'::jsonb
    )
    returning id::text as id
  `;
  created.bookings.push(booking.id);
  return booking.id;
}

/** Records an executed refund the way both engines do. */
async function recordExecutedRefund(bookingId: string, amount: string) {
  const [request] = await testSql<{ id: string }[]>`
    insert into commercial.refund_requests (id, booking_id, refund_scope, reason, status)
    values (gen_random_uuid(), ${bookingId}, 'partial', 'cutover test', 'refunded')
    returning id::text as id
  `;
  created.requests.push(request.id);

  await testSql`
    insert into commercial.refunds (
      id, refund_request_id, gateway, refund_amount, currency_code, status, processed_at
    ) values (
      gen_random_uuid(), ${request.id}, 'wallet_credit', ${amount}::numeric, 'IRR', 'refunded', now()
    )
  `;
  return request.id;
}

async function cleanup() {
  if (created.requests.length) {
    await testSql`delete from commercial.refunds where refund_request_id = any(${created.requests})`;
    await testSql`delete from commercial.refund_requests where id = any(${created.requests})`;
    created.requests.length = 0;
  }
  if (created.bookings.length) {
    await testSql`delete from booking.bookings where id = any(${created.bookings})`;
    created.bookings.length = 0;
  }
}

describe("cross-engine refund guard", () => {
  it("allows a refund within what the booking was paid", async () => {
    const bookingId = await seedPaidBooking(String(1_000_000 * TOMAN));
    if (!bookingId) return;

    try {
      const result = await testSql.begin(async (tx) =>
        assertRefundable({ bookingId, amount: String(400_000 * TOMAN) }, tx as never)
      );
      expect(Number(result.paidAmount)).toBe(1_000_000 * TOMAN);
      expect(Number(result.alreadyRefunded)).toBe(0);
      expect(Number(result.remaining)).toBe(1_000_000 * TOMAN);
    } finally {
      await cleanup();
    }
  });

  it("counts a refund executed by the OTHER engine against the remainder", async () => {
    const bookingId = await seedPaidBooking(String(1_000_000 * TOMAN));
    if (!bookingId) return;

    try {
      // Engine A already refunded 700,000 Toman on this booking.
      await recordExecutedRefund(bookingId, String(700_000 * TOMAN));

      const result = await testSql.begin(async (tx) =>
        assertRefundable({ bookingId, amount: String(300_000 * TOMAN) }, tx as never)
      );
      expect(Number(result.alreadyRefunded)).toBe(700_000 * TOMAN);
      expect(Number(result.remaining)).toBe(300_000 * TOMAN);
    } finally {
      await cleanup();
    }
  });

  it("refuses the second refund that would take the booking past what was paid", async () => {
    const bookingId = await seedPaidBooking(String(1_000_000 * TOMAN));
    if (!bookingId) return;

    try {
      // The customer paid 1,000,000 and one screen already refunded 700,000.
      await recordExecutedRefund(bookingId, String(700_000 * TOMAN));

      // The other screen tries to refund 500,000 — which would return 1,200,000 in total.
      await expect(
        testSql.begin(async (tx) =>
          assertRefundable({ bookingId, amount: String(500_000 * TOMAN) }, tx as never)
        )
      ).rejects.toThrow(RefundGuardError);

      await expect(
        testSql.begin(async (tx) =>
          assertRefundable({ bookingId, amount: String(500_000 * TOMAN) }, tx as never)
        )
      ).rejects.toThrow(/would exceed what this booking can be refunded/i);
    } finally {
      await cleanup();
    }
  });

  it("refuses a refund on a booking that was never paid", async () => {
    const bookingId = await seedPaidBooking("0");
    if (!bookingId) return;

    try {
      await expect(
        testSql.begin(async (tx) =>
          assertRefundable({ bookingId, amount: String(1 * TOMAN) }, tx as never)
        )
      ).rejects.toThrow(/would exceed/i);
    } finally {
      await cleanup();
    }
  });

  it("serialises two concurrent refunds on the same booking", async () => {
    const bookingId = await seedPaidBooking(String(1_000_000 * TOMAN));
    if (!bookingId) return;

    try {
      // Both ask for 600,000 at the same time. Without the advisory lock both would read
      // "nothing refunded yet" and both would pass, refunding 1,200,000 of a 1,000,000
      // booking. With it, the second waits, sees the first, and is refused.
      const attempt = () =>
        testSql.begin(async (tx) => {
          const check = await assertRefundable(
            { bookingId, amount: String(600_000 * TOMAN) },
            tx as never
          );
          const [request] = await tx<{ id: string }[]>`
            insert into commercial.refund_requests (id, booking_id, refund_scope, reason, status)
            values (gen_random_uuid(), ${bookingId}, 'partial', 'concurrency test', 'refunded')
            returning id::text as id
          `;
          created.requests.push(request.id);
          await tx`
            insert into commercial.refunds (
              id, refund_request_id, gateway, refund_amount, currency_code, status, processed_at
            ) values (
              gen_random_uuid(), ${request.id}, 'wallet_credit',
              ${String(600_000 * TOMAN)}::numeric, 'IRR', 'refunded', now()
            )
          `;
          return check;
        });

      const results = await Promise.allSettled([attempt(), attempt()]);
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const [total] = await testSql<{ total: string }[]>`
        select coalesce(sum(r.refund_amount), 0)::text as total
        from commercial.refunds r
        join commercial.refund_requests rr on rr.id = r.refund_request_id
        where rr.booking_id = ${bookingId}
      `;
      // Never more than the customer paid.
      expect(Number(total.total)).toBe(600_000 * TOMAN);
    } finally {
      await cleanup();
    }
  });
});
