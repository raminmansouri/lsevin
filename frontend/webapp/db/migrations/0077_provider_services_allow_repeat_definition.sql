-- A provider can offer the same service definition more than once
-- (e.g. a lift with description A and another with description B), each row
-- with its own display name, description and price. The unique index created by
-- the old EF migration (20250520090402_AddProviderAndStaff) rejected the second row.
-- Bookings, carts and reviews all reference provider_services.id, so nothing else
-- depends on the pair being unique.
drop index if exists category.ix_provider_services_service_provider_id_service_definition_id;

create index if not exists ix_provider_services_provider_definition
  on category.provider_services (service_provider_id, service_definition_id);
