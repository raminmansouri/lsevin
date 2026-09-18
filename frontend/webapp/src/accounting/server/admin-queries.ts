import "server-only";

import db from "@/config/database/db";

/**
 * Read side of the accounting admin panel.
 *
 * Everything here derives from the ledger. No screen keeps its own total, so a report
 * and the books can never disagree — if a number looks wrong, it is wrong in the ledger
 * and the reconciliation view will say so.
 */

export type PendingDepositRow = {
  id: string;
  userId: string;
  customerName: string | null;
  customerEmail: string | null;
  currencyCode: string;
  amount: string;
  method: string;
  status: string;
  receiptUrl: string | null;
  externalReference: string | null;
  createdAt: string;
};

export async function listPendingDeposits(limit = 100): Promise<PendingDepositRow[]> {
  return db<PendingDepositRow[]>`
    select
      d.id::text as "id",
      d.user_id::text as "userId",
      nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "customerName",
      u.email as "customerEmail",
      d.currency_code as "currencyCode",
      d.amount::text as "amount",
      d.method,
      d.status,
      d.receipt_url as "receiptUrl",
      d.external_reference as "externalReference",
      d.created_at::text as "createdAt"
    from accounting.deposit_requests d
    left join identity.asp_net_users u on u.id = d.user_id
    where d.status in ('pending_review', 'awaiting_payment')
    order by d.created_at asc
    limit ${limit}
  `;
}

export type PendingWithdrawalRow = {
  id: string;
  userId: string;
  customerName: string | null;
  customerEmail: string | null;
  currencyCode: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  status: string;
  destinationType: string;
  destinationIban: string | null;
  destinationHolderName: string | null;
  destinationAddress: string | null;
  destinationNetwork: string | null;
  createdAt: string;
};

export async function listPendingWithdrawals(limit = 100): Promise<PendingWithdrawalRow[]> {
  return db<PendingWithdrawalRow[]>`
    select
      w.id::text as "id",
      w.user_id::text as "userId",
      nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "customerName",
      u.email as "customerEmail",
      w.currency_code as "currencyCode",
      w.amount::text as "amount",
      w.fee_amount::text as "feeAmount",
      w.net_amount::text as "netAmount",
      w.status,
      w.destination_type as "destinationType",
      w.destination_iban as "destinationIban",
      w.destination_holder_name as "destinationHolderName",
      w.destination_address as "destinationAddress",
      w.destination_network as "destinationNetwork",
      w.created_at::text as "createdAt"
    from accounting.withdrawal_requests w
    left join identity.asp_net_users u on u.id = w.user_id
    where w.status in ('pending', 'approved', 'processing')
    order by w.created_at asc
    limit ${limit}
  `;
}

export type SystemBalanceRow = {
  currencyCode: string;
  userLiability: string;
  reserved: string;
  platformCash: string;
  walletCount: string;
};

/**
 * What the platform owes customers, versus what it is holding, per currency.
 *
 * `userLiability` should never exceed `platformCash` by more than what is legitimately
 * in flight. When it does, the platform has spent customer money — the single most
 * important number on this dashboard.
 */
export async function getSystemBalances(): Promise<SystemBalanceRow[]> {
  return db<SystemBalanceRow[]>`
    select
      w.currency_code as "currencyCode",
      coalesce(sum(w.available_balance), 0)::text as "userLiability",
      coalesce(sum(w.reserved_balance), 0)::text as "reserved",
      coalesce((
        select sum(b.balance)
        from accounting.v_account_balances_by_currency b
        join accounting.accounts a on a.id = b.account_id
        where a.account_type = 'asset' and b.currency_code = w.currency_code
      ), 0)::text as "platformCash",
      count(*)::text as "walletCount"
    from accounting.wallets w
    group by w.currency_code
    order by w.currency_code
  `;
}

export type DriftRow = {
  walletId: string;
  userId: string;
  currencyCode: string;
  bucket: string;
  cachedBalance: string;
  ledgerBalance: string;
  drift: string;
};

