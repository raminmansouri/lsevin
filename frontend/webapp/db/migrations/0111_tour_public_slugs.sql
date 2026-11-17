-- Tour URLs that say what the tour is (2026-11-16).
--
-- Tour slugs are typed by the operator and some ignore the tour's own English
-- title: /tours/sahelvgisom is "Autumn Tour of Gisoom Beach and Forest",
-- /tours/maro-lavan is "A Trip to the Dreamlike Islands of Maru and Lavan".
--
-- 1. tour.tour_slug_history keeps every slug a tour has had; the tour page
--    answers an old slug with one permanent redirect to the current one.
-- 2. Once, below: a slug that shares fewer than two words with the tour's
--    published English title is replaced by a slug built from that title. A
--    tour without an English title keeps its slug, and so do slugs that already
--    describe the tour (kish-island-beaches-and-sunset). Later slugs are the
--    operator's choice; the trigger only records changes in the history.
-- Uses shop.slug_from_text (migration 0110).

create table if not exists tour.tour_slug_history (
  slug       text        primary key,
  tour_id    uuid        not null references tour.tours(id) on delete cascade,
  retired_at timestamptz not null default now()
);
create index if not exists tour_slug_history_tour_idx on tour.tour_slug_history (tour_id);
comment on table tour.tour_slug_history is
  'Previous tour URL slugs; each one permanently redirects to the tour''s current slug.';

-- Record a replaced slug; a tour taking back one of its old slugs makes it current.
create or replace function tour.tours_slug_history()
returns trigger
language plpgsql
as $$
begin
  if old.slug is distinct from new.slug then
    insert into tour.tour_slug_history (slug, tour_id) values (old.slug, new.id)
    on conflict (slug) do update set tour_id = excluded.tour_id, retired_at = now();
    delete from tour.tour_slug_history where slug = new.slug and tour_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists tours_slug_history on tour.tours;
create trigger tours_slug_history
  before update of slug on tour.tours
  for each row execute function tour.tours_slug_history();

-- Words of three or more letters two slugs have in common.
create or replace function tour.slug_shared_words(a text, b text)
returns integer
language sql
immutable
as $$
  select count(distinct w)::int
    from regexp_split_to_table(coalesce(a, ''), '-') as w
   where w ~ '^[a-z]{3,}$' and w = any (regexp_split_to_array(coalesce(b, ''), '-'));
$$;

create or replace function tour.public_slug_upgrade(p_tour uuid)
returns void
language plpgsql
as $$
declare
  current_slug text;
  titled text;
  candidate text;
  suffix int := 2;
begin
  select t.slug into current_slug from tour.tours t where t.id = p_tour;
  if current_slug is null then return; end if;

  select shop.slug_from_text(regexp_replace(c.published_value, '^\s*(a|an|the)\s+', '', 'i')) into titled
    from tour.content c
   where c.entity_type = 'tour' and c.entity_id = p_tour and c.field_key = 'title'
     and c.locale::text like 'en%' and nullif(btrim(c.published_value), '') is not null
   order by c.locale::text = 'en-US' desc
   limit 1;

  -- Fits the column's check (at most 81 characters): a longer title is cut
  -- back to its last whole word within 78.
  if length(titled) > 78 then
    titled := regexp_replace(left(titled, 79), '-?[a-z0-9]*$', '');
  end if;
  if titled is null or titled = '' or tour.slug_shared_words(current_slug, titled) >= 2 then
    return;
  end if;

  candidate := titled;
  while exists (select 1 from tour.tours t where t.slug = candidate and t.id <> p_tour)
     or exists (select 1 from tour.tour_slug_history h where h.slug = candidate and h.tour_id <> p_tour) loop
    candidate := titled || '-' || suffix;
    suffix := suffix + 1;
  end loop;

  update tour.tours set slug = candidate where id = p_tour and slug <> candidate;
end;
$$;

drop trigger if exists content_title_slug on tour.content;
drop function if exists tour.content_title_slug();

-- Existing tours, one at a time in creation order (same result on every site).
do $$
declare
  t record;
begin
  for t in select id from tour.tours order by created_at, id loop
    perform tour.public_slug_upgrade(t.id);
  end loop;
end;
$$;
