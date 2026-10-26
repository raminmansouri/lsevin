"use server";

import { revalidatePath } from "next/cache";

import { AccountingAccessError } from "@/accounting/server/access";
import {
  createPanelUser,
  PanelUserError,
  resetPanelUserPassword,
  setPanelUserActive,
} from "@/accounting/server/panel-users.service";
import { PANEL_ROLES, type PanelRole } from "@/accounting/server/permissions";

/**
 * Users page actions. Each service opens with assertAccounting("users.manage") and
 * checks canManageRole against the target, which is the real boundary; this file only
 * turns refusals into sentences.
 */

export type UserFormState = { error?: string; ok?: string; credentials?: { username: string; password: string } };

function messageFor(error: unknown): string {
  if (error instanceof AccountingAccessError) return "حساب شما اجازهٔ مدیریت کاربران را ندارد.";
  if (error instanceof PanelUserError) {
    switch (error.code) {
      case "not_allowed":
        return "شما اجازهٔ این کار را برای این نقش ندارید.";
      case "invalid_username":
        return "نام کاربری باید ۳ تا ۴۰ حرف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.";
      case "name_required":
        return "نام و نام خانوادگی را وارد کنید.";
      case "username_taken":
        return "این نام کاربری قبلاً ثبت شده است.";
      case "not_found":
        return "این کاربر پیدا نشد. صفحه را تازه کنید.";
      case "self":
        return "حساب خودتان را از اینجا نمی‌توانید تغییر دهید.";
    }
  }
  console.error("financial panel users action failed", error);
  return "انجام نشد؛ خطای سرور رخ داد. دوباره تلاش کنید.";
}

export async function createPanelUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const role = String(formData.get("role") ?? "");
  if (!PANEL_ROLES.includes(role as PanelRole)) return { error: "نقش را انتخاب کنید." };
  try {
    const credentials = await createPanelUser({
      username: String(formData.get("username") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      role: role as PanelRole,
    });
    revalidatePath("/financial/users");
    return { ok: "کاربر ساخته شد.", credentials };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function setPanelUserActiveAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  try {
    const active = formData.get("active") === "true";
    await setPanelUserActive(String(formData.get("userId") ?? ""), active);
    revalidatePath("/financial/users");
    return { ok: active ? "فعال شد." : "غیرفعال شد و از پنل خارج شد." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function resetPanelUserPasswordAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  try {
    const credentials = await resetPanelUserPassword(String(formData.get("userId") ?? ""));
    return { ok: "رمز جدید ساخته شد.", credentials };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
