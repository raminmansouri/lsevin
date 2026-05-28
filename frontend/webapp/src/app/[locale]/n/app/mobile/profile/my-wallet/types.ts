export type WalletCurrency = "USD" | "EUR" | "GBP" | "AED" | (string & {});

export type WalletDirection = "credit" | "debit";

export type WalletTransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type WalletPaymentMethod = "card" | "bank" | "apple" | "wallet";

export interface WalletBalanceRow {
  currencyCode: WalletCurrency;
  availableAmount: number;
  pendingAmount: number;
}

export interface WalletTransactionRow {
  id: string;
  bookingId: string | null;
  paymentIntentId: string | null;
  transactionType:
    | "topup"
    | "booking_payment"
    | "refund"
    | "cashback"
    | "referral_bonus"
    | "manual_adjustment"
    | "withdrawal";
  direction: WalletDirection;
  status: WalletTransactionStatus;
  paymentMethod: WalletPaymentMethod | null;
  title: string;
  subtitle: string | null;
  currencyCode: WalletCurrency;
  amount: number;
  occurredAt: string;
}

export interface WalletPageData {
  defaultCurrency: WalletCurrency;
  balances: Record<string, number>;
  pendingBalances: Record<string, number>;
  supportedCurrencies: WalletCurrency[];
  transactions: WalletTransactionRow[];
}

export interface WalletHistoryPageData {
  defaultCurrency: WalletCurrency;
  transactions: WalletTransactionRow[];
}

export interface WalletTransactionDetailData {
  id: string;
  bookingId: string | null;
  paymentIntentId: string | null;
  transactionType: WalletTransactionRow["transactionType"];
  direction: WalletDirection;
  status: WalletTransactionStatus;
  paymentMethod: WalletPaymentMethod | null;
  paymentMethodLabel: string;
  title: string;
  subtitle: string | null;
  currencyCode: WalletCurrency;
  amount: number;
  occurredAt: string;
  transactionReference: string;
  gatewayReference: string | null;
  bookingReference: string | null;
  providerName: string | null;
  providerAddress: string | null;
  description: string;
  subtotal: number;
  fee: number;
  total: number;
}

export interface CreateTopUpIntentInput {
  amount: number;
  currencyCode: WalletCurrency;
  paymentMethod: Exclude<WalletPaymentMethod, "wallet">;
}

export type CreateTopUpIntentResult =
  | {
      ok: true;
      status: "pending";
      message: string;
    }
  | {
      ok: true;
      status: "requires_action" | "processing";
      redirectUrl?: string | null;
      clientSecret?: string | null;
      message?: string;
    }
  | {
      ok: false;
      message: string;
    };
