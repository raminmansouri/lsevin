-- Categories get a full display order that admins arrange by drag and drop
-- (Admin → Categories → "Arrange order").
--
-- The column already exists: category.categories.display_order, the "landing priority"
-- (1 shows first; 0 means no priority and sorts after the prioritised ones). It is
-- read per parent: main categories are ordered among themselves, and the subcategories
-- of each parent among themselves (Accommodation → Hotel first, then Villa...).
--
-- Most rows are still 0, and the site filled the gap three different ways (a hard-coded
-- slug list in the category browser, provider counts on the landing shelf, names
-- elsewhere). This gives every category an explicit position 1..N among its siblings,
-- starting from what the category browser shows today:
--   1. the browser's pinned slugs (health, tourism, accommodation first; classes last),
--   2. then any priority an admin already set,
--   3. then the Persian name.
--
-- Re-running it right away changes nothing (it writes the order it reads). After admins
-- have arranged categories it would put the pinned slugs back on top, so do not re-run it then.

with ranked as (
  select
    c.id,
    row_number() over (
      partition by c.parent_id
      order by
        case lower(coalesce(c.slug, ''))
          when 'health-treatment-and-beauty' then 0
          when 'tourism' then 1
          when 'accommodation' then 2
          when 'educational-classes' then 1000
          else 100
        end,
        case when coalesce(c.display_order, 0) > 0 then 0 else 1 end,
        coalesce(c.display_order, 0),
        common.get_translation_t(c.name_translations, 'fa-IR', 'en-US'),
        c.create_date,
        c.id
    )::int as position
  from category.categories c
)
update category.categories c
   set display_order = ranked.position
  from ranked
 where ranked.id = c.id
   and c.display_order is distinct from ranked.position;
