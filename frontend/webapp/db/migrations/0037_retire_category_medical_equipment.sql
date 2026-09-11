-- Retire the "تجهیزات پزشکی" service category without deleting it.
--
-- The admin panel's delete button cannot remove this category at all:
-- category.service_definitions.category_id is NOT NULL behind
-- fk_service_definitions_categories_category_id with ON DELETE NO ACTION, so
-- Postgres refuses the delete (23503) while any service is still filed under it.
-- The services were never at risk -- the database will not cascade them away --
-- but the category cannot go either until every service is moved elsewhere.
--
-- Hiding beats deleting here. A hard delete would silently strand three things
-- no foreign key protects: category.service_providers.category_id (providers
-- filed under this node), customer.consultings.category_id and
-- search.user_search_history.category_id. Flipping is_active keeps every row
-- intact and every service bookable, and takes the category out of the app.
--
-- The whole subtree, not just the node: the home shelf selects categories by
-- is_active and display_in_home_page with no parent filter, so an active child
-- of a hidden parent would keep showing up on the homepage.
--
-- Only rows that are visible today are touched, and the notices print the two
-- statements that put each field back exactly as it was, so this is reversible.
--
-- Idempotent: re-running finds nothing visible and reports 0 rows hidden.

begin;

do $$
declare
  v_name         text := 'تجهیزات پزشکی';
  v_ids          uuid[];
  v_category_id  uuid;
  v_subtree      uuid[];
  v_was_active   uuid[];
  v_was_on_home  uuid[];
  v_hidden_count integer;
  v_services     integer;
  v_providers    integer;
begin
  -- Matched on any locale key rather than one, because the category module writes
  -- name_translations with whatever locales the admin filled in ('fa-IR', 'fa', ...).
  -- Exact value match, not a LIKE: retiring the wrong category is worse than no match.
  select array_agg(c.id)
    into v_ids
  from category.categories c
  where exists (
    select 1
    from jsonb_each_text(
      -- jsonb_each_text errors on a scalar, and the guard cannot be relied on to
      -- run first in the same WHERE, so non-objects are turned into an empty object.
      case
        when jsonb_typeof(c.name_translations) = 'object' then c.name_translations
        else '{}'::jsonb
      end
    ) kv
    where btrim(kv.value) = v_name
  );

  if v_ids is null then
    raise notice 'No category named % -- nothing done.', v_name;
    return;
  end if;

  if array_length(v_ids, 1) > 1 then
    raise notice 'Ambiguous: % categories are named % (%). Nothing done -- retire the right one by id.',
      array_length(v_ids, 1), v_name, v_ids;
    return;
  end if;

  v_category_id := v_ids[1];

  with recursive subtree as (
    select c.id
    from category.categories c
    where c.id = v_category_id
    union all
    select child.id
    from category.categories child
    join subtree parent on child.parent_id = parent.id
  )
  select array_agg(id) into v_subtree from subtree;

  -- Snapshot before the update: a row can be active while already hidden from the
  -- homepage, and restoring both fields blindly would put it back on the homepage.
  select array_agg(c.id) filter (where c.is_active),
         array_agg(c.id) filter (where coalesce(c.display_in_home_page, true))
    into v_was_active, v_was_on_home
  from category.categories c
  where c.id = any(v_subtree);

  update category.categories c
     set is_active            = false,
         display_in_home_page = false,
         last_modified_date   = now()
   where c.id = any(v_subtree)
     and (c.is_active or coalesce(c.display_in_home_page, true));

  get diagnostics v_hidden_count = row_count;

  -- Reported, not changed. Both keep pointing at the category exactly as they do
  -- today; the counts are here so the operator sees what stays behind.
  select count(*) into v_services
  from category.service_definitions sd
  where sd.category_id = v_category_id;

  select count(*) into v_providers
  from category.service_providers sp
  where sp.category_id = v_category_id;

  raise notice 'Category "%" (%) retired: % of % rows in its subtree hidden.',
    v_name, v_category_id, v_hidden_count, coalesce(array_length(v_subtree, 1), 0);
  raise notice '% service definitions stay attached and bookable -- none moved, none deleted.', v_services;
  raise notice '% providers are filed under this category. Their rows are untouched, but they drop out of category browsing until they are re-filed.', v_providers;
  raise notice 'To undo:';
  raise notice '  update category.categories set is_active = true where id = any(%::uuid[]);',
    quote_literal(coalesce(v_was_active, '{}'::uuid[])::text);
  raise notice '  update category.categories set display_in_home_page = true where id = any(%::uuid[]);',
    quote_literal(coalesce(v_was_on_home, '{}'::uuid[])::text);
end $$;

commit;
