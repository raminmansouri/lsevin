"use server";

import { revalidatePath } from "next/cache";

import {
  AccountValidationError,
  createDetailAccount,
  deleteAccount,
  renameAccount,
  setAccountActive,
} from "@/accounting/server/accounts-admin";
import { SETTING_DEFINITIONS, updateSetting } from "@/accounting/server/settings-admin";
import { AccountingAccessError, assertAccounting } from "@/accounting/server/access";

/**
 * Configuration actions for the accounting panel.
 *
 * assertAccounting("configure") on the first line of each is the authorization boundary —
 * a `"use server"` export is a public POST endpoint reachable by action id, and these
 * change the platform fee and the chart of accounts. Deliberately a higher bar than the
 * approval queues: approving a deposit and rewriting the fee are different jobs.
 */

// The panel moved off /admin onto financial.lsevin.com in 50411750; these paths did
// not move with it, so every one of them revalidated a route that no longer exists
// and the screen the accountant was looking at kept its previous render.
function revalidateConfig() {
  revalidatePath("/financial/settings");
  revalidatePath("/financial/accounts");
  revalidatePath("/financial/entries");
  revalidatePath("/financial");
}

export type AccountFormState = { error?: string; ok?: string };

/**
 * Turns a refusal into a sentence the accountant can act on.
 *
 * These actions used to throw straight out of the server action. A throw from a
 * form action renders the route's error boundary — or, in production, nothing at
 * all — so an `accountant` who lacks `configure` pressed save on the chart of
 * accounts and saw the page simply not change.
 */
function accountMessageFor(error: unknown): string {
  if (error instanceof AccountingAccessError) {
    return "تغییر کدینگ حساب‌ها دسترسی «مدیر مالی» می‌خواهد و حساب شما «حسابدار» است.";
  }

  const raw = error instanceof Error ? error.message : "";

  if (error instanceof AccountValidationError) {
    if (/system account/i.test(raw)) {
      return "این حساب سیستمی است؛ قواعد ثبت سند به آن وابسته‌اند و حذف نمی‌شود. آن را غیرفعال کنید.";
    }
    if (/child account/i.test(raw)) {
      const count = raw.match(/has (\d+) child/i)?.[1] ?? "";
      return `این حساب ${count} زیرمجموعه دارد؛ ابتدا آن‌ها را حذف کنید.`;
    }
    if (/posting\(s\)/i.test(raw)) {
      const count = raw.match(/has (\d+) posting/i)?.[1] ?? "";
      return `این حساب ${count} ردیف سند دارد و حذف نمی‌شود. آن را غیرفعال کنید.`;
    }
    if (/wallet\(s\)/i.test(raw)) {
      return "این حساب، حساب دفتری کیف پول کاربران است و حذف نمی‌شود.";
    }
    if (/template/i.test(raw)) {
      return "این حساب در الگوی سند استفاده شده است؛ ابتدا الگو را اصلاح کنید.";
    }
    if (/code must be 3 to 20 digits/i.test(raw)) {
      return "کد حساب باید ۳ تا ۲۰ رقم باشد.";
    }
    if (/Persian name is required/i.test(raw)) {
      return "نام فارسی حساب اجباری است.";
    }
    if (/already exists/i.test(raw)) {
      return "این کد حساب قبلاً ثبت شده است.";
    }
    if (/must start with the parent/i.test(raw)) {
      const parent = raw.match(/\(([^)]+)\)/)?.[1] ?? "";
      return `کد حساب باید با کد حساب بالادست (${parent}) شروع شود.`;
    }
    if (/subsidiary \(level 3\)/i.test(raw)) {
      return "حساب جدید فقط زیر یک حساب معین (سطح ۳) ساخته می‌شود.";
    }
    if (/parent already accepts postings/i.test(raw)) {
      return "حساب بالادست خودش سنددار است و نمی‌تواند زیرمجموعه بگیرد.";
    }
    if (/not found/i.test(raw)) {
      return "حساب پیدا نشد.";
    }
    return raw;
  }

  console.error("accounting config action failed", error);
  return "انجام نشد.";
}

export async function updateSettingAction(formData: FormData) {
  const { userId } = await assertAccounting("configure");

  const key = String(formData.get("key") ?? "").trim();
  const definition = SETTING_DEFINITIONS.find((d) => d.key === key);
  if (!definition) throw new Error(`Unknown setting '${key}'.`);

  // Per-currency and confirmation settings arrive as `entry.<CURRENCY>` fields.
  const entries: Record<string, string> = {};
  for (const [field, value] of formData.entries()) {
    if (field.startsWith("entry.")) entries[field.slice(6)] = String(value);
  }

  await updateSetting({
    key,
    kind: definition.kind,
    value: formData.get("value") ? String(formData.get("value")) : undefined,
    entries,
    limit: formData.get("limit") ? String(formData.get("limit")) : undefined,
    windowSeconds: formData.get("windowSeconds") ? String(formData.get("windowSeconds")) : undefined,
    actorUserId: userId,
  });

  revalidateConfig();
}

export async function createAccountAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    const { userId } = await assertAccounting("configure");

    await createDetailAccount({
      parentId: String(formData.get("parentId") ?? "").trim(),
      code: String(formData.get("code") ?? "").trim(),
      nameFa: String(formData.get("nameFa") ?? "").trim(),
      nameEn: String(formData.get("nameEn") ?? "").trim(),
      currencyCode: String(formData.get("currencyCode") ?? "").trim() || null,
      actorUserId: userId,
    });

    revalidateConfig();
    return { ok: "حساب ساخته شد." };
  } catch (error) {
    return { error: accountMessageFor(error) };
  }
}

export async function renameAccountAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    const { userId } = await assertAccounting("configure");

    await renameAccount({
      accountId: String(formData.get("accountId") ?? "").trim(),
      nameFa: String(formData.get("nameFa") ?? "").trim(),
      nameEn: String(formData.get("nameEn") ?? "").trim(),
      actorUserId: userId,
    });

    revalidateConfig();
    return { ok: "نام حساب ذخیره شد." };
  } catch (error) {
    return { error: accountMessageFor(error) };
  }
}

export async function toggleAccountActiveAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    const { userId } = await assertAccounting("configure");
    const isActive = String(formData.get("isActive") ?? "") === "true";

    await setAccountActive({
      accountId: String(formData.get("accountId") ?? "").trim(),
      isActive,
      actorUserId: userId,
    });

    revalidateConfig();
    return { ok: isActive ? "حساب فعال شد." : "حساب غیرفعال شد." };
  } catch (error) {
    return { error: accountMessageFor(error) };
  }
}

/**
 * Removes a mistyped account from the coding tree.
 *
 * Deactivating was the only way out of a wrong code, and it leaves the wrong code
 * in the tree forever. The service refuses anything that is already depended on,
 * so what reaches the database here is only ever an account nothing points at.
 */
export async function deleteAccountAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    const { userId } = await assertAccounting("configure");

    const { code } = await deleteAccount({
      accountId: String(formData.get("accountId") ?? "").trim(),
      actorUserId: userId,
    });

    revalidateConfig();
    return { ok: `حساب ${code} حذف شد.` };
  } catch (error) {
    return { error: accountMessageFor(error) };
  }
}
