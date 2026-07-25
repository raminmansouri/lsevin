import "server-only";

import { createHmac } from "node:crypto";

export const LSEVIN_PROVIDER_SSO_COOKIE = "lsevin_provider_sso";
export const LSEVIN_SHARED_LOCALE_COOKIE = "LSEVIN_LOCALE";
export const LSEVIN_PROVIDER_SSO_MAX_AGE = 60 * 60 * 24 * 30;

const SSO_VERSION = 1;
const SSO_ISSUER = "lsevin-main-platform";
const SSO_AUDIENCE = "lsevin-providers-portal";

function secret() {
  return process.env.LSEVIN_SSO_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || "";
}

export function isProviderPortalSsoConfigured() {
  return Boolean(secret());
}

export function createProviderPortalSsoToken(userId: string) {
  const currentSecret = secret();
  if (!currentSecret) throw new Error("LSEVIN_SSO_SECRET or AUTH_SECRET is required for provider portal SSO.");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      v: SSO_VERSION,
      sub: userId,
      iat: now,
      exp: now + LSEVIN_PROVIDER_SSO_MAX_AGE,
      iss: SSO_ISSUER,
      aud: SSO_AUDIENCE,
    }),
    "utf8",
  ).toString("base64url");
  const signature = createHmac("sha256", currentSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function lsevinSharedCookieDomain(hostname: string) {
  const configured = process.env.LSEVIN_COOKIE_DOMAIN?.trim();
  if (configured) return configured;
  const host = hostname.toLowerCase();
  if (host === "lsevin.com" || host.endsWith(".lsevin.com")) return ".lsevin.com";
  return undefined;
}
