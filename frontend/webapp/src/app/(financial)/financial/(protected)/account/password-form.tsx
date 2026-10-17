"use client";

import Link from "next/link";
import { useActionState } from "react";

import { changePasswordAction, type ChangePasswordState } from "../../auth-actions";

const ERRORS: Record<string, string> = {
  too_short: "رمز جدید باید دست‌کم ۱۰ نویسه باشد.",
  invalid_current: "رمز فعلی درست نیست.",
};

/**
 * Changing the password ends every session, this one included, so a success sends the
 * person back to sign in with the new password.
 */
export function PasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});
  if (state.done) {
    return (
      <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
        رمز عوض شد. با رمز جدید{" "}
        <Link href="/financial/sign-in" className="underline">
          دوباره وارد شوید
        </Link>
        .
      </p>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const next = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
        const again = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
        if (next !== again) {
          event.preventDefault();
          window.alert("رمز جدید و تکرار آن یکی نیستند.");
        }
      }}
      className="grid max-w-md gap-3"
    >
      <label className="text-xs">
        <span className="text-muted-foreground">رمز فعلی</span>
        <input name="currentPassword" type="password" dir="ltr" required autoComplete="current-password" className="mt-1 h-9 w-full rounded border px-2" />
      </label>
      <label className="text-xs">
        <span className="text-muted-foreground">رمز جدید (دست‌کم ۱۰ نویسه)</span>
        <input name="newPassword" type="password" dir="ltr" required minLength={10} autoComplete="new-password" className="mt-1 h-9 w-full rounded border px-2" />
      </label>
      <label className="text-xs">
        <span className="text-muted-foreground">تکرار رمز جدید</span>
        <input name="confirmPassword" type="password" dir="ltr" required minLength={10} autoComplete="new-password" className="mt-1 h-9 w-full rounded border px-2" />
      </label>
      {state.error && <p className="text-xs font-medium text-red-700">{ERRORS[state.error] ?? "انجام نشد. دوباره تلاش کنید."}</p>}
      <button disabled={pending} className="w-fit rounded bg-green-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
        {pending ? "در حال ثبت..." : "تغییر رمز"}
      </button>
    </form>
  );
}
