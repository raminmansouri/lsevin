import "server-only";

import sql from "@/config/database/db";

import type { ShopApiScope } from "../scopes";
import { ShopApiError } from "./errors";
import { PORTAL_ASSERTION_HEADER, portalAssertionSecret, verifyPortalAssertion } from "./portal-assertion";
import { hashShopApiToken, looksLikeShopApiToken } from "./tokens";

export interface ShopApiPrincipal {
  /** The API token; null when the provider portal acts for a signed-in user. */
  tokenId: string | null;
  tokenName: string;
  sellerId: string;
  sellerSlug: string;
  scopes: ShopApiScope[];
  ip: string | null;
  source: "api_token" | "portal";
  /** The signed-in portal user (portal only). */
  actorUserId: string | null;
}

/** Requests per token per minute. Per server process: a coarse guard against runaway clients. */
export const SHOP_API_RATE_LIMIT_PER_MINUTE = 120;
const windows = new Map<string, { start: number; count: number }>();

export function checkRateLimit(tokenId: string, now = Date.now()): void {
  const current = windows.get(tokenId);
  if (!current || now - current.start >= 60_000) {
    windows.set(tokenId, { start: now, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > SHOP_API_RATE_LIMIT_PER_MINUTE) {
    const retryAfter = Math.max(1, Math.ceil((current.start + 60_000 - now) / 1000));
    throw new ShopApiError("rate_limited", `Too many requests. Try again in ${retryAfter} seconds.`, undefined, {
      "Retry-After": String(retryAfter),
    });
  }
}

/** Test seam: forget all rate-limit windows. */
export function resetRateLimits() {
  windows.clear();
}

function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || headers.get("x-real-ip") || "").slice(0, 64) || null;
}

/**
 * Resolves the bearer token to its seller. Every failure is the same 401 (missing, malformed,
 * unknown, revoked, expired, or a disabled seller), so a caller learns nothing about which.
 */
export async function authenticateShopApi(headers: Headers): Promise<ShopApiPrincipal> {
  const header = headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  const unauthorized = new ShopApiError(
    "unauthorized",
    "Missing or invalid API token. Send it as: Authorization: Bearer <token>",
    undefined,
    { "WWW-Authenticate": 'Bearer realm="lsevin-shop-api"' },
  );
  if (!match || !looksLikeShopApiToken(match[1])) throw unauthorized;

  const [row] = await sql<{ id: string; name: string; seller_id: string; seller_slug: string; scopes: string[] }[]>`
    select t.id::text as id, t.name, t.seller_id::text as seller_id, s.slug as seller_slug, t.scopes
    from shop.api_tokens t
    join shop.sellers s on s.id = t.seller_id
    where t.token_hash = ${hashShopApiToken(match[1])}
      and t.revoked_at is null
      and (t.expires_at is null or t.expires_at > now())
      and s.deleted_at is null
      and s.is_active
    limit 1
  `;
  if (!row) throw unauthorized;

  const ip = clientIp(headers);
  checkRateLimit(row.id);
  // At most one write a minute per token: usage tracking must not add a write to every read.
  await sql`
    update shop.api_tokens set last_used_at = now(), last_used_ip = ${ip}
    where id = ${row.id}::uuid and (last_used_at is null or last_used_at < now() - interval '1 minute')
  `;
  return {
    tokenId: row.id,
    tokenName: row.name,
    sellerId: row.seller_id,
    sellerSlug: row.seller_slug,
    scopes: (row.scopes ?? []) as ShopApiScope[],
    ip,
    source: "api_token",
    actorUserId: null,
  };
}

export function requireScope(principal: ShopApiPrincipal, scope: ShopApiScope): void {
  if (!principal.scopes.includes(scope)) {
    throw new ShopApiError("forbidden", `This token does not have the "${scope}" permission.`, { requiredScope: scope });
  }
}

// ------------------------------------------------------------------------------------------------
// Provider portal (X-Lsevin-Portal-Assertion)
// ------------------------------------------------------------------------------------------------

