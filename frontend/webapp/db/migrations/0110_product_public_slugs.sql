-- Descriptive product URLs (2026-11-16).
--
-- Product slugs came from supplier model codes and fragments: /fa/products/v209,
-- /08c, /af, /adaptor, /blood-pressure-monitor-4. A search result URL should say
-- what the page is about, and every product here has an English name
-- ("Varna Pregnancy Support Belt – Model V209"), so a weak slug is replaced by one
-- built from that name: /fa/products/varna-pregnancy-support-belt-model-v209.
--
-- 1. shop.product_slug_history keeps every slug a product has had; the product
--    page answers an old slug with a permanent redirect to the current one, so
--    no existing link, bookmark or indexed URL breaks.
-- 2. A trigger records every slug change (admin form, seller API, portal) in the
--    history. It never rewrites a slug someone chose: renaming happens once,
--    below, for the existing weak slugs.
-- 3. Existing products with a weak slug are renamed once below.
--
-- A slug is weak when it ends in a -2/-3 duplicate counter, or has fewer than two
-- real words (three or more letters): "v209", "08c", "af", "bl-888", "adaptor".

create table if not exists shop.product_slug_history (
  slug       text        primary key,
  product_id uuid        not null references shop.products(id) on delete cascade,
  retired_at timestamptz not null default now()
);
create index if not exists product_slug_history_product_idx on shop.product_slug_history (product_id);
comment on table shop.product_slug_history is
  'Previous product URL slugs; each one permanently redirects to the product''s current slug.';

create or replace function shop.slug_from_text(value text)
returns text
language sql
immutable
as $$
  -- lower-case ASCII words joined by "-", at most 80 characters, cut at a word.
  select nullif(
           regexp_replace(
             left(
               btrim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'), '-'),
               81
             ),
             -- cut back to the last whole word when the 81st character was mid-word
             case when length(btrim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'), '-')) > 80
                  then '-?[a-z0-9]*$' else '$^' end,
             ''
           ),
           ''
         );
$$;

create or replace function shop.product_slug_is_weak(value text)
returns boolean
language sql
immutable
as $$
  select value is null
      or value ~ '-[0-9]+$'
      or (select count(*) from regexp_split_to_table(value, '-') as word where word ~ '^[a-z]{3,}$') < 2;
$$;

create or replace function shop.product_slug_from_name(names jsonb)
returns text
language sql
immutable
as $$
  select shop.slug_from_text(coalesce(nullif(btrim(names ->> 'en'), ''), nullif(btrim(names ->> 'en-US'), '')));
$$;

-- First free slug for a product: base, base-2, base-3, ... (taken by another
-- product now, or once in its history).
create or replace function shop.product_slug_unique(base text, self_id uuid)
returns text
language plpgsql
as $$
declare
  candidate text := base;
  suffix int := 2;
begin
  loop
    exit when not exists (select 1 from shop.products p where p.slug = candidate and p.id is distinct from self_id)
          and not exists (select 1 from shop.product_slug_history h where h.slug = candidate and h.product_id is distinct from self_id);
    candidate := base || '-' || suffix;
    suffix := suffix + 1;
  end loop;
  return candidate;
end;
$$;

create or replace function shop.products_slug_history()
returns trigger
language plpgsql
as $$
begin
  if old.slug is distinct from new.slug then
    if old.slug is not null then
      insert into shop.product_slug_history (slug, product_id) values (old.slug, new.id)
      on conflict (slug) do update set product_id = excluded.product_id, retired_at = now();
    end if;
    -- A product taking back one of its own old slugs: it is current again.
    delete from shop.product_slug_history where slug = new.slug and product_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists products_public_slug on shop.products;
drop trigger if exists products_slug_history on shop.products;
create trigger products_slug_history
  before update of slug on shop.products
  for each row execute function shop.products_slug_history();

-- Rename the existing weak slugs once (the trigger records the old ones). One
-- product at a time in creation order, so two products with the same English
-- name get the same "-2" on every site that runs this (A and B each apply their
-- own migrations; a set-based UPDATE has no defined row order).
do $$
declare
  product record;
begin
  for product in
    select id from shop.products
     where deleted_at is null
       and shop.product_slug_is_weak(slug)
       and shop.product_slug_from_name(name_translations) is not null
     order by create_date, id
  loop
    update shop.products p
       set slug = shop.product_slug_unique(shop.product_slug_from_name(p.name_translations), p.id)
     where p.id = product.id
       -- only when the name gives something better than the code it replaces
       and (not shop.product_slug_is_weak(shop.product_slug_from_name(p.name_translations))
            or length(shop.product_slug_from_name(p.name_translations)) > length(p.slug));
  end loop;
end;
$$;
