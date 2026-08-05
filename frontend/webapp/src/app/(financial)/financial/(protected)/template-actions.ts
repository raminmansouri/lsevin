"use server";

import { revalidatePath } from "next/cache";

import {
  TemplateError,
  applyTemplate,
  createSchedule,
  createTemplate,
  runDueSchedules,
  setScheduleActive,
  setTemplateActive,
  type Frequency,
} from "@/accounting/server/templates.service";

/**
 * Template and schedule actions.
 *
 * Every export is a public POST endpoint reachable by action id; the services
 * each open with assertAccounting(...), which is the real boundary.
 */
export type TemplateActionState = { error?: string; ok?: string };

function message(error: unknown, fallback: string): string {
  if (error instanceof TemplateError) return error.message;
  const raw = error instanceof Error ? error.message : "";
  if (/duplicate key/i.test(raw)) return "این کد قبلاً ثبت شده است.";
  if (/unbalanced/i.test(raw)) return "الگو تراز نیست.";
  console.error(fallback, error);
  return fallback;
}

/** Reads the template line grid, dropping rows the user left entirely blank. */
function readTemplateLines(formData: FormData) {
  const accounts = formData.getAll("tl-account").map(String);
  const sides = formData.getAll("tl-side").map(String);
  const amounts = formData.getAll("tl-amount").map(String);
  const memos = formData.getAll("tl-memo").map(String);

  const lines: { accountId: string; side: "debit" | "credit"; amount?: string | null; memo?: string | null }[] = [];
  for (let i = 0; i < accounts.length; i++) {
    const accountId = accounts[i]?.trim();
    if (!accountId) continue;
    lines.push({
      accountId,
      side: (sides[i] === "credit" ? "credit" : "debit"),
      amount: amounts[i]?.trim() || null,
      memo: memos[i]?.trim() || null,
    });
  }
  return lines;
}

export async function createTemplateAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    await createTemplate({
      code: String(formData.get("code") ?? ""),
      nameFa: String(formData.get("name-fa") ?? ""),
      entryType: String(formData.get("entry-type") ?? "general"),
      description: String(formData.get("description") ?? "").trim() || null,
      lines: readTemplateLines(formData),
    });
    revalidatePath("/financial/templates");
    return { ok: "الگو ساخته شد." };
  } catch (error) {
    return { error: message(error, "ساخت الگو انجام نشد.") };
  }
}

export async function toggleTemplateAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    await setTemplateActive(
      String(formData.get("id") ?? ""),
      String(formData.get("active") ?? "") === "true"
    );
    revalidatePath("/financial/templates");
    return { ok: "وضعیت تغییر کرد." };
  } catch (error) {
    return { error: message(error, "تغییر وضعیت انجام نشد.") };
  }
}

export async function applyTemplateAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    const result = await applyTemplate(
      String(formData.get("id") ?? ""),
      String(formData.get("entry-date") ?? "") || new Date().toISOString().slice(0, 10)
    );
    revalidatePath("/financial/entries");
    return { ok: `سند ${result.entryNumber} به‌عنوان پیش‌نویس ساخته شد.` };
  } catch (error) {
    return { error: message(error, "ساخت سند از الگو انجام نشد.") };
  }
}

export async function createScheduleAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    await createSchedule({
      code: String(formData.get("code") ?? ""),
      templateId: String(formData.get("template-id") ?? ""),
      frequency: String(formData.get("frequency") ?? "monthly") as Frequency,
      intervalCount: Number(formData.get("interval") ?? 1) || 1,
      startsOn: String(formData.get("starts-on") ?? ""),
      endsOn: String(formData.get("ends-on") ?? "").trim() || null,
    });
    revalidatePath("/financial/templates");
    return { ok: "زمان‌بندی ساخته شد." };
  } catch (error) {
    return { error: message(error, "ساخت زمان‌بندی انجام نشد.") };
  }
}

export async function toggleScheduleAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    await setScheduleActive(
      String(formData.get("id") ?? ""),
      String(formData.get("active") ?? "") === "true"
    );
    revalidatePath("/financial/templates");
    return { ok: "وضعیت تغییر کرد." };
  } catch (error) {
    return { error: message(error, "تغییر وضعیت انجام نشد.") };
  }
}

export async function runSchedulesAction(
  _prev: TemplateActionState,
  _formData: FormData
): Promise<TemplateActionState> {
  try {
    const result = await runDueSchedules();
    revalidatePath("/financial/templates");
    revalidatePath("/financial/entries");
    if (result.generated === 0) {
      return { ok: "هیچ زمان‌بندی سررسیدی وجود نداشت." };
    }
    return { ok: `${result.generated} سند ساخته شد: ${result.details.slice(0, 5).join(" · ")}` };
  } catch (error) {
    return { error: message(error, "اجرای زمان‌بندی‌ها انجام نشد.") };
  }
}
