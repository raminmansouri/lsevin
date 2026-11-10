import "server-only";

import sql from "@/config/database/db";
import { assertShopPermission, SHOP_PERMISSIONS } from "@/features/shop/lib/permissions";

import { isShopApiScope, type ShopApiScope } from "../scopes";
import type { ProductContentInput } from "../schemas";
import { applyProductContent } from "./repository";
import { generateShopApiToken } from "./tokens";

/** Admin side of the Shop API: issue/revoke tokens and review seller product content. */

export type AdminApiToken = {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  tokenPrefix: string;
  scopes: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  revokedAt: Date | null;
  createDate: Date;
};

export async function listApiTokens(): Promise<AdminApiToken[]> {
  await assertShopPermission(SHOP_PERMISSIONS.integrationsManage);
  return sql<AdminApiToken[]>`
    select t.id::text as id, t.name, t.seller_id::text as "sellerId",
           coalesce(nullif(s.name_translations->>'fa', ''), nullif(s.name_translations->>'en', ''), s.slug) as "sellerName",
           t.token_prefix as "tokenPrefix", t.scopes, t.expires_at as "expiresAt", t.last_used_at as "lastUsedAt",
           t.last_used_ip as "lastUsedIp", t.revoked_at as "revokedAt", t.create_date as "createDate"
    from shop.api_tokens t join shop.sellers s on s.id = t.seller_id
    order by (t.revoked_at is null) desc, t.create_date desc
  `;
}

export async function listTokenSellers(): Promise<Array<{ id: string; name: string; slug: string; isDefault: boolean }>> {
  await assertShopPermission(SHOP_PERMISSIONS.integrationsManage);
  return sql`
    select id::text as id, slug, is_default as "isDefault",
           coalesce(nullif(name_translations->>'fa', ''), nullif(name_translations->>'en', ''), slug) as name
    from shop.sellers where deleted_at is null and is_active
    order by is_default, slug
  `;
}

/** Creates a token and returns its secret. The secret is not stored and cannot be shown again. */
export async function createApiToken(input: {
  name: string;
  sellerId: string;
  scopes: string[];
  expiresInDays?: number | null;
}): Promise<{ id: string; token: string }> {
  const actor = await assertShopPermission(SHOP_PERMISSIONS.integrationsManage);
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error("Give the token a name (up to 120 characters).");
  const scopes = [...new Set(input.scopes)].filter(isShopApiScope) as ShopApiScope[];
  if (!scopes.length) throw new Error("Pick at least one permission.");
  const [seller] = await sql<{ is_default: boolean }[]>`
    select is_default from shop.sellers where id = ${input.sellerId}::uuid and deleted_at is null and is_active
  `;
  if (!seller) throw new Error("That seller does not exist or is inactive.");
  // The default seller is L Sevin itself: a client token must never act as the platform.
  if (seller.is_default) throw new Error("Tokens cannot be issued for the default seller (L Sevin). Create a seller for the client first.");
  const days = input.expiresInDays;
  if (days != null && (!Number.isInteger(days) || days < 1 || days > 3650)) throw new Error("Invalid expiry.");

  const { token, prefix, hash } = generateShopApiToken();
  const [row] = await sql<{ id: string }[]>`
    insert into shop.api_tokens (seller_id, name, token_prefix, token_hash, scopes, expires_at, created_by_user_id)
    values (${input.sellerId}::uuid, ${name}, ${prefix}, ${hash}, ${scopes},
      ${days == null ? null : new Date(Date.now() + days * 86_400_000)}, ${actor.userId ?? null}::uuid)
    returning id::text as id
  `;
  return { id: row.id, token };
}

export async function revokeApiToken(tokenId: string): Promise<void> {
  const actor = await assertShopPermission(SHOP_PERMISSIONS.integrationsManage);
  await sql`
    update shop.api_tokens set revoked_at = now(), revoked_by_user_id = ${actor.userId ?? null}::uuid
    where id = ${tokenId}::uuid and revoked_at is null
  `;
}

// ------------------------------------------------------------------------------------------------
// Review
// ------------------------------------------------------------------------------------------------

export type ReviewProduct = {
  id: string;
  slug: string;
  name: string;
  sellerName: string;
  shortDescription: string;
  image: string | null;
  price: string | null;
  currency: string;
  createDate: Date;
};

