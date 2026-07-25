import "server-only";

import type { TransactionSql } from "postgres";

import db from "@/config/database/db";

import type { MoneyString, SystemAccountKey } from "../types";
import { postJournalEntry } from "./ledger.service";
import { consumeRateLimit } from "./rate-limit";
import { getCurrencyLimit } from "./settings.repository";
import { ensureWallet } from "./wallet.service";

type Tx = TransactionSql<Record<string, never>>;

export class DepositRuleError extends Error {
  constructor(
    message: string,
    readonly code:
      | "below_minimum"
      | "above_maximum"
      | "no_limit_configured"
      | "invalid_state"
      | "not_found"
  ) {
    super(message);
    this.name = "DepositRuleError";
  }
}

/** Which asset account a gateway's money lands in before it is the customer's. */
const GATEWAY_CLEARING_ACCOUNT: Record<string, SystemAccountKey> = {
  zarinpal: "clearing_zarinpal",
  btcpay: "clearing_btcpay",
};

async function assertWithinDepositLimits(tx: Tx, currency: string, amount: MoneyString) {
  const min = await getCurrencyLimit("deposit.min_amount", currency, tx as never);
  const max = await getCurrencyLimit("deposit.max_amount", currency, tx as never);
  if (!min || !max) {
    throw new DepositRuleError(
      `Deposits in ${currency} are not configured. Set deposit.min_amount and deposit.max_amount in Admin → Accounting → Settings.`,
      "no_limit_configured"
    );
  }

  const [check] = await tx<{ below: boolean; above: boolean }[]>`
    select ${amount}::numeric < ${min}::numeric as below,
           ${amount}::numeric > ${max}::numeric as above
  `;
  if (check.below) {
    throw new DepositRuleError(`Minimum deposit is ${min} ${currency}.`, "below_minimum");
  }
  if (check.above) {
    throw new DepositRuleError(`Maximum deposit is ${max} ${currency}.`, "above_maximum");
  }
}

/**
 * Start a card / crypto-invoice top-up.
 *
 * Nothing is posted to the ledger here — the customer has not paid yet. The row exists
 * so the gateway callback has something to resolve, and so an abandoned attempt is
 * visible rather than invisible.
 */
export async function createGatewayDepositIntent(input: {
  userId: string;
  currencyCode: string;
  amount: MoneyString | number;
  gatewayCode: string;
  authority: string;
  idempotencyKey: string;
}) {
  await consumeRateLimit({
    action: "deposit",
    identity: input.userId,
    settingKey: "rate_limit.deposit",
  });

  return db.begin(async (tx) => {
    const client = tx as Tx;
    const currency = input.currencyCode.toUpperCase();
    const amount = String(input.amount);

    await assertWithinDepositLimits(client, currency, amount);
    const walletId = await ensureWallet({ userId: input.userId, currencyCode: currency }, client);

    const [gatewayTxn] = await client<{ id: string }[]>`
      insert into accounting.gateway_transactions (
        gateway_code, purpose, user_id, amount, currency_code, authority, status, idempotency_key
      ) values (
        ${input.gatewayCode}, 'deposit', ${input.userId}, ${amount}::numeric, ${currency},
        ${input.authority}, 'requires_action', ${"gw:" + input.idempotencyKey}
      )
      on conflict (gateway_code, authority) do update set updated_at = now()
      returning id::text as id
    `;

    const [request] = await client<{ id: string; status: string }[]>`
      insert into accounting.deposit_requests (
        user_id, wallet_id, currency_code, amount, method, status,
        gateway_transaction_id, external_reference, idempotency_key
      ) values (
        ${input.userId}, ${walletId}, ${currency}, ${amount}::numeric,
        ${"gateway_" + input.gatewayCode}, 'awaiting_payment',
        ${gatewayTxn.id}, ${input.authority}, ${input.idempotencyKey}
      )
      on conflict (idempotency_key) do update set updated_at = now()
      returning id::text as id, status
    `;

    return { depositRequestId: request.id, gatewayTransactionId: gatewayTxn.id, status: request.status };
  });
}

/**
 * The gateway confirmed the payment. This is the point the money becomes the customer's.
 *
 * Safe to call repeatedly, which matters because it is reached from both the browser
 * return and the webhook — the two race, and BTCPay retries. The idempotency key is the
 * gateway's own authority, so the second caller posts nothing and reports the first
 * caller's entry.
 */
