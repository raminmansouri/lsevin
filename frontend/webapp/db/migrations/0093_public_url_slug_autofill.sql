-- Every public catalog record gets a slug, so no public URL shows a UUID.
--
-- 0092 holds the reviewed mapping for the rows that existed on 1 November 2026.
-- This migration gives the same kind of slug to the rows created since, and a
-- trigger gives one to every new row. The rules match the reviewed proposal
-- (docs/seo/slug-backfill-review.md): the English name first, else the Persian
-- name transliterated to lowercase ASCII; words joined by hyphens; a service is
-- prefixed with its provider's slug; a taken slug gets -2, -3, ...
--
-- A slug is only filled in, never rewritten: renaming a provider keeps its URL.

create or replace function category.public_slug_base(name text, fallback text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both '-' from left(
        regexp_replace(
          lower(translate(
            -- Letters written with two Latin letters first, then one-to-one;
            -- diacritics, ع, ء and the zero-width non-joiner are dropped.
            replace(replace(replace(replace(replace(replace(replace(
              coalesce(name, ''),
              'خ', 'kh'), 'ش', 'sh'), 'چ', 'ch'), 'ژ', 'zh'), 'غ', 'gh'), 'ث', 'th'), 'ذ', 'dh'),
            'اآأإٱبپتطجحهةدضرزظسصفقکكگلمنوؤیيىئ۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩àáâãäåāÀÁÂÃÄÅĀèéêëēÈÉÊËĒìíîïıīÌÍÎÏİĪòóôõöøōÒÓÔÕÖØŌùúûüūÙÚÛÜŪýÿÝçÇñÑşŞğĞعءًٌٍَُِّْ‌ـ',
            'aaaaabpttjhhhdzrzzssfqkkglmnvvyyyy01234567890123456789aaaaaaaaaaaaaaeeeeeeeeeeiiiiiiiiiiiioooooooooooooouuuuuuuuuuyyyccnnssgg'
          )),
          '[^a-z0-9]+', '-', 'g'
        ),
        120
      )),
      ''
    ),
    fallback
  );
$$;

comment on function category.public_slug_base(text, text) is
  'Lowercase, hyphenated ASCII slug base for a public name; the fallback when nothing is left.';

-- First free slug in a table: base, base-2, base-3, ... Table names come from
-- the trigger, never from user input.
create or replace function category.public_slug_unique(target regclass, base text, self_id uuid)
returns text
language plpgsql
as $$
declare
  candidate text := base;
  suffix int := 2;
  taken boolean;
begin
  loop
    execute format('select exists (select 1 from %s where slug = $1 and id is distinct from $2)', target)
      into taken using candidate, self_id;
    exit when not taken;
    candidate := base || '-' || suffix;
    suffix := suffix + 1;
  end loop;
  return candidate;
end;
$$;

create or replace function category.fill_public_slug()
returns trigger
language plpgsql
as $$
declare
  name text;
  base text;
  provider_slug text;
begin
  if coalesce(new.slug, '') <> '' then
    return new;
  end if;

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

  new.slug := category.public_slug_unique(tg_relid::regclass, base, new.id);
  return new;
end;
$$;

comment on function category.fill_public_slug() is
  'Gives a new or still slug-less public catalog row its permanent URL slug.';

create or replace trigger service_providers_public_slug
  before insert or update on category.service_providers
  for each row execute function category.fill_public_slug();
create or replace trigger provider_types_public_slug
  before insert or update on category.provider_types
  for each row execute function category.fill_public_slug();
create or replace trigger staff_public_slug
  before insert or update on category.staff
  for each row execute function category.fill_public_slug();
create or replace trigger special_packages_public_slug
  before insert or update on marketing.special_packages
  for each row execute function category.fill_public_slug();
create or replace trigger provider_services_public_slug
  before insert or update on category.provider_services
  for each row execute function category.fill_public_slug();

-- Rows without a slug yet (created after the reviewed snapshot), one at a time
-- and oldest first, so earlier records keep the plain slug. Providers go before
-- services, because a service slug starts with its provider's.
do $$
declare
  tbl text;
  row_id uuid;
begin
  foreach tbl in array array[
    'category.service_providers', 'category.provider_types', 'category.staff',
    'marketing.special_packages', 'category.provider_services'
  ] loop
    for row_id in execute format('select id from %s where slug is null order by create_date nulls last, id', tbl) loop
      execute format('update %s set slug = null where id = $1', tbl) using row_id;
    end loop;
  end loop;
end;
$$;
