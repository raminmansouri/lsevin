import { productSearchSchema } from "../schemas/catalog";
import type { ProductCard, ProductDetail, ShopCategory } from "../types/domain";
import { normalizeLocale, resolveCurrentCustomerId, sql } from "../lib/db";
import { joinSql, sortProductsSql } from "../lib/query-helpers";

export async function getShopCategories(locale?: string): Promise<ShopCategory[]> {
  const lang = normalizeLocale(locale);
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

export async function searchProducts(input: any, locale?: string): Promise<{ items: ProductCard[]; total: number }> {
  const filters = productSearchSchema.parse(input);
  const lang = normalizeLocale(locale);
  await resolveCurrentCustomerId();

  const conditions = [sql`p.deleted_at is null`, sql`p.status = 'active'`];
  if (filters.category) conditions.push(sql`exists (select 1 from shop.product_categories pc join shop.categories c on c.id = pc.category_id where pc.product_id = p.id and c.slug = ${filters.category})`);
  if (filters.brand) conditions.push(sql`exists (select 1 from shop.brands b where b.id = p.brand_id and b.slug = ${filters.brand})`);
  if (filters.featuredOnly) conditions.push(sql`p.is_featured = true`);
  if (filters.minRating > 0) conditions.push(sql`coalesce(review_summary.avg_rating, 0) >= ${filters.minRating}`);
  if (filters.inStockOnly) conditions.push(sql`coalesce(price_summary.has_stock, false) = true`);
  if (filters.minPrice > 0) conditions.push(sql`coalesce(price_summary.min_price, p.base_price) >= ${filters.minPrice}`);
  if (filters.maxPrice > 0) conditions.push(sql`coalesce(price_summary.max_price, p.base_price) <= ${filters.maxPrice}`);
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

  const rows = await sql<any[]>`
    with review_summary as (
      select product_id, avg(rating)::float as avg_rating, count(*)::int as review_count
      from shop.product_reviews
      where status = 'approved'
      group by product_id
    ),
    order_summary as (
      select oi.product_id, sum(oi.quantity)::int as units_sold
      from shop.order_items oi join shop.orders o on o.id = oi.order_id
      where o.status in ('paid', 'processing', 'partially_shipped', 'shipped', 'completed')
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
      p.base_currency as currency,
      coalesce(price_summary.min_price, p.base_price)::float as "minPrice",
      coalesce(price_summary.max_price, p.base_price)::float as "maxPrice",
      p.compare_at_price::float as "compareAtPrice",
      coalesce(review_summary.avg_rating, 0)::float as rating,
      coalesce(review_summary.review_count, 0)::int as "reviewCount",
      p.is_featured as "isFeatured",
      p.is_best_seller as "isBestSeller",
      p.is_new_arrival as "isNewArrival",
      (coalesce(price_summary.min_price, p.base_price) < coalesce(p.compare_at_price, 0)) as "hasDiscount",
      coalesce(price_summary.has_stock, false) as "hasStock",
      false as "wishlistActive",
      count(*) over()::int as total_count
    from shop.products p
    left join shop.brands b on b.id = p.brand_id
    left join shop.categories c on c.id = p.primary_category_id
    left join shop.v_product_price_summary price_summary on price_summary.product_id = p.id
    left join lateral (
      select url from shop.product_media pm where pm.product_id = p.id order by pm.is_primary desc, pm.display_order asc limit 1
    ) pm on true
    left join (
      select product_id, avg(rating)::float as avg_rating, count(*)::int as review_count
      from shop.product_reviews where status = 'approved' group by product_id
    ) review_summary on review_summary.product_id = p.id
    ${whereSql}
    order by ${sortProductsSql(filters.sort)}
    limit ${filters.pageSize} offset ${offset}
  `;
  return {
    total: rows[0]?.total_count ?? 0,
    items: rows.map((row) => ({ ...row, minPrice: +row.minPrice, maxPrice: +row.maxPrice, compareAtPrice: row.compareAtPrice == null ? null : +row.compareAtPrice, rating: +row.rating, reviewCount: +row.reviewCount })),
  };
}

export async function getProductBySlug(slug: string, locale?: string): Promise<ProductDetail | null> {
  const lang = normalizeLocale(locale);
  const baseRows = await sql<any[]>`
    select
      p.id::text as id, p.slug,
      common.get_translation_t(p.name_translations, ${lang}, 'en') as name,
      common.get_translation_t(p.short_description_translations, ${lang}, 'en') as "shortDescription",
      common.get_translation_t(p.description_translations, ${lang}, 'en') as description,
      p.base_currency as currency, p.base_price::float as "minPrice", p.base_price::float as "maxPrice",
      p.compare_at_price::float as "compareAtPrice",
      0::float as rating, 0::int as "reviewCount",
      p.is_featured as "isFeatured", p.is_best_seller as "isBestSeller", p.is_new_arrival as "isNewArrival",
      true as "hasStock", false as "wishlistActive",
      common.get_translation_t(b.name_translations, ${lang}, 'en') as "brandName",
      common.get_translation_t(c.name_translations, ${lang}, 'en') as "categoryName"
    from shop.products p
    left join shop.brands b on b.id = p.brand_id
    left join shop.categories c on c.id = p.primary_category_id
    where p.slug = ${slug} and p.deleted_at is null and p.status = 'active'
    limit 1
  `;
  const product = baseRows[0];
  if (!product) return null;
  const gallery = await sql<any[]>`select id::text as id, url, media_type as "mediaType", common.get_translation_t(alt_translations, ${lang}, 'en') as alt, is_primary as "isPrimary" from shop.product_media where product_id = ${product.id}::uuid order by is_primary desc, display_order asc`;
  const categories = await sql<ShopCategory[]>`select c.id::text as id, c.parent_id::text as "parentId", common.get_translation_t(c.name_translations, ${lang}, 'en') as name, c.slug, c.image_url as "imageUrl", c.banner_url as "bannerUrl", c.icon, c.gradient, 0::int as "productCount" from shop.product_categories pc join shop.categories c on c.id = pc.category_id where pc.product_id = ${product.id}::uuid`;
  const variants = await sql<any[]>`select v.id::text as id, v.sku, v.slug, common.get_translation_t(v.title_translations, ${lang}, 'en') as title, v.option_key as "optionKey", v.price::float as price, v.compare_at_price::float as "compareAtPrice", 10::int as "inventoryAvailable", true as "hasStock", '{}'::jsonb as selections from shop.product_variants v where v.product_id = ${product.id}::uuid and v.deleted_at is null and v.is_active = true`;
  const reviews = await sql<any[]>`select pr.id::text as id, pr.rating, pr.title, pr.body, pr.create_date::text as "createDate", concat_ws(' ', c.first_name, c.last_name) as "customerName", pr.is_verified_purchase as "isVerifiedPurchase" from shop.product_reviews pr left join customer.customers c on c.id = pr.customer_id where pr.product_id = ${product.id}::uuid and pr.status = 'approved' order by pr.create_date desc limit 10`;
  const related = await searchProducts({ q: "", category: categories[0]?.slug, sort: "popularity", minPrice: 0, maxPrice: 0, minRating: 0, inStockOnly: false, featuredOnly: false, page: 1, pageSize: 4 }, locale);
  return { ...product, gallery, categories, attributes: [], variants: variants.map(v => ({ ...v, price: +v.price, compareAtPrice: v.compareAtPrice == null ? null : +v.compareAtPrice, inventoryAvailable: +v.inventoryAvailable })), reviews, relatedProducts: related.items.filter(x => x.id !== product.id).slice(0, 4) };
}

export async function getShopHomeData(locale?: string) {
  const categories = await getShopCategories(locale);
  const featured = await searchProducts({ q: "", sort: "popularity", page: 1, pageSize: 8, minPrice: 0, maxPrice: 0, minRating: 0, inStockOnly: false, featuredOnly: true }, locale);
  const bestSellers = await searchProducts({ q: "", sort: "popularity", page: 1, pageSize: 8, minPrice: 0, maxPrice: 0, minRating: 0, inStockOnly: false, featuredOnly: false }, locale);
  const newest = await searchProducts({ q: "", sort: "newest", page: 1, pageSize: 8, minPrice: 0, maxPrice: 0, minRating: 0, inStockOnly: false, featuredOnly: false }, locale);
  return { categories, featured: featured.items, bestSellers: bestSellers.items, newest: newest.items, discounted: bestSellers.items.filter(x => x.hasDiscount).slice(0, 8) };
}