export async function settleGatewayDeposit(input: {
  gatewayCode: string;
  authority: string;
  /** What the gateway says was actually paid. Trusted over the requested amount. */
  settledAmount?: MoneyString | number;
  referenceId?: string;
  actorUserId?: string;
}) {
  return db.begin(async (tx) => {
    const client = tx as Tx;

    const [gatewayTxn] = await client<
      {
        id: string;
        user_id: string;
        amount: string;
        currency_code: string;
        status: string;
        journal_entry_id: string | null;
      }[]
    >`
      select id::text as id, user_id::text as user_id, amount::text as amount,
             currency_code, status, journal_entry_id::text as journal_entry_id
      from accounting.gateway_transactions
      where gateway_code = ${input.gatewayCode} and authority = ${input.authority}
      limit 1
      for no key update
    `;
    if (!gatewayTxn) {
      throw new DepositRuleError(
        `No deposit is registered for ${input.gatewayCode} authority ${input.authority}.`,
        "not_found"
      );
    }

    if (gatewayTxn.journal_entry_id) {
      return {
        alreadySettled: true,
        journalEntryId: gatewayTxn.journal_entry_id,
        amount: gatewayTxn.amount,
      };
    }

    const clearingAccount = GATEWAY_CLEARING_ACCOUNT[input.gatewayCode];
    if (!clearingAccount) {
      throw new DepositRuleError(
        `No clearing account is mapped for gateway '${input.gatewayCode}'.`,
        "invalid_state"
      );
    }

    const amount = input.settledAmount !== undefined ? String(input.settledAmount) : gatewayTxn.amount;
    const currency = gatewayTxn.currency_code;
    const walletId = await ensureWallet(
      { userId: gatewayTxn.user_id, currencyCode: currency },
      client
    );

    const entry = await postJournalEntry(
      {
        // The gateway's own reference is the key: a replayed webhook cannot mint a
        // second credit no matter how many times it arrives.
        idempotencyKey: `deposit:${input.gatewayCode}:${input.authority}`,
        sourceType: "deposit",
        sourceId: gatewayTxn.id,
        description: "واریز از درگاه پرداخت",
        actorUserId: input.actorUserId,
        lines: [
          { accountKey: clearingAccount, direction: "debit", amount, currencyCode: currency },
          {
            accountKey: "user_wallet_liability",
            direction: "credit",
            amount,
            currencyCode: currency,
            partyType: "user",
            partyId: gatewayTxn.user_id,
            walletId,
            walletBucket: "available",
            movementType: "deposit",
          },
        ],
      },
      client
    );

    await client`
      update accounting.gateway_transactions
         set status = 'verified', verified_at = now(), reference_id = ${input.referenceId ?? null},
             journal_entry_id = ${entry.entryId}, updated_at = now()
       where id = ${gatewayTxn.id}
    `;
    await client`
      update accounting.deposit_requests
         set status = 'completed', journal_entry_id = ${entry.entryId}, updated_at = now()
       where gateway_transaction_id = ${gatewayTxn.id}
    `;

    return { alreadySettled: entry.alreadyPosted, journalEntryId: entry.entryId, amount };
  });
}

/**
 * Customer says they sent a bank transfer or a crypto payment and uploads a receipt.
 *
 * Deliberately posts NOTHING to the ledger. All that exists at this point is a claim,
 * and recording an unverified claim as an asset is how a balance sheet starts lying.
 * The request sits in the review queue; the money appears when an admin confirms it.
 */
export async function createManualDepositRequest(input: {
  userId: string;
  currencyCode: string;
  amount: MoneyString | number;
  method: "bank_transfer" | "crypto_manual";
  receiptUrl?: string;
  receiptMediaId?: string;
  externalReference?: string;
  network?: string;
  idempotencyKey: string;
}) {
  await consumeRateLimit({
    action: "deposit",
    identity: input.userId,
    settingKey: "rate_limit.deposit",
  });

  return db.begin(async (tx) => {
    const client = tx as Tx;
    const currency = input.currencyCode.toUpperCase();
    const amount = String(input.amount);

    await assertWithinDepositLimits(client, currency, amount);
    const walletId = await ensureWallet({ userId: input.userId, currencyCode: currency }, client);

    const [request] = await client<{ id: string; status: string }[]>`
      insert into accounting.deposit_requests (
        user_id, wallet_id, currency_code, amount, method, status,
        receipt_url, receipt_media_id, external_reference, idempotency_key, metadata
      ) values (
        ${input.userId}, ${walletId}, ${currency}, ${amount}::numeric,
        ${input.method}, 'pending_review',
        ${input.receiptUrl ?? null}, ${input.receiptMediaId ?? null},
        ${input.externalReference ?? null}, ${input.idempotencyKey},
        ${client.json({ network: input.network ?? null } as never)}
      )
      on conflict (idempotency_key) do update set updated_at = now()
      returning id::text as id, status
    `;

    return { depositRequestId: request.id, status: request.status };
  });
}

/**
 * Admin confirms a manual deposit. THIS is the moment the money becomes spendable, and
 * it is the authorization boundary that stops a customer approving their own receipt.
 *
 * The admin can confirm a different amount than the customer claimed — a bank receipt
 * for a different figure, a partial crypto send — and the confirmed amount is what gets
 * credited, never the claim.
 */
