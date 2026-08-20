import sharedSql from "@/config/database/db";
import type {
  CreateTopUpIntentInput,
  WalletHistoryPageData,
  WalletPageData,
  WalletPaymentMethod,
  WalletTransactionDetailData,
  WalletTransactionRow,
} from "./types";
import { getPaymentMethodLabel } from "./utils";

export const SUPPORTED_WALLET_CURRENCIES = ["USD", "EUR", "GBP", "AED"] as const;

// Every caller used to build its own `postgres()` client here — a fresh
// connection pool per server action, none of which was ever `.end()`ed. Under
// load that leaks pools until PgBouncer's max_client_conn is reached. The shared
// client in @/config/database/db is the single pool for the whole process and
// already reads DATABASE_URL (which points at PgBouncer in production), so it is
// also the only place where pooling and prepare settings have to stay correct.
export function createWalletSqlClient() {
  return sharedSql;
}

export type WalletSqlClient = ReturnType<typeof createWalletSqlClient>;

export async function ensureWalletAccount(
  sql: WalletSqlClient,
  userId: string
): Promise<{ walletAccountId: string; defaultCurrency: string }> {
  const existing = await sql<{ id: string; default_currency: string }[]>`
    SELECT id, default_currency
    FROM customer.wallet_accounts
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return {
      walletAccountId: existing[0].id,
      defaultCurrency: existing[0].default_currency,
    };
  }

  const inserted = await sql<{ id: string; default_currency: string }[]>`
    INSERT INTO customer.wallet_accounts (user_id)
    VALUES (${userId})
    RETURNING id, default_currency
  `;

  return {
    walletAccountId: inserted[0].id,
    defaultCurrency: inserted[0].default_currency,
  };
}

function mapTransactionRow(row: {
  id: string;
  booking_id: string | null;
  payment_intent_id: string | null;
  transaction_type: WalletTransactionRow["transactionType"];
  direction: WalletTransactionRow["direction"];
  status: WalletTransactionRow["status"];
  payment_method: WalletTransactionRow["paymentMethod"];
  title: string;
  subtitle: string | null;
  currency_code: string;
  amount: string | number;
  occurred_at: string;
}): WalletTransactionRow {
  return {
    id: row.id,
    bookingId: row.booking_id,
    paymentIntentId: row.payment_intent_id,
    transactionType: row.transaction_type,
    direction: row.direction,
    status: row.status,
    paymentMethod: row.payment_method,
    title: row.title,
    subtitle: row.subtitle,
    currencyCode: row.currency_code,
    amount: Number(row.amount),
    occurredAt: row.occurred_at,
  };
}

async function getWalletTransactions(
  sql: WalletSqlClient,
  walletAccountId: string,
  limit: number
): Promise<WalletTransactionRow[]> {
  const transactions = await sql<{
    id: string;
    booking_id: string | null;
    payment_intent_id: string | null;
    transaction_type: WalletTransactionRow["transactionType"];
    direction: WalletTransactionRow["direction"];
    status: WalletTransactionRow["status"];
    payment_method: WalletTransactionRow["paymentMethod"];
    title: string;
    subtitle: string | null;
    currency_code: string;
    amount: string;
    occurred_at: string;
  }[]>`
    SELECT
      id,
      booking_id,
      payment_intent_id,
      transaction_type,
      direction,
      status,
      payment_method,
      title,
      subtitle,
      currency_code,
      amount,
      occurred_at
    FROM customer.wallet_transactions
    WHERE wallet_account_id = ${walletAccountId}
    ORDER BY occurred_at DESC
    LIMIT ${limit}
  `;

  return transactions.map(mapTransactionRow);
}

export async function getWalletPageData(
  sql: WalletSqlClient,
  userId: string,
  limit = 20
): Promise<WalletPageData> {
  const wallet = await ensureWalletAccount(sql, userId);

  const balances = await sql<{
    currency_code: string;
    available_amount: string;
    pending_amount: string;
  }[]>`
    SELECT currency_code, available_amount, pending_amount
    FROM customer.wallet_balances
    WHERE wallet_account_id = ${wallet.walletAccountId}
    ORDER BY currency_code
  `;

  const transactions = await getWalletTransactions(sql, wallet.walletAccountId, limit);

  const balanceMap = Object.fromEntries(
    SUPPORTED_WALLET_CURRENCIES.map((code) => [code, 0])
  ) as Record<string, number>;

  const pendingMap = Object.fromEntries(
    SUPPORTED_WALLET_CURRENCIES.map((code) => [code, 0])
  ) as Record<string, number>;

  for (const row of balances) {
    balanceMap[row.currency_code] = Number(row.available_amount ?? 0);
    pendingMap[row.currency_code] = Number(row.pending_amount ?? 0);
  }

  return {
    defaultCurrency: wallet.defaultCurrency,
    supportedCurrencies: [...SUPPORTED_WALLET_CURRENCIES],
    balances: balanceMap,
    pendingBalances: pendingMap,
    transactions,
  };
}

export async function getWalletHistoryPageData(
  sql: WalletSqlClient,
  userId: string,
  limit = 200
): Promise<WalletHistoryPageData> {
  const wallet = await ensureWalletAccount(sql, userId);
  const transactions = await getWalletTransactions(sql, wallet.walletAccountId, limit);

  return {
    defaultCurrency: wallet.defaultCurrency,
    transactions,
  };
}

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumberOrNull(value: unknown): number | null {
  const candidate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : null;
}

export async function getWalletTransactionDetail(
  sql: WalletSqlClient,
  userId: string,
  transactionId: string
): Promise<WalletTransactionDetailData | null> {
  const rows = await sql<{
    id: string;
    booking_id: string | null;
    payment_intent_id: string | null;
    transaction_type: WalletTransactionRow["transactionType"];
    direction: WalletTransactionRow["direction"];
    status: WalletTransactionRow["status"];
    payment_method: WalletPaymentMethod | null;
    title: string;
    subtitle: string | null;
    currency_code: string;
    amount: string;
    occurred_at: string;
    metadata: Record<string, unknown> | null;
    gateway_reference: string | null;
    gateway_name: string | null;
    booking_confirmation_code: string | null;
    booking_payment_reference: string | null;
    booking_total_amount: string | null;
    provider_name: string | null;
    provider_city: string | null;
    provider_country: string | null;
    service_name: string | null;
  }[]>`
    SELECT
      wt.id,
      wt.booking_id,
      wt.payment_intent_id,
      wt.transaction_type,
      wt.direction,
      wt.status,
      wt.payment_method,
      wt.title,
      wt.subtitle,
      wt.currency_code,
      wt.amount,
      wt.occurred_at,
      wt.metadata,
      wpi.gateway_reference,
      wpi.gateway_name,
      b.confirmation_code AS booking_confirmation_code,
      b.payment_reference AS booking_payment_reference,
      b.total_amount AS booking_total_amount,
      common.get_translation(sp.name_translations, 'en', 'en') AS provider_name,
      sp.city AS provider_city,
      sp.country AS provider_country,
      common.get_translation(ps.display_name_translations, 'en', 'en') AS service_name
    FROM customer.wallet_transactions wt
    LEFT JOIN customer.wallet_payment_intents wpi
      ON wpi.id = wt.payment_intent_id
    LEFT JOIN booking.bookings b
      ON b.id = wt.booking_id
    LEFT JOIN category.service_providers sp
      ON sp.id = b.provider_id
    LEFT JOIN category.provider_services ps
      ON ps.id = b.service_id
    WHERE wt.id = ${transactionId}
      AND wt.user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const metadata = row.metadata ?? {};
  const providerName =
    asTrimmedString(metadata.providerName) ??
    asTrimmedString(row.provider_name) ??
    asTrimmedString(row.subtitle);

  const providerAddress =
    asTrimmedString(metadata.providerAddress) ??
    ([asTrimmedString(row.provider_city), asTrimmedString(row.provider_country)]
      .filter(Boolean)
      .join(", ") || null);

  const description =
    asTrimmedString(metadata.description) ??
    asTrimmedString(row.service_name) ??
    row.title;

  const baseAmount = Math.abs(Number(row.amount));
  const subtotal =
    asNumberOrNull(metadata.subtotal) ??
    asNumberOrNull(row.booking_total_amount) ??
    baseAmount;
  const fee = asNumberOrNull(metadata.fee) ?? Math.max(baseAmount - subtotal, 0);

  return {
    id: row.id,
    bookingId: row.booking_id,
    paymentIntentId: row.payment_intent_id,
    transactionType: row.transaction_type,
    direction: row.direction,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentMethodLabel:
      asTrimmedString(metadata.paymentMethodLabel) ??
      asTrimmedString(row.gateway_name) ??
      getPaymentMethodLabel(row.payment_method),
    title: row.title,
    subtitle: row.subtitle,
    currencyCode: row.currency_code,
    amount: Number(row.amount),
    occurredAt: row.occurred_at,
    transactionReference:
      asTrimmedString(metadata.receiptNumber) ??
      row.gateway_reference ??
      row.booking_payment_reference ??
      row.id,
    gatewayReference: row.gateway_reference,
    bookingReference: row.booking_confirmation_code ?? row.booking_id,
    providerName,
    providerAddress,
    description,
    subtotal,
    fee,
    total: baseAmount,
  };
}

