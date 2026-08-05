import "server-only";

import db from "@/config/database/db";

import { assertAccounting } from "./access";

/**
 * Read models for the analytic reports added in 0016.
 *
 * Every one of these reads a view whose job is to decide what "in the books"
 * means — the SQL there filters to posted and reversed entries, so nothing here
 * has to remember to. That is deliberate: the same rule stated in six different
 * queries is the shape the trial-balance bug had.
 */

/** Picks the caller's language out of a name_translations blob. */
function pickName(value: Record<string, string> | null, locale: string, fallback: string): string {
  if (!value) return fallback;
  return value[locale] ?? value.fa ?? value.en ?? Object.values(value)[0] ?? fallback;
}

export type CostCenterRow = {
  id: string;
  code: string;
  name: string;
  budgetAmount: string | null;
  budgetCurrency: string | null;
  totalDebit: string;
  totalCredit: string;
  netAmount: string;
  entryCount: number;
  budgetUsedPercent: number | null;
};

export async function getCostCenterReport(locale = "fa"): Promise<CostCenterRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      cost_center_id: string;
      code: string;
      name_translations: Record<string, string> | null;
      budget_amount: string | null;
      budget_currency: string | null;
      total_debit: string;
      total_credit: string;
      net_amount: string;
      entry_count: number;
      budget_used_percent: string | null;
    }[]
  >`
    select cost_center_id::text, code, name_translations, budget_amount::text,
           budget_currency, total_debit::text, total_credit::text, net_amount::text,
           entry_count::int, budget_used_percent::text
      from accounting.v_cost_center_report
     order by code
  `;

  return rows.map((r) => ({
    id: r.cost_center_id,
    code: r.code,
    name: pickName(r.name_translations, locale, r.code),
    budgetAmount: r.budget_amount,
    budgetCurrency: r.budget_currency,
    totalDebit: r.total_debit,
    totalCredit: r.total_credit,
    netAmount: r.net_amount,
    entryCount: r.entry_count,
    budgetUsedPercent: r.budget_used_percent === null ? null : Number(r.budget_used_percent),
  }));
}

export type ProjectRow = {
  id: string;
  code: string;
  name: string;
  budgetAmount: string | null;
  startsOn: string | null;
  endsOn: string | null;
  netAmount: string;
  entryCount: number;
};

export async function getProjectReport(locale = "fa"): Promise<ProjectRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      project_id: string;
      code: string;
      name_translations: Record<string, string> | null;
      budget_amount: string | null;
      starts_on: string | null;
      ends_on: string | null;
      net_amount: string;
      entry_count: number;
    }[]
  >`
    select project_id::text, code, name_translations, budget_amount::text,
           starts_on::text, ends_on::text, net_amount::text, entry_count::int
      from accounting.v_project_report
     order by code
  `;

  return rows.map((r) => ({
    id: r.project_id,
    code: r.code,
    name: pickName(r.name_translations, locale, r.code),
    budgetAmount: r.budget_amount,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    netAmount: r.net_amount,
    entryCount: r.entry_count,
  }));
}

export type PartyBalanceRow = {
  partyType: string;
  partyId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  currencyCode: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
  lineCount: number;
  lastMovementAt: string | null;
};

/**
 * Subsidiary ledger by party.
 *
 * Rows with a zero balance are dropped: a provider who has been settled in full
 * is not something an accountant is looking for in this list, and leaving them in
 * buries the ones who matter.
 */
export async function getPartyBalances(
  locale = "fa",
  filters: { partyType?: string } = {}
): Promise<PartyBalanceRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      party_type: string;
      party_id: string;
      account_code: string;
      account_name: Record<string, string> | null;
      account_type: string;
      currency_code: string;
      total_debit: string;
      total_credit: string;
      balance: string;
      line_count: number;
      last_movement_at: string | null;
    }[]
  >`
    select party_type, party_id::text, account_code, account_name, account_type,
           currency_code, total_debit::text, total_credit::text, balance::text,
           line_count::int, last_movement_at::text
      from accounting.v_party_balances
     where balance <> 0
       and (${filters.partyType ?? null}::text is null or party_type = ${filters.partyType ?? null})
     order by abs(balance) desc
     limit 200
  `;

  return rows.map((r) => ({
    partyType: r.party_type,
    partyId: r.party_id,
    accountCode: r.account_code,
    accountName: pickName(r.account_name, locale, r.account_code),
    accountType: r.account_type,
    currencyCode: r.currency_code,
    totalDebit: r.total_debit,
    totalCredit: r.total_credit,
    balance: r.balance,
    lineCount: r.line_count,
    lastMovementAt: r.last_movement_at,
  }));
}

