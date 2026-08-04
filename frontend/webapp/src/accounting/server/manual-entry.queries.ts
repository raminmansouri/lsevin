import "server-only";

import db from "@/config/database/db";

import { assertAccounting } from "./access";

/**
 * Read-side queries for the manual entry screens.
 *
 * Separate from manual-entry.service.ts on purpose: that module owns the writes
 * and the workflow rules, this one only answers questions. Mixing them makes it
 * hard to see at a glance which functions can change the books.
 */

export type PostableAccount = {
  id: string;
  code: string;
  name: string;
  level: number;
  normalBalance: string;
  requiresCostCenter: boolean;
  requiresProject: boolean;
  requiresParty: boolean;
};

export type DimensionOption = {
  id: string;
  kind: string;
  code: string;
  name: string;
};

export type EntryListRow = {
  id: string;
  entryNumber: string;
  entryDate: string;
  referenceNumber: string | null;
  description: string | null;
  entryType: string;
  status: string;
  isManual: boolean;
  totalDebit: string;
  totalCredit: string;
  lineCount: number;
  baseCurrencyCode: string;
  createdBy: string | null;
  approvedBy: string | null;
};

/**
 * Accounts a line may actually post to.
 *
 * Only leaf accounts accept postings, which is why `is_postable` exists — a
 * balance on a parent is the sum of its children, so letting someone post to the
 * parent too would make the tree stop adding up.
 */
export async function listPostableAccounts(locale = "fa"): Promise<PostableAccount[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      code: string;
      name: string;
      level: number;
      normal_balance: string;
      requires_cost_center: boolean;
      requires_project: boolean;
      requires_party: boolean;
    }[]
  >`
    select id::text as id,
           code,
           coalesce(
             name_translations ->> ${locale},
             name_translations ->> 'fa',
             name_translations ->> 'en',
             code
           ) as name,
           level,
           normal_balance,
           requires_cost_center,
           requires_project,
           requires_party
      from accounting.accounts
     where is_postable and is_active and not is_blocked
     order by code
  `;

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    level: r.level,
    normalBalance: r.normal_balance,
    requiresCostCenter: r.requires_cost_center,
    requiresProject: r.requires_project,
    requiresParty: r.requires_party,
  }));
}

export async function listDimensions(locale = "fa"): Promise<DimensionOption[]> {
  await assertAccounting("read");

  const rows = await db<{ id: string; kind: string; code: string; name: string }[]>`
    select id::text as id,
           kind,
           code,
           coalesce(
             name_translations ->> ${locale},
             name_translations ->> 'fa',
             name_translations ->> 'en',
             code
           ) as name
      from accounting.dimensions
     where is_active
     order by kind, code
  `;

  return rows;
}

/** The journal — every document, newest first. */
export async function listEntries(
  filters: { status?: string; manualOnly?: boolean; limit?: number } = {}
): Promise<EntryListRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      entry_number: string;
      entry_date: string;
      reference_number: string | null;
      description: string | null;
      entry_type: string;
      status: string;
      is_manual: boolean;
      total_debit: string;
      total_credit: string;
      line_count: number;
      base_currency_code: string;
      created_by: string | null;
      approved_by: string | null;
    }[]
  >`
    select e.id::text as id,
           e.entry_number::text as entry_number,
           e.entry_date::date::text as entry_date,
           e.reference_number,
           e.description,
           e.entry_type,
           e.status,
           e.is_manual,
           coalesce(sum(l.base_debit_amount), 0)::text as total_debit,
           coalesce(sum(l.base_credit_amount), 0)::text as total_credit,
           count(l.id)::int as line_count,
           e.base_currency_code,
           cu.display_name as created_by,
           au.display_name as approved_by
      from accounting.journal_entries e
      left join accounting.journal_lines l on l.entry_id = e.id
      left join accounting.panel_users cu on cu.id = e.created_by
      left join accounting.panel_users au on au.id = e.approved_by
     where (${filters.status ?? null}::text is null or e.status = ${filters.status ?? null})
       and (${filters.manualOnly ?? false}::boolean is false or e.is_manual)
     group by e.id, cu.display_name, au.display_name
     order by e.entry_date desc, e.entry_number desc
     limit ${filters.limit ?? 200}
  `;

  return rows.map((r) => ({
    id: r.id,
    entryNumber: r.entry_number,
    entryDate: r.entry_date,
    referenceNumber: r.reference_number,
    description: r.description,
    entryType: r.entry_type,
    status: r.status,
    isManual: r.is_manual,
    totalDebit: r.total_debit,
    totalCredit: r.total_credit,
    lineCount: r.line_count,
    baseCurrencyCode: r.base_currency_code,
    createdBy: r.created_by,
    approvedBy: r.approved_by,
  }));
}

/**
 * Whether the books can accept a document dated today, and for how much longer.
 *
 * Production ran out of fiscal periods on 2026-08-01 and nothing said so until a
 * posting failed. This is surfaced on the entry screen so the next gap is visible
 * before it stops anyone working.
 */
export async function getPeriodCoverage(): Promise<{
  openPeriodsToday: number;
  coveredUntil: string | null;
  daysOfRunway: number;
}> {
  await assertAccounting("read");

  const [row] = await db<
    { open_periods_today: number; covered_until: string | null; days_of_runway: number }[]
  >`
    select open_periods_today::int,
           covered_until::text,
           days_of_runway::int
      from accounting.v_period_coverage
  `;

  return {
    openPeriodsToday: row?.open_periods_today ?? 0,
    coveredUntil: row?.covered_until ?? null,
    daysOfRunway: row?.days_of_runway ?? 0,
  };
}