export type ReviewChange = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  sellerName: string;
  changes: Record<string, unknown>;
  createDate: Date;
};

export async function listReviewQueue(): Promise<{ products: ReviewProduct[]; changes: ReviewChange[] }> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const products = await sql<ReviewProduct[]>`
    select p.id::text as id, p.slug,
           coalesce(nullif(p.name_translations->>'fa', ''), nullif(p.name_translations->>'en', ''), p.slug) as name,
           coalesce(nullif(s.name_translations->>'fa', ''), s.slug) as "sellerName",
           coalesce(nullif(p.short_description_translations->>'fa', ''), p.short_description_translations->>'en', '') as "shortDescription",
           (select m.url from shop.product_media m where m.product_id = p.id order by m.is_primary desc, m.display_order limit 1) as image,
           (select o.price::text from shop.offers o where o.product_id = p.id and o.seller_id = p.owner_seller_id and o.deleted_at is null limit 1) as price,
           p.base_currency as currency, p.create_date as "createDate"
    from shop.products p join shop.sellers s on s.id = p.owner_seller_id
    where p.api_review_status = 'pending' and p.deleted_at is null
    order by p.create_date
  `;
  const changes = await sql<ReviewChange[]>`
    select r.id::text as id, p.id::text as "productId", p.slug as "productSlug",
           coalesce(nullif(p.name_translations->>'fa', ''), nullif(p.name_translations->>'en', ''), p.slug) as "productName",
           coalesce(nullif(s.name_translations->>'fa', ''), s.slug) as "sellerName",
           r.changes, r.create_date as "createDate"
    from shop.product_change_requests r
    join shop.products p on p.id = r.product_id
    join shop.sellers s on s.id = r.seller_id
    where r.status = 'pending' and p.deleted_at is null
    order by r.create_date
  `;
  return { products, changes };
}

/** Approve publishes the product; reject keeps it a draft with the note for the seller. */
export async function reviewNewProduct(input: { productId: string; decision: "approve" | "reject"; note?: string | null }) {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const note = input.note?.trim() || null;
  if (input.decision === "reject" && !note) throw new Error("Write a short reason so the seller knows what to fix.");
  const updated =
    input.decision === "approve"
      ? await sql`
          update shop.products
             set status = 'active', published_at = coalesce(published_at, now()),
                 api_review_status = 'approved', api_review_note = ${note}, api_reviewed_at = now(), last_modified_date = now()
           where id = ${input.productId}::uuid and api_review_status = 'pending' and deleted_at is null
        `
      : await sql`
          update shop.products
             set api_review_status = 'rejected', api_review_note = ${note}, api_reviewed_at = now(), last_modified_date = now()
           where id = ${input.productId}::uuid and api_review_status = 'pending' and deleted_at is null
        `;
  if (updated.count === 0) throw new Error("This product is no longer waiting for review.");
}

export async function reviewChangeRequest(input: { requestId: string; decision: "approve" | "reject"; note?: string | null }) {
  const actor = await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  const note = input.note?.trim() || null;
  if (input.decision === "reject" && !note) throw new Error("Write a short reason so the seller knows what to fix.");
  await sql.begin(async (tx) => {
    const [request] = await tx<{ product_id: string; changes: Partial<ProductContentInput> }[]>`
      select r.product_id::text as product_id, r.changes from shop.product_change_requests r
      join shop.products p on p.id = r.product_id and p.deleted_at is null
      where r.id = ${input.requestId}::uuid and r.status = 'pending'
      for update of r
    `;
    if (!request) throw new Error("This change is no longer waiting for review.");
    if (input.decision === "approve") await applyProductContent(tx, request.product_id, request.changes ?? {});
    await tx`
      update shop.product_change_requests
         set status = ${input.decision === "approve" ? "approved" : "rejected"}, review_note = ${note},
             reviewed_by_user_id = ${actor.userId ?? null}::uuid, reviewed_at = now(), last_modified_date = now()
       where id = ${input.requestId}::uuid
    `;
    await tx`
      update shop.products set api_review_note = ${note}, api_reviewed_at = now() where id = ${request.product_id}::uuid
    `;
  });
}
