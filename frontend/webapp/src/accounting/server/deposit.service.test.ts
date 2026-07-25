import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  approveDepositRequest,
  createManualDepositRequest,
  rejectDepositRequest,
  settleGatewayDeposit,
} from "./deposit.service";
import {
  closeTestSql,
  ensureAccountingSchema,
  resetAccountingData,
  testSql,
  withTestTransaction,
} from "./__testing__/harness";

const TOMAN = 10; // IRR per Toman

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await closeTestSql();
});

/**
 * The deposit services open their own transaction via `db`, so these tests commit
 * instead of using the rollback harness, and reset the movement tables afterwards.
 */
const cleanup = () => resetAccountingData();

describe("manual deposits", () => {
  it("records a claim without moving any money", async () => {
    await withTestTransaction(async ({ tx, walletId, userId }) => {
      // A claim is only a claim: nothing is posted until an admin confirms it.
      await tx`
        insert into accounting.deposit_requests (
          user_id, wallet_id, currency_code, amount, method, status, idempotency_key
        ) values (
          ${userId}, ${walletId}, 'IRR', ${String(500_000 * TOMAN)}::numeric,
          'bank_transfer', 'pending_review', ${"claim-" + userId}
        )
      `;

      const [wallet] = await tx<{ available_balance: string; pending_balance: string }[]>`
        select available_balance::text as available_balance, pending_balance::text as pending_balance
        from accounting.wallets where id = ${walletId}
      `;
      expect(Number(wallet.available_balance)).toBe(0);
      expect(Number(wallet.pending_balance)).toBe(0);

      const [{ n }] = await tx<{ n: number }[]>`
        select count(*)::int as n from accounting.journal_entries where source_type = 'deposit'
      `;
      expect(n).toBe(0);
    });
  });

  it("credits the wallet only when an admin approves, using the confirmed amount", async () => {
    const userId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    try {
      const claimed = String(1_000_000 * TOMAN);
      const confirmed = String(950_000 * TOMAN); // the receipt was for less

      const request = await createManualDepositRequest({
        userId,
        currencyCode: "IRR",
        amount: claimed,
        method: "bank_transfer",
        receiptUrl: "https://example.test/receipt.jpg",
        idempotencyKey: `manual-${userId}`,
      });
      expect(request.status).toBe("pending_review");

      const approval = await approveDepositRequest({
        depositRequestId: request.depositRequestId,
        actorUserId: adminId,
        confirmedAmount: confirmed,
        note: "رسید بانکی تأیید شد",
      });
      expect(approval.alreadyPosted).toBe(false);

      const [wallet] = await testSql<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where user_id = ${userId} and currency_code = 'IRR'
      `;
      // The confirmed amount is credited, not what the customer claimed.
      expect(Number(wallet.available_balance)).toBe(950_000 * TOMAN);

      const [audit] = await testSql<{ action: string; actor_user_id: string }[]>`
        select action, actor_user_id::text as actor_user_id
        from accounting.audit_log where entity_id = ${request.depositRequestId}
      `;
      expect(audit.action).toBe("deposit.approve");
      expect(audit.actor_user_id).toBe(adminId);
    } finally {
      await cleanup();
    }
  });

  it("does not credit twice when approve is called again", async () => {
    const userId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    try {
      const amount = String(300_000 * TOMAN);
      const request = await createManualDepositRequest({
        userId,
        currencyCode: "IRR",
        amount,
        method: "bank_transfer",
        idempotencyKey: `manual-dup-${userId}`,
      });

      await approveDepositRequest({ depositRequestId: request.depositRequestId, actorUserId: adminId });
      const second = await approveDepositRequest({
        depositRequestId: request.depositRequestId,
        actorUserId: adminId,
      });
      expect(second.alreadyPosted).toBe(true);

      const [wallet] = await testSql<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where user_id = ${userId} and currency_code = 'IRR'
      `;
      expect(Number(wallet.available_balance)).toBe(300_000 * TOMAN);
    } finally {
      await cleanup();
    }
  });

  it("refuses to reject a deposit that was already credited", async () => {
    const userId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    try {
      const request = await createManualDepositRequest({
        userId,
        currencyCode: "IRR",
        amount: String(200_000 * TOMAN),
        method: "bank_transfer",
        idempotencyKey: `manual-rej-${userId}`,
      });
      await approveDepositRequest({ depositRequestId: request.depositRequestId, actorUserId: adminId });

      await expect(
        rejectDepositRequest({
          depositRequestId: request.depositRequestId,
          actorUserId: adminId,
          reason: "دیر شد",
        })
      ).rejects.toThrow(/already been credited/i);
    } finally {
      await cleanup();
    }
  });

  it("enforces the configured deposit minimum", async () => {
    const userId = crypto.randomUUID();
    try {
      await expect(
        createManualDepositRequest({
          userId,
          currencyCode: "IRR",
          amount: "1",
          method: "bank_transfer",
          idempotencyKey: `manual-min-${userId}`,
        })
      ).rejects.toThrow(/Minimum deposit/i);
    } finally {
      await cleanup();
    }
  });
});

