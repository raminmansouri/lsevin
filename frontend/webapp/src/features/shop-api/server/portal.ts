import "server-only";

import sql from "@/config/database/db";

import type { CreateOfferInput, UpdateOfferInput } from "../schemas";
import type { PortalPrincipal, ShopApiPrincipal } from "./auth";
import { notFound, ShopApiError } from "./errors";
import { createOwnOffer, updateOwnOffer, writeAudit } from "./repository";

/**
 * The provider portal's shop: a clinic requests a shop, an admin approves it with the categories
 * it may sell in, the clinic lists catalog products that go live after an admin approves each one.
 * Offer writes reuse the Shop API repository (same rules for both channels); this file adds the
 * shop lifecycle, the catalog view for a provider seller and the admin queue.
 */

export type ShopState =
  | "none"
  | "requested"
  | "rejected"
  | "active"
  | "suspended";

type SellerRow = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  logo_url: string | null;
  shop_status: "requested" | "active" | "suspended";
  shop_status_reason: string | null;
  shop_requested_at: Date | null;
  shop_reviewed_at: Date | null;
  shop_request: {
    state?: string;
    categoryIds?: string[];
    licenceUrl?: string | null;
  } | null;
  fulfillment_mode: string;
};

function stateOf(row: SellerRow | null): ShopState {
  if (!row) return "none";
  if (row.shop_status === "requested")
    return row.shop_request?.state === "rejected" ? "rejected" : "requested";
  return row.shop_status;
}

const SELLER_COLUMNS = sql`
  s.id::text as id, s.slug, coalesce(nullif(s.name_translations->>'fa', ''), nullif(s.name_translations->>'en', ''), s.slug) as name,
  s.phone, s.logo_url, s.shop_status, s.shop_status_reason, s.shop_requested_at, s.shop_reviewed_at, s.shop_request, s.fulfillment_mode
`;

async function sellerOfProvider(providerId: string): Promise<SellerRow | null> {
  const [row] = await sql<SellerRow[]>`
    select ${SELLER_COLUMNS} from shop.sellers s
    where s.service_provider_id = ${providerId}::uuid and s.deleted_at is null
    limit 1
  `;
  return row ?? null;
}

async function categoriesByIds(ids: string[]) {
  if (!ids.length) return [];
  return sql<{ id: string; name: string; parentId: string | null }[]>`
    select c.id::text as id, coalesce(nullif(c.name_translations->>'fa', ''), nullif(c.name_translations->>'en', ''), c.slug) as name,
           c.parent_id::text as "parentId"
    from shop.categories c where c.id::text = any(${ids}) and c.deleted_at is null
    order by c.display_order, c.slug
  `;
}

async function allowedCategories(sellerId: string) {
  return sql<{ id: string; name: string }[]>`
    select c.id::text as id, coalesce(nullif(c.name_translations->>'fa', ''), nullif(c.name_translations->>'en', ''), c.slug) as name
    from shop.seller_categories sc join shop.categories c on c.id = sc.category_id and c.deleted_at is null
    where sc.seller_id = ${sellerId}::uuid
    order by c.display_order, c.slug
  `;
}

/** Every active category, to choose from (activation request, admin approval). */
export async function listActiveCategories() {
  return sql<{ id: string; name: string; parentId: string | null }[]>`
    select c.id::text as id, coalesce(nullif(c.name_translations->>'fa', ''), nullif(c.name_translations->>'en', ''), c.slug) as name,
           c.parent_id::text as "parentId"
    from shop.categories c where c.deleted_at is null and c.is_active
    order by c.display_order, c.slug
  `;
}

function requireProvider(principal: PortalPrincipal) {
  if (principal.kind !== "provider" || !principal.providerId)
    throw new ShopApiError("forbidden", "A provider is required.");
  return principal.providerId;
}

/** The Shop API principal for the provider's seller, for the shared offer rules. */
async function sellerPrincipal(
  principal: PortalPrincipal
): Promise<ShopApiPrincipal> {
  const seller = await sellerOfProvider(requireProvider(principal));
  if (!seller)
    throw new ShopApiError("forbidden", "Request a shop first.", {
      reason: "no_shop",
    });
  return {
    tokenId: null,
    tokenName: "provider-portal",
    sellerId: seller.id,
    sellerSlug: seller.slug,
    scopes: ["offers:read", "offers:write", "catalog:read"],
    ip: principal.ip,
    source: "portal",
    actorUserId: principal.actorUserId,
  };
}

