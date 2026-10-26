import { afterAll, describe, expect, it } from "vitest";

import {
  listBookingPaymentsForReview,
  listPartlyPaidBookings,
  listRecentBookingPayments,
} from "./booking-payments.queries";
import {
  approveBookingPayment,
  BookingPaymentRuleError,
  recordBookingBalancePayment,
  rejectBookingPayment,
} from "./booking-payments.service";
import { closeTestSql, testSql } from "./__testing__/harness";

/**
 * The financial panel's reservation queue reads booking.payments / booking.bookings
 * directly. Before this, the deposit queue read only accounting.deposit_requests, which
 * no checkout writes, so reservation payments never appeared there at all.
 */

const ACTOR = "00000000-0000-4000-8000-00000000a11c"; // a financial panel user, not the customer
const created: string[] = [];

afterAll(async () => {
  if (created.length) await testSql`delete from booking.bookings where id = any(${created}::uuid[])`;
  await closeTestSql();
});

async function seedBooking(opts: {
  total: number;
  paid: number;
  paymentStatus: string;
  bookingStatus?: string;
  dueNow?: number;
}) {
  // booking.bookings hangs off providers and services; only the money matters here, so
  // the FK triggers are skipped for this one seed transaction.
  return testSql.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    const [booking] = await tx<{ id: string }[]>`
      insert into booking.bookings (
        id, provider_id, service_id, booking_ui_mode, payment_method,
        booking_status, payment_status, currency_code, total_amount, paid_amount,
        add_ons, upload_files, user_id, confirmation_code
      ) values (
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'default_slot', 'bank_receipt',
        ${opts.bookingStatus ?? "Pending"}, ${opts.paymentStatus}, 'IRR', ${opts.total}, ${opts.paid},
        '[]'::jsonb, '[]'::jsonb, gen_random_uuid(), 'TEST-' || substr(md5(random()::text), 1, 6)
      )
      returning id::text as id
    `;
    if (opts.dueNow !== undefined) {
      await tx`
        insert into commercial.booking_payment_terms (booking_id, collection_mode, payment_currency_code, total_amount, due_now_amount, due_later_amount)
        values (${booking.id}, 'deposit', 'IRR', ${opts.total}, ${opts.dueNow}, ${opts.total - opts.dueNow})
      `;
    }
    if (opts.paid > 0) {
      await tx`
        insert into booking.payments (booking_id, payment_method, gateway, amount, currency, status)
        values (${booking.id}, 'zarinpal', 'zarinpal', ${opts.paid}, 'IRR', 'Succeeded')
      `;
    }
    created.push(booking.id);
    return booking.id;
  });
}

async function addPayment(bookingId: string, method: string, amount: number, status = "Pending") {
  const [row] = await testSql<{ id: string }[]>`
    insert into booking.payments (booking_id, payment_method, gateway, amount, currency, status, gateway_payload)
    values (${bookingId}, ${method}, ${method}, ${amount}, 'IRR', ${status},
            ${{ receipt: { fileUrl: "https://example.test/r.jpg", mimeType: "image/jpeg" } } as never})
    returning id::text as id
  `;
  return row.id;
}

async function bookingState(id: string) {
  const [row] = await testSql<{ paid: string; paymentStatus: string; bookingStatus: string }[]>`
    select paid_amount::text as paid, payment_status as "paymentStatus", booking_status as "bookingStatus"
    from booking.bookings where id = ${id}
  `;
  return row;
}