export async function insertTopUpIntentAndMaybePendingTransaction(
  sql: WalletSqlClient,
  {
    userId,
    walletAccountId,
    input,
    gateway,
  }: {
    userId: string;
    walletAccountId: string;
    input: CreateTopUpIntentInput;
    gateway: {
      gatewayName: string;
      gatewayReference?: string | null;
      redirectUrl?: string | null;
      clientSecret?: string | null;
      status: "pending" | "requires_action" | "processing";
      raw?: unknown;
    };
  }
) {
  return await sql.begin(async (tx) => {
    const [intent] = await tx<{ id: string }[]>`
      INSERT INTO customer.wallet_payment_intents (
        wallet_account_id,
        user_id,
        intent_type,
        payment_method,
        gateway_name,
        gateway_reference,
        client_secret,
        redirect_url,
        currency_code,
        amount,
        status,
        metadata
      )
      VALUES (
        ${walletAccountId},
        ${userId},
        'topup',
        ${input.paymentMethod},
        ${gateway.gatewayName},
        ${gateway.gatewayReference ?? null},
        ${gateway.clientSecret ?? null},
        ${gateway.redirectUrl ?? null},
        ${input.currencyCode},
        ${input.amount},
        ${gateway.status},
        ${JSON.stringify(gateway.raw ?? {})}::jsonb
      )
      RETURNING id
    `;

    if (input.paymentMethod === "bank") {
      await tx`
        INSERT INTO customer.wallet_transactions (
          wallet_account_id,
          user_id,
          payment_intent_id,
          transaction_type,
          direction,
          status,
          payment_method,
          title,
          subtitle,
          currency_code,
          amount,
          metadata
        )
        VALUES (
          ${walletAccountId},
          ${userId},
          ${intent.id},
          'topup',
          'credit',
          'pending',
          'bank',
          'Wallet Top-up',
          'Bank transfer pending confirmation',
          ${input.currencyCode},
          ${input.amount},
          ${JSON.stringify({
            source: 'wallet-topup',
            topUpMethod: 'bank',
            description: 'Wallet top-up awaiting bank transfer confirmation',
            subtotal: input.amount,
            fee: 0,
          })}::jsonb
        )
      `;
    }

    return intent.id;
  });
}
