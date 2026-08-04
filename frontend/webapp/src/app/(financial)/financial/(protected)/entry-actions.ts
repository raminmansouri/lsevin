"use server";

import { revalidatePath } from "next/cache";

import {
  ManualEntryError,
  copyEntry,
  createManualEntry,
  deleteDraft,
  transitionEntry,
  type EntryStatus,
  type ManualLineInput,
} from "@/accounting/server/manual-entry.service";

/**
 * Manual journal entry actions.
 *
 * Every export of a `"use server"` module is a public POST endpoint reachable by
 * action id, not by URL. The service each of these calls begins with
 * assertAccounting(...) — that is the authorization boundary, not this file, and
 * it is why a read-only auditor cannot post a document by replaying a form.
 */

export type EntryFormState = { error?: string; ok?: string; entryNumber?: string };

/**
 * Pulls the line grid out of the form.
 *
 * The form posts parallel arrays (`line-account[]`, `line-debit[]`, …) because a
 * dynamic row count cannot be expressed as fixed field names. Rows the user left
 * completely blank are dropped rather than rejected: an empty trailing row is a
 * normal state of a grid someone is still typing into, not an error worth
 * throwing their work away for.
 */
function readLines(formData: FormData): ManualLineInput[] {
  const accounts = formData.getAll("line-account").map(String);
  const debits = formData.getAll("line-debit").map(String);
  const credits = formData.getAll("line-credit").map(String);
  const memos = formData.getAll("line-memo").map(String);
  const costCenters = formData.getAll("line-cost-center").map(String);
  const projects = formData.getAll("line-project").map(String);

  const lines: ManualLineInput[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]?.trim();
    const debit = (debits[i] ?? "").trim();
    const credit = (credits[i] ?? "").trim();

    if (!account && !debit && !credit) continue;

    lines.push({
      accountId: account,
      debit: debit || "0",
      credit: credit || "0",
      memo: memos[i]?.trim() || null,
      costCenterId: costCenters[i]?.trim() || null,
      projectId: projects[i]?.trim() || null,
    });
  }

  return lines;
}

export async function createEntryAction(
  _prev: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  try {
    const lines = readLines(formData);
    if (lines.length < 2) {
      return { error: "یک سند حداقل به دو ردیف نیاز دارد." };
    }

    const result = await createManualEntry({
      entryDate: String(formData.get("entry-date") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      entryType: (String(formData.get("entry-type") ?? "general") || "general") as never,
      referenceNumber: String(formData.get("reference-number") ?? "").trim() || null,
      lines,
    });

    revalidatePath("/financial/entries");
    revalidatePath("/financial/journal");
    return { ok: "سند به‌عنوان پیش‌نویس ذخیره شد.", entryNumber: result.entryNumber };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function transitionEntryAction(
  _prev: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  try {
    await transitionEntry(
      String(formData.get("entry-id") ?? ""),
      String(formData.get("to") ?? "") as EntryStatus,
      { reason: String(formData.get("reason") ?? "").trim() || undefined }
    );
    revalidatePath("/financial/entries");
    revalidatePath("/financial/journal");
    return { ok: "وضعیت سند به‌روزرسانی شد." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function copyEntryAction(
  _prev: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  try {
    const result = await copyEntry(String(formData.get("entry-id") ?? ""));
    revalidatePath("/financial/entries");
    return { ok: "رونوشت سند ساخته شد.", entryNumber: result.entryNumber };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteDraftAction(
  _prev: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  try {
    await deleteDraft(String(formData.get("entry-id") ?? ""));
    revalidatePath("/financial/entries");
    return { ok: "پیش‌نویس حذف شد." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

/**
 * Turns an error into something an accountant can act on.
 *
 * The database raises the financial refusals ("unbalanced in IRR", "requires a
 * cost centre"), and those messages name the actual problem, so they are worth
 * showing. Anything else is left generic rather than leaking internals to the
 * screen.
 */
function messageFor(error: unknown): string {
  if (error instanceof ManualEntryError) return error.message;

  const raw = error instanceof Error ? error.message : "";

  if (/unbalanced in base currency/i.test(raw)) {
    return "سند در ارز پایه تراز نیست؛ نرخ تبدیل ردیف‌ها را بررسی کنید.";
  }
  if (/unbalanced/i.test(raw)) {
    return "جمع بدهکار و بستانکار برابر نیست؛ سند تراز نشده است.";
  }
  if (/has no lines/i.test(raw)) {
    return "سند هیچ ردیفی ندارد.";
  }
  if (/requires a cost centre/i.test(raw)) {
    return "یکی از حساب‌ها مرکز هزینه اجباری دارد و خالی مانده است.";
  }
  if (/requires a project/i.test(raw)) {
    return "یکی از حساب‌ها پروژهٔ اجباری دارد و خالی مانده است.";
  }
  if (/requires a party/i.test(raw)) {
    return "یکی از حساب‌ها طرف حساب اجباری دارد و خالی مانده است.";
  }
  if (/is blocked/i.test(raw)) {
    return "یکی از حساب‌های انتخابی مسدود است و سند نمی‌پذیرد.";
  }
  if (/hard-locked/i.test(raw)) {
    return "دورهٔ مالی این تاریخ قفل است.";
  }
  if (/append-only/i.test(raw)) {
    return "سند قطعی‌شده قابل تغییر نیست؛ برای اصلاح، سند معکوس بزنید.";
  }
  if (/duplicate key|ux_accounting_entries_reference/i.test(raw)) {
    return "این شماره عطف قبلاً در همین دوره ثبت شده است.";
  }

  console.error("manual entry action failed", error);
  return "ثبت سند انجام نشد.";
}
