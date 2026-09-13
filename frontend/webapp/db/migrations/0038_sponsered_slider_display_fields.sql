-- Sponsored slider: guarantee the columns the live carousel now reads.
--
-- The carousel used to print a hardcoded eyebrow ("جایگاه ویژه") over every ad and
-- ignored the Badge, ARIA label and "open in new tab" fields the admin form has
-- always offered -- an admin could fill them in and nothing on the site changed.
-- The read query now selects them, so they have to exist for certain.
--
-- The write path (`createSponseredSlider`) has inserted into all four for a long
-- time, so on this database they are already there and every statement below is a
-- no-op. `if not exists` is what makes that safe to assert rather than assume: no
-- schema dump in the repository is recent enough to prove it, and a missing column
-- would take the read query down and blank every sponsored slot on the site.
--
-- Nothing is back-filled. Rows that predate a column read back as '{}' (no
-- eyebrow, no badge, no ARIA label) or false (same-tab links), which is exactly
-- what those slides do today.

begin;

alter table media.sponsered_slider
  add column if not exists eyebrow_translations jsonb not null default '{}'::jsonb,
  add column if not exists badge_translations jsonb not null default '{}'::jsonb,
  add column if not exists aria_label_translations jsonb not null default '{}'::jsonb,
  add column if not exists opens_in_new_tab boolean not null default false;

comment on column media.sponsered_slider.eyebrow_translations is
  'Small line above the title, per locale. Empty renders nothing.';
comment on column media.sponsered_slider.badge_translations is
  'Optional chip shown next to the "Sponsored" label, per locale.';
comment on column media.sponsered_slider.aria_label_translations is
  'Accessible name for the slide link, per locale. Falls back to the title.';
comment on column media.sponsered_slider.opens_in_new_tab is
  'Open the slide link in a new tab. External (http/https) links always do.';

commit;
