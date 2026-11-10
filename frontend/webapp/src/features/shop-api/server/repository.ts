import "server-only";

import type { TransactionSql } from "postgres";

import sql from "@/config/database/db";

import type {
  CreateOfferInput,
  CreateProductInput,
  ProductContentInput,
  UpdateOfferInput,
  UpdateProductInput,
} from "../schemas";
import type { ShopApiPrincipal } from "./auth";
import { notFound, ShopApiError } from "./errors";

/**
 * Data access for the Shop API. Every function takes the authenticated principal and filters by
 * its seller in SQL, so another seller's rows are invisible: they answer "not found", exactly
 * like rows that do not exist.
 */

// Helpers run inside sql.begin transactions or on the pool; the pool is used through the same type.
type Tx = TransactionSql;
const root = sql as unknown as Tx;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const j = (value: unknown) => sql.json((value ?? {}) as any);

// ------------------------------------------------------------------------------------------------
// Serialisation
// ------------------------------------------------------------------------------------------------

type ProductRow = {
  id: string;
  slug: string;
  status: string;
  api_review_status: string | null;
  api_review_note: string | null;
  name_translations: Record<string, string>;
  short_description_translations: Record<string, string>;
  description_translations: Record<string, string>;
  base_currency: string;
  primary_category_id: string | null;
  category_ids: string[] | null;
  images: string[] | null;
  pending_changes: Record<string, unknown> | null;
  create_date: Date;
  last_modified_date: Date;
};

const PRODUCT_SELECT = (tx: Tx) => tx`
  select p.id::text as id, p.slug, p.status::text as status, p.api_review_status, p.api_review_note,
         p.name_translations, p.short_description_translations, p.description_translations,
         p.base_currency, p.primary_category_id::text as primary_category_id,
         coalesce((select array_agg(pc.category_id::text order by pc.is_primary desc, pc.category_id)
                     from shop.product_categories pc where pc.product_id = p.id), '{}') as category_ids,
         coalesce((select array_agg(m.url order by m.is_primary desc, m.display_order)
                     from shop.product_media m where m.product_id = p.id and m.variant_id is null), '{}') as images,
         (select r.changes from shop.product_change_requests r
           where r.product_id = p.id and r.status = 'pending') as pending_changes,
         p.create_date, p.last_modified_date
  from shop.products p
`;

export function serializeProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    // draft = not in the storefront yet; active = live; archived = withdrawn.
    status: row.status,
    review: {
      status: row.api_review_status ?? "approved",
      note: row.api_review_note,
      // Edits of an approved product that are waiting for an admin (the live product is unchanged).
      pendingChanges: row.pending_changes,
    },
    name: row.name_translations ?? {},
    shortDescription: row.short_description_translations ?? {},
    description: row.description_translations ?? {},
    currency: row.base_currency,
    primaryCategoryId: row.primary_category_id,
    categoryIds: row.category_ids ?? [],
    images: row.images ?? [],
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

type OfferRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  seller_sku: string | null;
  currency: string;
  price: string;
  compare_at_price: string | null;
  stock_quantity: number | null;
  handling_days: number | null;
  is_active: boolean;
  create_date: Date;
  last_modified_date: Date;
};

const OFFER_COLUMNS = (tx: Tx) => tx`
  o.id::text as id, o.product_id::text as product_id, o.variant_id::text as variant_id, o.seller_sku, o.currency,
  o.price::text as price, o.compare_at_price::text as compare_at_price, o.stock_quantity, o.handling_days,
  o.is_active, o.create_date, o.last_modified_date
`;

