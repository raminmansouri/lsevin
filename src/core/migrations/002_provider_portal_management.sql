-- Optional hardening for provider portal management surfaces.
-- Run after the base LSevin schema exists.

create index if not exists ix_provider_members_user_provider on provider_portal.provider_members (user_id, service_provider_id);
create index if not exists ix_provider_members_provider on provider_portal.provider_members (service_provider_id);
create index if not exists ix_provider_services_provider on category.provider_services (service_provider_id);
create index if not exists ix_provider_staffs_provider on category.provider_staffs (service_provider_id);
create index if not exists ix_provider_gallery_provider on category.provider_gallery_items (service_provider_id);
create index if not exists ix_bookings_provider on booking.bookings (provider_id, create_date desc);
create index if not exists ix_provider_ledgers_provider on commercial.provider_ledgers (provider_id, created_at desc);
create index if not exists ix_support_tickets_provider on provider_portal.support_tickets (service_provider_id, create_date desc);
create index if not exists ix_bookable_resources_provider on provider_portal.bookable_resources (service_provider_id);
create index if not exists ix_generic_availability_provider on provider_portal.generic_availability_rules (service_provider_id, target_type, target_id);
create index if not exists ix_reviews_provider on category.service_provider_comments (service_provider_id, create_date desc);
