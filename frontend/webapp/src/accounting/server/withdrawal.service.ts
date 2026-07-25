import "server-only";

import type { TransactionSql } from "postgres";

import db from "@/config/database/db";

import type { MoneyString } from "../types";
import { postJournalEntry, reverseJournalEntry } from "./ledger.service";
import { consumeRateLimit } from "./rate-limit";
import { getCurrencyLimit, getSetting } from "./settings.repository";

type Tx = TransactionSql<Record<string, never>>;

export class WithdrawalRuleError extends Error {
  constructor(
    message: string,
    readonly code:
      | "below_minimum"
      | "above_maximum"
      | "daily_cap_exceeded"
      | "insufficient_balance"
      | "no_limit_configured"
      | "wallet_frozen"
      | "invalid_state"
  ) {
    super(message);
    this.name = "WithdrawalRuleError";
  }
}

export type RequestWithdrawalInput = {
  userId: string;
  walletId: string;
  amount: MoneyString | number;
  destination:
    | { type: "bank_iban"; iban: string; holderName?: string; bankName?: string }
    | { type: "crypto_address"; address: string; network: string };
  idempotencyKey: string;
  actorUserId?: string;
};

/**
 * Customer asks to withdraw.
 *
 * The money does not leave yet — it moves from the wallet's available balance into a
 * reserved balance, via a journal entry. That is what stops a customer from requesting
 * two withdrawals of their whole balance and having both approved: after the first, the
 * funds are no longer available.
 *
 * Every limit is read from accounting.settings, never hardcoded.
 */
