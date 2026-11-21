-- Isolated staging clone only. Never run against production.
-- An active seller and an approved offer let browser tests prove the public
-- storefront title, canonical URL, sitemap entry, and product association.
with seller as (
  insert into shop.sellers (slug, name_translations, description_translations, shop_status, is_active)
  values (
    'seo-test-seller',
    '{"fa-IR":"فروشگاه آزمایشی سئو","en-US":"SEO Test Seller"}'::jsonb,
    '{"fa-IR":"فروشگاه نمونه برای آزمون صفحه فروشنده","en-US":"Test storefront for seller SEO checks"}'::jsonb,
    'active', true
  )
  on conflict (slug) do update set
    name_translations = excluded.name_translations,
    description_translations = excluded.description_translations,
    shop_status = 'active', is_active = true, deleted_at = null
  returning id
)
insert into shop.offers (product_id, variant_id, seller_id, currency, price, stock_quantity, is_active, admin_status)
select o.product_id, o.variant_id, seller.id, o.currency, o.price, 3, true, 'approved'
from seller cross join lateral (
  select o.product_id, o.variant_id, o.currency, o.price
  from shop.offers o join shop.products p on p.id = o.product_id
  where o.deleted_at is null and o.is_active and o.admin_status = 'approved'
    and p.deleted_at is null and p.status = 'active'
  order by o.create_date limit 1
) o
where not exists (
  select 1 from shop.offers existing
  where existing.seller_id = seller.id and existing.product_id = o.product_id
    and existing.variant_id is not distinct from o.variant_id and existing.deleted_at is null
);
