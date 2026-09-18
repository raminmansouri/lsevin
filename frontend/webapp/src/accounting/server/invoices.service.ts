import "server-only";

import { pickTranslatedName } from "@/accounting/lib/names";
import db from "@/config/database/db";

import { assertAccounting } from "./access";
import { getPanelUser } from "./panel-auth";
import { getBaseCurrency } from "./settings.repository";

/**
 * Purchase and sales invoices (فاکتور خرید و فروش).
 *
 * An invoice is the paperwork, not the books. It is raised as a draft, checked, and
 * then *issued* — and issuing is the only thing here that touches the ledger: it
 * writes one manual journal document and links the two together.
 *
 * That document is deliberately ordinary. It lands as a draft, carries is_manual,
 * and walks the same draft → temporary → approved → posted ladder with the same
 * four-eyes control as anything an accountant types. An invoice cannot put money in
 * the books on its own; someone still approves the document it produced.
 *
 * Which side is which:
 *
 *   sale      debit  the receivable account for the whole total
 *             credit each line's income account, and the tax account
 *
 *   purchase  debit  each line's expense/asset account, and the tax account
 *             credit the payable account for the whole total
 *
 * The counterparty is copied onto the lines as (party_type, party_id) when it is a
 * kind journal_lines accepts, which is what makes the invoice show up on
 * accounting.v_party_balances — the صورت‌حساب of that party.
 */

export class InvoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceError";
  }
}

export type InvoiceKind = "purchase" | "sale";
export type InvoiceStatus = "draft" | "issued" | "cancelled";

/** Party kinds accounting.journal_lines accepts. Anything else is name-only. */
export const PARTY_TYPES = ["user", "provider", "gateway", "platform"] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export type InvoiceLineInput = {
  description: string;
  quantity: string;
  unitPrice: string;
  accountId: string;
  costCenterId?: string | null;
  projectId?: string | null;
};

export type InvoiceInput = {
  kind: InvoiceKind;
  invoiceDate: string;
  dueDate?: string | null;
  partyName: string;
  partyType?: PartyType | null;
  partyId?: string | null;
  partyTaxId?: string | null;
  currencyCode?: string | null;
  counterpartyAccountId: string;
  taxAmount?: string | null;
  taxAccountId?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  lines: InvoiceLineInput[];
};

export type InvoiceLineRow = {
  id: string;
  lineNo: number;
  description: string;
  quantity: string;
  unitPrice: string;
  lineAmount: string;
  accountCode: string;
  accountName: string;
};

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  kind: InvoiceKind;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string | null;
  partyName: string;
  partyType: string | null;
  partyId: string | null;
  currencyCode: string;
  subtotalAmount: string;
  taxAmount: string;
  totalAmount: string;
  referenceNumber: string | null;
  description: string | null;
  counterpartyAccountCode: string;
  counterpartyAccountName: string;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  journalEntryStatus: string | null;
};

const MONEY = /^\d+(\.\d+)?$/;

function assertMoney(value: string, field: string) {
  if (!MONEY.test(value)) throw new InvoiceError(`${field} must be a non-negative number`);
}

/**
 * Multiplies without going through a float.
 *
 * The amounts are numeric(38,18) and travel as strings for that reason. A quantity
 * of 3 at 33,333,333.33 is a real invoice line, and Number() arithmetic on it loses
 * rials — which the ledger then refuses to balance against.
 */
