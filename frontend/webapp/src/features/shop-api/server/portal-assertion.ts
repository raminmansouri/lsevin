import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The provider portal's signed statement "user X, acting for provider Y (or as an admin), sent
 * this request". Sent as `X-Lsevin-Portal-Assertion: <payload>.<signature>`, both base64url:
 * payload = JSON {userId, providerId, kind, iat, exp}, signature = HMAC-SHA256(payload, secret).
 *
 * The claims only say who the portal says is acting. The webapp re-checks the membership or the
 * admin role in the database on every request (auth.ts); a valid signature alone grants nothing.
 */

export const PORTAL_ASSERTION_HEADER = "x-lsevin-portal-assertion";
/** Longest lifetime a token may claim (exp - iat). */
export const PORTAL_ASSERTION_MAX_TTL_SECONDS = 120;
/** Tolerated clock difference between the portal and the webapp servers. */
const CLOCK_SKEW_SECONDS = 30;
export const MIN_PORTAL_ASSERTION_SECRET_LENGTH = 32;

export type PortalAssertionKind = "provider" | "admin";
export type PortalAssertion = {
  userId: string;
  providerId: string | null;
  kind: PortalAssertionKind;
  iat: number;
  exp: number;
};

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const B64URL = /^[A-Za-z0-9_-]+$/;

export function portalAssertionSecret(): string | null {
  const secret = process.env.SHOP_PORTAL_ASSERTION_SECRET?.trim() ?? "";
  return secret.length >= MIN_PORTAL_ASSERTION_SECRET_LENGTH ? secret : null;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");
}

/** Used by tests (and mirrors the portal's signer). */
export function signPortalAssertion(
  claims: {
    userId: string;
    providerId?: string | null;
    kind: PortalAssertionKind;
    iat?: number;
    exp?: number;
  },
  secret: string
): string {
  const iat = claims.iat ?? Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      userId: claims.userId,
      providerId: claims.providerId ?? null,
      kind: claims.kind,
      iat,
      exp: claims.exp ?? iat + 60,
    }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Returns the claims of a well-formed, correctly signed, unexpired assertion, else null. Never
 * says why: every failure becomes the same 401.
 */
export function verifyPortalAssertion(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): PortalAssertion | null {
  if (!token || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !B64URL.test(parts[0]) || !B64URL.test(parts[1]))
    return null;
  const expected = Buffer.from(sign(parts[0], secret), "utf8");
  const given = Buffer.from(parts[1], "utf8");
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!claims || typeof claims !== "object") return null;
  const { userId, providerId, kind, iat, exp } = claims;
  if (typeof userId !== "string" || !GUID.test(userId)) return null;
  if (kind !== "provider" && kind !== "admin") return null;
  if (
    kind === "provider" &&
    (typeof providerId !== "string" || !GUID.test(providerId))
  )
    return null;
  if (
    kind === "admin" &&
    providerId != null &&
    (typeof providerId !== "string" || !GUID.test(providerId))
  )
    return null;
  if (!Number.isInteger(iat) || !Number.isInteger(exp)) return null;
  const issued = iat as number;
  const expires = exp as number;
  if (expires <= issued || expires - issued > PORTAL_ASSERTION_MAX_TTL_SECONDS)
    return null;
  if (issued > nowSeconds + CLOCK_SKEW_SECONDS) return null;
  if (expires <= nowSeconds - CLOCK_SKEW_SECONDS || expires <= nowSeconds)
    return null;
  return {
    userId: userId.toLowerCase(),
    providerId:
      typeof providerId === "string" ? providerId.toLowerCase() : null,
    kind,
    iat: issued,
    exp: expires,
  };
}
