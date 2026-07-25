import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  mirrorBookingWalletPayment,
  mirrorWalletCredit,
  resetAccountingInstalledCache,
} from "./legacy-bridge";
import {
  closeTestSql,
  ensureAccountingSchema,
  withTestTransaction,
} from "./__testing__/harness";

const TOMAN = 10; // IRR per Toman

beforeAll(async () => {
  await ensureAccountingSchema();
  // The schema was just rebuilt; the bridge caches whether it exists.
  resetAccountingInstalledCache();
});

afterAll(async () => {
  await closeTestSql();
});

describe("legacy bridge — booking wallet payment", () => {
  it("debits the wallet and splits the platform fee out of the provider's share", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      // Fund the wallet first, the way a verified top-up would.
      const { postJournalEntry } = await import("./ledger.service");
      await postJournalEntry(
        {
          idempotencyKey: `bridge-fund-${userId}`,
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: String(1_000_000 * TOMAN), currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit",
              amount: String(1_000_000 * TOMAN), currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      const amount = String(400_000 * TOMAN);
      const result = await mirrorBookingWalletPayment(
        {
          userId,
          currencyCode: "IRR",
          amount,
          bookingId: crypto.randomUUID(),
          paymentId: crypto.randomUUID(),
        },
        tx
      );
      expect(result.posted).toBe(true);

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(600_000 * TOMAN);

      // 5% of 400,000 Toman = 20,000 Toman to the platform, 380,000 to the provider.
      const lines = await tx<{ account_code: string; credit_amount: string }[]>`
        select a.code as account_code, l.credit_amount::text as credit_amount
        from accounting.journal_lines l
        join accounting.accounts a on a.id = l.account_id
        join accounting.journal_entries e on e.id = l.entry_id
        where e.id = ${result.entryId!} and l.credit_amount > 0
        order by a.code
      `;
      const byCode = Object.fromEntries(lines.map((l) => [l.account_code, Number(l.credit_amount)]));
      expect(byCode["2003001"]).toBe(380_000 * TOMAN); // provider payable
      expect(byCode["4001001"]).toBe(20_000 * TOMAN); // platform fee income
    });
  });

  it("uses the configured fee percentage, not a hardcoded one", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      await tx`
        update accounting.settings set value = '10'::jsonb where key = 'platform_fee_percent'
      `;

      const { postJournalEntry } = await import("./ledger.service");
      await postJournalEntry(
        {
          idempotencyKey: `bridge-fee-fund-${userId}`,
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: String(500_000 * TOMAN), currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit",
              amount: String(500_000 * TOMAN), currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      const result = await mirrorBookingWalletPayment(
        {
          userId,
          currencyCode: "IRR",
          amount: String(200_000 * TOMAN),
          bookingId: crypto.randomUUID(),
          paymentId: crypto.randomUUID(),
        },
        tx
      );

      const [fee] = await tx<{ credit_amount: string }[]>`
        select l.credit_amount::text as credit_amount
        from accounting.journal_lines l
        join accounting.accounts a on a.id = l.account_id
        where l.entry_id = ${result.entryId!} and a.system_key = 'platform_fee_income'
      `;
      expect(Number(fee.credit_amount)).toBe(20_000 * TOMAN); // 10% of 200,000
    });
  });

  it("refuses to post when the wallet cannot cover it, rolling the checkout back", async () => {
    await withTestTransaction(async ({ tx, userId }) => {
      // Empty wallet — the ledger's non-negative CHECK is the last line of defence even
      // if a caller's own balance check were ever wrong.
      await expect(
        mirrorBookingWalletPayment(
          {
            userId,
            currencyCode: "IRR",
            amount: String(50_000 * TOMAN),
            bookingId: crypto.randomUUID(),
            paymentId: crypto.randomUUID(),
          },
          tx
        )
      ).rejects.toThrow(/ck_wallets_available_non_negative|violates check constraint/i);
    });
  });

  it("does not debit twice when the same booking payment is mirrored again", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const { postJournalEntry } = await import("./ledger.service");
      await postJournalEntry(
        {
          idempotencyKey: `bridge-dup-fund-${userId}`,
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: String(800_000 * TOMAN), currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit",
              amount: String(800_000 * TOMAN), currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      const paymentId = crypto.randomUUID();
      const bookingId = crypto.randomUUID();
      const payload = {
        userId,
        currencyCode: "IRR",
        amount: String(300_000 * TOMAN),
        bookingId,
        paymentId,
      };

      const first = await mirrorBookingWalletPayment(payload, tx);
      const second = await mirrorBookingWalletPayment(payload, tx);
      expect(second.entryId).toBe(first.entryId);

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(500_000 * TOMAN);
    });
  });
});

describe("legacy bridge — wallet credit", () => {
  it("credits the wallet from the gateway clearing account on a card top-up", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const result = await mirrorWalletCredit(
        {
          userId,
          currencyCode: "IRR",
          amount: String(1_200_000 * TOMAN),
          idempotencyKey: `deposit:zarinpal:AUTH-${userId.slice(0, 8)}`,
          sourceType: "deposit",
          counterpartAccountKey: "clearing_zarinpal",
        },
        tx
      );
      expect(result.posted).toBe(true);

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(1_200_000 * TOMAN);

      // The money is shown as arriving in the gateway's clearing account, not the bank —
      // that distinction is what makes gateway settlement reconcilable later.
      const [clearing] = await tx<{ debit_amount: string }[]>`
        select l.debit_amount::text as debit_amount
        from accounting.journal_lines l
        join accounting.accounts a on a.id = l.account_id
        where l.entry_id = ${result.entryId!} and a.system_key = 'clearing_zarinpal'
      `;
      expect(Number(clearing.debit_amount)).toBe(1_200_000 * TOMAN);
    });
  });

  it("credits an admin-confirmed manual deposit from the platform bank account", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const result = await mirrorWalletCredit(
        {
          userId,
          currencyCode: "IRR",
          amount: String(700_000 * TOMAN),
          idempotencyKey: `deposit:manual-intent:${crypto.randomUUID()}`,
          sourceType: "deposit",
          counterpartAccountKey: "bank_platform",
        },
        tx
      );

      const [bank] = await tx<{ debit_amount: string }[]>`
        select l.debit_amount::text as debit_amount
        from accounting.journal_lines l
        join accounting.accounts a on a.id = l.account_id
        where l.entry_id = ${result.entryId!} and a.system_key = 'bank_platform'
      `;
      expect(Number(bank.debit_amount)).toBe(700_000 * TOMAN);

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(700_000 * TOMAN);
    });
  });

  it("credits once when a gateway callback is replayed", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const payload = {
        userId,
        currencyCode: "IRR",
        amount: String(500_000 * TOMAN),
        idempotencyKey: `deposit:zarinpal:REPLAY-${userId.slice(0, 8)}`,
        sourceType: "deposit" as const,
        counterpartAccountKey: "clearing_zarinpal" as const,
      };

      const first = await mirrorWalletCredit(payload, tx);
      const second = await mirrorWalletCredit(payload, tx);
      expect(second.entryId).toBe(first.entryId);

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(500_000 * TOMAN);
    });
  });
});