function multiply(quantity: string, unitPrice: string): string {
  const scaleOf = (value: string) => (value.split(".")[1] ?? "").length;
  const digitsOf = (value: string) => BigInt(value.replace(".", ""));

  const scale = scaleOf(quantity) + scaleOf(unitPrice);
  const product = (digitsOf(quantity) * digitsOf(unitPrice)).toString().padStart(scale + 1, "0");

  if (scale === 0) return product;
  const whole = product.slice(0, product.length - scale);
  const fraction = product.slice(product.length - scale).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function add(a: string, b: string): string {
  const scale = Math.max((a.split(".")[1] ?? "").length, (b.split(".")[1] ?? "").length);
  const lift = (value: string) => {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(scale, "0"));
  };
  const sum = (lift(a) + lift(b)).toString().padStart(scale + 1, "0");
  if (scale === 0) return sum;
  const whole = sum.slice(0, sum.length - scale);
  const fraction = sum.slice(sum.length - scale).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function assertLines(lines: InvoiceLineInput[]) {
  if (lines.length === 0) throw new InvoiceError("An invoice needs at least one line");

  lines.forEach((line, index) => {
    const where = `Line ${index + 1}`;
    if (!line.description?.trim()) throw new InvoiceError(`${where} has no description`);
    if (!line.accountId) throw new InvoiceError(`${where} has no account`);
    assertMoney(line.quantity, `${where} quantity`);
    assertMoney(line.unitPrice, `${where} unit price`);
    if (Number(line.quantity) <= 0) throw new InvoiceError(`${where} has no quantity`);
  });
}

/** Raises an invoice as a draft. Nothing reaches the ledger until it is issued. */
export async function createInvoice(input: InvoiceInput): Promise<{ id: string; invoiceNumber: string }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new InvoiceError("Not signed in");

  if (!input.partyName?.trim()) throw new InvoiceError("The counterparty name is required");
  if (!input.counterpartyAccountId) throw new InvoiceError("The counterparty account is required");
  if (!input.invoiceDate) throw new InvoiceError("The invoice date is required");
  assertLines(input.lines);

  const tax = (input.taxAmount ?? "0").trim() || "0";
  assertMoney(tax, "Tax");
  if (Number(tax) > 0 && !input.taxAccountId) {
    throw new InvoiceError("A tax amount needs a tax account");
  }
  if ((input.partyType && !input.partyId) || (!input.partyType && input.partyId)) {
    throw new InvoiceError("A party type and a party id go together");
  }

  const currency = (input.currencyCode ?? "").trim() || (await getBaseCurrency());

  const subtotal = input.lines.reduce(
    (sum, line) => add(sum, multiply(line.quantity.trim(), line.unitPrice.trim())),
    "0"
  );
  const total = add(subtotal, tax);

  return db.begin(async (tx) => {
    const [invoice] = await tx<{ id: string; invoice_number: string }[]>`
      insert into accounting.invoices (
        kind, status, invoice_date, due_date, party_name, party_type, party_id,
        party_tax_id, currency_code, counterparty_account_id, tax_amount, tax_account_id,
        subtotal_amount, total_amount, description, reference_number, created_by
      ) values (
        ${input.kind}, 'draft', ${input.invoiceDate}, ${input.dueDate?.trim() || null},
        ${input.partyName.trim()}, ${input.partyType ?? null}, ${input.partyId ?? null},
        ${input.partyTaxId?.trim() || null}, ${currency}, ${input.counterpartyAccountId},
        ${tax}, ${input.taxAccountId || null},
        ${subtotal}, ${total},
        ${input.description?.trim() || null}, ${input.referenceNumber?.trim() || null},
        ${user.id}
      )
      returning id::text as id, invoice_number::text as invoice_number
    `;

    for (const [index, line] of input.lines.entries()) {
      await tx`
        insert into accounting.invoice_lines (
          invoice_id, line_no, description, quantity, unit_price,
          account_id, cost_center_id, project_id
        ) values (
          ${invoice.id}, ${index + 1}, ${line.description.trim()},
          ${line.quantity.trim()}, ${line.unitPrice.trim()},
          ${line.accountId}, ${line.costCenterId || null}, ${line.projectId || null}
        )
      `;
    }

    return { id: invoice.id, invoiceNumber: invoice.invoice_number };
  });
}