export async function requestWithdrawal(input: RequestWithdrawalInput) {
  // Before the transaction, on its own connection: an attempt that goes on to fail must
  // still be counted, and a rolled-back transaction would erase it.
  await consumeRateLimit({
    action: "withdrawal",
    identity: input.userId,
    settingKey: "rate_limit.withdrawal",
  });

  return db.begin(async (tx) => {
    const client = tx as Tx;

    const [wallet] = await client<
      { user_id: string; currency_code: string; available_balance: string; status: string }[]
    >`
      select user_id::text as user_id, currency_code,
             available_balance::text as available_balance, status
      from accounting.wallets
      where id = ${input.walletId}
      limit 1
      for no key update
    `;
    if (!wallet) throw new WithdrawalRuleError("Wallet was not found.", "invalid_state");
    if (wallet.user_id !== input.userId) {
      throw new WithdrawalRuleError("This wallet belongs to another account.", "invalid_state");
    }
    if (wallet.status !== "active") {
      throw new WithdrawalRuleError(`Wallet is ${wallet.status}.`, "wallet_frozen");
    }

    const currency = wallet.currency_code;
    const amount = String(input.amount);

    // All comparisons are done by Postgres on numeric, never in JS — a large Rial figure
    // with 18 decimals does not survive a round trip through a double.
    const [limits] = await client<
      { min_amount: string | null; max_amount: string | null; daily_cap: string | null }[]
    >`
      select
        (select value ->> ${currency} from accounting.settings where key = 'withdrawal.min_amount') as min_amount,
        (select value ->> ${currency} from accounting.settings where key = 'withdrawal.max_amount') as max_amount,
        (select value ->> ${currency} from accounting.settings where key = 'withdrawal.daily_cap') as daily_cap
    `;

    if (!limits.min_amount || !limits.max_amount) {
      throw new WithdrawalRuleError(
        `Withdrawals in ${currency} are not configured. Set withdrawal.min_amount and withdrawal.max_amount in Admin → Accounting → Settings.`,
        "no_limit_configured"
      );
    }

    const [checks] = await client<
      { below_min: boolean; above_max: boolean; enough: boolean; used_today: string }[]
    >`
      select
        ${amount}::numeric < ${limits.min_amount}::numeric as below_min,
        ${amount}::numeric > ${limits.max_amount}::numeric as above_max,
        ${wallet.available_balance}::numeric >= ${amount}::numeric as enough,
        coalesce((
          select sum(amount)
          from accounting.withdrawal_requests
          where user_id = ${input.userId}
            and currency_code = ${currency}
            and created_at >= now() - interval '24 hours'
            and status not in ('rejected', 'failed', 'cancelled')
        ), 0)::text as used_today
    `;

    if (checks.below_min) {
      throw new WithdrawalRuleError(
        `Minimum withdrawal is ${limits.min_amount} ${currency}.`,
        "below_minimum"
      );
    }
    if (checks.above_max) {
      throw new WithdrawalRuleError(
        `Maximum withdrawal is ${limits.max_amount} ${currency}.`,
        "above_maximum"
      );
    }

    if (limits.daily_cap) {
      const [cap] = await client<{ exceeded: boolean }[]>`
        select (${checks.used_today}::numeric + ${amount}::numeric) > ${limits.daily_cap}::numeric as exceeded
      `;
      if (cap.exceeded) {
        throw new WithdrawalRuleError(
          `This would exceed the daily withdrawal limit of ${limits.daily_cap} ${currency} (already used ${checks.used_today}).`,
          "daily_cap_exceeded"
        );
      }
    }

    // Checked here for a clear error message; the wallet's non-negative CHECK is the
    // backstop if this is ever reached by another path.
    if (!checks.enough) {
      throw new WithdrawalRuleError(
        `Insufficient balance: ${wallet.available_balance} ${currency} available.`,
        "insufficient_balance"
      );
    }

    const feePercent = String((await getSetting<number | string>("withdrawal.fee_percent", client as never)) ?? 0);
    const feeFixed = (await getCurrencyLimit("withdrawal.fee_fixed", currency, client as never)) ?? "0";
    const [fees] = await client<{ fee: string; net: string }[]>`
      select
        round(${amount}::numeric * ${feePercent}::numeric / 100 + ${feeFixed}::numeric, 18)::text as fee,
        (${amount}::numeric - round(${amount}::numeric * ${feePercent}::numeric / 100 + ${feeFixed}::numeric, 18))::text as net
    `;

    // Move the funds out of reach before anything else can spend them.
    const hold = await postJournalEntry(
      {
        idempotencyKey: `withdrawal:hold:${input.idempotencyKey}`,
        sourceType: "withdrawal",
        description: "رزرو وجه برای درخواست برداشت",
        actorUserId: input.actorUserId ?? input.userId,
        lines: [
          {
            accountKey: "user_wallet_liability",
            direction: "debit",
            amount,
            currencyCode: currency,
            partyType: "user",
            partyId: input.userId,
            walletId: input.walletId,
            walletBucket: "available",
            movementType: "withdrawal_hold",
          },
          {
            accountKey: "withdrawal_reserved",
            direction: "credit",
            amount,
            currencyCode: currency,
            partyType: "user",
            partyId: input.userId,
            walletId: input.walletId,
            walletBucket: "reserved",
            movementType: "withdrawal_hold",
          },
        ],
      },
      client
    );

    const destination = input.destination;
    const [request] = await client<{ id: string; status: string }[]>`
      insert into accounting.withdrawal_requests (
        user_id, wallet_id, currency_code, amount, fee_amount, net_amount,
        destination_type, destination_iban, destination_holder_name, destination_bank_name,
        destination_address, destination_network,
        status, hold_entry_id, idempotency_key
      ) values (
        ${input.userId}, ${input.walletId}, ${currency}, ${amount}::numeric,
        ${fees.fee}::numeric, ${fees.net}::numeric,
        ${destination.type},
        ${destination.type === "bank_iban" ? destination.iban : null},
        ${destination.type === "bank_iban" ? destination.holderName ?? null : null},
        ${destination.type === "bank_iban" ? destination.bankName ?? null : null},
        ${destination.type === "crypto_address" ? destination.address : null},
        ${destination.type === "crypto_address" ? destination.network : null},
        'pending', ${hold.entryId}, ${input.idempotencyKey}
      )
      on conflict (idempotency_key) do update set updated_at = now()
      returning id::text as id, status
    `;

    await writeAudit(client, {
      actorUserId: input.actorUserId ?? input.userId,
      action: "withdrawal.request",
      entityId: request.id,
      after: { amount, fee: fees.fee, net: fees.net, currency },
    });

    return {
      withdrawalRequestId: request.id,
      status: request.status,
      amount,
      feeAmount: fees.fee,
      netAmount: fees.net,
      currencyCode: currency,
    };
  });
}

/** Admin approves. Nothing moves — the funds are already held. */
export async function approveWithdrawal(params: {
  withdrawalRequestId: string;
  actorUserId: string;
  note?: string;
}) {
  return db.begin(async (tx) => {
    const client = tx as Tx;
    const request = await lockRequest(client, params.withdrawalRequestId);

    if (request.status !== "pending") {
      throw new WithdrawalRuleError(
        `Only a pending withdrawal can be approved (this one is ${request.status}).`,
        "invalid_state"
      );
    }

    await client`
      update accounting.withdrawal_requests
         set status = 'approved', reviewed_by = ${params.actorUserId}, reviewed_at = now(),
             review_note = ${params.note ?? null}, updated_at = now()
       where id = ${params.withdrawalRequestId}
    `;

    await writeAudit(client, {
      actorUserId: params.actorUserId,
      action: "withdrawal.approve",
      entityId: params.withdrawalRequestId,
      before: { status: request.status },
      after: { status: "approved" },
    });

    return { status: "approved" as const };
  });
}

/**
 * Admin rejects, or the payout failed. Either way the hold is released and the money
 * becomes spendable again — by reversing the hold entry, not by editing it.
 */
