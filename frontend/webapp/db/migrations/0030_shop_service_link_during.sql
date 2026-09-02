-- ---------------------------------------------------------------------------
-- 0030_shop_service_link_during.sql  (SHP-V02-007, SHP-REL-*)
--
-- Adds a "during treatment" relation label to the product ↔ service and
-- category ↔ service link tables, alongside the existing before/after ones.
-- Additive: only widens the allowed set of `relation_type`, existing rows and
-- code are unaffected.
-- ---------------------------------------------------------------------------
set search_path = public;

do $$
begin
  if to_regclass('shop.product_service_links') is not null then
    alter table shop.product_service_links drop constraint if exists product_service_links_relation_type_check;
    alter table shop.product_service_links
      add constraint product_service_links_relation_type_check
      check (relation_type in ('general','recommended_before','recommended_during','recommended_after','compatible','required','optional_addon'));
  end if;

  if to_regclass('shop.category_service_links') is not null then
    alter table shop.category_service_links drop constraint if exists category_service_links_relation_type_check;
    alter table shop.category_service_links
      add constraint category_service_links_relation_type_check
      check (relation_type in ('general','recommended_before','recommended_during','recommended_after','compatible','required','optional_addon'));
  end if;
end $$;