export async function approveDepositRequest(input: {
  depositRequestId: string;
  actorUserId: string;
  confirmedAmount?: MoneyString | number;
  note?: string;
}) {
  return db.begin(async (tx) => {
    const client = tx as Tx;
    const request = await lockDeposit(client, input.depositRequestId);

    // Idempotency is checked before the state machine, not after: an admin who
    // double-clicks approve, or a retried request, must get the original entry back
    // rather than an error that leaves them unsure whether the money moved.
    if (request.journal_entry_id) {
      return { alreadyPosted: true, journalEntryId: request.journal_entry_id };
    }
    if (!["pending_review", "awaiting_payment", "approved"].includes(request.status)) {
      throw new DepositRuleError(
        `A ${request.status} deposit cannot be approved.`,
        "invalid_state"
      );
    }

    const amount =
      input.confirmedAmount !== undefined ? String(input.confirmedAmount) : request.amount;

    const [valid] = await client<{ positive: boolean }[]>`select ${amount}::numeric > 0 as positive`;
    if (!valid.positive) {
      throw new DepositRuleError("The confirmed amount must be greater than zero.", "invalid_state");
    }

    // A manual deposit's counterpart is the platform's own bank account or crypto
    // wallet — that is where the money physically arrived.
    const counterpart: SystemAccountKey =
      request.method === "crypto_manual" ? "crypto_cold" : "bank_platform";

    const entry = await postJournalEntry(
      {
        idempotencyKey: `deposit:manual:${request.id}`,
        sourceType: "deposit",
        sourceId: request.id,
        description: input.note ?? "تأیید واریز دستی",
        actorUserId: input.actorUserId,
        lines: [
          { accountKey: counterpart, direction: "debit", amount, currencyCode: request.currency_code },
          {
            accountKey: "user_wallet_liability",
            direction: "credit",
            amount,
            currencyCode: request.currency_code,
            partyType: "user",
            partyId: request.user_id,
            walletId: request.wallet_id,
            walletBucket: "available",
            movementType: "deposit",
          },
        ],
      },
      client
    );

    await client`
      update accounting.deposit_requests
         set status = 'completed', confirmed_amount = ${amount}::numeric,
             journal_entry_id = ${entry.entryId}, reviewed_by = ${input.actorUserId},
             reviewed_at = now(), review_note = ${input.note ?? null}, updated_at = now()
       where id = ${request.id}
    `;

    await writeAudit(client, {
      actorUserId: input.actorUserId,
      action: "deposit.approve",
      entityId: request.id,
      before: { status: request.status, claimedAmount: request.amount },
      after: { status: "completed", confirmedAmount: amount, journalEntryId: entry.entryId },
    });

    return { alreadyPosted: entry.alreadyPosted, journalEntryId: entry.entryId, amount };
  });
}

/** Admin rejects a claimed deposit. Nothing to reverse — nothing was ever posted. */
export async function rejectDepositRequest(input: {
  depositRequestId: string;
  actorUserId: string;
  reason: string;
}) {
  return db.begin(async (tx) => {
    const client = tx as Tx;
    const request = await lockDeposit(client, input.depositRequestId);

    if (request.journal_entry_id) {
      throw new DepositRuleError(
        "This deposit has already been credited. Reverse the journal entry instead of rejecting it.",
        "invalid_state"
      );
    }
    if (!["pending_review", "awaiting_payment"].includes(request.status)) {
      throw new DepositRuleError(`A ${request.status} deposit cannot be rejected.`, "invalid_state");
    }

    await client`
      update accounting.deposit_requests
         set status = 'rejected', reviewed_by = ${input.actorUserId}, reviewed_at = now(),
             review_note = ${input.reason}, updated_at = now()
       where id = ${request.id}
    `;

    await writeAudit(client, {
      actorUserId: input.actorUserId,
      action: "deposit.reject",
      entityId: request.id,
      before: { status: request.status },
      after: { status: "rejected", reason: input.reason },
    });

    return { status: "rejected" as const };
  });
}

async function lockDeposit(tx: Tx, id: string) {
  const [request] = await tx<
    {
      id: string;
      user_id: string;
      wallet_id: string;
      currency_code: string;
      amount: string;
      method: string;
      status: string;
      journal_entry_id: string | null;
    }[]
  >`
    select id::text as id, user_id::text as user_id, wallet_id::text as wallet_id,
           currency_code, amount::text as amount, method, status,
           journal_entry_id::text as journal_entry_id
    from accounting.deposit_requests
    where id = ${id}
    limit 1
    for no key update
  `;
  if (!request) throw new DepositRuleError("Deposit request was not found.", "not_found");
  return request;
}

async function writeAudit(
  tx: Tx,
  entry: { actorUserId: string; action: string; entityId: string; before?: unknown; after?: unknown }
): Promise<void> {
  await tx`
    insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, before_state, after_state)
    values (${entry.actorUserId}, ${entry.action}, 'deposit_request', ${entry.entityId},
            ${entry.before ? tx.json(entry.before as never) : null},
            ${entry.after ? tx.json(entry.after as never) : null})
  `;
}
