import sharedSql from "@/config/database/db";
import type {
  CreateTopUpIntentInput,
  WalletPageData,
  WalletTransactionRow,
} from "./types";

export const SUPPORTED_WALLET_CURRENCIES = ["IRR", "IRT", "USD", "EUR", "GBP", "AED"] as const;

// Every caller used to build its own `postgres()` client here — a fresh
// connection pool per server action, none of which was ever `.end()`ed. Under
// load that leaks pools until PgBouncer's max_client_conn is reached. The shared
// client in @/config/database/db is the single pool for the whole process and
// already reads DATABASE_URL (which points at PgBouncer in production), so it is
// also the only place where pooling and prepare settings have to stay correct.
export function createWalletSqlClient() {
  return sharedSql;
}

export async function ensureWalletAccount(
  sql: ReturnType<typeof createWalletSqlClient>,
  userId: string
): Promise<{ walletAccountId: string; defaultCurrency: string }> {
  const existing = await sql<{
    id: string;
    default_currency: string;
  }[]>`
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

  const inserted = await sql<{
    id: string;
    default_currency: string;
  }[]>`
    INSERT INTO customer.wallet_accounts (user_id)
    VALUES (${userId})
    RETURNING id, default_currency
  `;

  return {
    walletAccountId: inserted[0].id,
    defaultCurrency: inserted[0].default_currency,
  };
}

export async function getWalletPageData(
  sql: ReturnType<typeof createWalletSqlClient>,
  userId: string,
  limit = 20
): Promise<WalletPageData> {
  const wallet = await ensureWalletAccount(sql, userId);

  const balances = await sql<{
    currency_code: string;
    available_amount: string;
    pending_amount: string;
  }[]>`
    WITH supported(currency_code) AS (
      SELECT unnest(${SUPPORTED_WALLET_CURRENCIES}::text[])
    )
    SELECT
      s.currency_code,
      COALESCE(sum(CASE WHEN wt.status = 'completed' THEN wt.amount ELSE 0 END), 0)::numeric(18,2)::text AS available_amount,
      COALESCE(sum(CASE WHEN wt.status IN ('pending', 'processing') THEN wt.amount ELSE 0 END), 0)::numeric(18,2)::text AS pending_amount
    FROM supported s
    LEFT JOIN customer.wallet_transactions wt
      ON wt.wallet_account_id = ${wallet.walletAccountId}::uuid
     AND wt.currency_code = s.currency_code
    GROUP BY s.currency_code
    ORDER BY s.currency_code
  `;

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
    WHERE wallet_account_id = ${wallet.walletAccountId}
    ORDER BY occurred_at DESC
    LIMIT ${limit}
  `;

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
    paymentGateways: [],
    transactions: transactions.map((row) => ({
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
    })),
  };
}

export async function insertTopUpIntentAndMaybePendingTransaction(
  sql: ReturnType<typeof createWalletSqlClient>,
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
    const [intent] = await tx<{
      id: string;
    }[]>`
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

    if (input.paymentMethod === "bank" || input.paymentMethod === "crypto") {
      const isCrypto = input.paymentMethod === "crypto";

      // For crypto the receipt/txHash/network live in gateway.raw (built by the
      // crypto top-up action) and are mirrored onto the intent metadata above,
      // so both rows carry the same audit payload.
      const transactionMetadata = isCrypto
        ? gateway.raw ?? { source: "crypto" }
        : { source: "wallet-topup", topUpMethod: "bank" };

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
          ${input.paymentMethod},
          'Wallet Top-up',
          ${isCrypto ? "Crypto deposit pending review" : "Bank transfer pending confirmation"},
          ${input.currencyCode},
          ${input.amount},
          ${JSON.stringify(transactionMetadata)}::jsonb
        )
      `;
    }

    return intent.id;
  });
}
