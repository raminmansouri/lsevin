-- Old public slugs keep working (docs/seo/lsevin-url-tasks.md T7: "if a slug has
-- to change, keep the previous one and redirect").
--
-- 1. category.public_slug_history remembers every slug a record has had. The
--    public pages look a slug up there when no current record has it and send a
--    permanent redirect to the current one.
-- 2. A record whose name existed only in Persian got a transliterated slug
--    without vowels (klynyk-...). When an admin adds the English name later, the
--    slug moves to the English form once; the old slug goes into the history.
--    Any other rename still keeps the URL.
-- 3. A slug in the history stays reserved for its record, so it never starts
--    pointing at a different page.

create table if not exists category.public_slug_history (
  kind       text        not null check (kind in ('provider', 'specialty', 'service', 'specialist', 'package')),
  slug       text        not null,
  entity_id  uuid        not null,
  retired_at timestamptz not null default now(),
  primary key (kind, slug)
);

create index if not exists public_slug_history_entity_idx
  on category.public_slug_history (kind, entity_id);

comment on table category.public_slug_history is
  'Previous public URL slugs; each one permanently redirects to the record''s current slug.';

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
  end;
$$;

-- First free slug: base, base-2, base-3, ... A slug is taken when another record
-- has it now or had it before.
create or replace function category.public_slug_unique(target regclass, base text, self_id uuid)
returns text
language plpgsql
as $$
declare
  candidate text := base;
  suffix int := 2;
  taken boolean;
  slug_kind text := category.public_slug_kind(target);
begin
  loop
    execute format('select exists (select 1 from %s where slug = $1 and id is distinct from $2)', target)
      into taken using candidate, self_id;
    if not taken then
      select exists (
        select 1 from category.public_slug_history h
         where h.kind = slug_kind and h.slug = candidate and h.entity_id is distinct from self_id
      ) into taken;
    end if;
    exit when not taken;
    candidate := base || '-' || suffix;
    suffix := suffix + 1;
  end loop;
  return candidate;
end;
$$;

-- The English public name a slug is built from, per table.
create or replace function category.public_slug_english_name(tbl text, rec jsonb)
returns text
language sql
immutable
as $$
  select nullif(trim(case tbl
    when 'special_packages'  then rec -> 'title_translations' ->> 'en-US'
    when 'provider_services' then rec -> 'display_name_translations' ->> 'en-US'
    else rec -> 'name_translations' ->> 'en-US'
  end), '');
$$;

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
  'Gives a public catalog row its URL slug, upgrades a Persian-only slug once the English name is added, and keeps every previous slug as a redirect.';
