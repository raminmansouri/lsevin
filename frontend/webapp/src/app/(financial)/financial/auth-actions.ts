"use server";

import { redirect } from "next/navigation";

import { changePassword, getPanelUser, signIn, signOut } from "@/accounting/server/panel-auth";

export type SignInState = { error?: "invalid" | "locked" | "inactive" | "missing" };

/**
 * Sign-in for the financial panel.
 *
 * The failure message is the same whichever way it failed, apart from the lockout, which
 * has to be distinguishable or the user cannot tell why waiting helps. Everything else
 * collapses to one message so the form does not confirm which usernames exist.
 */
export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "missing" };

  const result = await signIn({ username, password });
  if (result.ok === false) return { error: result.reason };

  redirect("/financial");
}

export async function signOutAction() {
  await signOut();
  redirect("/financial/sign-in");
}

export type ChangePasswordState = { error?: string; done?: boolean };

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getPanelUser();
  if (!user) redirect("/financial/sign-in");

  const result = await changePassword({
    userId: user.id,
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });

  if (!result.ok) return { error: result.reason };
  return { done: true };
}
