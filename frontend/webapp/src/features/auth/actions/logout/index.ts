"use server";

import { cookies, headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { signOut } from "@/lib/auth";
import { LSEVIN_PROVIDER_SSO_COOKIE, lsevinSharedCookieDomain } from "@/lib/auth/provider-portal-sso";

export async function logout() {
  const locale = await getLocale();
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const host = (headerStore.get("x-forwarded-host") || headerStore.get("host") || "appmain.lsevin.com").split(":")[0];

  cookieStore.set(LSEVIN_PROVIDER_SSO_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: lsevinSharedCookieDomain(host),
    maxAge: 0,
  });

  await signOut({ redirectTo: `/${locale}/sign-in`, redirect: true });
}