export function serializeOffer(row: OfferRow) {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    sellerSku: row.seller_sku,
    currency: row.currency,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    stockQuantity: row.stock_quantity,
    handlingDays: row.handling_days,
    isActive: row.is_active,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

// ------------------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------------------

async function audit(tx: Tx, principal: ShopApiPrincipal, action: string, entityType: string, entityId: string | null) {
  await tx`
    insert into shop.api_audit_log (token_id, seller_id, action, entity_type, entity_id, ip)
    values (${principal.tokenId}::uuid, ${principal.sellerId}::uuid, ${action}, ${entityType}, ${entityId}::uuid, ${principal.ip})
  `;
}

async function assertCategoriesExist(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  const rows = await tx<{ id: string }[]>`
    select id::text as id from shop.categories
    where id::text = any(${ids}) and deleted_at is null and is_active = true
  `;
  const found = new Set(rows.map((row) => row.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    throw new ShopApiError("validation_error", "Unknown category id(s).", missing.map((id) => ({ field: "categoryIds", message: `Category ${id} does not exist.` })));
  }
}

function slugBase(input: { slug?: string; name?: Record<string, string> }) {
  if (input.slug) return input.slug;
  const latin = (input.name?.en ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return latin.length >= 2 ? latin.slice(0, 80) : "product";
}

async function freeSlug(tx: Tx, wanted: string, exceptProductId?: string) {
  const rows = await tx<{ slug: string }[]>`
    select slug from shop.products
    where (slug = ${wanted} or slug like ${`${wanted}-%`})
      and (${exceptProductId ?? null}::uuid is null or id <> ${exceptProductId ?? null}::uuid)
  `;
  const taken = new Set(rows.map((row) => row.slug));
  let slug = wanted;
  for (let n = 2; taken.has(slug); n += 1) slug = `${wanted}-${n}`;
  return slug;
}

/**
 * Writes product content (name, descriptions, slug, categories, images). Used for API products
 * still under review and when an admin approves a change request.
 */
export async function applyProductContent(tx: Tx, productId: string, changes: Partial<ProductContentInput>) {
  const categoryIds = changes.categoryIds;
  const primary = changes.primaryCategoryId;
  if (categoryIds || primary) await assertCategoriesExist(tx, [...(categoryIds ?? []), ...(primary ? [primary] : [])]);
  const slug = changes.slug ? await freeSlug(tx, changes.slug, productId) : null;

  await tx`
    update shop.products set
      name_translations = coalesce(${changes.name ? j(changes.name) : null}::jsonb, name_translations),
      short_description_translations = coalesce(${changes.shortDescription ? j(changes.shortDescription) : null}::jsonb, short_description_translations),
      description_translations = coalesce(${changes.description ? j(changes.description) : null}::jsonb, description_translations),
      slug = coalesce(${slug}, slug),
      primary_category_id = case when ${primary !== undefined} then ${primary ?? null}::uuid else primary_category_id end,
      last_modified_date = now()
    where id = ${productId}::uuid
  `;
  if (categoryIds || primary !== undefined) {
    const [current] = await tx<{ primary_category_id: string | null }[]>`
      select primary_category_id::text as primary_category_id from shop.products where id = ${productId}::uuid
    `;
    const primaryId = current?.primary_category_id ?? null;
    const ids =
      categoryIds ??
      (await tx<{ id: string }[]>`select category_id::text as id from shop.product_categories where product_id = ${productId}::uuid`).map((r) => r.id);
    await tx`delete from shop.product_categories where product_id = ${productId}::uuid`;
    for (const id of new Set([...ids, ...(primaryId ? [primaryId] : [])])) {
      await tx`
        insert into shop.product_categories (product_id, category_id, is_primary)
        values (${productId}::uuid, ${id}::uuid, ${id === primaryId}) on conflict do nothing
      `;
    }
  }
  if (changes.images) {
    await tx`delete from shop.product_media where product_id = ${productId}::uuid and variant_id is null`;
    let order = 0;
    for (const url of changes.images) {
      await tx`
        insert into shop.product_media (product_id, url, media_type, display_order, is_primary)
        values (${productId}::uuid, ${url}, 'image', ${order}, ${order === 0})
      `;
      order += 1;
    }
  }
  // Same search vector as the admin editor (SHP-V01-005).
  await tx`
    update shop.products
    set search_vector =
      setweight(to_tsvector('simple', coalesce(name_translations->>'en','')), 'A') ||
      setweight(to_tsvector('simple', coalesce(short_description_translations->>'en','')), 'B')
    where id = ${productId}::uuid
  `;
}

// ------------------------------------------------------------------------------------------------
// Products
// ------------------------------------------------------------------------------------------------

export async function listOwnProducts(
  principal: ShopApiPrincipal,
  options: { page: number; pageSize: number; status?: string | null },
) {
  const status = options.status && ["draft", "active", "archived"].includes(options.status) ? options.status : null;
  const rows = await sql<ProductRow[]>`
    ${PRODUCT_SELECT(root)}
    where p.owner_seller_id = ${principal.sellerId}::uuid and p.deleted_at is null
      and (${status}::text is null or p.status::text = ${status})
    order by p.create_date desc, p.id
    limit ${options.pageSize} offset ${(options.page - 1) * options.pageSize}
  `;
  const [{ total }] = await sql<{ total: number }[]>`
    select count(*)::int as total from shop.products p
    where p.owner_seller_id = ${principal.sellerId}::uuid and p.deleted_at is null
      and (${status}::text is null or p.status::text = ${status})
  `;
  return { data: rows.map(serializeProduct), page: options.page, pageSize: options.pageSize, total };
}

export async function getOwnProduct(principal: ShopApiPrincipal, productId: string, tx: Tx = root) {
  const [row] = await tx<ProductRow[]>`
    ${PRODUCT_SELECT(tx)}
    where p.id = ${productId}::uuid and p.owner_seller_id = ${principal.sellerId}::uuid and p.deleted_at is null
  `;
  if (!row) throw notFound("Product");
  return serializeProduct(row);
}

export async function createOwnProduct(principal: ShopApiPrincipal, input: CreateProductInput) {
  return sql.begin(async (tx) => {
    await assertCategoriesExist(tx, [...(input.categoryIds ?? []), ...(input.primaryCategoryId ? [input.primaryCategoryId] : [])]);
    const slug = await freeSlug(tx, slugBase(input));
    const shortDescription = input.shortDescription ?? {};
    const [row] = await tx<{ id: string }[]>`
      insert into shop.products (
        product_type, status, slug, base_currency, base_price, compare_at_price,
        name_translations, short_description_translations, description_translations,
        primary_category_id, tax_class, requires_shipping, owner_seller_id, api_review_status
      ) values (
        'simple', 'draft', ${slug}, ${input.currency}, ${input.offer?.price ?? 0}, ${input.offer?.compareAtPrice ?? null},
        ${j(input.name)}, ${j(shortDescription)}, ${j(input.description ?? {})},
        ${input.primaryCategoryId ?? null}::uuid, 'standard', true, ${principal.sellerId}::uuid, 'pending'
      )
      returning id::text as id
    `;
    await applyProductContent(tx, row.id, { categoryIds: input.categoryIds, primaryCategoryId: input.primaryCategoryId, images: input.images });
    if (input.offer) {
      await tx`
        insert into shop.offers (product_id, seller_id, seller_sku, currency, price, compare_at_price, stock_quantity, handling_days, is_active)
        values (${row.id}::uuid, ${principal.sellerId}::uuid, ${input.offer.sellerSku ?? null}, ${input.currency}, ${input.offer.price},
          ${input.offer.compareAtPrice ?? null}, ${input.offer.stockQuantity ?? null}, ${input.offer.handlingDays ?? null}, ${input.offer.isActive ?? true})
      `;
    }
    await audit(tx, principal, "product.create", "product", row.id);
    return getOwnProduct(principal, row.id, tx);
  });
}

/**
 * Content edit. A product that was never approved is edited in place (it stays in review). For
 * an approved product the edit waits in a change request (merged with any pending one) and the
 * live product is unchanged until an admin approves.
 */
export async function updateOwnProduct(principal: ShopApiPrincipal, productId: string, input: UpdateProductInput) {
  return sql.begin(async (tx) => {
    const [product] = await tx<{ api_review_status: string | null }[]>`
      select api_review_status from shop.products
      where id = ${productId}::uuid and owner_seller_id = ${principal.sellerId}::uuid and deleted_at is null
      for update
    `;
    if (!product) throw notFound("Product");
    await assertCategoriesExist(tx, [...(input.categoryIds ?? []), ...(input.primaryCategoryId ? [input.primaryCategoryId] : [])]);

    if (product.api_review_status !== "approved") {
      await applyProductContent(tx, productId, input);
      await tx`
        update shop.products set api_review_status = 'pending', api_review_note = null where id = ${productId}::uuid
      `;
      await audit(tx, principal, "product.update", "product", productId);
      return { product: await getOwnProduct(principal, productId, tx), appliedImmediately: true };
    }

    await tx`
      insert into shop.product_change_requests (product_id, seller_id, token_id, changes)
      values (${productId}::uuid, ${principal.sellerId}::uuid, ${principal.tokenId}::uuid, ${j(input)})
      on conflict (product_id) where status = 'pending'
      do update set changes = shop.product_change_requests.changes || excluded.changes,
                    token_id = excluded.token_id, last_modified_date = now()
    `;
    await audit(tx, principal, "product.change_request", "product", productId);
    return { product: await getOwnProduct(principal, productId, tx), appliedImmediately: false };
  });
}

/** Removes the product from the storefront for good, with its offers and pending edits. */
export async function deleteOwnProduct(principal: ShopApiPrincipal, productId: string) {
  return sql.begin(async (tx) => {
    const deleted = await tx`
      update shop.products set status = 'archived', deleted_at = now(), last_modified_date = now()
      where id = ${productId}::uuid and owner_seller_id = ${principal.sellerId}::uuid and deleted_at is null
    `;
    if (deleted.count === 0) throw notFound("Product");
    await tx`
      update shop.offers set is_active = false, deleted_at = now(), last_modified_date = now()
      where product_id = ${productId}::uuid and deleted_at is null
    `;
    await tx`
      update shop.product_change_requests set status = 'rejected', review_note = 'Product deleted by the seller.', last_modified_date = now()
      where product_id = ${productId}::uuid and status = 'pending'
    `;
    await audit(tx, principal, "product.delete", "product", productId);
  });
}

// ------------------------------------------------------------------------------------------------
// Offers (always the token's own seller)
// ------------------------------------------------------------------------------------------------

export async function listOwnOffers(
  principal: ShopApiPrincipal,
  options: { page: number; pageSize: number; productId?: string | null },
) {
  const productId = options.productId ?? null;
  const rows = await sql<OfferRow[]>`
    select ${OFFER_COLUMNS(root)} from shop.offers o
    where o.seller_id = ${principal.sellerId}::uuid and o.deleted_at is null
      and (${productId}::uuid is null or o.product_id = ${productId}::uuid)
    order by o.create_date desc, o.id
    limit ${options.pageSize} offset ${(options.page - 1) * options.pageSize}
  `;
  const [{ total }] = await sql<{ total: number }[]>`
    select count(*)::int as total from shop.offers o
    where o.seller_id = ${principal.sellerId}::uuid and o.deleted_at is null
      and (${productId}::uuid is null or o.product_id = ${productId}::uuid)
  `;
  return { data: rows.map(serializeOffer), page: options.page, pageSize: options.pageSize, total };
}

export async function getOwnOffer(principal: ShopApiPrincipal, offerId: string, tx: Tx = root) {
  const [row] = await tx<OfferRow[]>`
    select ${OFFER_COLUMNS(tx)} from shop.offers o
    where o.id = ${offerId}::uuid and o.seller_id = ${principal.sellerId}::uuid and o.deleted_at is null
  `;
  if (!row) throw notFound("Offer");
  return serializeOffer(row);
}

/**
 * A seller may sell its own products, and products of the platform catalog that are live.
 * Another seller's own products are not visible to it (not found).
 */
export async function createOwnOffer(principal: ShopApiPrincipal, input: CreateOfferInput) {
  return sql.begin(async (tx) => {
    const [product] = await tx<{ base_currency: string }[]>`
      select base_currency from shop.products
      where id = ${input.productId}::uuid and deleted_at is null
        and (owner_seller_id = ${principal.sellerId}::uuid or (owner_seller_id is null and status = 'active'))
    `;
    if (!product) throw notFound("Product");
    if (input.variantId) {
      const [variant] = await tx`
        select 1 from shop.product_variants
        where id = ${input.variantId}::uuid and product_id = ${input.productId}::uuid and deleted_at is null
      `;
      if (!variant) throw new ShopApiError("validation_error", "This variant does not belong to the product.", [{ field: "variantId", message: "Unknown variant." }]);
    }
    try {
      const [row] = await tx<{ id: string }[]>`
        insert into shop.offers (product_id, variant_id, seller_id, seller_sku, currency, price, compare_at_price,
          stock_quantity, handling_days, is_active)
        values (${input.productId}::uuid, ${input.variantId ?? null}::uuid, ${principal.sellerId}::uuid, ${input.sellerSku ?? null},
          ${product.base_currency}, ${input.price}, ${input.compareAtPrice ?? null}, ${input.stockQuantity ?? null},
          ${input.handlingDays ?? null}, ${input.isActive ?? true})
        returning id::text as id
      `;
      await audit(tx, principal, "offer.create", "offer", row.id);
      return getOwnOffer(principal, row.id, tx);
    } catch (error) {
      if ((error as { code?: string })?.code === "23505") {
        throw new ShopApiError("conflict", "You already have an offer for this item. Update it with PATCH /offers/{id}.");
      }
      throw error;
    }
  });
}

export async function updateOwnOffer(principal: ShopApiPrincipal, offerId: string, input: UpdateOfferInput) {
  return sql.begin(async (tx) => {
    const [current] = await tx<{ price: string; compare_at_price: string | null }[]>`
      select price::text as price, compare_at_price::text as compare_at_price from shop.offers
      where id = ${offerId}::uuid and seller_id = ${principal.sellerId}::uuid and deleted_at is null
      for update
    `;
    if (!current) throw notFound("Offer");
    const price = input.price ?? Number(current.price);
    const compareAt = input.compareAtPrice !== undefined ? input.compareAtPrice : current.compare_at_price == null ? null : Number(current.compare_at_price);
    if (compareAt != null && compareAt < price) {
      throw new ShopApiError("validation_error", "compareAtPrice must not be lower than price.", [{ field: "compareAtPrice", message: "Lower than price." }]);
    }
    const has = (key: keyof UpdateOfferInput) => Object.prototype.hasOwnProperty.call(input, key);
    await tx`
      update shop.offers set
        price = ${price},
        compare_at_price = ${compareAt},
        stock_quantity = case when ${has("stockQuantity")} then ${input.stockQuantity ?? null}::int else stock_quantity end,
        seller_sku = case when ${has("sellerSku")} then ${input.sellerSku ?? null} else seller_sku end,
        handling_days = case when ${has("handlingDays")} then ${input.handlingDays ?? null}::int else handling_days end,
        is_active = coalesce(${input.isActive ?? null}::boolean, is_active),
        last_modified_date = now()
      where id = ${offerId}::uuid and seller_id = ${principal.sellerId}::uuid
    `;
    await audit(tx, principal, "offer.update", "offer", offerId);
    return getOwnOffer(principal, offerId, tx);
  });
}

export async function deleteOwnOffer(principal: ShopApiPrincipal, offerId: string) {
  return sql.begin(async (tx) => {
    const deleted = await tx`
      update shop.offers set is_active = false, deleted_at = now(), last_modified_date = now()
      where id = ${offerId}::uuid and seller_id = ${principal.sellerId}::uuid and deleted_at is null
    `;
    if (deleted.count === 0) throw notFound("Offer");
    await audit(tx, principal, "offer.delete", "offer", offerId);
  });
}

// ------------------------------------------------------------------------------------------------
// Platform catalog (read-only)
// ------------------------------------------------------------------------------------------------

export async function listCatalogProducts(options: { page: number; pageSize: number; search?: string | null; categoryId?: string | null }) {
  const search = options.search?.trim() ? `%${options.search.trim()}%` : null;
  const categoryId = options.categoryId ?? null;
  const where = sql`
    p.deleted_at is null and p.status = 'active' and p.owner_seller_id is null
    and (${search}::text is null or p.slug ilike ${search} or exists (
      select 1 from jsonb_each_text(case when jsonb_typeof(p.name_translations) = 'object' then p.name_translations else '{}'::jsonb end) t
      where t.value ilike ${search}))
    and (${categoryId}::uuid is null or exists (
      select 1 from shop.product_categories pc where pc.product_id = p.id and pc.category_id = ${categoryId}::uuid))
  `;
  const rows = await sql<{ id: string; slug: string; name_translations: Record<string, string>; base_currency: string; primary_category_id: string | null; image: string | null; has_variants: boolean }[]>`
    select p.id::text as id, p.slug, p.name_translations, p.base_currency, p.primary_category_id::text as primary_category_id,
           (select m.url from shop.product_media m where m.product_id = p.id order by m.is_primary desc, m.display_order limit 1) as image,
           exists (select 1 from shop.product_variants v where v.product_id = p.id and v.deleted_at is null) as has_variants
    from shop.products p
    where ${where}
    order by p.create_date desc, p.id
    limit ${options.pageSize} offset ${(options.page - 1) * options.pageSize}
  `;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from shop.products p where ${where}`;
  return {
    data: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name_translations ?? {},
      currency: row.base_currency,
      primaryCategoryId: row.primary_category_id,
      image: row.image,
      hasVariants: row.has_variants,
    })),
    page: options.page,
    pageSize: options.pageSize,
    total,
  };
}

export async function listCatalogVariants(productId: string) {
  const [product] = await sql`
    select 1 from shop.products where id = ${productId}::uuid and deleted_at is null and status = 'active' and owner_seller_id is null
  `;
  if (!product) throw notFound("Product");
  const rows = await sql<{ id: string; sku: string | null; title_translations: Record<string, string> | null }[]>`
    select v.id::text as id, v.sku, v.title_translations
    from shop.product_variants v
    where v.product_id = ${productId}::uuid and v.deleted_at is null and v.is_active
    order by v.sku nulls last, v.id
  `;
  return { data: rows.map((row) => ({ id: row.id, sku: row.sku, title: row.title_translations ?? {} })) };
}

export async function listCategories() {
  const rows = await sql<{ id: string; parent_id: string | null; slug: string; name_translations: Record<string, string> }[]>`
    select c.id::text as id, c.parent_id::text as parent_id, c.slug, c.name_translations
    from shop.categories c
    where c.deleted_at is null and c.is_active = true
    order by c.display_order nulls last, c.slug
  `;
  return { data: rows.map((row) => ({ id: row.id, parentId: row.parent_id, slug: row.slug, name: row.name_translations ?? {} })) };
}
