import "server-only";

import type { TransactionSql } from "postgres";

import { postJournalEntry } from "./ledger.service";
import { getSetting } from "./settings.repository";
import { ensureWallet } from "./wallet.service";

type Tx = TransactionSql<Record<string, never>>;

/**
 * Bridge between the legacy `customer.wallet_*` tables and the accounting ledger.
 *
 * The migration strategy is dual-write, not switch-over. Each legacy money path keeps
 * writing its own rows AND posts the matching journal entry, both inside the caller's
 * existing transaction. That matters because:
 *
 *   * Several readers still read the legacy tables — the wallet screen, the admin
 *     pages, booking-pro's own balance check. Writing only to the ledger would show
 *     those customers a stale balance.
 *   * `accounting.v_cutover_reconciliation` compares the two. While both are written
 *     together it stays green, and the moment a path is missed it goes red — which is
 *     the whole point of migrating this way rather than in one jump.
 *
 * Once every path is bridged and the reconciliation has been green for a full cycle,
 * the legacy writes can be deleted and the ledger becomes the only writer.
 */

let installedCache: boolean | null = null;
let warned = false;

/**
 * True when the accounting migrations have been applied.
 *
 * Checked rather than assumed so the application can be deployed before the migrations
 * are run — otherwise shipping this code would break checkout for everyone until an
 * operator remembered to migrate. Cached per process; a deploy follows a migration.
 */
export async function isAccountingInstalled(tx: Tx): Promise<boolean> {
  if (installedCache !== null) return installedCache;

  const [row] = await tx<{ installed: boolean }[]>`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'accounting' and table_name = 'journal_lines'
    ) as installed
  `;
  installedCache = row?.installed ?? false;

  if (!installedCache && !warned) {
    warned = true;
    console.warn(
      "[accounting] schema not installed — money is being written to the legacy wallet only. " +
        "Run `pnpm migrate` to bring the ledger up."
    );
  }
  return installedCache;
}

/** Only for tests, which create and drop the schema between runs. */
export function resetAccountingInstalledCache(): void {
  installedCache = null;
}

/**
 * Mirrors a booking paid from the wallet.
 *
 *     Dr  2001001  the customer's wallet        (full amount)
 *     Cr  2003001  provider payable             (amount less the platform fee)
 *     Cr  4001001  platform fee income          (the fee)
 *
 * The fee percentage comes from accounting.settings, so changing it is a settings edit
 * rather than a deploy.
 *
 * Returns silently when the schema is not installed. Any other failure propagates and
 * rolls back the caller's transaction — a booking must not be marked paid if the ledger
 * refused the entry, because the ledger is what enforces the balance.
 */
export async function mirrorBookingWalletPayment(
  input: {
    userId: string;
    currencyCode: string;
    amount: string;
    bookingId: string;
    paymentId: string;
  },
  tx: Tx
): Promise<{ posted: boolean; entryId?: string }> {
  if (!(await isAccountingInstalled(tx))) return { posted: false };

  const currency = input.currencyCode.toUpperCase();
  const walletId = await ensureWallet({ userId: input.userId, currencyCode: currency }, tx);

  const feePercent = String((await getSetting<number | string>("platform_fee_percent", tx as never)) ?? 0);

  // Split in Postgres so the fee is computed at the ledger's precision, and so the two
  // credit legs are guaranteed to add back to the debit exactly.
  const [split] = await tx<{ fee: string; provider_share: string }[]>`
    select
      round(${input.amount}::numeric * ${feePercent}::numeric / 100, 18)::text as fee,
      (${input.amount}::numeric - round(${input.amount}::numeric * ${feePercent}::numeric / 100, 18))::text as provider_share
  `;

  const lines = [
    {
      accountKey: "user_wallet_liability" as const,
      direction: "debit" as const,
      amount: input.amount,
      currencyCode: currency,
      partyType: "user" as const,
      partyId: input.userId,
      walletId,
      walletBucket: "available" as const,
      movementType: "booking_payment" as const,
      memo: `Booking ${input.bookingId}`,
    },
    {
      accountKey: "provider_payable" as const,
      direction: "credit" as const,
      amount: split.provider_share,
      currencyCode: currency,
      memo: `Booking ${input.bookingId}`,
    },
  ];

  if (Number(split.fee) > 0) {
    lines.push({
      accountKey: "platform_fee_income" as never,
      direction: "credit" as const,
      amount: split.fee,
      currencyCode: currency,
      memo: `Platform fee ${feePercent}%`,
    } as never);
  }

  const entry = await postJournalEntry(
    {
      // Keyed on the booking payment, so a retry of the same checkout collides here
      // instead of debiting the wallet twice.
      idempotencyKey: `booking_payment:${input.paymentId}`,
      sourceType: "booking_payment",
      sourceId: input.bookingId,
      description: "پرداخت رزرو از کیف پول",
      actorUserId: input.userId,
      lines,
    },
    tx
  );

  return { posted: true, entryId: entry.entryId };
}

/**
 * Mirrors a wallet credit that the legacy code performs: a verified top-up, an
 * admin-approved deposit, or a refund landing back in the wallet.
 */
export async function mirrorWalletCredit(
  input: {
    userId: string;
    currencyCode: string;
    amount: string;
    idempotencyKey: string;
    sourceType: "deposit" | "refund";
    sourceId?: string;
    counterpartAccountKey: "clearing_zarinpal" | "clearing_btcpay" | "bank_platform" | "crypto_cold" | "provider_payable";
    description?: string;
    actorUserId?: string;
  },
  tx: Tx
): Promise<{ posted: boolean; entryId?: string }> {
  if (!(await isAccountingInstalled(tx))) return { posted: false };

  const currency = input.currencyCode.toUpperCase();
  const walletId = await ensureWallet({ userId: input.userId, currencyCode: currency }, tx);

  const entry = await postJournalEntry(
    {
      idempotencyKey: input.idempotencyKey,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      description: input.description,
      actorUserId: input.actorUserId,
      lines: [
        {
          accountKey: input.counterpartAccountKey,
          direction: "debit",
          amount: input.amount,
          currencyCode: currency,
        },
        {
          accountKey: "user_wallet_liability",
          direction: "credit",
          amount: input.amount,
          currencyCode: currency,
          partyType: "user",
          partyId: input.userId,
          walletId,
          walletBucket: "available",
          movementType: input.sourceType === "refund" ? "refund" : "deposit",
        },
      ],
    },
    tx
  );

  return { posted: true, entryId: entry.entryId };
}