describe("reservation payments waiting for review", () => {
  it("lists bank receipts and pay-at-place payments, not abandoned gateway attempts or cancelled bookings", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 0, paymentStatus: "Pending" });
    const receipt = await addPayment(booking, "bank_receipt", 1_000_000);
    const gateway = await addPayment(booking, "zarinpal", 1_000_000);
    const cancelled = await seedBooking({ total: 500_000, paid: 0, paymentStatus: "Pending", bookingStatus: "Cancelled" });
    const cancelledReceipt = await addPayment(cancelled, "bank_receipt", 500_000);

    const ids = (await listBookingPaymentsForReview()).map((r) => r.paymentId);
    expect(ids).toContain(receipt);
    expect(ids).not.toContain(gateway);
    expect(ids).not.toContain(cancelledReceipt);

    const row = (await listBookingPaymentsForReview()).find((r) => r.paymentId === receipt)!;
    expect(row.receiptUrl).toBe("https://example.test/r.jpg");
    expect(row.kind).toBe("partial");
    expect(row.remainingAmount).toBe("1000000.00");
  });

  it("approving a receipt marks the booking paid and moves it to the recent payments list", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 0, paymentStatus: "Pending" });
    const receipt = await addPayment(booking, "bank_receipt", 1_000_000);

    await approveBookingPayment({ bookingId: booking, paymentId: receipt, actorUserId: ACTOR });

    expect(await bookingState(booking)).toMatchObject({ paid: "1000000.00", paymentStatus: "Paid", bookingStatus: "Confirmed" });
    expect((await listBookingPaymentsForReview()).map((r) => r.paymentId)).not.toContain(receipt);
    const recent = (await listRecentBookingPayments(30)).find((r) => r.paymentId === receipt);
    expect(recent?.kind).toBe("full");
  });

  it("rejecting a second receipt does not mark an already part-paid booking as failed", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 300_000, paymentStatus: "Paid", dueNow: 300_000 });
    const receipt = await addPayment(booking, "bank_receipt", 700_000);

    await rejectBookingPayment({ bookingId: booking, paymentId: receipt, actorUserId: ACTOR, reason: "blurry" });

    expect(await bookingState(booking)).toMatchObject({ paid: "300000.00", paymentStatus: "Paid" });
    const [payment] = await testSql`select status from booking.payments where id = ${receipt}`;
    expect(payment.status).toBe("Failed");
  });

  it("rejecting the only receipt of an unpaid booking still marks it failed", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 0, paymentStatus: "Pending" });
    const receipt = await addPayment(booking, "bank_receipt", 1_000_000);

    await rejectBookingPayment({ bookingId: booking, paymentId: receipt, actorUserId: ACTOR, reason: "fake" });

    expect((await bookingState(booking)).paymentStatus).toBe("Failed");
  });
});

describe("partly paid reservations", () => {
  it("lists a deposit-paid booking with what is paid and what is left", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 300_000, paymentStatus: "Paid", dueNow: 300_000 });

    const row = (await listPartlyPaidBookings()).find((r) => r.bookingId === booking);
    expect(row).toMatchObject({ kind: "deposit", paidAmount: "300000.00", remainingAmount: "700000.00", totalAmount: "1000000.00" });
  });

  it("lists a booking that paid less than the part due now as partial", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 100_000, paymentStatus: "PartiallyPaid", dueNow: 300_000 });

    const row = (await listPartlyPaidBookings()).find((r) => r.bookingId === booking);
    expect(row?.kind).toBe("partial");
  });

  it("recording the rest makes the booking fully paid and keeps a completed booking completed", async () => {
    const booking = await seedBooking({
      total: 1_000_000,
      paid: 300_000,
      paymentStatus: "Paid",
      bookingStatus: "Completed",
      dueNow: 300_000,
    });

    await recordBookingBalancePayment({ bookingId: booking, amount: "700000", actorUserId: ACTOR, reference: "POS-123" });

    expect(await bookingState(booking)).toMatchObject({ paid: "1000000.00", paymentStatus: "Paid", bookingStatus: "Completed" });
    expect((await listPartlyPaidBookings()).map((r) => r.bookingId)).not.toContain(booking);
    const recent = (await listRecentBookingPayments(30)).filter((r) => r.bookingId === booking);
    expect(recent.find((r) => r.method === "manual_collection")).toMatchObject({ kind: "full", externalReference: "POS-123" });
  });

  it("refuses more than what is left, and leaves no payment row behind", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 300_000, paymentStatus: "Paid", dueNow: 300_000 });

    await expect(
      recordBookingBalancePayment({ bookingId: booking, amount: "700001", actorUserId: ACTOR })
    ).rejects.toMatchObject({ code: "over_remaining" });
    await expect(
      recordBookingBalancePayment({ bookingId: booking, amount: "-5", actorUserId: ACTOR })
    ).rejects.toBeInstanceOf(BookingPaymentRuleError);

    const [{ count }] = await testSql`select count(*)::int as count from booking.payments where booking_id = ${booking}`;
    expect(count).toBe(1);
    expect((await bookingState(booking)).paid).toBe("300000.00");
  });

  it("a double submit records the balance once", async () => {
    const booking = await seedBooking({ total: 1_000_000, paid: 300_000, paymentStatus: "Paid", dueNow: 300_000 });

    const results = await Promise.allSettled([
      recordBookingBalancePayment({ bookingId: booking, amount: "700000", actorUserId: ACTOR }),
      recordBookingBalancePayment({ bookingId: booking, amount: "700000", actorUserId: ACTOR }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await bookingState(booking)).paid).toBe("1000000.00");
  });
});