export type PendingDocumentRow = {
  id: string;
  entryNumber: string;
  entryDate: string;
  referenceNumber: string | null;
  description: string | null;
  status: string;
  isManual: boolean;
  totalDebit: string;
  totalCredit: string;
  difference: string;
  isUnbalanced: boolean;
  lineCount: number;
  ageDays: number;
};

export async function getPendingDocuments(): Promise<PendingDocumentRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      entry_number: string;
      entry_date: string;
      reference_number: string | null;
      description: string | null;
      status: string;
      is_manual: boolean;
      total_debit: string;
      total_credit: string;
      difference: string;
      is_unbalanced: boolean;
      line_count: number;
      age_days: number;
    }[]
  >`
    select id::text, entry_number::text, entry_date::date::text, reference_number,
           description, status, is_manual, total_debit::text, total_credit::text,
           difference::text, is_unbalanced, line_count::int, age_days::int
      from accounting.v_pending_documents
     order by age_days desc, entry_number desc
     limit 200
  `;

  return rows.map((r) => ({
    id: r.id,
    entryNumber: r.entry_number,
    entryDate: r.entry_date,
    referenceNumber: r.reference_number,
    description: r.description,
    status: r.status,
    isManual: r.is_manual,
    totalDebit: r.total_debit,
    totalCredit: r.total_credit,
    difference: r.difference,
    isUnbalanced: r.is_unbalanced,
    lineCount: r.line_count,
    ageDays: r.age_days,
  }));
}

export type MonthlyVolumeRow = { month: string; label: string; totalDebit: string };

/**
 * Posting volume for the last six months — the dashboard's bar chart.
 *
 * Months with no activity are still returned, at zero. A chart that silently
 * drops empty months compresses the timeline and makes a quiet month look like
 * it never happened.
 */
export async function getMonthlyVolume(): Promise<MonthlyVolumeRow[]> {
  await assertAccounting("read");

  const rows = await db<{ month: string; total_debit: string }[]>`
    with months as (
      select date_trunc('month', current_date) - (n || ' month')::interval as m
        from generate_series(5, 0, -1) as n
    )
    select to_char(months.m, 'YYYY-MM') as month,
           coalesce(sum(l.base_debit_amount), 0)::text as total_debit
      from months
      left join accounting.journal_entries e
             on date_trunc('month', e.entry_date) = months.m
            and accounting.fn_status_is_in_books(e.status)
      left join accounting.journal_lines l on l.entry_id = e.id
     group by months.m
     order by months.m
  `;

  const FA_MONTH: Record<string, string> = {
    "01": "ژانویه", "02": "فوریه", "03": "مارس", "04": "آوریل",
    "05": "مه", "06": "ژوئن", "07": "ژوئیه", "08": "اوت",
    "09": "سپتامبر", "10": "اکتبر", "11": "نوامبر", "12": "دسامبر",
  };

  return rows.map((r) => ({
    month: r.month,
    label: FA_MONTH[r.month.slice(5, 7)] ?? r.month,
    totalDebit: r.total_debit,
  }));
}

export type CurrencyExposureRow = {
  currencyCode: string;
  totalDebit: string;
  totalCredit: string;
  netAmount: string;
  baseCurrencyCode: string;
  netBaseAmount: string;
  entryCount: number;
};

export async function getCurrencyExposure(): Promise<CurrencyExposureRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      currency_code: string;
      total_debit: string;
      total_credit: string;
      net_amount: string;
      base_currency_code: string;
      net_base_amount: string;
      entry_count: number;
    }[]
  >`
    select currency_code, total_debit::text, total_credit::text, net_amount::text,
           base_currency_code, net_base_amount::text, entry_count::int
      from accounting.v_currency_exposure
     order by currency_code
  `;

  return rows.map((r) => ({
    currencyCode: r.currency_code,
    totalDebit: r.total_debit,
    totalCredit: r.total_credit,
    netAmount: r.net_amount,
    baseCurrencyCode: r.base_currency_code,
    netBaseAmount: r.net_base_amount,
    entryCount: r.entry_count,
  }));
}
