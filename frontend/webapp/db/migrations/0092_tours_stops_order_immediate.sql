-- tour.itinerary_stops: make the stop-order uniqueness immediate instead of DEFERRABLE (2026-11-07 incident).
--
-- 0078 declared ux_stops_order DEFERRABLE INITIALLY DEFERRED so that saveItinerary could swap two stops' positions inside one
-- transaction. SymmetricDS (replication between the two sites) loads every inserted row with
-- "INSERT ... ON CONFLICT DO NOTHING", and PostgreSQL rejects that statement on a table that has a deferrable unique
-- constraint: "ON CONFLICT does not support deferrable unique constraints/exclusion constraints as arbiters".
-- The first itinerary a provider saved on site A (batch 000-16328, 2026-11-04) therefore never reached site B, every later batch
-- queued behind it and replication stayed stalled for three days.
--
-- saveItinerary now parks the kept stops at temporary positions before writing the final ones (authoring.ts), so the
-- constraint no longer has to be deferred. Existing rows already satisfy it: it was enforced at every commit.
-- Run on both sites (schema changes are not replicated); safe to re-run.

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'tour.itinerary_stops'::regclass and conname = 'ux_stops_order' and condeferrable
  ) then
    alter table tour.itinerary_stops drop constraint ux_stops_order;
    alter table tour.itinerary_stops add constraint ux_stops_order unique (tour_id, day_number, "position");
  end if;
end $$;
