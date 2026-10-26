-- Mobile itinerary: a customer can book the same add-on provider type more than once in
-- one booking (an airport transfer in and another out, two tours on different days).
-- The unique indexes below allowed only one child row per (parent, provider type), and
-- booking-pro's saveChildDraft upserted on that pair. Child rows are now addressed by
-- their own id (saveChildDraft updates by id, inserts otherwise), and checkout already
-- copies every draft child row, so nothing else depends on the pair being unique.
--
-- Production carries two identical unique indexes on the draft table (one per name);
-- both go. Non-unique indexes keep the "children of this parent" lookups indexed.
drop index if exists booking.ux_booking_draft_child_one_per_provider_type;
drop index if exists booking.ux_booking_draft_child_one_provider_type;
drop index if exists booking.ux_booking_child_one_per_provider_type;

create index if not exists ix_booking_draft_child_bookings_parent_draft
  on booking.booking_draft_child_bookings (parent_draft_id, create_date);

create index if not exists ix_booking_child_bookings_parent_provider_type
  on booking.booking_child_bookings (parent_booking_id, provider_type_id);
