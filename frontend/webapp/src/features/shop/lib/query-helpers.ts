import { sql } from "./db";
export function joinSql(parts: any[], separator: any) {
  return parts.slice(1).reduce((acc, part) => sql`${acc}${separator}${part}`, parts[0]);
}
export function sortProductsSql(sort: string) {
  switch (sort) {
    case "newest": return sql`p.published_at desc nulls last, p.create_date desc`;
    case "price_asc": return sql`price_summary.min_price asc nulls last, p.create_date desc`;
    case "price_desc": return sql`price_summary.max_price desc nulls last, p.create_date desc`;
    case "rating": return sql`coalesce(review_summary.avg_rating, 0) desc, coalesce(review_summary.review_count, 0) desc, p.create_date desc`;
    case "low_stock": return sql`(
      select coalesce(sum(o.stock_quantity) filter (where o.stock_quantity is not null), 2147483647)
      from shop.offers o
      where o.product_id = p.id and o.deleted_at is null and o.is_active and o.admin_status = 'approved'
    ) asc, coalesce(order_summary.units_sold, 0) desc, p.create_date desc`;
    default: return sql`p.is_best_seller desc, p.is_featured desc, p.create_date desc`;
  }
}
