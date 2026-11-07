import "server-only";

import sql from "@/config/database/db";

import type { ShopApiScope } from "../scopes";
import { ShopApiError } from "./errors";
import { hashShopApiToken, looksLikeShopApiToken } from "./tokens";

export interface ShopApiPrincipal {
  tokenId: string;
  tokenName: string;
  sellerId: string;
  sellerSlug: string;
  scopes: ShopApiScope[];
  ip: string | null;
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
  };
}

export function requireScope(principal: ShopApiPrincipal, scope: ShopApiScope): void {
  if (!principal.scopes.includes(scope)) {
    throw new ShopApiError("forbidden", `This token does not have the "${scope}" permission.`, { requiredScope: scope });
  }
}
