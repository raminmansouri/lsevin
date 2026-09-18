-- ---------------------------------------------------------------------------
-- 0040 — Hotel/airport transfer routes (new domain, additive).
--
-- Admin picked "fixed routes" pricing over live distance calculation: each
-- route is admin-defined (a from label, a to label, a fixed price), not
-- computed from a geocoded distance. That means a route is fundamentally a
-- regular bookable service -- so it's created as one (via the existing
-- category.provider_services writer, saveProviderServiceAction, exactly the
-- same table every other bookable listing uses), and gets the entire
-- existing booking-pro machinery for free: search, cart, checkout, invoice,
-- payment. Nothing about booking a transfer needs new booking/cart/payment
-- code.
--
-- What's genuinely new is structure: provider_services has no notion of "a
-- listing has a from place and a to place" beyond whatever text ends up in
-- its display name. This table is a thin 1:1 enrichment row alongside a
-- provider_services row, giving the storefront a distinct "From X -> To Y"
-- chip (see booking-pro's listServices()/EntityCard, the same pattern
-- already used for surfacing admin-defined room features) instead of relying
-- on free text alone.
--
-- Cross-schema references (service_provider_id, provider_service_id) are
-- soft (application-validated uuid, no FK) -- same modularity rule 0039
-- documents for itself.
-- ---------------------------------------------------------------------------
begin;

create schema if not exists transfer;

create table if not exists transfer.routes (
  id                  uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null,
  -- The category.provider_services row this route is priced/booked through.
  -- One route per listing; editing a route's from/to never creates a second
  -- listing for the same trip.
  provider_service_id uuid not null,
  from_translations   jsonb not null default '{}'::jsonb,
  to_translations     jsonb not null default '{}'::jsonb,
  vehicle_type        character varying(80),
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now(),
  constraint uq_transfer_routes_provider_service unique (provider_service_id)
);
create index if not exists ix_transfer_routes_provider
  on transfer.routes (service_provider_id);

commit;