/** Must always be empty. Anything here is a wallet whose balance left the ledger behind. */
export async function listBalanceDrift(): Promise<DriftRow[]> {
  return db<DriftRow[]>`
    select
      wallet_id::text as "walletId",
      user_id::text as "userId",
      currency_code as "currencyCode",
      bucket,
      cached_balance::text as "cachedBalance",
      ledger_balance::text as "ledgerBalance",
      drift::text as "drift"
    from accounting.v_wallet_balance_drift
    limit 50
  `;
}

export type TrialBalanceRow = {
  accountCode: string;
  accountName: Record<string, string> | null;
  accountType: string;
  currencyCode: string | null;
  totalDebit: string;
  totalCredit: string;
  balance: string;
};

export async function getTrialBalance(): Promise<TrialBalanceRow[]> {
  return db<TrialBalanceRow[]>`
    select
      account_code as "accountCode",
      account_name as "accountName",
      account_type as "accountType",
      currency_code as "currencyCode",
      total_debit::text as "totalDebit",
      total_credit::text as "totalCredit",
      balance::text as "balance"
    from accounting.v_trial_balance
    where total_debit <> 0 or total_credit <> 0
    order by account_code
  `;
}

/**
 * How much of the journal a trial balance is allowed to see.
 *
 *   in_books    — posted and reversed. What the books say, and the only scope the
 *                 balance sheet and the income statement are built from.
 *   in_workflow — plus documents waiting for approval, so an accountant can see
 *                 where the month lands once the queue clears.
 *   all         — every document that exists, drafts and rejections included.
 *
 * The wider two are a working view, not a statement: a draft is unbalanced by
 * design while it is being typed, so this report can legitimately not foot in those
 * scopes. That is why the default stays `in_books` and why it keeps reading
 * v_trial_balance — the official number has exactly one definition, in the view.
 */
export type TrialBalanceScope = "in_books" | "in_workflow" | "all";

const SCOPE_STATUSES: Record<Exclude<TrialBalanceScope, "in_books">, string[]> = {
  in_workflow: ["posted", "reversed", "approved", "temporary"],
  all: ["posted", "reversed", "approved", "temporary", "draft", "rejected"],
};

export async function getTrialBalanceForScope(
  scope: TrialBalanceScope = "in_books"
): Promise<TrialBalanceRow[]> {
  if (scope === "in_books") return getTrialBalance();

  const statuses = SCOPE_STATUSES[scope];

  // The same shape as v_trial_balance, with the status test widened. The lines are
  // filtered inside the subquery rather than on the outer join, for the reason 0016
  // spells out: a predicate on the LEFT JOINed entry leaves the line in the result
  // when it fails, and sum() then counts a document that was meant to be excluded.
  return db<TrialBalanceRow[]>`
    select
      a.code               as "accountCode",
      a.name_translations  as "accountName",
      a.account_type       as "accountType",
      l.base_currency_code as "currencyCode",
      coalesce(sum(l.base_debit_amount), 0)::text  as "totalDebit",
      coalesce(sum(l.base_credit_amount), 0)::text as "totalCredit",
      (case a.normal_balance
         when 'debit' then coalesce(sum(l.base_debit_amount), 0::numeric)
                         - coalesce(sum(l.base_credit_amount), 0::numeric)
         else              coalesce(sum(l.base_credit_amount), 0::numeric)
                         - coalesce(sum(l.base_debit_amount), 0::numeric)
       end)::text          as "balance"
    from accounting.accounts a
    left join (
      select l.*
        from accounting.journal_lines l
        join accounting.journal_entries e on e.id = l.entry_id
       where e.status = any(${statuses}::text[])
    ) l on l.account_id = a.id
    group by a.id, a.code, a.name_translations, a.account_type, a.normal_balance,
             l.base_currency_code
    having coalesce(sum(l.base_debit_amount), 0) <> 0
        or coalesce(sum(l.base_credit_amount), 0) <> 0
    order by a.code
  `;
}

export type JournalEntryRow = {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string | null;
  sourceType: string;
  status: string;
  totalDebit: string;
  baseCurrencyCode: string;
  lineCount: string;
};

