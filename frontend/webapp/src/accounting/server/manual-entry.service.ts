import "server-only";

import type { TransactionSql } from "postgres";

import db from "@/config/database/db";

import { assertAccounting } from "./access";
import { getPanelUser } from "./panel-auth";
import { getBaseCurrency } from "./settings.repository";

/**
 * Manual journal entries — the accountant-facing half of the ledger.
 *
 * ledger.service.ts posts documents that the *system* originates: a deposit
 * settles, a withdrawal is approved, and one balanced entry is written in the
 * same transaction. Those are born final and never edited.
 *
 * A document typed by a person is a different object. It exists before it is
 * correct: one side gets entered, an invoice is looked up, a line is deleted, and
 * only at the end does it balance and become fit to post. This module owns that
 * lifecycle:
 *
 *   draft ──▶ temporary ──▶ approved ──▶ posted
 *     │            │            │
 *     └── editable ┘         rejected
 *
 * The database enforces the parts that must never be bypassed — balance on
 * commit, required dimensions, blocked accounts, period locks, immutability once
 * committed (0014). This module enforces *who* may move a document along, and
 * makes the transitions atomic.
 */

// postgres.js overloads `begin`, so deriving the callback argument from it resolves
// to `never`. ledger.service.ts hit this first; use the exported type directly.
type Tx = TransactionSql<Record<string, never>>;

export type EntryStatus = "draft" | "temporary" | "approved" | "posted" | "reversed" | "rejected";

export type EntryType =
  | "general"
  | "receipt"
  | "payment"
  | "provider_settlement"
  | "patient_refund"
  | "fx_revaluation"
  | "opening"
  | "closing"
  | "adjustment";

export type ManualLineInput = {
  accountId: string;
  debit: string;
  credit: string;
  currencyCode?: string;
  exchangeRate?: string;
  memo?: string | null;
  costCenterId?: string | null;
  projectId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  partyType?: string | null;
  partyId?: string | null;
};

export type ManualEntryInput = {
  entryDate: string;
  description: string;
  entryType?: EntryType;
  referenceNumber?: string | null;
  lines: ManualLineInput[];
};

export class ManualEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualEntryError";
  }
}

/** Statuses a document may still be edited in. Mirrors fn_status_is_editable. */
const EDITABLE: EntryStatus[] = ["draft", "temporary"];

/**
 * Which transitions are legal, and which capability each one demands.
 *
 * Kept as data rather than a chain of ifs so the whole workflow — including who
 * is allowed to do what — is readable in one place. `operate` covers an
 * accountant; `configure` is the finance admin who may approve and finalise.
 * Approving your own document is refused separately below.
 */
const TRANSITIONS: Record<string, { to: EntryStatus; capability: "operate" | "configure" }> = {
  "draft>temporary": { to: "temporary", capability: "operate" },
  "temporary>draft": { to: "draft", capability: "operate" },
  "temporary>approved": { to: "approved", capability: "configure" },
  "temporary>rejected": { to: "rejected", capability: "configure" },
  "approved>posted": { to: "posted", capability: "configure" },
  "approved>temporary": { to: "temporary", capability: "configure" },
};

function assertMoney(value: string, field: string) {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new ManualEntryError(`${field} must be a non-negative number`);
  }
}

/**
 * A line carries an amount on exactly one side.
 *
 * A row with both filled is almost always a typo, and one with neither is an
 * empty row the user forgot to delete. Rejecting both here keeps the ledger from
 * having to interpret intent later.
 */
function assertLine(line: ManualLineInput, index: number) {
  const where = `Line ${index + 1}`;
  assertMoney(line.debit, `${where} debit`);
  assertMoney(line.credit, `${where} credit`);

  const debit = Number(line.debit);
  const credit = Number(line.credit);

  if (debit > 0 && credit > 0) {
    throw new ManualEntryError(`${where} has both a debit and a credit; use two lines`);
  }
  if (debit === 0 && credit === 0) {
    throw new ManualEntryError(`${where} has no amount`);
  }
  if (!line.accountId) {
    throw new ManualEntryError(`${where} has no account`);
  }
}

/**
 * Creates a manual document as a draft.
 *
 * Deliberately does NOT require the lines to balance: that is the whole reason
 * this path exists. The database refuses to let it leave the editable states
 * unbalanced, which is where the rule belongs.
 */
