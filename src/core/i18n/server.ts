import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_PORTAL_LOCALE, PORTAL_LOCALE_COOKIE, normalizePortalLocale } from "./config";

export async function getPortalLocale() {
  const store = await cookies();
  return normalizePortalLocale(store.get(PORTAL_LOCALE_COOKIE)?.value || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || DEFAULT_PORTAL_LOCALE);
}
