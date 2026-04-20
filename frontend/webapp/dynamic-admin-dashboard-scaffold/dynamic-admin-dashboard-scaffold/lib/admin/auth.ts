import { headers } from "next/headers";
import { adminLocales } from "./config";

export type AdminSession = {
  userId: string;
  locale: string;
};

export async function getAdminSession(): Promise<AdminSession> {
  // Replace this with your real auth integration:
  // next-auth, custom JWT, Clerk, direct session cookie, etc.
  const h = await headers();
  const userId = h.get("x-admin-user-id") || "00000000-0000-0000-0000-000000000001";
  const locale = h.get("x-admin-locale") || adminLocales.defaultLocale;

  return {
    userId,
    locale: adminLocales.supported.includes(locale) ? locale : adminLocales.defaultLocale,
  };
}