export async function createManualEntry(input: ManualEntryInput): Promise<{ id: string; entryNumber: string }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new ManualEntryError("Not signed in");

  if (!input.description?.trim()) {
    throw new ManualEntryError("A document needs a description");
  }
  input.lines.forEach(assertLine);

  const baseCurrency = await getBaseCurrency();

  return db.begin(async (tx) => {
    const [period] = await tx<{ id: string; lock_level: string }[]>`
      select id::text as id, lock_level
        from accounting.fiscal_periods
       where ${input.entryDate}::date between starts_on and ends_on
       limit 1
    `;
    if (!period) {
      throw new ManualEntryError(
        `No fiscal period covers ${input.entryDate}. Open the period before entering documents for it.`
      );
    }
    if (period.lock_level === "hard") {
      throw new ManualEntryError(`The period covering ${input.entryDate} is locked`);
    }

    const [entry] = await tx<{ id: string; entry_number: string }[]>`
      insert into accounting.journal_entries (
        fiscal_period_id, entry_date, description, status, entry_type, reference_number,
        source_type, idempotency_key, base_currency_code, is_manual, created_by, submitted_by
      ) values (
        ${period.id}, ${input.entryDate}, ${input.description.trim()}, 'draft',
        ${input.entryType ?? "general"}, ${input.referenceNumber?.trim() || null},
        'manual', ${`manual-${crypto.randomUUID()}`}, ${baseCurrency}, true,
        ${user.id}, ${user.id}
      )
      returning id::text as id, entry_number::text as entry_number
    `;

    await insertLines(tx, entry.id, input.lines, baseCurrency);

    return { id: entry.id, entryNumber: entry.entry_number };
  });
}

/** Replaces every line of an editable document. */
export async function replaceManualEntryLines(entryId: string, lines: ManualLineInput[]): Promise<void> {
  await assertAccounting("operate");
  lines.forEach(assertLine);
  const baseCurrency = await getBaseCurrency();

  await db.begin(async (tx) => {
    const [entry] = await tx<{ status: EntryStatus }[]>`
      select status from accounting.journal_entries where id = ${entryId} for update
    `;
    if (!entry) throw new ManualEntryError("Document not found");
    if (!EDITABLE.includes(entry.status)) {
      throw new ManualEntryError(`A ${entry.status} document cannot be edited`);
    }

    await tx`delete from accounting.journal_lines where entry_id = ${entryId}`;
    await insertLines(tx, entryId, lines, baseCurrency);
  });
}

async function insertLines(
  tx: Tx,
  entryId: string,
  lines: ManualLineInput[],
  baseCurrency: string
) {
  for (const [index, line] of lines.entries()) {
    const rate = line.exchangeRate ?? "1";
    const currency = line.currencyCode ?? baseCurrency;

    // The base amounts are what every report sums, so they are computed once here
    // rather than being recalculated per query against a rate that may have moved.
    const baseDebit = (Number(line.debit) * Number(rate)).toString();
    const baseCredit = (Number(line.credit) * Number(rate)).toString();

    await tx`
      insert into accounting.journal_lines (
        entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
        base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
        memo, cost_center_id, project_id, branch_id, department_id, party_type, party_id
      ) values (
        ${entryId}, ${index + 1}, ${line.accountId}, ${currency},
        ${line.debit}, ${line.credit},
        ${baseCurrency}, ${baseDebit}, ${baseCredit}, ${rate},
        ${line.memo ?? null}, ${line.costCenterId ?? null}, ${line.projectId ?? null},
        ${line.branchId ?? null}, ${line.departmentId ?? null},
        ${line.partyType ?? null}, ${line.partyId ?? null}
      )
    `;
  }
}

/**
 * Moves a document one step along the workflow.
 *
 * Every financial guard — balance, dimensions, blocked accounts, period lock —
 * is a deferred database constraint, so it fires when this transaction commits.
 * That is intentional: the rules cannot be skipped by writing a different code
 * path, only by changing the schema.
 */