// ------------------------------------------------------------------------------------------------
// Provider: shop
// ------------------------------------------------------------------------------------------------

async function providerProfile(providerId: string) {
  const [row] = await sql<
    {
      name: string;
      phone: string | null;
      logo_url: string | null;
      slug: string | null;
      name_en: string | null;
    }[]
  >`
    select coalesce(nullif(sp.name_translations->>'fa', ''), nullif(sp.name_translations->>'en', ''), '') as name,
           nullif(concat_ws('', sp.phone_number_country_code, sp.phone_number), '') as phone,
           sp.image_url as logo_url, sp.slug, sp.name_translations->>'en' as name_en
    from category.service_providers sp where sp.id = ${providerId}::uuid
  `;
  return row ?? null;
}

export async function getProviderShop(principal: PortalPrincipal) {
  const providerId = requireProvider(principal);
  const [seller, profile] = await Promise.all([
    sellerOfProvider(providerId),
    providerProfile(providerId),
  ]);
  const state = stateOf(seller);
  return {
    state,
    categories: await listActiveCategories(),
    role: principal.providerRole,
    provider: profile
      ? { name: profile.name, phone: profile.phone, logoUrl: profile.logo_url }
      : null,
    seller: seller
      ? {
          id: seller.id,
          slug: seller.slug,
          name: seller.name,
          phone: seller.phone,
          logoUrl: seller.logo_url,
          reason: seller.shop_status_reason,
          requestedAt: seller.shop_requested_at,
          reviewedAt: seller.shop_reviewed_at,
          fulfillmentMode: seller.fulfillment_mode,
          requestedCategories: await categoriesByIds(
            seller.shop_request?.categoryIds ?? []
          ),
          licenceUrl: seller.shop_request?.licenceUrl ?? null,
          allowedCategories:
            state === "active" || state === "suspended"
              ? await allowedCategories(seller.id)
              : [],
        }
      : null,
  };
}

