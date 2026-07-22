import "server-only";
import { routing } from "@/i18n/routing";

export function normalizePortalLocale(value?: string | null) {
  const locale = String(value || "").trim().toLowerCase().split("-")[0];
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
}

export function providerPortalOrigin() {
  const configured = process.env.PROVIDER_PORTAL_ORIGIN?.trim();
  if (!configured) throw new Error("PROVIDER_PORTAL_ORIGIN is required for provider SSO.");
  return new URL(configured).origin;
}

export function providerPortalSsoSecret() {
  const secret = process.env.PROVIDER_PORTAL_SSO_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("PROVIDER_PORTAL_SSO_SECRET must contain at least 32 characters.");
  return secret;
}

export function validateProviderCallback(value: string | null) {
  if (!value) return null;
  try {
    const target = new URL(value);
    if (target.origin !== providerPortalOrigin() || target.pathname !== "/api/auth/callback") return null;
    return target;
  } catch {
    return null;
  }
}
