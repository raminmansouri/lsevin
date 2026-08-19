export type FinanceSummary = { pendingEarnings: string; approvedEarnings: string; paidAmount: string; currencyCode: string };
export type LedgerEntry = { id: string; entryType: string; amount: string; currencyCode: string; status: string; notes: string | null; createdAt: string };
export type PayoutAccount = { id: string; accountHolderName: string; bankName: string | null; iban: string | null; currencyCode: string; isDefault: boolean };
