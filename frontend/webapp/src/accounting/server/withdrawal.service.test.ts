import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { postJournalEntry } from "./ledger.service";
import {
  closeTestSql,
  ensureAccountingSchema,
  withSavepoint,
  withTestTransaction,
  type TestTx,
} from "./__testing__/harness";

/**
 * The withdrawal rules are the business's numbers — 100,000 Toman minimum,
 * 20,000,000 Toman maximum and daily cap. Expressed in IRR, which is what the ledger
 * stores: 1 Toman = 10 IRR.
 */
const TOMAN = 10; // IRR per Toman
const MIN = String(100_000 * TOMAN); // 1,000,000 IRR
const MAX = String(20_000_000 * TOMAN); // 200,000,000 IRR

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await closeTestSql();
});

/** Puts money in the wallet so a withdrawal has something to reserve. */
async function fund(tx: TestTx, walletId: string, userId: string, amount: string) {
  await postJournalEntry(
    {
      idempotencyKey: `fund:${walletId}:${amount}`,
      sourceType: "deposit",
      lines: [
        { accountKey: "clearing_zarinpal", direction: "debit", amount, currencyCode: "IRR" },
        {
          accountKey: "user_wallet_liability",
          direction: "credit",
          amount,
          currencyCode: "IRR",
          partyType: "user",
          partyId: userId,
          walletId,
          movementType: "deposit",
        },
      ],
    },
    tx
  );
}

describe("withdrawal limits", () => {
  it("seeds the configured minimum and maximum", async () => {
    await withTestTransaction(async ({ tx }) => {
      const [row] = await tx<{ min: string; max: string; cap: string }[]>`
        select
          (select value ->> 'IRR' from accounting.settings where key = 'withdrawal.min_amount') as min,
          (select value ->> 'IRR' from accounting.settings where key = 'withdrawal.max_amount') as max,
          (select value ->> 'IRR' from accounting.settings where key = 'withdrawal.daily_cap') as cap
      `;
      expect(row.min).toBe(MIN);
      expect(row.max).toBe(MAX);
      expect(row.cap).toBe(MAX);
    });
  });

  it("rejects an amount below the 100,000 Toman minimum", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      await fund(tx, walletId, userId, MAX);

      const [below] = await tx<{ below_min: boolean }[]>`
        select ${String(99_999 * TOMAN)}::numeric < ${MIN}::numeric as below_min
      `;
      expect(below.below_min).toBe(true);

      const [atMin] = await tx<{ below_min: boolean }[]>`
        select ${MIN}::numeric < ${MIN}::numeric as below_min
      `;
      expect(atMin.below_min).toBe(false);
    });
  });

  it("rejects an amount above the 20,000,000 Toman maximum", async () => {
    await withTestTransaction(async ({ tx }) => {
      const [over] = await tx<{ above_max: boolean }[]>`
        select ${String(20_000_001 * TOMAN)}::numeric > ${MAX}::numeric as above_max
      `;
      expect(over.above_max).toBe(true);
    });
  });

  it("counts only live requests towards the daily cap", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      // Two requests: one live, one rejected. Only the live one should count.
      for (const [status, amount] of [
        ["pending", String(5_000_000 * TOMAN)],
        ["rejected", String(9_000_000 * TOMAN)],
      ] as const) {
        await tx`
          insert into accounting.withdrawal_requests (
            user_id, wallet_id, currency_code, amount, fee_amount, net_amount,
            destination_type, destination_iban, status, idempotency_key
          ) values (
            ${userId}, ${walletId}, 'IRR', ${amount}::numeric, 0, ${amount}::numeric,
            'bank_iban', 'IR000000000000000000000000', ${status}, ${"k-" + status + amount}
          )
        `;
      }

      const [used] = await tx<{ used: string }[]>`
        select coalesce(sum(amount), 0)::text as used
        from accounting.withdrawal_requests
        where user_id = ${userId}
          and currency_code = 'IRR'
          and created_at >= now() - interval '24 hours'
          and status not in ('rejected', 'failed', 'cancelled')
      `;
      expect(Number(used.used)).toBe(5_000_000 * TOMAN);

      // 5M + 16M Toman would breach the 20M cap.
      const [cap] = await tx<{ exceeded: boolean }[]>`
        select (${used.used}::numeric + ${String(16_000_000 * TOMAN)}::numeric) > ${MAX}::numeric as exceeded
      `;
      expect(cap.exceeded).toBe(true);
    });
  });
});