export async function releaseWithdrawal(params: {
  withdrawalRequestId: string;
  actorUserId: string;
  reason: string;
  outcome: "rejected" | "failed" | "cancelled";
}) {
  return db.begin(async (tx) => {
    const client = tx as Tx;
    const request = await lockRequest(client, params.withdrawalRequestId);

    if (!["pending", "approved", "processing"].includes(request.status)) {
      throw new WithdrawalRuleError(
        `A ${request.status} withdrawal cannot be released.`,
        "invalid_state"
      );
    }
    if (!request.hold_entry_id) {
      throw new WithdrawalRuleError("This withdrawal has no hold to release.", "invalid_state");
    }

    const release = await reverseJournalEntry(
      { entryId: request.hold_entry_id, reason: params.reason, actorUserId: params.actorUserId },
      client
    );

    await client`
      update accounting.withdrawal_requests
         set status = ${params.outcome}, release_entry_id = ${release.entryId},
             reviewed_by = ${params.actorUserId}, reviewed_at = now(),
             review_note = ${params.reason}, updated_at = now()
       where id = ${params.withdrawalRequestId}
    `;

    await writeAudit(client, {
      actorUserId: params.actorUserId,
      action: `withdrawal.${params.outcome}`,
      entityId: params.withdrawalRequestId,
      before: { status: request.status },
      after: { status: params.outcome, reason: params.reason },
    });

    return { status: params.outcome, releaseEntryId: release.entryId };
  });
}

/**
 * The payout actually left. The reserved funds are cleared, the platform's bank or hot
 * wallet goes down by the net amount, and any fee is recognised as income.
 */
export async function markWithdrawalPaid(params: {
  withdrawalRequestId: string;
  actorUserId: string;
  payoutReference: string;
}) {
  return db.begin(async (tx) => {
    const client = tx as Tx;
    const request = await lockRequest(client, params.withdrawalRequestId);

    if (!["approved", "processing"].includes(request.status)) {
      throw new WithdrawalRuleError(
        `Only an approved withdrawal can be paid (this one is ${request.status}).`,
        "invalid_state"
      );
    }

    const payoutAccount =
      request.destination_type === "crypto_address" ? ("crypto_cold" as const) : ("bank_platform" as const);

    const lines = [
      {
        accountKey: "withdrawal_reserved" as const,
        direction: "debit" as const,
        amount: request.amount,
        currencyCode: request.currency_code,
        partyType: "user" as const,
        partyId: request.user_id,
        walletId: request.wallet_id,
        walletBucket: "reserved" as const,
        movementType: "withdrawal" as const,
      },
      {
        accountKey: payoutAccount,
        direction: "credit" as const,
        amount: request.net_amount,
        currencyCode: request.currency_code,
      },
    ];

    if (Number(request.fee_amount) > 0) {
      lines.push({
        accountKey: "withdrawal_fee_income" as never,
        direction: "credit" as const,
        amount: request.fee_amount,
        currencyCode: request.currency_code,
      } as never);
    }

    const settlement = await postJournalEntry(
      {
        idempotencyKey: `withdrawal:settle:${params.withdrawalRequestId}`,
        sourceType: "withdrawal",
        sourceId: params.withdrawalRequestId,
        description: "پرداخت برداشت",
        actorUserId: params.actorUserId,
        lines,
      },
      client
    );

    await client`
      update accounting.withdrawal_requests
         set status = 'paid', settlement_entry_id = ${settlement.entryId},
             paid_at = now(), payout_reference = ${params.payoutReference}, updated_at = now()
       where id = ${params.withdrawalRequestId}
    `;

    await writeAudit(client, {
      actorUserId: params.actorUserId,
      action: "withdrawal.paid",
      entityId: params.withdrawalRequestId,
      before: { status: request.status },
      after: { status: "paid", payoutReference: params.payoutReference },
    });

    return { status: "paid" as const, settlementEntryId: settlement.entryId };
  });
}

async function lockRequest(tx: Tx, id: string) {
  const [request] = await tx<
    {
      id: string;
      user_id: string;
      wallet_id: string;
      currency_code: string;
      amount: string;
      fee_amount: string;
      net_amount: string;
      status: string;
      destination_type: string;
      hold_entry_id: string | null;
    }[]
  >`
    select id::text as id, user_id::text as user_id, wallet_id::text as wallet_id,
           currency_code, amount::text as amount, fee_amount::text as fee_amount,
           net_amount::text as net_amount, status, destination_type,
           hold_entry_id::text as hold_entry_id
    from accounting.withdrawal_requests
    where id = ${id}
    limit 1
    for no key update
  `;
  if (!request) throw new WithdrawalRuleError("Withdrawal request was not found.", "invalid_state");
  return request;
}

async function writeAudit(
  tx: Tx,
  entry: {
    actorUserId: string;
    action: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  }
): Promise<void> {
  await tx`
    insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, before_state, after_state)
    values (${entry.actorUserId}, ${entry.action}, 'withdrawal_request', ${entry.entityId},
            ${entry.before ? tx.json(entry.before as never) : null},
            ${entry.after ? tx.json(entry.after as never) : null})
  `;
}