function slugify(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function freeSellerSlug(tx: typeof sql, base: string) {
  const wanted = base.length >= 2 ? base : "clinic";
  const rows = await tx<
    { slug: string }[]
  >`select slug from shop.sellers where slug = ${wanted} or slug like ${`${wanted}-%`}`;
  const taken = new Set(rows.map((row) => row.slug));
  let slug = wanted;
  for (let n = 2; taken.has(slug); n += 1) slug = `${wanted}-${n}`;
  return slug;
}

export type ActivationInput = {
  name: string;
  phone?: string | null;
  categoryIds: string[];
  licenceUrl?: string | null;
};

/**
 * Creates the provider's seller as "requested", or asks again after a rejection. An active or
 * suspended shop, or a request already waiting, is a conflict.
 */
export async function requestShopActivation(
  principal: PortalPrincipal,
  input: ActivationInput
) {
  const providerId = requireProvider(principal);
  const categories = await categoriesByIds(input.categoryIds);
  if (categories.length !== new Set(input.categoryIds).size) {
    throw new ShopApiError("validation_error", "Unknown category id(s).", [
      { field: "categoryIds", message: "Choose categories from the list." },
    ]);
  }
  const profile = await providerProfile(providerId);
  if (!profile) throw notFound("Provider");
  const request = {
    state: "requested",
    categoryIds: input.categoryIds,
    licenceUrl: input.licenceUrl ?? null,
  };

  await sql.begin(async (tx) => {
    // Serialise concurrent requests of one provider (the unique index would also catch it).
    await tx`select pg_advisory_xact_lock(hashtext(${`shop-activation:${providerId}`}))`;
    const [existing] = await tx<SellerRow[]>`
      select ${SELLER_COLUMNS} from shop.sellers s
      where s.service_provider_id = ${providerId}::uuid and s.deleted_at is null for update
    `;
    const state = stateOf(existing ?? null);
    if (state === "requested")
      throw new ShopApiError(
        "conflict",
        "Your request is already waiting for review."
      );
    if (state === "active" || state === "suspended")
      throw new ShopApiError(
        "conflict",
        "Your shop has already been reviewed."
      );

    let id: string;
    if (existing) {
      await tx`
        update shop.sellers set
          name_translations = jsonb_set(name_translations, '{fa}', to_jsonb(${input.name}::text)),
          phone = ${input.phone ?? profile.phone}, shop_request = ${tx.json(request)},
          shop_status = 'requested', shop_status_reason = null,
          shop_requested_at = now(), shop_requested_by_user_id = ${principal.actorUserId}::uuid,
          last_modified_date = now()
        where id = ${existing.id}::uuid
      `;
      id = existing.id;
    } else {
      const slug = await freeSellerSlug(
        tx as unknown as typeof sql,
        slugify(profile.slug) ||
          slugify(profile.name_en) ||
          `clinic-${providerId.slice(0, 8)}`
      );
      const [row] = await tx<{ id: string }[]>`
        insert into shop.sellers (slug, name_translations, logo_url, phone, service_provider_id, is_default, is_active,
          shop_status, shop_request, shop_requested_at, shop_requested_by_user_id, fulfillment_mode)
        values (${slug}, ${tx.json({ fa: input.name })}, ${profile.logo_url}, ${input.phone ?? profile.phone}, ${providerId}::uuid, false, true,
          'requested', ${tx.json(request)}, now(), ${principal.actorUserId}::uuid, 'clinic_pickup')
        returning id::text as id
      `;
      id = row.id;
    }
    await writeAudit(tx, {
      tokenId: null,
      sellerId: id,
      actorUserId: principal.actorUserId,
      source: "portal",
      ip: principal.ip,
      action: existing ? "shop.re_request" : "shop.request",
      entityType: "seller",
      entityId: id,
    });
  });
  return getProviderShop(principal);
}

// ------------------------------------------------------------------------------------------------
// Provider: catalog and offers
// ------------------------------------------------------------------------------------------------

export async function listPortalCatalog(
  principal: PortalPrincipal,
  search: string | null
) {
  const providerId = requireProvider(principal);
  const seller = await sellerOfProvider(providerId);
  const term = search?.trim() ? `%${search.trim()}%` : null;
  const rows = await sql<
    {
      product_id: string;
      variant_id: string | null;
      slug: string;
      name: string;
      variant_name: string | null;
      image: string | null;
      currency: string;
      category_names: string[] | null;
      allowed: boolean;
      seller_count: number;
      min_price: string | null;
      own_offer_id: string | null;
      own_offer_status: string | null;
    }[]
  >`
    select p.id::text as product_id, v.id::text as variant_id, p.slug,
           coalesce(nullif(p.name_translations->>'fa', ''), nullif(p.name_translations->>'en', ''), p.slug) as name,
           coalesce(nullif(v.title_translations->>'fa', ''), nullif(v.title_translations->>'en', ''), v.sku) as variant_name,
           (select m.url from shop.product_media m where m.product_id = p.id order by m.is_primary desc, m.display_order limit 1) as image,
           coalesce(v.currency, p.base_currency) as currency,
           (select array_agg(coalesce(nullif(c.name_translations->>'fa', ''), c.slug) order by c.slug)
              from shop.product_categories pc join shop.categories c on c.id = pc.category_id where pc.product_id = p.id) as category_names,
           ${seller ? sql`shop.seller_may_list_product(${seller.id}::uuid, p.id)` : sql`false`} as allowed,
           (select count(distinct o.seller_id)::int from shop.offers o join shop.sellers s on s.id = o.seller_id
             where o.product_id = p.id and o.variant_id is not distinct from v.id and o.deleted_at is null and o.is_active
               and o.admin_status = 'approved' and s.is_active and s.deleted_at is null and s.shop_status = 'active') as seller_count,
           (select min(o.price)::text from shop.offers o join shop.sellers s on s.id = o.seller_id
             where o.product_id = p.id and o.variant_id is not distinct from v.id and o.deleted_at is null and o.is_active
               and o.admin_status = 'approved' and s.is_active and s.deleted_at is null and s.shop_status = 'active') as min_price,
           ${
             seller
               ? sql`(select o.id::text from shop.offers o where o.seller_id = ${seller.id}::uuid and o.product_id = p.id
                            and o.variant_id is not distinct from v.id and o.deleted_at is null limit 1)`
               : sql`null::text`
           } as own_offer_id,
           ${
             seller
               ? sql`(select o.admin_status from shop.offers o where o.seller_id = ${seller.id}::uuid and o.product_id = p.id
                            and o.variant_id is not distinct from v.id and o.deleted_at is null limit 1)`
               : sql`null::text`
           } as own_offer_status
    from shop.products p
    left join shop.product_variants v on v.product_id = p.id and v.deleted_at is null and v.is_active
    where p.deleted_at is null and p.status = 'active' and p.owner_seller_id is null
      and (${term}::text is null or p.slug ilike ${term} or v.sku ilike ${term} or exists (
        select 1 from jsonb_each_text(case when jsonb_typeof(p.name_translations) = 'object' then p.name_translations else '{}'::jsonb end) t
        where t.value ilike ${term}))
    order by p.name_translations->>'fa' nulls last, p.slug, v.sku nulls first
    limit 40
  `;
  return {
    data: rows.map((row) => ({
      productId: row.product_id,
      variantId: row.variant_id,
      slug: row.slug,
      name: row.name,
      variantName: row.variant_name,
      image: row.image,
      currency: row.currency,
      categories: row.category_names ?? [],
      allowed: row.allowed,
      sellerCount: row.seller_count,
      minPrice: row.min_price == null ? null : Number(row.min_price),
      ownOfferId: row.own_offer_id,
      ownOfferStatus: row.own_offer_status,
    })),
  };
}

export async function createPortalOffer(
  principal: PortalPrincipal,
  input: CreateOfferInput,
  extras: { warranty?: string | null }
) {
  return createOwnOffer(await sellerPrincipal(principal), input, extras);
}

export async function updatePortalOffer(
  principal: PortalPrincipal,
  offerId: string,
  input: Partial<UpdateOfferInput>,
  extras: { warranty?: string | null; resubmit?: boolean }
) {
  if (
    !Object.keys(input).length &&
    extras.warranty === undefined &&
    !extras.resubmit
  ) {
    throw new ShopApiError(
      "validation_error",
      "Send at least one field to change."
    );
  }
  return updateOwnOffer(
    await sellerPrincipal(principal),
    offerId,
    input,
    extras
  );
}

/** The shop activation and every offer, with review state and the buy-box position. */
export async function listPortalRequests(principal: PortalPrincipal) {
  const shop = await getProviderShop(principal);
  if (!shop.seller) return { shop, offers: [] };
  const offers = await sql<
    {
      id: string;
      product_id: string;
      variant_id: string | null;
      product_name: string;
      variant_name: string | null;
      image: string | null;
      currency: string;
      price: string;
      compare_at_price: string | null;
      stock_quantity: number | null;
      handling_days: number | null;
      seller_sku: string | null;
      warranty: string | null;
      is_active: boolean;
      admin_status: string;
      admin_status_reason: string | null;
      admin_reviewed_at: Date | null;
      create_date: Date;
      last_modified_date: Date;
      cheaper_sellers: number;
      is_winner: boolean;
    }[]
  >`
    with mine as (
      select o.* from shop.offers o where o.seller_id = ${shop.seller.id}::uuid and o.deleted_at is null
    )
    select o.id::text as id, o.product_id::text as product_id, o.variant_id::text as variant_id,
           coalesce(nullif(p.name_translations->>'fa', ''), nullif(p.name_translations->>'en', ''), p.slug) as product_name,
           coalesce(nullif(v.title_translations->>'fa', ''), nullif(v.title_translations->>'en', ''), v.sku) as variant_name,
           (select m.url from shop.product_media m where m.product_id = p.id order by m.is_primary desc, m.display_order limit 1) as image,
           o.currency, o.price::text as price, o.compare_at_price::text as compare_at_price, o.stock_quantity, o.handling_days, o.seller_sku,
           nullif(o.warranty_translations->>'fa', '') as warranty,
           o.is_active, o.admin_status, o.admin_status_reason, o.admin_reviewed_at, o.create_date, o.last_modified_date,
           (select count(distinct other.seller_id)::int from shop.offers other join shop.sellers s on s.id = other.seller_id
             where other.product_id = o.product_id and other.variant_id is not distinct from o.variant_id and other.seller_id <> o.seller_id
               and other.deleted_at is null and other.is_active and other.admin_status = 'approved'
               and s.is_active and s.deleted_at is null and s.shop_status = 'active' and other.price < o.price) as cheaper_sellers,
           exists (select 1 from shop.v_product_price_summary ps where ps.best_offer_id = o.id) as is_winner
    from mine o
    join shop.products p on p.id = o.product_id
    left join shop.product_variants v on v.id = o.variant_id
    order by o.create_date desc, o.id
  `;
  return {
    shop,
    offers: offers.map((row) => ({
      id: row.id,
      productId: row.product_id,
      variantId: row.variant_id,
      productName: row.product_name,
      variantName: row.variant_name,
      image: row.image,
      currency: row.currency,
      price: Number(row.price),
      compareAtPrice:
        row.compare_at_price == null ? null : Number(row.compare_at_price),
      stockQuantity: row.stock_quantity,
      handlingDays: row.handling_days,
      sellerSku: row.seller_sku,
      warranty: row.warranty,
      isActive: row.is_active,
      adminStatus: row.admin_status,
      reason: row.admin_status_reason,
      reviewedAt: row.admin_reviewed_at,
      createdAt: row.create_date,
      updatedAt: row.last_modified_date,
      cheaperSellers: row.cheaper_sellers,
      isWinner: row.is_winner,
    })),
  };
}

// ------------------------------------------------------------------------------------------------
// Admin: queue and decisions
// ------------------------------------------------------------------------------------------------

export type QueueStatus = "pending" | "approved" | "rejected" | "blocked";

function requireAdmin(principal: PortalPrincipal) {
  if (principal.kind !== "admin")
    throw new ShopApiError("forbidden", "An admin is required.");
}

export async function listAdminQueue(
  principal: PortalPrincipal,
  status: QueueStatus
) {
  requireAdmin(principal);
  // Which shops / offers belong to each tab.
  const shopFilter = {
    pending: sql`s.shop_status = 'requested' and coalesce(s.shop_request->>'state', 'requested') <> 'rejected'`,
    approved: sql`s.shop_status = 'active'`,
    rejected: sql`s.shop_status = 'requested' and s.shop_request->>'state' = 'rejected'`,
    blocked: sql`s.shop_status = 'suspended'`,
  }[status];
  const shops = await sql<
    {
      id: string;
      name: string;
      phone: string | null;
      provider_id: string;
      provider_name: string | null;
      city: string | null;
      shop_status: string;
      reason: string | null;
      requested_at: Date | null;
      reviewed_at: Date | null;
      shop_request: SellerRow["shop_request"];
      live: number;
      pending: number;
      rejected: number;
      blocked: number;
    }[]
  >`
    select s.id::text as id, coalesce(nullif(s.name_translations->>'fa', ''), s.slug) as name, s.phone,
           s.service_provider_id::text as provider_id,
           coalesce(nullif(sp.name_translations->>'fa', ''), nullif(sp.name_translations->>'en', '')) as provider_name, sp.city,
           s.shop_status, s.shop_status_reason as reason, s.shop_requested_at as requested_at, s.shop_reviewed_at as reviewed_at, s.shop_request,
           (select count(*)::int from shop.offers o where o.seller_id = s.id and o.deleted_at is null and o.admin_status = 'approved') as live,
           (select count(*)::int from shop.offers o where o.seller_id = s.id and o.deleted_at is null and o.admin_status = 'pending') as pending,
           (select count(*)::int from shop.offers o where o.seller_id = s.id and o.deleted_at is null and o.admin_status = 'rejected') as rejected,
           (select count(*)::int from shop.offers o where o.seller_id = s.id and o.deleted_at is null and o.admin_status = 'blocked') as blocked
    from shop.sellers s
    left join category.service_providers sp on sp.id = s.service_provider_id
    where s.deleted_at is null and s.service_provider_id is not null and not s.is_default and ${shopFilter}
    order by coalesce(s.shop_requested_at, s.create_date) desc
    limit 200
  `;
  const offers = await sql<
    {
      id: string;
      seller_id: string;
      seller_name: string;
      shop_status: string;
      product_id: string;
      product_name: string;
      variant_name: string | null;
      image: string | null;
      currency: string;
      price: string;
      stock_quantity: number | null;
      handling_days: number | null;
      admin_status: string;
      reason: string | null;
      created_at: Date;
      reviewed_at: Date | null;
      other_min: string | null;
      other_max: string | null;
      other_sellers: number;
      allowed: boolean;
      category_names: string[] | null;
    }[]
  >`
    select o.id::text as id, s.id::text as seller_id, coalesce(nullif(s.name_translations->>'fa', ''), s.slug) as seller_name, s.shop_status,
           p.id::text as product_id,
           coalesce(nullif(p.name_translations->>'fa', ''), nullif(p.name_translations->>'en', ''), p.slug) as product_name,
           coalesce(nullif(v.title_translations->>'fa', ''), nullif(v.title_translations->>'en', ''), v.sku) as variant_name,
           (select m.url from shop.product_media m where m.product_id = p.id order by m.is_primary desc, m.display_order limit 1) as image,
           o.currency, o.price::text as price, o.stock_quantity, o.handling_days, o.admin_status, o.admin_status_reason as reason,
           o.create_date as created_at, o.admin_reviewed_at as reviewed_at,
           r.other_min, r.other_max, r.other_sellers,
           shop.seller_may_list_product(s.id, p.id) as allowed,
           (select array_agg(coalesce(nullif(c.name_translations->>'fa', ''), c.slug) order by c.slug)
              from shop.product_categories pc join shop.categories c on c.id = pc.category_id where pc.product_id = p.id) as category_names
    from shop.offers o
    join shop.sellers s on s.id = o.seller_id and s.deleted_at is null and s.service_provider_id is not null and not s.is_default
    join shop.products p on p.id = o.product_id
    left join shop.product_variants v on v.id = o.variant_id
    left join lateral (
      select min(x.price)::text as other_min, max(x.price)::text as other_max, count(distinct x.seller_id)::int as other_sellers
      from shop.offers x join shop.sellers xs on xs.id = x.seller_id
      where x.product_id = o.product_id and x.variant_id is not distinct from o.variant_id and x.seller_id <> o.seller_id
        and x.deleted_at is null and x.is_active and x.admin_status = 'approved'
        and xs.is_active and xs.deleted_at is null and xs.shop_status = 'active'
    ) r on true
    where o.deleted_at is null and o.admin_status = ${status}
    order by o.last_modified_date desc
    limit 200
  `;
  const [{ pending_count }] = await sql<{ pending_count: number }[]>`
    select ((select count(*) from shop.sellers s where s.deleted_at is null and s.service_provider_id is not null
              and s.shop_status = 'requested' and coalesce(s.shop_request->>'state', 'requested') <> 'rejected')
          + (select count(*) from shop.offers o join shop.sellers s on s.id = o.seller_id
              where o.deleted_at is null and o.admin_status = 'pending' and s.service_provider_id is not null and s.deleted_at is null))::int as pending_count
  `;
  const categoryIds = [
    ...new Set(shops.flatMap((shop) => shop.shop_request?.categoryIds ?? [])),
  ];
  const categoryNames = new Map<string, string>(
    (await categoriesByIds(categoryIds)).map(
      (c) => [c.id, c.name] as [string, string]
    )
  );
  const history = await sql<
    { seller_id: string; live: number; rejected: number; blocked: number }[]
  >`
    select o.seller_id::text as seller_id,
           count(*) filter (where o.admin_status = 'approved')::int as live,
           count(*) filter (where o.admin_status = 'rejected')::int as rejected,
           count(*) filter (where o.admin_status = 'blocked')::int as blocked
    from shop.offers o where o.deleted_at is null and o.seller_id::text = any(${[...new Set(offers.map((o) => o.seller_id))]})
    group by o.seller_id
  `;
  const historyBySeller = new Map(history.map((h) => [h.seller_id, h]));

  const items = [
    ...shops.map((shop) => ({
      type: "shop_activation" as const,
      id: shop.id,
      sellerId: shop.id,
      title: shop.name,
      sellerName: shop.name,
      status: status,
      shopStatus: shop.shop_status,
      reason: shop.reason,
      createdAt: shop.requested_at,
      reviewedAt: shop.reviewed_at,
      activation: {
        providerId: shop.provider_id,
        providerName: shop.provider_name,
        city: shop.city,
        phone: shop.phone,
        requestedCategories: (shop.shop_request?.categoryIds ?? []).map(
          (id) => ({ id, name: categoryNames.get(id) ?? id })
        ),
        licenceUrl: shop.shop_request?.licenceUrl ?? null,
        history: {
          live: shop.live,
          pending: shop.pending,
          rejected: shop.rejected,
          blocked: shop.blocked,
        },
      },
    })),
    ...offers.map((offer) => ({
      type:
        offer.admin_status === "blocked"
          ? ("blocked" as const)
          : ("listing" as const),
      id: offer.id,
      sellerId: offer.seller_id,
      title: offer.variant_name
        ? `${offer.product_name} — ${offer.variant_name}`
        : offer.product_name,
      sellerName: offer.seller_name,
      status: status,
      shopStatus: offer.shop_status,
      reason: offer.reason,
      createdAt: offer.created_at,
      reviewedAt: offer.reviewed_at,
      listing: {
        productId: offer.product_id,
        image: offer.image,
        currency: offer.currency,
        price: Number(offer.price),
        stockQuantity: offer.stock_quantity,
        handlingDays: offer.handling_days,
        categories: offer.category_names ?? [],
        categoryAllowed: offer.allowed,
        otherSellers: {
          count: offer.other_sellers,
          minPrice: offer.other_min == null ? null : Number(offer.other_min),
          maxPrice: offer.other_max == null ? null : Number(offer.other_max),
        },
        sellerHistory: historyBySeller.get(offer.seller_id) ?? {
          live: 0,
          rejected: 0,
          blocked: 0,
        },
      },
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );
  return { status, pendingCount: pending_count, categories: await listActiveCategories(), items };
}

const needReason = (reason: string | null | undefined) => {
  if (!reason?.trim())
    throw new ShopApiError("validation_error", "A reason is required.", [
      { field: "reason", message: "Write a short reason." },
    ]);
  return reason.trim();
};

export type ShopDecision =
  | { decision: "approve"; categoryIds: string[] }
  | { decision: "reject"; reason: string }
  | { decision: "suspend"; reason: string }
  | { decision: "unsuspend" };

export async function decideShop(
  principal: PortalPrincipal,
  sellerId: string,
  input: ShopDecision
) {
  requireAdmin(principal);
  return sql.begin(async (tx) => {
    const [seller] = await tx<SellerRow[]>`
      select ${SELLER_COLUMNS} from shop.sellers s
      where s.id = ${sellerId}::uuid and s.deleted_at is null and s.service_provider_id is not null and not s.is_default
      for update
    `;
    if (!seller) throw notFound("Shop");
    const state = stateOf(seller);
    let note: string | null = null;
    if (input.decision === "approve") {
      if (state !== "requested")
        throw new ShopApiError(
          "conflict",
          "Only a waiting request can be approved."
        );
      if (!input.categoryIds.length) {
        throw new ShopApiError(
          "validation_error",
          "Choose at least one allowed category.",
          [{ field: "categoryIds", message: "Required." }]
        );
      }
      const found = await tx<{ id: string }[]>`
        select id::text as id from shop.categories where id::text = any(${input.categoryIds}) and deleted_at is null
      `;
      if (found.length !== new Set(input.categoryIds).size) {
        throw new ShopApiError("validation_error", "Unknown category id(s).", [
          { field: "categoryIds", message: "Choose categories from the list." },
        ]);
      }
      await tx`delete from shop.seller_categories where seller_id = ${sellerId}::uuid`;
      for (const id of new Set(input.categoryIds)) {
        await tx`
          insert into shop.seller_categories (seller_id, category_id, created_by_user_id)
          values (${sellerId}::uuid, ${id}::uuid, ${principal.actorUserId}::uuid)
        `;
      }
      await tx`
        update shop.sellers set shop_status = 'active', shop_status_reason = null,
          shop_request = shop_request || '{"state":"approved"}'::jsonb,
          shop_reviewed_at = now(), shop_reviewed_by_user_id = ${principal.actorUserId}::uuid, last_modified_date = now()
        where id = ${sellerId}::uuid
      `;
    } else if (input.decision === "reject") {
      note = needReason(input.reason);
      if (state !== "requested")
        throw new ShopApiError(
          "conflict",
          "Only a waiting request can be rejected."
        );
      await tx`
        update shop.sellers set shop_status_reason = ${note}, shop_request = shop_request || '{"state":"rejected"}'::jsonb,
          shop_reviewed_at = now(), shop_reviewed_by_user_id = ${principal.actorUserId}::uuid, last_modified_date = now()
        where id = ${sellerId}::uuid
      `;
    } else if (input.decision === "suspend") {
      note = needReason(input.reason);
      if (state !== "active")
        throw new ShopApiError(
          "conflict",
          "Only an active shop can be suspended."
        );
      await tx`
        update shop.sellers set shop_status = 'suspended', shop_status_reason = ${note},
          shop_reviewed_at = now(), shop_reviewed_by_user_id = ${principal.actorUserId}::uuid, last_modified_date = now()
        where id = ${sellerId}::uuid
      `;
    } else {
      if (state !== "suspended")
        throw new ShopApiError(
          "conflict",
          "Only a suspended shop can be unsuspended."
        );
      await tx`
        update shop.sellers set shop_status = 'active', shop_status_reason = null,
          shop_reviewed_at = now(), shop_reviewed_by_user_id = ${principal.actorUserId}::uuid, last_modified_date = now()
        where id = ${sellerId}::uuid
      `;
    }
    await writeAudit(tx, {
      tokenId: null,
      sellerId,
      actorUserId: principal.actorUserId,
      source: "portal",
      ip: principal.ip,
      action: `shop.${input.decision}`,
      entityType: "seller",
      entityId: sellerId,
      note,
    });
    return { sellerId, decision: input.decision };
  });
}

export type OfferDecision =
  | { decision: "approve" }
  | { decision: "reject"; reason: string }
  | { decision: "block"; reason: string }
  | { decision: "unblock" };

const OFFER_TRANSITIONS: Record<
  OfferDecision["decision"],
  { from: string[]; to: string }
> = {
  approve: { from: ["pending"], to: "approved" },
  reject: { from: ["pending"], to: "rejected" },
  block: { from: ["pending", "approved", "rejected"], to: "blocked" },
  unblock: { from: ["blocked"], to: "approved" },
};

export async function decideOffer(
  principal: PortalPrincipal,
  offerId: string,
  input: OfferDecision
) {
  requireAdmin(principal);
  const note =
    input.decision === "reject" || input.decision === "block"
      ? needReason(input.reason)
      : null;
  return sql.begin(async (tx) => {
    const [offer] = await tx<{ seller_id: string; admin_status: string }[]>`
      select o.seller_id::text as seller_id, o.admin_status from shop.offers o
      join shop.sellers s on s.id = o.seller_id and s.service_provider_id is not null and not s.is_default
      where o.id = ${offerId}::uuid and o.deleted_at is null
      for update of o
    `;
    if (!offer) throw notFound("Offer");
    const transition = OFFER_TRANSITIONS[input.decision];
    if (!transition.from.includes(offer.admin_status)) {
      throw new ShopApiError(
        "conflict",
        `This listing is ${offer.admin_status}; it cannot be changed with "${input.decision}".`
      );
    }
    await tx`
      update shop.offers set admin_status = ${transition.to}, admin_status_reason = ${note},
        -- A blocked listing is switched off; after unblocking the seller switches it on again.
        is_active = case when ${input.decision === "block"} then false else is_active end,
        admin_reviewed_at = now(), admin_reviewed_by_user_id = ${principal.actorUserId}::uuid, last_modified_date = now()
      where id = ${offerId}::uuid
    `;
    await writeAudit(tx, {
      tokenId: null,
      sellerId: offer.seller_id,
      actorUserId: principal.actorUserId,
      source: "portal",
      ip: principal.ip,
      action: `offer.${input.decision}`,
      entityType: "offer",
      entityId: offerId,
      note,
    });
    return { offerId, decision: input.decision, adminStatus: transition.to };
  });
}