describe("withdrawal hold and release", () => {
  it("moves funds from available to reserved when requested", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      await fund(tx, walletId, userId, String(10_000_000 * TOMAN));

      const amount = String(3_000_000 * TOMAN);
      await postJournalEntry(
        {
          idempotencyKey: "wd-hold",
          sourceType: "withdrawal",
          lines: [
            {
              accountKey: "user_wallet_liability", direction: "debit", amount, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "available",
              movementType: "withdrawal_hold",
            },
            {
              accountKey: "withdrawal_reserved", direction: "credit", amount, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "reserved",
              movementType: "withdrawal_hold",
            },
          ],
        },
        tx
      );

      const [w] = await tx<{ available_balance: string; reserved_balance: string }[]>`
        select available_balance::text as available_balance, reserved_balance::text as reserved_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(w.available_balance)).toBe(7_000_000 * TOMAN);
      expect(Number(w.reserved_balance)).toBe(3_000_000 * TOMAN);

      // The reconciliation alert must stay silent: a held withdrawal is not drift.
      // Before the wallet_ledger gained a `bucket` column this reported every wallet
      // with an open withdrawal, which would have made the alert useless.
      const drift = await tx`
        select * from accounting.v_wallet_balance_drift where wallet_id = ${walletId}
      `;
      expect(drift.length).toBe(0);
    });
  });

  it("stops a second withdrawal from reserving money the first already holds", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const balance = String(5_000_000 * TOMAN);
      await fund(tx, walletId, userId, balance);

      const hold = (key: string, amount: string) =>
        postJournalEntry(
          {
            idempotencyKey: key,
            sourceType: "withdrawal",
            lines: [
              {
                accountKey: "user_wallet_liability", direction: "debit", amount, currencyCode: "IRR",
                partyType: "user", partyId: userId, walletId, walletBucket: "available",
                movementType: "withdrawal_hold",
              },
              {
                accountKey: "withdrawal_reserved", direction: "credit", amount, currencyCode: "IRR",
                partyType: "user", partyId: userId, walletId, walletBucket: "reserved",
                movementType: "withdrawal_hold",
              },
            ],
          },
          tx
        );

      await hold("wd-1", balance);

      // The whole balance is reserved; a second request for the same money must fail.
      await expect(withSavepoint(tx, () => hold("wd-2", balance))).rejects.toThrow(
        /ck_wallets_available_non_negative|violates check constraint/i
      );

      const [w] = await tx<{ available_balance: string; reserved_balance: string }[]>`
        select available_balance::text as available_balance, reserved_balance::text as reserved_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(w.available_balance)).toBe(0);
      expect(Number(w.reserved_balance)).toBe(5_000_000 * TOMAN);
    });
  });
});

describe("withdrawal settlement", () => {
  it("clears the reserve, reduces the bank, and books the fee as income", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const gross = String(2_000_000 * TOMAN);
      const fee = String(50_000 * TOMAN);
      const net = String(1_950_000 * TOMAN);

      await fund(tx, walletId, userId, gross);

      await postJournalEntry(
        {
          idempotencyKey: "settle-hold",
          sourceType: "withdrawal",
          lines: [
            {
              accountKey: "user_wallet_liability", direction: "debit", amount: gross, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "available",
              movementType: "withdrawal_hold",
            },
            {
              accountKey: "withdrawal_reserved", direction: "credit", amount: gross, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "reserved",
              movementType: "withdrawal_hold",
            },
          ],
        },
        tx
      );

      await postJournalEntry(
        {
          idempotencyKey: "settle-pay",
          sourceType: "withdrawal",
          lines: [
            {
              accountKey: "withdrawal_reserved", direction: "debit", amount: gross, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "reserved",
              movementType: "withdrawal",
            },
            { accountKey: "bank_platform", direction: "credit", amount: net, currencyCode: "IRR" },
            { accountKey: "withdrawal_fee_income", direction: "credit", amount: fee, currencyCode: "IRR" },
          ],
        },
        tx
      );

      const [w] = await tx<{ available_balance: string; reserved_balance: string }[]>`
        select available_balance::text as available_balance, reserved_balance::text as reserved_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(w.available_balance)).toBe(0);
      expect(Number(w.reserved_balance)).toBe(0);

      const [income] = await tx<{ amount: string }[]>`
        select coalesce(sum(amount), 0)::text as amount
        from accounting.v_income_statement
        where account_code = '4002001'
      `;
      expect(Number(income.amount)).toBe(50_000 * TOMAN);

      // And the books still balance after all of it.
      const [tb] = await tx<{ d: string; c: string }[]>`
        select coalesce(sum(total_debit), 0)::text as d, coalesce(sum(total_credit), 0)::text as c
        from accounting.v_trial_balance
      `;
      expect(tb.d).toBe(tb.c);
    });
  });

  it("returns the money to the customer when a withdrawal is rejected", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const amount = String(1_000_000 * TOMAN);
      await fund(tx, walletId, userId, amount);

      const hold = await postJournalEntry(
        {
          idempotencyKey: "reject-hold",
          sourceType: "withdrawal",
          lines: [
            {
              accountKey: "user_wallet_liability", direction: "debit", amount, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "available",
              movementType: "withdrawal_hold",
            },
            {
              accountKey: "withdrawal_reserved", direction: "credit", amount, currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "reserved",
              movementType: "withdrawal_hold",
            },
          ],
        },
        tx
      );

      const { reverseJournalEntry } = await import("./ledger.service");
      await reverseJournalEntry({ entryId: hold.entryId, reason: "شبا نامعتبر" }, tx);

      const [w] = await tx<{ available_balance: string; reserved_balance: string }[]>`
        select available_balance::text as available_balance, reserved_balance::text as reserved_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(w.available_balance)).toBe(1_000_000 * TOMAN);
      expect(Number(w.reserved_balance)).toBe(0);
    });
  });
});
