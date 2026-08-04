"use server";

import { revalidatePath } from "next/cache";

import {
  DimensionError,
  createDimension,
  setDimensionActive,
  updateDimensionBudget,
  type DimensionKind,
} from "@/accounting/server/dimensions.service";
import { AttachmentError, addAttachment, deleteAttachment, type AttachmentKind }
  from "@/accounting/server/attachments.service";

/**
 * Dimension and attachment actions.
 *
 * Every export here is a public POST endpoint reachable by action id. The
 * services each begin with assertAccounting(...), and that — not this file — is
 * the authorization boundary.
 */

export type ActionState = { error?: string; ok?: string };

function message(error: unknown, fallback: string): string {
  if (error instanceof DimensionError || error instanceof AttachmentError) return error.message;
  const raw = error instanceof Error ? error.message : "";
  if (/duplicate key/i.test(raw)) return "این کد قبلاً ثبت شده است.";
  if (/cannot be changed or removed/i.test(raw)) {
    return "ضمیمهٔ سند قطعی‌شده قابل حذف یا تغییر نیست.";
  }
  if (/size_limit/i.test(raw)) return "حجم فایل بیش از حد مجاز است.";
  console.error(fallback, error);
  return fallback;
}

export async function createDimensionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createDimension({
      kind: String(formData.get("kind") ?? "") as DimensionKind,
      code: String(formData.get("code") ?? ""),
      nameFa: String(formData.get("name-fa") ?? ""),
      nameEn: String(formData.get("name-en") ?? "") || undefined,
      budgetAmount: String(formData.get("budget") ?? "").trim() || null,
      budgetCurrency: String(formData.get("budget-currency") ?? "").trim() || null,
      startsOn: String(formData.get("starts-on") ?? "").trim() || null,
      endsOn: String(formData.get("ends-on") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
    });
    revalidatePath("/financial/dimensions");
    revalidatePath("/financial/analytics");
    return { ok: "ثبت شد." };
  } catch (error) {
    return { error: message(error, "ثبت انجام نشد.") };
  }
}

export async function toggleDimensionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await setDimensionActive(
      String(formData.get("id") ?? ""),
      String(formData.get("active") ?? "") === "true"
    );
    revalidatePath("/financial/dimensions");
    return { ok: "وضعیت تغییر کرد." };
  } catch (error) {
    return { error: message(error, "تغییر وضعیت انجام نشد.") };
  }
}

export async function updateBudgetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updateDimensionBudget(
      String(formData.get("id") ?? ""),
      String(formData.get("budget") ?? "").trim() || null,
      String(formData.get("budget-currency") ?? "").trim() || null
    );
    revalidatePath("/financial/dimensions");
    revalidatePath("/financial/analytics");
    return { ok: "بودجه به‌روزرسانی شد." };
  } catch (error) {
    return { error: message(error, "به‌روزرسانی بودجه انجام نشد.") };
  }
}

export async function addAttachmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "فایلی انتخاب نشده است." };

    await addAttachment({
      entryId: String(formData.get("entry-id") ?? ""),
      file,
      kind: (String(formData.get("kind") ?? "other") || "other") as AttachmentKind,
      note: String(formData.get("note") ?? "").trim() || null,
    });
    revalidatePath("/financial/entries");
    return { ok: "ضمیمه اضافه شد." };
  } catch (error) {
    return { error: message(error, "افزودن ضمیمه انجام نشد.") };
  }
}

export async function deleteAttachmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await deleteAttachment(String(formData.get("id") ?? ""));
    revalidatePath("/financial/entries");
    return { ok: "ضمیمه حذف شد." };
  } catch (error) {
    return { error: message(error, "حذف ضمیمه انجام نشد.") };
  }
}
