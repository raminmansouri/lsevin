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
    default: return sql`p.is_best_seller desc, p.is_featured desc, p.create_date desc`;
  }
}
