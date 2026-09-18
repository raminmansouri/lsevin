-- ---------------------------------------------------------------------------
-- 0041 — Home nursing (item 7): let a service require a customer address.
--
-- "Multi-address" and "equipment" both reuse existing infrastructure rather
-- than needing new schema:
--   - Addresses: shop.customer_addresses already has full multi-address,
--     default-address support per customer. A nursing booking just picks one
--     of those rows (via the existing listAddressesAction/saveAddressAction)
--     rather than getting its own separate, duplicated address book. The
--     chosen address's id and a point-in-time snapshot are stored in
--     booking.booking_drafts/bookings' existing metadata jsonb column, the
--     same extension point adults/children/rooms already use -- no new
--     columns on either table.
--   - Equipment: category.addons / category.provider_service_addons already
--     supports attaching priced add-ons (wheelchair rental, oxygen
--     concentrator, etc.) to a provider_services row, already flows into the
--     unified cart/invoice, and already has a customer-facing selection step
--     in the booking wizard. Nothing new needed there either.
--
-- The one genuinely missing piece: nothing marks a service as "this happens
-- at the customer's home, so ask for an address before booking". This column
-- is that flag -- set per service_definition (a translator's in-clinic
-- session and a nurse's home visit are different service_definitions, so
-- this belongs at that level, not per-provider or globally).
-- ---------------------------------------------------------------------------
begin;

alter table category.service_definitions
  add column if not exists requires_customer_address boolean not null default false;

commit;
