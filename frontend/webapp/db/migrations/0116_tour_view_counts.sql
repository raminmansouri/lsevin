-- Tour view counts for "Most viewed tours" on the tours home (2026-11-18).
--
-- Until now the only per-tour view signal was tour.tours.popularity, which the
-- tour page bumps only for visitors whose browsing history is on (it rides on
-- Recently Viewed). view_count counts every tour-page view, history or not; it
-- is an anonymous total, nothing about who viewed is stored.
--
-- Backfill: popularity has only ever been increased by recorded tour views
-- (catalog.recordRecentView), so it is the best starting value we have.
-- popularity itself is left alone; search's "popular" sort still uses it.
--
-- The second index serves "Best-selling tours" (bookings per tour, all time and
-- last 30 days).

begin;

alter table tour.tours
  add column if not exists view_count bigint not null default 0;

update tour.tours
   set view_count = popularity
 where view_count = 0 and popularity > 0;

comment on column tour.tours.view_count is
  'Tour detail page views (every visitor, anonymous total). Shown as "Most viewed tours" on the tours home.';

create index if not exists ix_tours_view_count
  on tour.tours (view_count desc) where status = 'published';

create index if not exists ix_tour_bookings_tour_status
  on tour.bookings (tour_id, status, created_at);

commit;
