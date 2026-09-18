-- ---------------------------------------------------------------------------
-- 0044 — Fix booking_drafts "one active draft per user" index vs. cart items.
--
-- Bug: a customer who saves a draft to their cart (saveBookingToCart in
-- cart.repository.ts) gets that row's metadata tagged with "cartSavedAt" but
-- its status stays 'Draft'/'InProgress' -- deliberately, so the cart item
-- keeps its slot/pricing intact. Every read path that decides what counts as
-- "the" active draft (getOrCreateActiveDraft, getActiveDraft,
-- abandonActiveDraft in booking-pro/server/repository.ts) already excludes
-- cartSavedAt rows from that definition, precisely so a cart item never
-- blocks starting a new booking.
--
-- ux_booking_drafts_one_active_per_user never got that same exclusion: it's
-- a plain partial unique index on (user_id) WHERE status IN ('Draft',
-- 'InProgress'), with no metadata condition. So the moment a customer has one
-- cart-saved draft and getOrCreateActiveDraft tries to INSERT a fresh row for
-- a new booking, the insert hits this index and fails with
-- "duplicate key value violates unique constraint
-- ux_booking_drafts_one_active_per_user" (23505) -- a hard, unrecoverable
-- error that blocks the customer from booking anything else until the cart
-- item is removed. This is what "throws error and he cant book" was: any
-- customer who has ever saved something to cart and then starts a second
-- booking hits it, not a one-off data issue.
--
-- Fix: make the index's definition of "active" match the app's, by adding
-- the same "not cartSavedAt" condition already used everywhere else.
-- ---------------------------------------------------------------------------
begin;

drop index if exists booking.ux_booking_drafts_one_active_per_user;

create unique index ux_booking_drafts_one_active_per_user
  on booking.booking_drafts (user_id)
  where (
    (status)::text = any (array[('Draft')::text, ('InProgress')::text])
    and not (coalesce(metadata, '{}'::jsonb) ? 'cartSavedAt')
  );

commit;