export async function transitionEntry(
  entryId: string,
  to: EntryStatus,
  options: { reason?: string } = {}
): Promise<void> {
  const user = await getPanelUser();
  if (!user) throw new ManualEntryError("Not signed in");

  await db.begin(async (tx) => {
    const [entry] = await tx<
      { status: EntryStatus; created_by: string | null; is_manual: boolean }[]
    >`
      select status, created_by::text as created_by, is_manual
        from accounting.journal_entries
       where id = ${entryId}
       for update
    `;
    if (!entry) throw new ManualEntryError("Document not found");
    if (!entry.is_manual) {
      throw new ManualEntryError("Automatic documents are not part of the approval workflow");
    }

    const rule = TRANSITIONS[`${entry.status}>${to}`];
    if (!rule) {
      throw new ManualEntryError(`A ${entry.status} document cannot become ${to}`);
    }
    await assertAccounting(rule.capability);

    // Four-eyes: whoever wrote the document is not the one who blesses it. This is
    // the control that makes the approval step mean anything at all.
    if ((to === "approved" || to === "posted") && entry.created_by === user.id) {
      throw new ManualEntryError("A document must be approved by someone other than its author");
    }

    if (to === "approved") {
      await tx`
        update accounting.journal_entries
           set status = 'approved', approved_by = ${user.id}, approved_at = now()
         where id = ${entryId}
      `;
    } else if (to === "posted") {
      await tx`
        update accounting.journal_entries
           set status = 'posted', posted_by = ${user.id}, posted_at = now()
         where id = ${entryId}
      `;
    } else if (to === "rejected") {
      await tx`
        update accounting.journal_entries
           set status = 'rejected', rejected_by = ${user.id}, rejected_at = now(),
               rejection_reason = ${options.reason ?? null}
         where id = ${entryId}
      `;
    } else {
      await tx`update accounting.journal_entries set status = ${to} where id = ${entryId}`;
    }
  });
}

/**
 * Copies a document into a new draft.
 *
 * Records the lineage so "where did this come from" is answerable, and never
 * copies the reference number — the whole point of شماره عطف is that one piece of
 * paper is entered once.
 */
export async function copyEntry(entryId: string): Promise<{ id: string; entryNumber: string }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new ManualEntryError("Not signed in");

  return db.begin(async (tx) => {
    const [source] = await tx<
      { description: string; entry_type: string; base_currency_code: string }[]
    >`
      select description, entry_type, base_currency_code
        from accounting.journal_entries where id = ${entryId}
    `;
    if (!source) throw new ManualEntryError("Document not found");

    const [period] = await tx<{ id: string }[]>`
      select id::text as id from accounting.fiscal_periods
       where current_date between starts_on and ends_on and lock_level <> 'hard'
       limit 1
    `;
    if (!period) throw new ManualEntryError("No open fiscal period covers today");

    const [copy] = await tx<{ id: string; entry_number: string }[]>`
      insert into accounting.journal_entries (
        fiscal_period_id, entry_date, description, status, entry_type,
        source_type, idempotency_key, base_currency_code, is_manual,
        created_by, submitted_by, copied_from_entry_id
      ) values (
        ${period.id}, current_date, ${source.description}, 'draft', ${source.entry_type},
        'manual', ${`manual-${crypto.randomUUID()}`}, ${source.base_currency_code}, true,
        ${user.id}, ${user.id}, ${entryId}
      )
      returning id::text as id, entry_number::text as entry_number
    `;

    await tx`
      insert into accounting.journal_lines (
        entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
        base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
        memo, cost_center_id, project_id, branch_id, department_id, party_type, party_id
      )
      select ${copy.id}, line_no, account_id, currency_code, debit_amount, credit_amount,
             base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
             memo, cost_center_id, project_id, branch_id, department_id, party_type, party_id
        from accounting.journal_lines
       where entry_id = ${entryId}
       order by line_no
    `;

    return { id: copy.id, entryNumber: copy.entry_number };
  });
}

/** Deletes a document that never entered the books. */
export async function deleteDraft(entryId: string): Promise<void> {
  await assertAccounting("operate");

  await db.begin(async (tx) => {
    const [entry] = await tx<{ status: EntryStatus }[]>`
      select status from accounting.journal_entries where id = ${entryId} for update
    `;
    if (!entry) throw new ManualEntryError("Document not found");
    if (entry.status !== "draft") {
      // Anything past draft has been seen by someone else; it is superseded with a
      // reversing entry, never removed, so the history stays readable.
      throw new ManualEntryError(`A ${entry.status} document cannot be deleted`);
    }
    await tx`delete from accounting.journal_lines where entry_id = ${entryId}`;
    await tx`delete from accounting.journal_entries where id = ${entryId}`;
  });
}
