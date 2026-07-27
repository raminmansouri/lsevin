import "server-only";

import type { TransactionSql } from "postgres";

import db from "@/config/database/db";

import type { WalletBalances } from "../types";

type Tx = TransactionSql<Record<string, never>>;

/**
 * Finds or creates the user's wallet for a currency.
 *
 * Created on demand rather than at signup: a user who never holds money never needs a
 * wallet row, and there is one wallet per currency the user actually uses.
 *
 * The ON CONFLICT is what makes this safe under concurrency — two requests arriving
 * together for a user with no wallet both try to insert, one wins, and the loser reads
 * the winner's row instead of failing.
 */
export async function ensureWallet(
  params: { userId: string; currencyCode: string },
  tx: Tx
): Promise<string> {
  const currency = params.currencyCode.toUpperCase();

  const [existing] = await tx<{ id: string }[]>`
    select id::text as id
    from accounting.wallets
    where user_id = ${params.userId} and currency_code = ${currency}
    limit 1
  `;
  if (existing) return existing.id;

  const [account] = await tx<{ id: string }[]>`
    select id::text as id from accounting.accounts where system_key = 'user_wallet_liability' limit 1
  `;
  if (!account) {
    throw new Error("The user wallet liability account is missing. Run the accounting seed.");
  }

  const [created] = await tx<{ id: string }[]>`
    insert into accounting.wallets (user_id, currency_code, account_id)
    values (${params.userId}, ${currency}, ${account.id})
    on conflict (user_id, currency_code) do update set updated_at = now()
    returning id::text as id
  `;
  return created.id;
}

/**
 * Reads a wallet's three balances.
 *
 * `available` is what the customer can spend now; `reserved` is held against a
 * withdrawal that has not been paid out yet; `pending` is incoming money that has not
 * been confirmed. The customer-facing screens should show available and pending
 * separately — showing their sum is how someone comes to believe they can spend an
 * unconfirmed crypto deposit.
 */
export async function getWalletBalances(
  params: { userId: string },
  sql: typeof db = db
): Promise<WalletBalances[]> {
  const rows = await sql<
    {
      id: string;
      user_id: string;
      currency_code: string;
      available_balance: string;
      reserved_balance: string;
      pending_balance: string;
    }[]
  >`
    select id::text as id, user_id::text as user_id, currency_code,
           available_balance::text as available_balance,
           reserved_balance::text as reserved_balance,
           pending_balance::text as pending_balance
    from accounting.wallets
    where user_id = ${params.userId}
    order by currency_code
  `;

  return rows.map((r) => ({
    walletId: r.id,
    userId: r.user_id,
    currencyCode: r.currency_code,
    available: r.available_balance,
    reserved: r.reserved_balance,
    pending: r.pending_balance,
  }));
}

/**
 * Locks a wallet row and returns its balances, for use inside a transaction that is
 * about to move money. `for no key update` serialises concurrent movers on the same
 * wallet without blocking the key-share locks foreign keys take.
 */
export async function lockWallet(
  params: { walletId: string },
  tx: Tx
): Promise<{ available: string; reserved: string; pending: string; currencyCode: string }> {
  const [wallet] = await tx<
    {
      currency_code: string;
      available_balance: string;
      reserved_balance: string;
      pending_balance: string;
    }[]
  >`
    select currency_code,
           available_balance::text as available_balance,
           reserved_balance::text as reserved_balance,
           pending_balance::text as pending_balance
    from accounting.wallets
    where id = ${params.walletId}
    limit 1
    for no key update
  `;
  if (!wallet) throw new Error(`Wallet ${params.walletId} was not found.`);

  return {
    currencyCode: wallet.currency_code,
    available: wallet.available_balance,
    reserved: wallet.reserved_balance,
    pending: wallet.pending_balance,
  };
}
