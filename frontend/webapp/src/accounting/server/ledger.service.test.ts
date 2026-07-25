import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { postJournalEntry, reverseJournalEntry } from "./ledger.service";
import {
  closeTestSql,
  ensureAccountingSchema,
  withSavepoint,
  withTestTransaction,
} from "./__testing__/harness";

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await closeTestSql();
});

describe("postJournalEntry — balance", () => {
  it("posts a balanced entry and returns its number", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const result = await postJournalEntry(
        {
          idempotencyKey: "test-deposit-1",
          sourceType: "deposit",
          description: "واریز آزمایشی",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: "10000000", currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability",
              direction: "credit",
              amount: "10000000",
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

      expect(result.alreadyPosted).toBe(false);
      expect(Number(result.entryNumber)).toBeGreaterThan(0);
    });
  });

  it("refuses an entry whose debits and credits differ", async () => {
    await withTestTransaction(async ({ tx }) => {
      await expect(
        postJournalEntry(
          {
            idempotencyKey: "test-unbalanced",
            sourceType: "test",
            lines: [
              { accountKey: "clearing_zarinpal", direction: "debit", amount: "100", currencyCode: "IRR" },
              { accountKey: "user_wallet_liability", direction: "credit", amount: "99", currencyCode: "IRR" },
            ],
          },
          tx
        ).then(() => tx`set constraints all immediate`)
      ).rejects.toThrow(/unbalanced/i);
    });
  });

  it("refuses to post onto a non-leaf account", async () => {
    await withTestTransaction(async ({ tx }) => {
      const [group] = await tx<{ id: string }[]>`
        select id::text as id from accounting.accounts where code = '1' limit 1
      `;
      await expect(
        postJournalEntry(
          {
            idempotencyKey: "test-group-post",
            sourceType: "test",
            lines: [
              { accountId: group.id, direction: "debit", amount: "100", currencyCode: "IRR" },
              { accountKey: "user_wallet_liability", direction: "credit", amount: "100", currencyCode: "IRR" },
            ],
          },
          tx
        )
      ).rejects.toThrow(/not postable/i);
    });
  });
});

describe("postJournalEntry — idempotency", () => {
  it("returns the original entry when the same key is replayed", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const lines = [
        { accountKey: "clearing_zarinpal" as const, direction: "debit" as const, amount: "500000", currencyCode: "IRR" },
        {
          accountKey: "user_wallet_liability" as const,
          direction: "credit" as const,
          amount: "500000",
          currencyCode: "IRR",
          partyType: "user" as const,
          partyId: userId,
          walletId,
          movementType: "deposit" as const,
        },
      ];

      const first = await postJournalEntry(
        { idempotencyKey: "zarinpal:AUTH-XYZ", sourceType: "deposit", lines },
        tx
      );
      const replay = await postJournalEntry(
        { idempotencyKey: "zarinpal:AUTH-XYZ", sourceType: "deposit", lines },
        tx
      );

      expect(replay.alreadyPosted).toBe(true);
      expect(replay.entryId).toBe(first.entryId);

      // The decisive assertion: the wallet was credited once, not twice.
      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance from accounting.wallets where id = ${walletId}
      `;
      expect(wallet.available_balance).toBe("500000.000000000000000000");
    });
  });
});

describe("postJournalEntry — wallet balances", () => {
  it("credits and debits the wallet and records the running balance", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      await postJournalEntry(
        {
          idempotencyKey: "wallet-credit",
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: "1000000", currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit", amount: "1000000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      await postJournalEntry(
        {
          idempotencyKey: "wallet-debit",
          sourceType: "booking_payment",
          lines: [
            {
              accountKey: "user_wallet_liability", direction: "debit", amount: "400000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "booking_payment",
            },
            { accountKey: "provider_payable", direction: "credit", amount: "380000", currencyCode: "IRR" },
            { accountKey: "platform_fee_income", direction: "credit", amount: "20000", currencyCode: "IRR" },
          ],
        },
        tx
      );

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(600_000);

      const [derived] = await tx<{ b: string }[]>`
        select accounting.fn_recompute_wallet_balance(${walletId})::text as b
      `;
      expect(Number(derived.b)).toBe(600_000);

      const statement = await tx<{ balance_after: string }[]>`
        select balance_after::text as balance_after
        from accounting.wallet_ledger where wallet_id = ${walletId} order by seq
      `;
      expect(statement.map((r) => Number(r.balance_after))).toEqual([1_000_000, 600_000]);
    });
  });

  it("refuses to spend more than the wallet holds", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      await expect(
        postJournalEntry(
          {
            idempotencyKey: "overdraft",
            sourceType: "booking_payment",
            lines: [
              {
                accountKey: "user_wallet_liability", direction: "debit", amount: "1", currencyCode: "IRR",
                partyType: "user", partyId: userId, walletId, movementType: "booking_payment",
              },
              { accountKey: "provider_payable", direction: "credit", amount: "1", currencyCode: "IRR" },
            ],
          },
          tx
        )
      ).rejects.toThrow(/ck_wallets_available_non_negative|violates check constraint/i);
    });
  });

  it("moves funds between available and reserved on a withdrawal hold", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      await postJournalEntry(
        {
          idempotencyKey: "hold-funding",
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: "5000000", currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit", amount: "5000000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      await postJournalEntry(
        {
          idempotencyKey: "hold-1",
          sourceType: "withdrawal",
          lines: [
            {
              accountKey: "user_wallet_liability", direction: "debit", amount: "2000000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "available",
              movementType: "withdrawal_hold",
            },
            {
              accountKey: "withdrawal_reserved", direction: "credit", amount: "2000000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, walletBucket: "reserved",
              movementType: "withdrawal_hold",
            },
          ],
        },
        tx
      );

      const [wallet] = await tx<{ available_balance: string; reserved_balance: string }[]>`
        select available_balance::text as available_balance, reserved_balance::text as reserved_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(3_000_000);
      expect(Number(wallet.reserved_balance)).toBe(2_000_000);
    });
  });
});