describe("gateway deposits", () => {
  it("credits once even when the webhook and the browser return both settle it", async () => {
    const userId = crypto.randomUUID();
    try {
      const amount = String(2_000_000 * TOMAN);
      const authority = `A-${userId.slice(0, 8)}`;

      await testSql`
        insert into accounting.gateway_transactions (
          gateway_code, purpose, user_id, amount, currency_code, authority, status, idempotency_key
        ) values (
          'zarinpal', 'deposit', ${userId}, ${amount}::numeric, 'IRR', ${authority},
          'requires_action', ${"gw-" + authority}
        )
      `;

      // The browser return and the webhook race; both call this.
      const [first, second] = await Promise.all([
        settleGatewayDeposit({ gatewayCode: "zarinpal", authority, referenceId: "REF-1" }),
        settleGatewayDeposit({ gatewayCode: "zarinpal", authority, referenceId: "REF-1" }),
      ]);

      // Whichever won, exactly one entry exists and the wallet moved once.
      expect(first.journalEntryId).toBe(second.journalEntryId);

      const [wallet] = await testSql<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where user_id = ${userId} and currency_code = 'IRR'
      `;
      expect(Number(wallet.available_balance)).toBe(2_000_000 * TOMAN);

      const [{ n }] = await testSql<{ n: number }[]>`
        select count(*)::int as n from accounting.journal_entries
        where idempotency_key = ${`deposit:zarinpal:${authority}`}
      `;
      expect(n).toBe(1);
    } finally {
      await cleanup();
    }
  });

  it("credits what the gateway settled, not what was requested", async () => {
    const userId = crypto.randomUUID();
    try {
      const authority = `B-${userId.slice(0, 8)}`;
      await testSql`
        insert into accounting.gateway_transactions (
          gateway_code, purpose, user_id, amount, currency_code, authority, status, idempotency_key
        ) values (
          'zarinpal', 'deposit', ${userId}, ${String(1_000_000 * TOMAN)}::numeric, 'IRR',
          ${authority}, 'requires_action', ${"gw-" + authority}
        )
      `;

      await settleGatewayDeposit({
        gatewayCode: "zarinpal",
        authority,
        settledAmount: String(999_000 * TOMAN),
      });

      const [wallet] = await testSql<{ available_balance: string }[]>`
        select available_balance::text as available_balance
        from accounting.wallets where user_id = ${userId} and currency_code = 'IRR'
      `;
      expect(Number(wallet.available_balance)).toBe(999_000 * TOMAN);
    } finally {
      await cleanup();
    }
  });

  it("refuses an authority it has never seen", async () => {
    await expect(
      settleGatewayDeposit({ gatewayCode: "zarinpal", authority: "does-not-exist" })
    ).rejects.toThrow(/No deposit is registered/i);
  });
});

describe("books stay balanced", () => {
  it("keeps total debits equal to total credits across deposit flows", async () => {
    const userId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    try {
      const request = await createManualDepositRequest({
        userId,
        currencyCode: "IRR",
        amount: String(400_000 * TOMAN),
        method: "crypto_manual",
        idempotencyKey: `bal-${userId}`,
      });
      await approveDepositRequest({ depositRequestId: request.depositRequestId, actorUserId: adminId });

      const [tb] = await testSql<{ d: string; c: string }[]>`
        select coalesce(sum(total_debit), 0)::text as d, coalesce(sum(total_credit), 0)::text as c
        from accounting.v_trial_balance
      `;
      expect(tb.d).toBe(tb.c);

      const drift = await testSql`select * from accounting.v_wallet_balance_drift`;
      expect(drift.length).toBe(0);
    } finally {
      await cleanup();
    }
  });
});
