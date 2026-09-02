import "server-only";

import { productSearchSchema } from "../schemas/catalog";
import type { ProductCard, ProductDetail, ShopCategory } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency, resolvePrices, resolvePrice } from "../lib/pricing";
import { sql } from "../lib/db";
import { joinSql, sortProductsSql } from "../lib/query-helpers";

/**
 * Storefront read model. Every price that leaves this module is already
 * resolved into the request's display currency by `../lib/pricing`
 * (SHP-V01-025, SHP-CHK-013, SHP-API-006). Raw `base_price` never reaches the client.
 */

type RawProductRow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  sourceCurrency: string;
  sourceMinPrice: number;
  sourceMaxPrice: number;
  sourceCompareAt: number | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  hasStock: boolean;
  allowBackorder: boolean;
  totalCount?: number;
};

/** Wishlisted product ids for the current customer (empty for guests). Inlined
 *  here rather than imported to avoid a cycle with wishlist.repository. */
async function loadWishlistIds(): Promise<Set<string>> {
  const ctx = await getShopContext();
  if (!ctx.customerId) return new Set();
  const rows = await sql<{ id: string }[]>`
    select wi.product_id::text as id
    from shop.wishlist_items wi
    join shop.wishlists w on w.id = wi.wishlist_id
    where w.customer_id = ${ctx.customerId}::uuid
  `;
  return new Set(rows.map((r) => r.id));
}

async function priceCards(rows: RawProductRow[], displayCurrency: string, wishlistIds?: Set<string>): Promise<ProductCard[]> {
  const priced = await resolvePrices(
    rows.map((r) => ({
      ref: r,
      amount: Number(r.sourceMinPrice),
      sourceCurrency: r.sourceCurrency,
      compareAtAmount: r.sourceCompareAt != null ? Number(r.sourceCompareAt) : null,
    })),
    displayCurrency
  );
  const maxPriced = await resolvePrices(
    rows.map((r) => ({ ref: r, amount: Number(r.sourceMaxPrice), sourceCurrency: r.sourceCurrency })),
    displayCurrency
  );

  return priced.map((p, i) => {
    const r = p.ref;
    const price = p.price.amount;
    const compareAt = p.compareAtPrice && !p.compareAtPrice.unavailable ? p.compareAtPrice.amount : null;
    const hasDiscount = compareAt != null && compareAt > price;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      shortDescription: r.shortDescription ?? "",
      imageUrl: r.imageUrl,
      brandName: r.brandName,
      categoryName: r.categoryName,
      currency: p.price.currency,
      price,
      priceMax: maxPriced[i]?.price.amount ?? price,
      compareAtPrice: compareAt,
      priceUnavailable: p.price.unavailable,
      sourceCurrency: r.sourceCurrency,
      sourcePrice: Number(r.sourceMinPrice),
      discountPercent: hasDiscount ? Math.round((1 - price / compareAt!) * 100) : null,
      rating: Number(r.rating) || 0,
      reviewCount: Number(r.reviewCount) || 0,
      soldCount: Number(r.soldCount) || 0,
      isFeatured: r.isFeatured,
      isBestSeller: r.isBestSeller,
      isNewArrival: r.isNewArrival,
      hasDiscount,
      hasStock: r.hasStock,
      isPreorder: !r.hasStock && r.allowBackorder,
      wishlistActive: wishlistIds ? wishlistIds.has(r.id) : false,
    };
  });
}

export async function getShopCategories(locale?: string): Promise<ShopCategory[]> {
  const lang = normalizeLocale(locale ?? (await getShopContext()).locale);
  return sql<ShopCategory[]>`
    select
      c.id::text as id,
      c.parent_id::text as "parentId",
      common.get_translation_t(c.name_translations, ${lang}, 'en') as name,
      c.slug,
      c.image_url as "imageUrl",
      c.banner_url as "bannerUrl",
      c.icon,
      c.gradient,
      count(distinct pc.product_id)::int as "productCount"
    from shop.categories c
    left join shop.product_categories pc on pc.category_id = c.id
    left join shop.products p on p.id = pc.product_id and p.deleted_at is null and p.status = 'active'
    where c.deleted_at is null and c.is_active = true
    group by c.id
    order by c.display_order asc, name asc
  `;
}

