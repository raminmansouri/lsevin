-- Categories get public slugs, so category links read /fa/categories/hotel
-- instead of /fa/categories?parent=<uuid> and /fa/map?categoryId=<uuid>.
--
-- Same rules as the other public catalog records (0091, 0093, 0094): the English
-- name first, else the Persian name transliterated; a taken slug gets -2, -3...;
-- once given, a slug only changes when an English name is added to a record that
-- had a Persian-only slug, and every previous slug keeps redirecting.

alter table category.categories add column if not exists slug text null;

create unique index if not exists categories_slug_uq
  on category.categories (slug) where slug is not null;

-- The slug history learns the new kind.
alter table category.public_slug_history drop constraint if exists public_slug_history_kind_check;
alter table category.public_slug_history add constraint public_slug_history_kind_check
  check (kind in ('provider', 'specialty', 'service', 'specialist', 'package', 'category'));

create or replace function category.public_slug_kind(target regclass)
returns text
language sql
stable
as $$
  select case target
    when 'category.service_providers'::regclass then 'provider'
    when 'category.provider_types'::regclass    then 'specialty'
    when 'category.provider_services'::regclass then 'service'
    when 'category.staff'::regclass             then 'specialist'
    when 'marketing.special_packages'::regclass then 'package'
    when 'category.categories'::regclass        then 'category'
  end;
$$;

-- 0094's function with one more table (categories).
create or replace function category.fill_public_slug()
returns trigger
language plpgsql
as $$
declare
  name text;
  base text;
  provider_slug text;
  slug_kind text := category.public_slug_kind(tg_relid::regclass);
  old_english text;
  new_english text;
begin
  if tg_op = 'UPDATE' and coalesce(old.slug, '') <> '' and new.slug is not distinct from old.slug then
    -- The one automatic slug change: the English name has just been added to a
    -- record that only had a Persian one.
    old_english := category.public_slug_english_name(tg_table_name, to_jsonb(old));
    new_english := category.public_slug_english_name(tg_table_name, to_jsonb(new));
    if coalesce(old_english, '') !~ '[A-Za-z]' and coalesce(new_english, '') ~ '[A-Za-z]' then
      new.slug := null;
    end if;
  end if;

  if coalesce(new.slug, '') = '' then
    if tg_table_name = 'service_providers' then
      name := coalesce(nullif(trim(new.name_translations ->> 'en-US'), ''), new.name_translations ->> 'fa-IR');
      base := category.public_slug_base(name, 'provider');
    elsif tg_table_name = 'provider_types' then
      name := coalesce(nullif(trim(new.name_translations ->> 'en-US'), ''), new.name_translations ->> 'fa-IR');
      base := category.public_slug_base(name, 'specialty');
    elsif tg_table_name = 'staff' then
      name := coalesce(nullif(trim(new.name_translations ->> 'en-US'), ''), new.name_translations ->> 'fa-IR');
      base := category.public_slug_base(name, 'specialist');
    elsif tg_table_name = 'special_packages' then
      name := coalesce(nullif(trim(new.title_translations ->> 'en-US'), ''), new.title_translations ->> 'fa-IR');
      base := category.public_slug_base(name, 'package');
    elsif tg_table_name = 'categories' then
      name := coalesce(nullif(trim(new.name_translations ->> 'en-US'), ''), new.name_translations ->> 'fa-IR');
      base := category.public_slug_base(name, 'category');
    elsif tg_table_name = 'provider_services' then
      select coalesce(
               nullif(trim(new.display_name_translations ->> 'en-US'), ''),
               nullif(trim(sd.name_translations ->> 'en-US'), ''),
               nullif(trim(new.display_name_translations ->> 'fa-IR'), ''),
               sd.name_translations ->> 'fa-IR')
        into name
        from category.service_definitions sd
       where sd.id = new.service_definition_id;
      name := coalesce(name, nullif(trim(new.display_name_translations ->> 'en-US'), ''), new.display_name_translations ->> 'fa-IR');
      select sp.slug into provider_slug from category.service_providers sp where sp.id = new.service_provider_id;
      base := coalesce(provider_slug, 'provider') || '-' || category.public_slug_base(name, 'service');
    else
      return new;
    end if;

    -- A record that gets its own old slug back reuses it rather than a -2.
    new.slug := category.public_slug_unique(tg_relid::regclass, base, new.id);
  elsif exists (
    select 1 from category.public_slug_history h
     where h.kind = slug_kind and h.slug = new.slug and h.entity_id <> new.id
  ) then
    raise exception 'public slug "%" is reserved for another % (it used to be its URL)', new.slug, slug_kind
      using errcode = 'unique_violation';
  end if;

  if tg_op = 'UPDATE' and coalesce(old.slug, '') <> '' and new.slug is distinct from old.slug then
    insert into category.public_slug_history (kind, slug, entity_id)
    values (slug_kind, old.slug, old.id)
    on conflict (kind, slug) do nothing;
  end if;

  -- The current slug is never also a "previous" one.
  delete from category.public_slug_history h
   where h.kind = slug_kind and h.slug = new.slug and h.entity_id = new.id;

  return new;
end;
$$;

comment on function category.fill_public_slug() is
  'Gives a public catalog row (provider, specialty, service, specialist, package, category) its URL slug, upgrades a Persian-only slug once the English name is added, and keeps every previous slug as a redirect.';

create or replace trigger categories_public_slug
  before insert or update on category.categories
  for each row execute function category.fill_public_slug();

-- Existing categories, top level first, so a parent keeps the plain slug if a
-- child ever shares its name.
do $$
declare
  row_id uuid;
begin
  for row_id in
    select id from category.categories
     where slug is null
     order by (parent_id is not null), display_order, create_date, id
  loop
    update category.categories set slug = null where id = row_id;
  end loop;
end;
$$;