/**
 * Issues a draft invoice and posts the document it stands for.
 *
 * One transaction: the invoice becomes `issued` and the journal document exists, or
 * neither happened. An invoice that is issued without its document, or a document
 * with no invoice behind it, is precisely the state this whole table exists to
 * prevent.
 */
export async function issueInvoice(invoiceId: string): Promise<{ entryNumber: string }> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new InvoiceError("Not signed in");

  const baseCurrency = await getBaseCurrency();

  return db.begin(async (tx) => {
    const [invoice] = await tx<
      {
        id: string;
        invoice_number: string;
        kind: InvoiceKind;
        status: InvoiceStatus;
        invoice_date: string;
        party_name: string;
        party_type: string | null;
        party_id: string | null;
        currency_code: string;
        counterparty_account_id: string;
        tax_amount: string;
        tax_account_id: string | null;
        total_amount: string;
        description: string | null;
        reference_number: string | null;
      }[]
    >`
      select id::text as id, invoice_number::text as invoice_number, kind, status,
             invoice_date::text as invoice_date, party_name, party_type,
             party_id::text as party_id, currency_code,
             counterparty_account_id::text as counterparty_account_id,
             tax_amount::text as tax_amount, tax_account_id::text as tax_account_id,
             total_amount::text as total_amount, description, reference_number
        from accounting.invoices where id = ${invoiceId} for update
    `;
    if (!invoice) throw new InvoiceError("Invoice not found");
    if (invoice.status === "issued") throw new InvoiceError("This invoice is already issued");
    if (invoice.status === "cancelled") throw new InvoiceError("A cancelled invoice cannot be issued");

    const lines = await tx<
      { line_no: number; description: string; line_amount: string; account_id: string; cost_center_id: string | null; project_id: string | null }[]
    >`
      select line_no, description, line_amount::text as line_amount,
             account_id::text as account_id,
             cost_center_id::text as cost_center_id, project_id::text as project_id
        from accounting.invoice_lines where invoice_id = ${invoiceId} order by line_no
    `;
    if (lines.length === 0) throw new InvoiceError("This invoice has no lines");

    const [period] = await tx<{ id: string; lock_level: string }[]>`
      select id::text as id, lock_level from accounting.fiscal_periods
       where ${invoice.invoice_date}::date between starts_on and ends_on limit 1
    `;
    if (!period) {
      throw new InvoiceError(
        `No fiscal period covers ${invoice.invoice_date}. Open the period before issuing.`
      );
    }
    if (period.lock_level === "hard") {
      throw new InvoiceError(`The period covering ${invoice.invoice_date} is locked`);
    }

    // Every line is written with exchange_rate 1, so the base-currency snapshot the
    // ledger balances on is only right while the invoice is in the base currency.
    // The manual entry form has the same limit; rather than post a silently wrong
    // base amount, this refuses and says why.
    if (invoice.currency_code !== baseCurrency) {
      throw new InvoiceError(
        `This invoice is in ${invoice.currency_code}; only ${baseCurrency} invoices can be issued.`
      );
    }

    const isSale = invoice.kind === "sale";
    const label = isSale ? "فاکتور فروش" : "فاکتور خرید";
    const description =
      invoice.description?.trim() ||
      `${label} ${invoice.invoice_number} — ${invoice.party_name}`;

    const [entry] = await tx<{ id: string; entry_number: string }[]>`
      insert into accounting.journal_entries (
        fiscal_period_id, entry_date, description, status, entry_type,
        reference_number, source_type, source_id, idempotency_key,
        base_currency_code, is_manual, created_by, submitted_by
      ) values (
        ${period.id}, ${invoice.invoice_date}, ${description}, 'draft', 'general',
        ${invoice.reference_number?.trim() || `INV-${invoice.invoice_number}`},
        'invoice', ${invoice.id}, ${`invoice-${invoice.id}`},
        ${baseCurrency}, true, ${user.id}, ${user.id}
      )
      returning id::text as id, entry_number::text as entry_number
    `;

    // The counterparty side first, so the document reads the way the paperwork does:
    // what is owed, then what it is owed for.
    let lineNo = 1;
    await tx`
      insert into accounting.journal_lines (
        entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
        base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
        memo, party_type, party_id
      ) values (
        ${entry.id}, ${lineNo}, ${invoice.counterparty_account_id}, ${invoice.currency_code},
        ${isSale ? invoice.total_amount : "0"}, ${isSale ? "0" : invoice.total_amount},
        ${baseCurrency},
        ${isSale ? invoice.total_amount : "0"}, ${isSale ? "0" : invoice.total_amount},
        1, ${invoice.party_name},
        ${invoice.party_type}, ${invoice.party_id}
      )
    `;

    for (const line of lines) {
      lineNo += 1;
      await tx`
        insert into accounting.journal_lines (
          entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
          base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
          memo, cost_center_id, project_id, party_type, party_id
        ) values (
          ${entry.id}, ${lineNo}, ${line.account_id}, ${invoice.currency_code},
          ${isSale ? "0" : line.line_amount}, ${isSale ? line.line_amount : "0"},
          ${baseCurrency},
          ${isSale ? "0" : line.line_amount}, ${isSale ? line.line_amount : "0"},
          1, ${line.description}, ${line.cost_center_id}, ${line.project_id},
          ${invoice.party_type}, ${invoice.party_id}
        )
      `;
    }

    if (Number(invoice.tax_amount) > 0 && invoice.tax_account_id) {
      lineNo += 1;
      await tx`
        insert into accounting.journal_lines (
          entry_id, line_no, account_id, currency_code, debit_amount, credit_amount,
          base_currency_code, base_debit_amount, base_credit_amount, exchange_rate,
          memo, party_type, party_id
        ) values (
          ${entry.id}, ${lineNo}, ${invoice.tax_account_id}, ${invoice.currency_code},
          ${isSale ? "0" : invoice.tax_amount}, ${isSale ? invoice.tax_amount : "0"},
          ${baseCurrency},
          ${isSale ? "0" : invoice.tax_amount}, ${isSale ? invoice.tax_amount : "0"},
          1, 'مالیات بر ارزش افزوده',
          ${invoice.party_type}, ${invoice.party_id}
        )
      `;
    }

    await tx`
      update accounting.invoices
         set status = 'issued', journal_entry_id = ${entry.id},
             issued_by = ${user.id}, issued_at = now(), updated_at = now()
       where id = ${invoiceId}
    `;

    return { entryNumber: entry.entry_number };
  });
}

