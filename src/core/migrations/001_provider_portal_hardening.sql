-- Optional hardening for the standalone providers portal.
-- Run after validating current production duplicates.

create unique index if not exists ux_provider_members_provider_user
  on provider_portal.provider_members (service_provider_id, user_id);

create unique index if not exists ux_provider_operating_hours_provider_day
  on provider_portal.provider_operating_hours (service_provider_id, day_of_week);

create index if not exists ix_provider_members_user
  on provider_portal.provider_members (user_id);

create index if not exists ix_onboarding_applications_applicant_status
  on provider_portal.onboarding_applications (applicant_user_id, status);

create index if not exists ix_provider_services_provider
  on category.provider_services (service_provider_id);

create index if not exists ix_provider_staffs_provider
  on category.provider_staffs (service_provider_id);

create index if not exists ix_bookings_provider_date
  on booking.bookings (provider_id, create_date desc);

create index if not exists ix_provider_ledgers_provider_created
  on commercial.provider_ledgers (provider_id, created_at desc);
