/**
 * Money is never a JavaScript number in this module.
 *
 * Ledger amounts are numeric(38,18). A double has 53 bits of mantissa, so it cannot hold
 * 18 decimal places of a large Rial figure without silently rounding — and a rounding
 * error in a ledger is a balance that stops reconciling. Amounts travel as strings and
 * all arithmetic happens in Postgres, which is why every amount type below is `string`.
 */
export type MoneyString = string;

/** Stable handles for the seeded system accounts (accounting.accounts.system_key). */
export type SystemAccountKey =
  | "clearing_zarinpal"
  | "clearing_btcpay"
  | "bank_platform"
  | "crypto_cold"
  | "receivable_gateway"
  | "user_wallet_liability"
  | "withdrawal_reserved"
  | "provider_payable"
  | "pending_deposits"
  | "share_capital"
  | "retained_earnings"
  | "opening_balance_equity"
  | "platform_fee_income"
  | "withdrawal_fee_income"
  | "fx_gain"
  | "gateway_fee_expense"
  | "network_fee_expense"
  | "fx_loss";

export type LedgerDirection = "debit" | "credit";

export type PartyType = "user" | "provider" | "gateway" | "platform";

/** Which of a wallet's three balances a line moves. Credit raises it, debit lowers it. */
export type WalletBucket = "available" | "reserved" | "pending";

export type WalletMovementType =
  | "deposit"
  | "withdrawal"
  | "withdrawal_hold"
  | "withdrawal_release"
  | "booking_payment"
  | "refund"
  | "cashback"
  | "referral_bonus"
  | "platform_fee"
  | "adjustment"
  | "reversal"
  | "opening_balance";

export type JournalLineInput = {
  /** Either a seeded system account… */
  accountKey?: SystemAccountKey;
  /** …or an explicit account id, for accounts an accountant added later. */
  accountId?: string;

  direction: LedgerDirection;
  amount: MoneyString | number;
  currencyCode: string;

  partyType?: PartyType;
  partyId?: string;

  /** Set to also move a wallet balance and write the customer's statement line. */
  walletId?: string;
  walletBucket?: WalletBucket;
  movementType?: WalletMovementType;

  memo?: string;
  metadata?: Record<string, unknown>;
};

export type PostJournalEntryInput = {
  /**
   * The anti-double-post key. Must be derived from the thing that caused the entry —
   * the gateway authority, the invoice id, the withdrawal request id — never random,
   * or a retry creates a second entry instead of colliding with the first.
   */
  idempotencyKey: string;
  sourceType: string;
  sourceId?: string;
  description?: string;
  entryDate?: Date;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  /**
   * Set when this entry reverses another. Written at insert time, because a posted entry
   * is immutable and the only field the database lets us stamp afterwards is the
   * original's `reversed_by_entry_id` pointer.
   */
  reversesEntryId?: string;
  lines: JournalLineInput[];
};

export type PostJournalEntryResult = {
  entryId: string;
  entryNumber: string;
  /** True when this key had already been posted and nothing new was written. */
  alreadyPosted: boolean;
};

export type WalletBalances = {
  walletId: string;
  userId: string;
  currencyCode: string;
  available: MoneyString;
  reserved: MoneyString;
  pending: MoneyString;
};
