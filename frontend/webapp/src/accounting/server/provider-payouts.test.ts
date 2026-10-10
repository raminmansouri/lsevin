import { afterAll, describe, expect, it } from "vitest";

import { listProviderPayoutsDue, listRecentProviderPayouts } from "./provider-payouts.queries";
import {
  approveProviderEntries,
  cancelProviderEntry,
  markProviderEntriesPaid,
  ProviderPayoutRuleError,
} from "./provider-payouts.service";
import { closeTestSql, testSql } from "./__testing__/harness";

/**
 * The withdrawal queue reads commercial.provider_ledgers directly. Before this it read
 * only accounting.withdrawal_requests, which nothing writes, so what doctors and hotels
 * were owed never showed up in the financial panel.
 */

const ACTOR = "00000000-0000-4000-8000-00000000a11c";
const bookings: string[] = [];
const ledgers: string[] = [];

afterAll(async () => {
  if (ledgers.length) await testSql`delete from commercial.provider_ledgers where id = any(${ledgers}::uuid[])`;
  if (bookings.length) await testSql`delete from booking.bookings where id = any(${bookings}::uuid[])`;
  await closeTestSql();
});

async function seed(opts: { paid: number; bookingStatus?: string; entries: { amount: number; type?: string; status?: string }[] }) {
  return testSql.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    const [provider] = await tx<{ id: string }[]>`select gen_random_uuid()::text as id`;
    const [booking] = await tx<{ id: string }[]>`
      insert into booking.bookings (
        id, provider_id, service_id, booking_ui_mode, payment_method, booking_status, payment_status,
        currency_code, total_amount, paid_amount, add_ons, upload_files, confirmation_code
      ) values (
        gen_random_uuid(), ${provider.id}, gen_random_uuid(), 'default_slot', 'zarinpal',
        ${opts.bookingStatus ?? "Confirmed"}, ${opts.paid > 0 ? "Paid" : "Pending"},
        'IRR', 1000000, ${opts.paid}, '[]'::jsonb, '[]'::jsonb, 'PAY-' || substr(md5(random()::text), 1, 6)
      ) returning id::text as id
    `;
    bookings.push(booking.id);
    const ids: string[] = [];
    for (const e of opts.entries) {
      const [row] = await tx<{ id: string }[]>`
        insert into commercial.provider_ledgers (provider_id, booking_id, entry_type, amount, currency_code, status)
        values (${provider.id}, ${booking.id}, ${e.type ?? "earning"}, ${e.amount}, 'IRR', ${e.status ?? "pending"})
        returning id::text as id
      `;
      ids.push(row.id);
      ledgers.push(row.id);
    }
    return { providerId: provider.id, bookingId: booking.id, ids };
  });
}

const groupFor = async (providerId: string) => (await listProviderPayoutsDue()).find((g) => g.providerId === providerId);

describe("provider payouts due", () => {
  it("shows a provider's share once the customer has paid, with pending and approved totals", async () => {
    const s = await seed({ paid: 1000000, entries: [{ amount: 800000 }, { amount: 50000, status: "approved" }] });

    const g = await groupFor(s.providerId);
    expect(g).toMatchObject({ pendingTotal: "800000.00", approvedTotal: "50000.00", currencyCode: "IRR" });
    expect(g?.entries.map((e) => e.customerPayment)).toEqual(["full", "full"]);
  });

  it("leaves out earnings on unpaid or cancelled bookings", async () => {
    const unpaid = await seed({ paid: 0, entries: [{ amount: 800000 }] });
    const cancelled = await seed({ paid: 1000000, bookingStatus: "Cancelled", entries: [{ amount: 800000 }] });

    expect(await groupFor(unpaid.providerId)).toBeUndefined();
    expect(await groupFor(cancelled.providerId)).toBeUndefined();
  });

  it("leaves out earnings whose booking was deleted, but keeps manual adjustments", async () => {
    const s = await seed({ paid: 1000000, entries: [{ amount: 800000 }] });
    const [adj] = await testSql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      return tx<{ id: string }[]>`
        insert into commercial.provider_ledgers (provider_id, booking_id, entry_type, amount, currency_code, status)
        values (${s.providerId}, null, 'adjustment', 25000, 'IRR', 'pending')
        returning id::text as id
      `;
    });
    ledgers.push(adj.id);
    // booking_id is ON DELETE SET NULL, so deleting the booking leaves an orphan earning.
    await testSql`update commercial.provider_ledgers set booking_id = null where id = ${s.ids[0]}`;

    const g = await groupFor(s.providerId);
    expect(g?.entries.map((e) => e.id)).toEqual([adj.id]);
    expect(g?.pendingTotal).toBe("25000.00");
  });

  it("nets a refund reversal against the earning", async () => {
    const s = await seed({
      paid: 1000000,
      entries: [{ amount: 800000, status: "approved" }, { amount: -300000, type: "reversal", status: "approved" }],
    });
    expect((await groupFor(s.providerId))?.approvedTotal).toBe("500000.00");
  });
});