/**
 * Active brands that have at least one active, listable product — the brand
 * facet for the search/category filter bar (SHP-V02-005).
 */
export async function getShopBrands(
  locale?: string,
  categorySlug?: string
): Promise<Array<{ slug: string; name: string; productCount: number }>> {
  const lang = normalizeLocale(locale ?? (await getShopContext()).locale);
  return sql<Array<{ slug: string; name: string; productCount: number }>>`
    select b.slug,
      common.get_translation_t(b.name_translations, ${lang}, 'en') as name,
      count(distinct p.id)::int as "productCount"
    from shop.brands b
    join shop.products p on p.brand_id = b.id and p.deleted_at is null and p.status = 'active'
    ${
      categorySlug
        ? sql`join shop.product_categories pc on pc.product_id = p.id
               join shop.categories c on c.id = pc.category_id and c.slug = ${categorySlug}`
        : sql``
    }
    where b.deleted_at is null and b.is_active = true
    group by b.slug, name
    order by "productCount" desc, name asc
    limit 24
  `;
}

export async function searchProducts(
  input: unknown,
  opts?: { locale?: string; displayCurrency?: string }
): Promise<{ items: ProductCard[]; total: number; page: number; pageSize: number }> {
  const filters = productSearchSchema.parse(input ?? {});
  const ctx = await getShopContext();
  const lang = normalizeLocale(opts?.locale ?? ctx.locale);
  const displayCurrency =
    opts?.displayCurrency ?? (await resolveDisplayCurrency(ctx)).currency;

  const conditions = [sql`p.deleted_at is null`, sql`p.status = 'active'`];
  if (filters.category)
    conditions.push(sql`exists (select 1 from shop.product_categories pc join shop.categories c on c.id = pc.category_id where pc.product_id = p.id and c.slug = ${filters.category})`);
  if (filters.brand)
    conditions.push(sql`exists (select 1 from shop.brands b where b.id = p.brand_id and b.slug = ${filters.brand})`);
  if (filters.featuredOnly) conditions.push(sql`p.is_featured = true`);
  if (filters.discountedOnly)
    conditions.push(sql`p.compare_at_price is not null and p.compare_at_price > coalesce(price_summary.min_price, p.base_price)`);
  if (filters.slugs && filters.slugs.length) conditions.push(sql`p.slug = any(${filters.slugs})`);
  if (filters.minRating > 0) conditions.push(sql`coalesce(review_summary.avg_rating, 0) >= ${filters.minRating}`);
  if (filters.inStockOnly) conditions.push(sql`coalesce(price_summary.has_stock, false) = true`);
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(sql`(
      p.search_vector @@ websearch_to_tsquery('simple', ${filters.q})
      or common.get_translation_t(p.name_translations, ${lang}, 'en') ilike ${like}
      or common.get_translation_t(p.short_description_translations, ${lang}, 'en') ilike ${like}
      or exists (select 1 from shop.brands b where b.id = p.brand_id and common.get_translation_t(b.name_translations, ${lang}, 'en') ilike ${like})
    )`);
  }
  const whereSql = sql`where ${joinSql(conditions, sql` and `)}`;
  const offset = (filters.page - 1) * filters.pageSize;

  const rows = await sql<(RawProductRow & { total_count: number })[]>`
    with review_summary as (
      select product_id, avg(rating)::float as avg_rating, count(*)::int as review_count
      from shop.product_reviews where status = 'approved' group by product_id
    ),
    order_summary as (
      select oi.product_id, sum(oi.quantity)::int as units_sold
      from shop.order_items oi join shop.orders o on o.id = oi.order_id
      where o.status in ('paid','processing','partially_shipped','shipped','completed')
      group by oi.product_id
    )
    select
      p.id::text as id,
      p.slug,
      common.get_translation_t(p.name_translations, ${lang}, 'en') as name,
      common.get_translation_t(p.short_description_translations, ${lang}, 'en') as "shortDescription",
      pm.url as "imageUrl",
      common.get_translation_t(b.name_translations, ${lang}, 'en') as "brandName",
      common.get_translation_t(c.name_translations, ${lang}, 'en') as "categoryName",
      p.base_currency as "sourceCurrency",
      coalesce(price_summary.min_price, p.base_price)::float as "sourceMinPrice",
      coalesce(price_summary.max_price, p.base_price)::float as "sourceMaxPrice",
      p.compare_at_price::float as "sourceCompareAt",
      coalesce(review_summary.avg_rating, 0)::float as rating,
      coalesce(review_summary.review_count, 0)::int as "reviewCount",
      coalesce(order_summary.units_sold, 0)::int as "soldCount",
      p.is_featured as "isFeatured",
      p.is_best_seller as "isBestSeller",
      p.is_new_arrival as "isNewArrival",
      p.allow_backorder as "allowBackorder",
      coalesce(price_summary.has_stock, false) as "hasStock",
      count(*) over()::int as total_count
    from shop.products p
    left join shop.brands b on b.id = p.brand_id
    left join shop.categories c on c.id = p.primary_category_id
    left join shop.v_product_price_summary price_summary on price_summary.product_id = p.id
    left join lateral (
      select url from shop.product_media pm where pm.product_id = p.id order by pm.is_primary desc, pm.display_order asc limit 1
    ) pm on true
    left join review_summary on review_summary.product_id = p.id
    left join order_summary on order_summary.product_id = p.id
    ${whereSql}
    order by ${sortProductsSql(filters.sort)}
    limit ${filters.pageSize} offset ${offset}
  `;

  const total = rows[0]?.total_count ?? 0;
  const wishlistIds = ctx.customerId ? await loadWishlistIds() : undefined;
  const items = await priceCards(rows, displayCurrency, wishlistIds);

  // price sort must run on the resolved comparison currency, not raw source
  // amounts (SHP-CHK-018 / SHP-NFR-017)
  if (filters.sort === "price_asc") items.sort((a, b) => a.price - b.price);
  if (filters.sort === "price_desc") items.sort((a, b) => b.price - a.price);
  if (filters.minPrice > 0 || filters.maxPrice > 0) {
    // client-provided bounds are in the display currency
  }

  const filtered = items.filter(
    (it) =>
      (filters.minPrice <= 0 || it.price >= filters.minPrice) &&
      (filters.maxPrice <= 0 || it.price <= filters.maxPrice)
  );

  return { items: filtered, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getProductBySlug(slug: string, locale?: string): Promise<ProductDetail | null> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(locale ?? ctx.locale);
  const displayCurrency = (await resolveDisplayCurrency(ctx)).currency;

  const baseRows = await sql<any[]>`
    with review_summary as (
      select product_id, avg(rating)::float as avg_rating, count(*)::int as review_count
      from shop.product_reviews where status = 'approved' group by product_id
    ),
    order_summary as (
      select oi.product_id, sum(oi.quantity)::int as units_sold
      from shop.order_items oi join shop.orders o on o.id = oi.order_id
      where o.status in ('paid','processing','partially_shipped','shipped','completed')
      group by oi.product_id
    )
    select
      p.id::text as id, p.slug,
      common.get_translation_t(p.name_translations, ${lang}, 'en') as name,
      common.get_translation_t(p.short_description_translations, ${lang}, 'en') as "shortDescription",
      common.get_translation_t(p.description_translations, ${lang}, 'en') as description,
      p.base_currency as "sourceCurrency",
      coalesce(ps.min_price, p.base_price)::float as "sourceMinPrice",
      coalesce(ps.max_price, p.base_price)::float as "sourceMaxPrice",
      p.compare_at_price::float as "sourceCompareAt",
      p.requires_shipping as "requiresShipping",
      p.fulfillment_type as "fulfillmentType",
      p.allow_backorder as "allowBackorder",
      coalesce(ps.has_stock, false) as "hasStock",
      coalesce(review_summary.avg_rating, 0)::float as rating,
      coalesce(review_summary.review_count, 0)::int as "reviewCount",
      coalesce(order_summary.units_sold, 0)::int as "soldCount",
      p.is_featured as "isFeatured", p.is_best_seller as "isBestSeller", p.is_new_arrival as "isNewArrival",
      p.is_preorder as "isPreorder", p.preorder_release_at::text as "preorderReleaseAt",
      p.preorder_limit as "preorderLimit",
      p.preorder_payment_policy::text as "preorderPaymentPolicy",
      p.preorder_deposit_percent::float as "preorderDepositPercent",
      coalesce((
        select sum(oi.quantity)::int from shop.order_items oi
        join shop.orders o on o.id = oi.order_id
        where oi.product_id = p.id and oi.is_preorder = true and o.status not in ('cancelled','refunded','returned')
      ), 0) as "preorderSold",
      common.get_translation_t(b.name_translations, ${lang}, 'en') as "brandName",
      common.get_translation_t(c.name_translations, ${lang}, 'en') as "categoryName",
      coalesce((
        select sum(greatest(i.on_hand - i.reserved, 0))::int
        from shop.inventory i where i.product_id = p.id and i.variant_id is null
      ), 0) as "inventoryAvailable"
    from shop.products p
    left join shop.brands b on b.id = p.brand_id
    left join shop.categories c on c.id = p.primary_category_id
    left join shop.v_product_price_summary ps on ps.product_id = p.id
    left join review_summary on review_summary.product_id = p.id
    left join order_summary on order_summary.product_id = p.id
    where p.slug = ${slug} and p.deleted_at is null and p.status = 'active'
    limit 1
  `;
  const row = baseRows[0];
  if (!row) return null;

  const [card] = await priceCards(
    [
      {
        ...row,
        rating: row.rating,
        reviewCount: row.reviewCount,
        soldCount: row.soldCount,
        allowBackorder: row.allowBackorder,
      } as RawProductRow,
    ],
    displayCurrency,
    await loadWishlistIds()
  );

  const [gallery, categories, variantRows, attrRows, reviews, serviceLinks, questions] = await Promise.all([
    sql<any[]>`select id::text as id, url, media_type as "mediaType", common.get_translation_t(alt_translations, ${lang}, 'en') as alt, is_primary as "isPrimary" from shop.product_media where product_id = ${row.id}::uuid order by is_primary desc, display_order asc`,
    sql<ShopCategory[]>`select c.id::text as id, c.parent_id::text as "parentId", common.get_translation_t(c.name_translations, ${lang}, 'en') as name, c.slug, c.image_url as "imageUrl", c.banner_url as "bannerUrl", c.icon, c.gradient, 0::int as "productCount" from shop.product_categories pc join shop.categories c on c.id = pc.category_id where pc.product_id = ${row.id}::uuid`,
    sql<any[]>`
      select v.id::text as id, v.sku, v.slug,
        common.get_translation_t(v.title_translations, ${lang}, 'en') as title,
        v.option_key as "optionKey", v.price::float as price, v.compare_at_price::float as "compareAtPrice",
        v.currency as "sourceCurrency", v.allow_backorder as "allowBackorder",
        coalesce((select sum(greatest(i.on_hand - i.reserved,0))::int from shop.inventory i where i.variant_id = v.id), 0) as "inventoryAvailable"
      from shop.product_variants v
      where v.product_id = ${row.id}::uuid and v.deleted_at is null and v.is_active = true
      order by v.price asc
    `,
    sql<any[]>`
      select a.id::text as "attributeId", a.slug,
        common.get_translation_t(a.name_translations, ${lang}, 'en') as name,
        coalesce(jsonb_agg(jsonb_build_object(
          'id', av.id::text, 'value', av.value,
          'displayName', common.get_translation_t(av.display_name_translations, ${lang}, 'en'),
          'colorHex', av.color_hex
        ) order by av.value) filter (where av.id is not null), '[]'::jsonb) as values
      from shop.product_attributes pa
      join shop.attributes a on a.id = pa.attribute_id
      left join shop.attribute_values av on av.attribute_id = a.id
      where pa.product_id = ${row.id}::uuid
      group by a.id
      order by min(pa.display_order)
    `,
    sql<any[]>`select pr.id::text as id, pr.rating, pr.title, pr.body, pr.create_date::text as "createDate", concat_ws(' ', c.first_name, c.last_name) as "customerName", pr.is_verified_purchase as "isVerifiedPurchase" from shop.product_reviews pr left join customer.customers c on c.id = pr.customer_id where pr.product_id = ${row.id}::uuid and pr.status = 'approved' order by pr.create_date desc limit 20`,
    sql<any[]>`
      select psl.service_definition_id::text as "serviceDefinitionId", psl.relation_type as "relationType",
        coalesce(common.get_translation_t(sd.name_translations, ${lang}, 'en'), '') as name
      from shop.product_service_links psl
      left join category.service_definitions sd on sd.id = psl.service_definition_id
      where psl.product_id = ${row.id}::uuid and psl.is_active = true
      order by psl.display_order asc
    `,
    sql<any[]>`
      select q.id::text as id, q.question, q.answer, q.create_date::text as "createDate"
      from shop.product_questions q
      where q.product_id = ${row.id}::uuid and q.status = 'answered'
      order by q.last_modified_date desc limit 10
    `,
  ]);

  const variants = await Promise.all(
    variantRows.map(async (v) => {
      const pr = await resolvePrice({
        amount: Number(v.price),
        sourceCurrency: v.sourceCurrency,
        compareAtAmount: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
        displayCurrency,
      });
      return {
        id: v.id,
        sku: v.sku,
        slug: v.slug,
        title: v.title ?? v.sku,
        optionKey: v.optionKey,
        price: pr.price.amount,
        compareAtPrice: pr.compareAtPrice && !pr.compareAtPrice.unavailable ? pr.compareAtPrice.amount : null,
        currency: pr.price.currency,
        priceUnavailable: pr.price.unavailable,
        inventoryAvailable: Number(v.inventoryAvailable) || 0,
        allowBackorder: Boolean(v.allowBackorder),
        hasStock: Number(v.inventoryAvailable) > 0 || Boolean(v.allowBackorder),
        selections: {},
      };
    })
  );

  const related = await searchProducts(
    { category: categories[0]?.slug, sort: "popularity", page: 1, pageSize: 8 },
    { locale: lang, displayCurrency }
  );

  const preorderLimit = row.preorderLimit == null ? null : Number(row.preorderLimit);
  return {
    ...card,
    description: row.description ?? "",
    requiresShipping: Boolean(row.requiresShipping),
    fulfillmentType: row.fulfillmentType,
    allowBackorder: Boolean(row.allowBackorder),
    inventoryAvailable: Number(row.inventoryAvailable) || 0,
    isPreorder: Boolean(row.isPreorder) || Boolean((card as { isPreorder?: boolean }).isPreorder),
    preorderConfigured: Boolean(row.isPreorder),
    preorderReleaseAt: row.preorderReleaseAt ?? null,
    preorderPaymentPolicy: row.preorderPaymentPolicy ?? "full",
    preorderDepositPercent: row.preorderDepositPercent == null ? null : Number(row.preorderDepositPercent),
    preorderRemaining: preorderLimit == null ? null : Math.max(0, preorderLimit - Number(row.preorderSold || 0)),
    gallery,
    categories,
    attributes: attrRows.map((a) => ({ attributeId: a.attributeId, name: a.name, slug: a.slug, values: a.values })),
    variants,
    relatedServices: serviceLinks.map((s) => ({ serviceDefinitionId: s.serviceDefinitionId, name: s.name, relationType: s.relationType })),
    questions: questions.map((q) => ({ id: q.id, question: q.question, answer: q.answer, createDate: q.createDate })),
    reviews,
    relatedProducts: related.items.filter((x) => x.id !== row.id).slice(0, 8),
  };
}
