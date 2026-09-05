-- Sponsored slider: make the placement column a guaranteed part of the schema.
--
-- The application has carried a `placement_key` concept for a while (the admin form
-- has a Placement dropdown, the repository selects and writes the column), but the
-- query that actually feeds the live carousel ignored it, so every slide rendered on
-- the home page and nowhere else. Wiring the placements up on the frontend means the
-- column has to be there for certain -- no schema dump in the repository is recent
-- enough to prove it either way.
--
-- `if not exists` settles it: a no-op where the column already exists, and the missing
-- piece where it does not. Nothing is back-filled. Rows that predate the column read
-- back as null, and every read path treats null as 'home_native_ad', which is exactly
-- where those slides render today -- so existing ads keep their current placement
-- without a single row being written.

begin;

alter table media.sponsered_slider
  add column if not exists placement_key text;

comment on column media.sponsered_slider.placement_key is
  'Which slot on the site renders this slide (home_native_ad, search_results, provider_detail, ...). Null is read as home_native_ad.';

-- The public read is always "active slides for one placement, in display order".
create index if not exists ix_sponsered_slider_placement_active
  on media.sponsered_slider (placement_key, is_active, display_order);

commit;