describe("approving and paying providers", () => {
  it("approve -> paid with the bank reference, then it moves to the recently paid list", async () => {
    const s = await seed({ paid: 1000000, entries: [{ amount: 800000 }, { amount: 100000 }] });

    await approveProviderEntries({ ids: s.ids, actorUserId: ACTOR });
    expect((await groupFor(s.providerId))?.approvedTotal).toBe("900000.00");

    const result = await markProviderEntriesPaid({ ids: s.ids, actorUserId: ACTOR, reference: "SATNA-42" });
    expect(result).toMatchObject({ paid: 2, total: "900000.00" });

    expect(await groupFor(s.providerId)).toBeUndefined();
    const paid = (await listRecentProviderPayouts(30)).find((g) => g.providerId === s.providerId);
    expect(paid?.entries.every((e) => e.status === "paid" && e.payoutReference === "SATNA-42")).toBe(true);
  });

  it("refuses to pay entries that are not approved, or that changed since the page loaded", async () => {
    const s = await seed({ paid: 1000000, entries: [{ amount: 800000 }] });
    await expect(markProviderEntriesPaid({ ids: s.ids, actorUserId: ACTOR, reference: "X" })).rejects.toMatchObject({
      code: "changed",
    });

    await approveProviderEntries({ ids: s.ids, actorUserId: ACTOR });
    await expect(approveProviderEntries({ ids: s.ids, actorUserId: ACTOR })).rejects.toMatchObject({ code: "changed" });
  });

  it("refuses a payout without a reference, across two providers, or with nothing owed", async () => {
    const a = await seed({ paid: 1000000, entries: [{ amount: 800000, status: "approved" }] });
    const b = await seed({ paid: 1000000, entries: [{ amount: 500000, status: "approved" }] });
    const neg = await seed({ paid: 1000000, entries: [{ amount: -10000, type: "reversal", status: "approved" }] });

    await expect(markProviderEntriesPaid({ ids: a.ids, actorUserId: ACTOR, reference: "  " })).rejects.toMatchObject({
      code: "reference_required",
    });
    await expect(
      markProviderEntriesPaid({ ids: [...a.ids, ...b.ids], actorUserId: ACTOR, reference: "R" })
    ).rejects.toMatchObject({ code: "mixed" });
    await expect(markProviderEntriesPaid({ ids: neg.ids, actorUserId: ACTOR, reference: "R" })).rejects.toBeInstanceOf(
      ProviderPayoutRuleError
    );

    const [row] = await testSql`select status from commercial.provider_ledgers where id = ${a.ids[0]}`;
    expect(row.status).toBe("approved");
  });

  it("cancelling an entry removes it from what is owed", async () => {
    const s = await seed({ paid: 1000000, entries: [{ amount: 800000 }, { amount: 200000 }] });
    await cancelProviderEntry({ id: s.ids[1], actorUserId: ACTOR, reason: "duplicate" });

    expect((await groupFor(s.providerId))?.pendingTotal).toBe("800000.00");
    await expect(cancelProviderEntry({ id: s.ids[1], actorUserId: ACTOR, reason: "again" })).rejects.toMatchObject({
      code: "changed",
    });
  });
});
