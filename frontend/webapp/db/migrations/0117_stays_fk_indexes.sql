-- Stays: indexes for foreign keys that had none.
--
-- Every stays query measured in production runs in under 3 ms today (17 stays), so this is
-- not a fix for current slowness: it keeps two growing tables from being read in full later.
--   * stay.recent_views grows with every page view, stay.holds with every checkout start,
--     stay.bookings with every booking. Deleting or editing a room type, rate plan or stay
--     checks these foreign keys, which without an index means a full read of the table.
--   * room photos are looked up by room type (stay.media.room_type_id).
-- Plain CREATE INDEX: the tables are small enough today that the brief write lock is
-- negligible, and the migration runner wraps each file in a transaction (CONCURRENTLY is not
-- allowed there). IF NOT EXISTS keeps a re-run harmless.

create index if not exists ix_stay_media_room_type on stay.media (room_type_id) where room_type_id is not null;
create index if not exists ix_stay_holds_room_type on stay.holds (room_type_id);
create index if not exists ix_stay_holds_rate_plan on stay.holds (rate_plan_id);
create index if not exists ix_stay_holds_property on stay.holds (property_id);
create index if not exists ix_stay_bookings_room_type on stay.bookings (room_type_id);
create index if not exists ix_stay_bookings_rate_plan on stay.bookings (rate_plan_id);
create index if not exists ix_stay_bookings_hold on stay.bookings (hold_id) where hold_id is not null;
create index if not exists ix_stay_bookings_policy on stay.bookings (policy_id) where policy_id is not null;
create index if not exists ix_stay_wishlist_property on stay.wishlist (property_id);
create index if not exists ix_stay_recent_views_property on stay.recent_views (property_id);
