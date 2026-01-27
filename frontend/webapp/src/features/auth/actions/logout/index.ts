"use server";

import { getLocale } from "next-intl/server";

import { signOut } from "@/lib/auth";

export async function logout() {
  const locale = await getLocale();

  await signOut({ redirectTo: `/${locale}/sign-in`, redirect: true });
}