export type ProviderMemberRole = "owner" | "admin" | "manager" | "editor" | "viewer" | "staff";
/** Roles that may read the provider's shop, and the ones that may change it. */
const SHOP_READ_ROLES: ProviderMemberRole[] = ["owner", "admin", "manager", "viewer"];
const SHOP_WRITE_ROLES: ProviderMemberRole[] = ["owner", "admin", "manager"];
/** Admin roles that may review shops and listings (same names as the portal's admin roles). */
export const SHOP_PORTAL_ADMIN_ROLES = ["SUPERADMIN", "ADMIN", "PROVIDER_ADMIN", "CONTENT_ADMIN"];

export type PortalPrincipal = {
  source: "portal";
  kind: "provider" | "admin";
  actorUserId: string;
  /** kind = provider: the provider the user acts for, and the user's role in it. */
  providerId: string | null;
  providerRole: ProviderMemberRole | null;
  adminRoles: string[];
  ip: string | null;
};

function portalUnauthorized() {
  return new ShopApiError("unauthorized", "Missing or invalid portal assertion.", undefined, {
    "WWW-Authenticate": 'Bearer realm="lsevin-shop-api"',
  });
}

/** Same query as the portal's getProviderRole. */
export async function getProviderMemberRole(userId: string, providerId: string): Promise<ProviderMemberRole | null> {
  const [row] = await sql<{ role: ProviderMemberRole }[]>`
    select pm.role::text as role
    from provider_portal.provider_members pm
    where pm.user_id = ${userId}::uuid
      and pm.service_provider_id = ${providerId}::uuid
      and coalesce(pm.status, 'active') = 'active'
    limit 1
  `;
  return row?.role ?? null;
}

/** Same query as the portal's listAdminRoleNames. */
export async function listAdminRoleNames(userId: string): Promise<string[]> {
  const rows = await sql<{ role_name: string }[]>`
    select upper(coalesce(r.normalized_name, r.name, '')) as role_name
    from identity.asp_net_user_roles ur
    join identity.asp_net_roles r on r.id = ur.role_id
    where ur.user_id = ${userId}::uuid
  `;
  return rows.map((row) => row.role_name).filter(Boolean);
}

/**
 * Verifies the portal's signed assertion, then checks in the database that the user really is a
 * member of the provider (kind = provider) or holds a shop admin role (kind = admin). A wrong
 * kind for the endpoint, a bad/expired/malformed token or an unconfigured secret is the same 401;
 * a real user without the needed role is a 403.
 */
export async function authenticatePortal(
  headers: Headers,
  required: { kind: "provider" | "admin"; write: boolean },
): Promise<PortalPrincipal> {
  const token = headers.get(PORTAL_ASSERTION_HEADER)?.trim() ?? "";
  const secret = portalAssertionSecret();
  if (!secret) {
    if (token) console.error("[shop-api] portal assertion received but SHOP_PORTAL_ASSERTION_SECRET is not configured (min 32 chars)");
    throw portalUnauthorized();
  }
  const claims = token ? verifyPortalAssertion(token, secret) : null;
  if (!claims || claims.kind !== required.kind) throw portalUnauthorized();

  // Per user (not one bucket for the whole portal).
  checkRateLimit(`portal:${claims.userId}`);
  const ip = clientIp(headers);

  if (claims.kind === "provider") {
    const role = await getProviderMemberRole(claims.userId, claims.providerId as string);
    if (!role || !SHOP_READ_ROLES.includes(role)) {
      throw new ShopApiError("forbidden", "You are not allowed to manage this provider's shop.");
    }
    if (required.write && !SHOP_WRITE_ROLES.includes(role)) {
      throw new ShopApiError("forbidden", "Your role can view the shop but not change it. Ask an owner, admin or manager.");
    }
    return { source: "portal", kind: "provider", actorUserId: claims.userId, providerId: claims.providerId, providerRole: role, adminRoles: [], ip };
  }

  const roles = await listAdminRoleNames(claims.userId);
  if (!roles.some((role) => SHOP_PORTAL_ADMIN_ROLES.includes(role))) {
    throw new ShopApiError("forbidden", "A shop review admin role is required.");
  }
  return { source: "portal", kind: "admin", actorUserId: claims.userId, providerId: null, providerRole: null, adminRoles: roles, ip };
}
