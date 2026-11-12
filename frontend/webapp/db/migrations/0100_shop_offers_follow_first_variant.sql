begin;

create or replace function shop.sync_default_offer_from_variant() returns trigger
language plpgsql as $$
declare
  seller uuid := shop.default_seller_id();
begin
  if tg_op = 'INSERT' and new.deleted_at is null
     and not exists (
       select 1 from shop.product_variants v
        where v.product_id = new.product_id and v.id <> new.id and v.deleted_at is null
     ) then
    update shop.offers
       set variant_id = new.id, last_modified_date = now()
     where product_id = new.product_id and variant_id is null and deleted_at is null;
  end if;

  if seller is null then return new; end if;

  if new.deleted_at is not null then
    update shop.offers set deleted_at = now(), is_active = false, last_modified_date = now()
     where variant_id = new.id and seller_id = seller and deleted_at is null;
    return new;
  end if;

  update shop.offers
     set price = new.price, compare_at_price = new.compare_at_price,
         allow_backorder = new.allow_backorder, is_preorder = new.is_preorder, last_modified_date = now()
   where variant_id = new.id and seller_id = seller and deleted_at is null;

  return new;
end $$;

create or replace function shop.sync_default_offer_from_product() returns trigger
language plpgsql as $$
declare
  seller uuid := shop.default_seller_id();
begin
  if seller is null or new.deleted_at is not null then return new; end if;
  if exists (select 1 from shop.product_variants v where v.product_id = new.id and v.deleted_at is null) then
    return new;
  end if;

  update shop.offers
     set price = new.base_price, compare_at_price = new.compare_at_price,
         allow_backorder = new.allow_backorder, is_preorder = new.is_preorder, last_modified_date = now()
   where product_id = new.id and variant_id is null and seller_id = seller and deleted_at is null;

  return new;
end $$;

update shop.offers o
   set variant_id = fv.id, last_modified_date = now()
  from (
    select distinct on (product_id) product_id, id
      from shop.product_variants
     where deleted_at is null
     order by product_id, id
  ) fv
 where o.product_id = fv.product_id
   and o.variant_id is null
   and o.deleted_at is null
   and not exists (
     select 1 from shop.offers x where x.variant_id = fv.id and x.seller_id = o.seller_id
   );

commit;