export async function listJournalEntries(limit = 100): Promise<JournalEntryRow[]> {
  return db<JournalEntryRow[]>`
    select
      e.id::text as "id",
      e.entry_number::text as "entryNumber",
      e.entry_date::text as "entryDate",
      e.description,
      e.source_type as "sourceType",
      e.status,
      coalesce(sum(l.base_debit_amount), 0)::text as "totalDebit",
      e.base_currency_code as "baseCurrencyCode",
      count(l.id)::text as "lineCount"
    from accounting.journal_entries e
    left join accounting.journal_lines l on l.entry_id = e.id
    group by e.id, e.entry_number, e.entry_date, e.description, e.source_type, e.status, e.base_currency_code
    order by e.entry_number desc
    limit ${limit}
  `;
}

export type AuditLogRow = {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  occurredAt: string;
};

export async function listAuditLog(limit = 200): Promise<AuditLogRow[]> {
  return db<AuditLogRow[]>`
    select
      a.id::text as "id",
      a.actor_user_id::text as "actorUserId",
      nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "actorName",
      a.action,
      a.entity_type as "entityType",
      a.entity_id::text as "entityId",
      a.occurred_at::text as "occurredAt"
    from accounting.audit_log a
    left join identity.asp_net_users u on u.id = a.actor_user_id
    order by a.id desc
    limit ${limit}
  `;
}

/** True when the accounting migrations have not been applied yet. */
export async function isAccountingInstalled(): Promise<boolean> {
  const [row] = await db<{ installed: boolean }[]>`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'accounting' and table_name = 'journal_lines'
    ) as installed
  `;
  return row?.installed ?? false;
}

export type StatementLineRow = {
  accountType: string;
  groupCode: string | null;
  accountCode: string;
  accountName: Record<string, string> | null;
  currencyCode: string | null;
  amount: string;
};

/** Balance sheet: assets, liabilities and equity, per currency. */
export async function getBalanceSheet(): Promise<StatementLineRow[]> {
  return db<StatementLineRow[]>`
    select
      tb.account_type as "accountType",
      left(tb.account_code, 1) as "groupCode",
      tb.account_code as "accountCode",
      tb.account_name as "accountName",
      tb.currency_code as "currencyCode",
      tb.balance::text as "amount"
    from accounting.v_trial_balance tb
    where tb.account_type in ('asset', 'liability', 'equity')
      and tb.balance <> 0
    order by tb.account_code
  `;
}

/** Income statement: revenue and expenses, per currency. */
export async function getIncomeStatement(): Promise<StatementLineRow[]> {
  return db<StatementLineRow[]>`
    select
      tb.account_type as "accountType",
      left(tb.account_code, 1) as "groupCode",
      tb.account_code as "accountCode",
      tb.account_name as "accountName",
      tb.currency_code as "currencyCode",
      tb.balance::text as "amount"
    from accounting.v_trial_balance tb
    where tb.account_type in ('income', 'expense')
      and tb.balance <> 0
    order by tb.account_code
  `;
}

export type LedgerLineRow = {
  entryNumber: string;
  entryDate: string;
  accountCode: string;
  accountName: Record<string, string> | null;
  description: string | null;
  currencyCode: string;
  debitAmount: string;
  creditAmount: string;
  partyType: string | null;
  memo: string | null;
};

/**
 * General / subsidiary / detail ledger. Filtering by an account code prefix is what
 * turns one query into all three: '2' is the group, '2001' the subsidiary, '2001001'
 * the detail account.
 */
export async function getLedgerLines(input: {
  accountCodePrefix?: string;
  limit?: number;
}): Promise<LedgerLineRow[]> {
  const prefix = (input.accountCodePrefix ?? "").trim();
  return db<LedgerLineRow[]>`
    select
      v.entry_number::text as "entryNumber",
      v.entry_date::text as "entryDate",
      v.account_code as "accountCode",
      v.account_name as "accountName",
      v.entry_description as "description",
      v.currency_code as "currencyCode",
      v.debit_amount::text as "debitAmount",
      v.credit_amount::text as "creditAmount",
      v.party_type as "partyType",
      v.memo
    from accounting.v_ledger_entries v
    where (${prefix} = '' or v.account_code like ${prefix + "%"})
    order by v.entry_number desc, v.line_no
    limit ${input.limit ?? 500}
  `;
}
