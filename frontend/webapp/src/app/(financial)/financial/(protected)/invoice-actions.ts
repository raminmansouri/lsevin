"use server";

import { revalidatePath } from "next/cache";

import { AccountingAccessError } from "@/accounting/server/access";
import {
  InvoiceError,
  cancelInvoice,
  createInvoice,
  deleteDraftInvoice,
  issueInvoice,
  type InvoiceKind,
  type InvoiceLineInput,
  type PartyType,
} from "@/accounting/server/invoices.service";

/**
 * Purchase and sales invoice actions.
 *
 * Every export of a `"use server"` module is a public POST endpoint reachable by
 * action id, not by URL. The service each of these calls begins with
 * assertAccounting("operate") — that is the authorization boundary, not this file.
 */

export type InvoiceFormState = { error?: string; ok?: string; invoiceNumber?: string };

const PARTY_TYPES = new Set(["user", "provider", "gateway", "platform"]);

/**
 * Pulls the line grid out of the form.
 *
 * Parallel arrays, the same shape the journal entry form posts, because a dynamic
 * row count cannot be expressed as fixed field names. A row left completely blank is
 * dropped rather than rejected — an empty trailing row is a normal state of a grid
 * someone is still typing into.
 */
function readLines(formData: FormData): InvoiceLineInput[] {
  const descriptions = formData.getAll("line-description").map(String);
  const quantities = formData.getAll("line-quantity").map(String);
  const prices = formData.getAll("line-price").map(String);
  const accounts = formData.getAll("line-account").map(String);
  const costCenters = formData.getAll("line-cost-center").map(String);
  const projects = formData.getAll("line-project").map(String);

  const lines: InvoiceLineInput[] = [];

  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]?.trim() ?? "";
    const price = (prices[i] ?? "").trim();
    const account = accounts[i]?.trim() ?? "";

    if (!description && !price && !account) continue;

    lines.push({
      description,
      quantity: (quantities[i] ?? "").trim() || "1",
      unitPrice: price || "0",
      accountId: account,
      costCenterId: costCenters[i]?.trim() || null,
      projectId: projects[i]?.trim() || null,
    });
  }

  return lines;
}

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  try {
    const partyType = String(formData.get("party-type") ?? "").trim();
    const partyId = String(formData.get("party-id") ?? "").trim();

    const result = await createInvoice({
      kind: (String(formData.get("kind") ?? "sale") || "sale") as InvoiceKind,
      invoiceDate: String(formData.get("invoice-date") ?? "").trim(),
      dueDate: String(formData.get("due-date") ?? "").trim() || null,
      partyName: String(formData.get("party-name") ?? "").trim(),
      // Both or neither: the ledger's own party columns are constrained that way.
      partyType: PARTY_TYPES.has(partyType) && partyId ? (partyType as PartyType) : null,
      partyId: PARTY_TYPES.has(partyType) && partyId ? partyId : null,
      partyTaxId: String(formData.get("party-tax-id") ?? "").trim() || null,
      counterpartyAccountId: String(formData.get("counterparty-account") ?? "").trim(),
      taxAmount: String(formData.get("tax-amount") ?? "").trim() || "0",
      taxAccountId: String(formData.get("tax-account") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      referenceNumber: String(formData.get("reference-number") ?? "").trim() || null,
      lines: readLines(formData),
    });

    revalidateInvoices();
    return { ok: "فاکتور به‌عنوان پیش‌نویس ذخیره شد.", invoiceNumber: result.invoiceNumber };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function issueInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  try {
    const { entryNumber } = await issueInvoice(String(formData.get("invoice-id") ?? ""));
    revalidateInvoices();
    return { ok: `فاکتور صادر شد و سند ${entryNumber} به‌صورت پیش‌نویس ثبت گردید.` };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function cancelInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  try {
    await cancelInvoice(
      String(formData.get("invoice-id") ?? ""),
      String(formData.get("reason") ?? "")
    );
    revalidateInvoices();
    return { ok: "فاکتور ابطال شد." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  try {
    await deleteDraftInvoice(String(formData.get("invoice-id") ?? ""));
    revalidateInvoices();
    return { ok: "پیش‌نویس فاکتور حذف شد." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

function revalidateInvoices() {
  revalidatePath("/financial/invoices");
  revalidatePath("/financial/entries");
  revalidatePath("/financial/journal");
}

/** Turns a refusal into a sentence an accountant can act on, in the panel's language. */
function messageFor(error: unknown): string {
  if (error instanceof AccountingAccessError) {
    return "حساب شما اجازهٔ صدور فاکتور را ندارد.";
  }

  const raw = error instanceof Error ? error.message : "";

  if (/at least one line/i.test(raw)) return "فاکتور حداقل به یک ردیف نیاز دارد.";
  if (/counterparty name is required/i.test(raw)) return "نام طرف حساب اجباری است.";
  if (/counterparty account is required/i.test(raw)) return "حساب طرف حساب را انتخاب کنید.";
  if (/invoice date is required/i.test(raw)) return "تاریخ فاکتور اجباری است.";
  if (/tax amount needs a tax account/i.test(raw)) return "برای مبلغ مالیات باید حساب مالیات انتخاب شود.";
  if (/party type and a party id go together/i.test(raw)) {
    return "برای اتصال به صورت‌حساب، هم نوع طرف حساب و هم شناسهٔ او لازم است.";
  }
  if (/only .* invoices can be issued/i.test(raw)) {
    const currency = raw.match(/only (\w+) invoices/i)?.[1] ?? "";
    return `فعلاً فقط فاکتور به ارز پایه (${currency}) قابل صدور است.`;
  }
  if (/already issued/i.test(raw)) return "این فاکتور قبلاً صادر شده است.";
  if (/already cancelled/i.test(raw)) return "این فاکتور قبلاً ابطال شده است.";
  if (/cancelled invoice cannot be issued/i.test(raw)) return "فاکتور ابطال‌شده صادر نمی‌شود.";
  if (/cannot be deleted; cancel it instead/i.test(raw)) {
    return "فاکتور صادرشده حذف نمی‌شود؛ آن را ابطال کنید.";
  }
  if (/Invoice not found/i.test(raw)) return "فاکتور پیدا نشد.";
  if (/has no lines/i.test(raw)) return "این فاکتور هیچ ردیفی ندارد.";
  if (/No fiscal period covers/i.test(raw)) {
    return "برای تاریخ این فاکتور دورهٔ مالی تعریف نشده است؛ ابتدا دوره را بسازید.";
  }
  if (/period covering .* is locked/i.test(raw)) return "دورهٔ مالی این تاریخ قفل است.";
  if (/Not signed in/i.test(raw)) return "نشست شما منقضی شده است؛ دوباره وارد شوید.";
  if (/^Line \d+ /i.test(raw)) {
    const row = raw.match(/^Line (\d+)/i)?.[1] ?? "";
    if (/no description/i.test(raw)) return `ردیف ${row} شرح ندارد.`;
    if (/no account/i.test(raw)) return `ردیف ${row} حساب ندارد.`;
    if (/no quantity/i.test(raw)) return `تعداد ردیف ${row} باید بزرگ‌تر از صفر باشد.`;
    return `مقدار ردیف ${row} معتبر نیست.`;
  }
  if (/must be a non-negative number/i.test(raw)) return "مبلغ واردشده معتبر نیست.";
  if (/is blocked/i.test(raw)) return "یکی از حساب‌های انتخابی مسدود است.";
  if (/requires a cost centre/i.test(raw)) return "یکی از حساب‌ها مرکز هزینه اجباری دارد.";
  if (/requires a project/i.test(raw)) return "یکی از حساب‌ها پروژهٔ اجباری دارد.";
  if (/duplicate key/i.test(raw)) return "این فاکتور قبلاً ثبت شده است.";

  if (error instanceof InvoiceError) return raw;

  console.error("invoice action failed", error);
  return "عملیات فاکتور انجام نشد.";
}
