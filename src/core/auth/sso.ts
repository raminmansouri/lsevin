import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { normalizePortalLocale } from "@core/i18n/config";

const uuidSchema = z.string().uuid();
const assertionSchema = z.object({
  kind: z.literal("sso_assertion"),
  sub: z.string().uuid(),
  iss: z.string().min(1),
  aud: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
  jti: z.string().min(8),
  locale: z.string().optional(),
});
const sessionSchema = z.object({
  kind: z.literal("portal_session"),
  sub: z.string().uuid(),
  iss: z.literal("lsevin-providers-portal"),
  aud: z.literal("lsevin-providers-portal"),
  iat: z.number().int(),
  exp: z.number().int(),
  locale: z.string().optional(),
});

export const PORTAL_SESSION_COOKIE = process.env.PROVIDER_PORTAL_SESSION_COOKIE || "lsevin_provider_session";

function requireSecret(name: "PROVIDER_PORTAL_SSO_SECRET" | "PROVIDER_PORTAL_SESSION_SECRET") {
  const fallback = name === "PROVIDER_PORTAL_SESSION_SECRET" ? process.env.PROVIDER_PORTAL_SSO_SECRET : undefined;
  const value = (process.env[name] || fallback || "").trim();
  if (value.length < 32) throw new Error(`${name} must contain at least 32 characters.`);
  return value;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function decodeAndVerify(token: string, secret: string) {
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) throw new Error("Malformed signed token.");
  const expected = signPayload(encodedPayload, secret);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    throw new Error("Invalid signed token.");
  }
  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
}

function assertTimeWindow(iat: number, exp: number, maxLifetimeSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const skew = 30;
  if (iat > now + skew || exp < now - skew || exp <= iat || exp - iat > maxLifetimeSeconds) {
    throw new Error("Signed token is expired or has an invalid lifetime.");
  }
}

export function verifyLsevinSsoAssertion(token: string) {
  const claims = assertionSchema.parse(decodeAndVerify(token, requireSecret("PROVIDER_PORTAL_SSO_SECRET")));
  const expectedIssuer = process.env.LSEVIN_SSO_ISSUER?.trim() || "lsevin-appmain";
  const expectedAudience = process.env.LSEVIN_SSO_AUDIENCE?.trim() || "lsevin-providers-portal";
  if (claims.iss !== expectedIssuer || claims.aud !== expectedAudience) throw new Error("SSO issuer or audience is invalid.");
  assertTimeWindow(claims.iat, claims.exp, 120);
  return { userId: claims.sub, locale: claims.locale ? normalizePortalLocale(claims.locale).locale : undefined };
}

export function createPortalSession(userId: string, locale?: string) {
  if (!uuidSchema.safeParse(userId).success) throw new Error("Portal session user id is invalid.");
  const now = Math.floor(Date.now() / 1000);
  const requestedMinutes = Number(process.env.PROVIDER_PORTAL_SESSION_MINUTES || 30);
  const minutes = Number.isFinite(requestedMinutes) ? Math.min(Math.max(requestedMinutes, 5), 480) : 30;
  const claims = {
    kind: "portal_session" as const,
    sub: userId,
    iss: "lsevin-providers-portal" as const,
    aud: "lsevin-providers-portal" as const,
    iat: now,
    exp: now + minutes * 60,
    locale: locale ? normalizePortalLocale(locale).locale : undefined,
  };
  const encoded = encode(claims);
  return { token: `${encoded}.${signPayload(encoded, requireSecret("PROVIDER_PORTAL_SESSION_SECRET"))}`, maxAge: minutes * 60 };
}

export function verifyPortalSession(token: string) {
  const claims = sessionSchema.parse(decodeAndVerify(token, requireSecret("PROVIDER_PORTAL_SESSION_SECRET")));
  assertTimeWindow(claims.iat, claims.exp, 8 * 60 * 60);
  return { userId: claims.sub, locale: claims.locale ? normalizePortalLocale(claims.locale).locale : undefined };
}

export function safeReturnTo(value?: string | null) {
  const candidate = String(value || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "/dashboard";
  return candidate;
}

export function buildLsevinSsoUrl(returnTo?: string, locale?: string) {
  const configured = process.env.LSEVIN_SSO_URL?.trim();
  if (!configured) return null;
  const url = new URL(configured);
  url.searchParams.set("returnTo", safeReturnTo(returnTo));
  if (locale) url.searchParams.set("locale", normalizePortalLocale(locale).locale);
  return url.toString();
}


/** Compatibility helpers retained for the public portal header and older SSO callers. */
export function isLsevinSsoConfigured() {
  return Boolean(process.env.LSEVIN_SSO_URL?.trim());
}

export function buildLsevinSsoBridgeUrl(returnTo?: string, locale?: string) {
  const url = buildLsevinSsoUrl(returnTo, locale);
  if (!url) throw new Error("LSevin SSO is not configured.");
  return url;
}