/**
 * Cancels an issued invoice.
 *
 * The invoice stays; only its status moves, because a number that was handed to a
 * counterparty must never be reused or made to disappear. The document it posted is
 * left alone on purpose — if it is still a draft, delete it from the journal screen;
 * if it is already in the books, it is corrected with a reversing entry.
 */
export async function cancelInvoice(invoiceId: string, reason: string): Promise<void> {
  await assertAccounting("operate");
  const user = await getPanelUser();
  if (!user) throw new InvoiceError("Not signed in");

  await db.begin(async (tx) => {
    const [invoice] = await tx<{ status: InvoiceStatus }[]>`
      select status from accounting.invoices where id = ${invoiceId} for update
    `;
    if (!invoice) throw new InvoiceError("Invoice not found");
    if (invoice.status === "cancelled") throw new InvoiceError("This invoice is already cancelled");

    await tx`
      update accounting.invoices
         set status = 'cancelled', cancelled_by = ${user.id}, cancelled_at = now(),
             cancel_reason = ${reason.trim() || null}, updated_at = now()
       where id = ${invoiceId}
    `;
  });
}

/** Deletes a draft invoice. An issued one is cancelled, never removed. */
export async function deleteDraftInvoice(invoiceId: string): Promise<void> {
  await assertAccounting("operate");

  await db.begin(async (tx) => {
    const [invoice] = await tx<{ status: InvoiceStatus }[]>`
      select status from accounting.invoices where id = ${invoiceId} for update
    `;
    if (!invoice) throw new InvoiceError("Invoice not found");
    if (invoice.status !== "draft") {
      throw new InvoiceError(`A ${invoice.status} invoice cannot be deleted; cancel it instead`);
    }
    await tx`delete from accounting.invoices where id = ${invoiceId}`;
  });
}