describe("reverseJournalEntry", () => {
  it("undoes an entry by posting its mirror, leaving both in the history", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const original = await postJournalEntry(
        {
          idempotencyKey: "to-reverse",
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: "750000", currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit", amount: "750000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      const reversal = await reverseJournalEntry(
        { entryId: original.entryId, reason: "واریز اشتباه" },
        tx
      );

      const [wallet] = await tx<{ available_balance: string }[]>`
        select available_balance::text as available_balance from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(0);

      const [orig] = await tx<{ status: string; reversed_by_entry_id: string }[]>`
        select status, reversed_by_entry_id::text as reversed_by_entry_id
        from accounting.journal_entries where id = ${original.entryId}
      `;
      expect(orig.status).toBe("reversed");
      expect(orig.reversed_by_entry_id).toBe(reversal.entryId);

      // Both documents survive — a correction never erases what happened.
      const [{ n }] = await tx<{ n: number }[]>`
        select count(*)::int as n from accounting.journal_entries
        where id in (${original.entryId}, ${reversal.entryId})
      `;
      expect(n).toBe(2);
    });
  });

  it("refuses to reverse the same entry twice", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const original = await postJournalEntry(
        {
          idempotencyKey: "double-reverse",
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: "100000", currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit", amount: "100000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      await reverseJournalEntry({ entryId: original.entryId, reason: "first" }, tx);
      await expect(
        reverseJournalEntry({ entryId: original.entryId, reason: "second" }, tx)
      ).rejects.toThrow(/already been reversed/i);
    });
  });
});

describe("postJournalEntry — immutability", () => {
  it("blocks editing or deleting a posted line", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      const entry = await postJournalEntry(
        {
          idempotencyKey: "immutable-1",
          sourceType: "deposit",
          lines: [
            { accountKey: "clearing_zarinpal", direction: "debit", amount: "1000", currencyCode: "IRR" },
            {
              accountKey: "user_wallet_liability", direction: "credit", amount: "1000", currencyCode: "IRR",
              partyType: "user", partyId: userId, walletId, movementType: "deposit",
            },
          ],
        },
        tx
      );

      await expect(
        withSavepoint(tx, () =>
          tx`update accounting.journal_lines set debit_amount = 999 where entry_id = ${entry.entryId}`
        )
      ).rejects.toThrow(/append-only/i);

      await expect(
        withSavepoint(tx, () =>
          tx`delete from accounting.journal_lines where entry_id = ${entry.entryId}`
        )
      ).rejects.toThrow(/append-only/i);

      // The entry is still intact after both refusals.
      const [{ n }] = await tx<{ n: number }[]>`
        select count(*)::int as n from accounting.journal_lines where entry_id = ${entry.entryId}
      `;
      expect(n).toBe(2);
    });
  });
});