export async function listInvoices(
  filters: { kind?: InvoiceKind; status?: InvoiceStatus; limit?: number } = {},
  locale = "fa"
): Promise<InvoiceRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      invoice_number: string;
      kind: InvoiceKind;
      status: InvoiceStatus;
      invoice_date: string;
      due_date: string | null;
      party_name: string;
      party_type: string | null;
      party_id: string | null;
      currency_code: string;
      subtotal_amount: string;
      tax_amount: string;
      total_amount: string;
      reference_number: string | null;
      description: string | null;
      counterparty_account_code: string;
      counterparty_account_name: Record<string, string> | null;
      journal_entry_id: string | null;
      journal_entry_number: string | null;
      journal_entry_status: string | null;
    }[]
  >`
    select id::text as id,
           invoice_number::text as invoice_number,
           kind, status,
           invoice_date::text as invoice_date,
           due_date::text as due_date,
           party_name, party_type, party_id::text as party_id,
           currency_code,
           subtotal_amount::text as subtotal_amount,
           tax_amount::text as tax_amount,
           total_amount::text as total_amount,
           reference_number, description,
           counterparty_account_code, counterparty_account_name,
           journal_entry_id::text as journal_entry_id,
           journal_entry_number::text as journal_entry_number,
           journal_entry_status
      from accounting.v_invoice_statement
     where (${filters.kind ?? null}::text is null or kind = ${filters.kind ?? null})
       and (${filters.status ?? null}::text is null or status = ${filters.status ?? null})
     order by invoice_date desc, invoice_number desc
     limit ${filters.limit ?? 200}
  `;

  return rows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoice_number,
    kind: r.kind,
    status: r.status,
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    partyName: r.party_name,
    partyType: r.party_type,
    partyId: r.party_id,
    currencyCode: r.currency_code,
    subtotalAmount: r.subtotal_amount,
    taxAmount: r.tax_amount,
    totalAmount: r.total_amount,
    referenceNumber: r.reference_number,
    description: r.description,
    counterpartyAccountCode: r.counterparty_account_code,
    counterpartyAccountName: pickTranslatedName(
      r.counterparty_account_name,
      locale,
      r.counterparty_account_code
    ),
    journalEntryId: r.journal_entry_id,
    journalEntryNumber: r.journal_entry_number,
    journalEntryStatus: r.journal_entry_status,
  }));
}

/** The lines of one invoice, for the row that expands on the list. */
export async function listInvoiceLines(invoiceId: string, locale = "fa"): Promise<InvoiceLineRow[]> {
  await assertAccounting("read");

  const rows = await db<
    {
      id: string;
      line_no: number;
      description: string;
      quantity: string;
      unit_price: string;
      line_amount: string;
      account_code: string;
      account_name: Record<string, string> | null;
    }[]
  >`
    select il.id::text as id, il.line_no, il.description,
           il.quantity::text as quantity, il.unit_price::text as unit_price,
           il.line_amount::text as line_amount,
           a.code as account_code, a.name_translations as account_name
      from accounting.invoice_lines il
      join accounting.accounts a on a.id = il.account_id
     where il.invoice_id = ${invoiceId}
     order by il.line_no
  `;

  return rows.map((r) => ({
    id: r.id,
    lineNo: r.line_no,
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    lineAmount: r.line_amount,
    accountCode: r.account_code,
    accountName: pickTranslatedName(r.account_name, locale, r.account_code),
  }));
}
