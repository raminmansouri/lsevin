-- Batch 11: provider/staff booking change workflow.
-- Canonical booking date/time/status remain in booking.bookings.
-- This table stores only request/review/audit state for the Providers Portal.
create schema if not exists booking_management;

create table if not exists booking_management.booking_change_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  service_provider_id uuid not null,
  staff_id uuid,
  request_type text not null check (request_type in ('reschedule','cancel')),
  previous_date date,
  previous_time time without time zone,
  previous_status text,
  requested_date date,
  requested_time time without time zone,
  reason text,
  status text not null default 'requested' check (status in ('requested','approved','rejected','withdrawn')),
  requested_by_user_id uuid,
  reviewed_by_user_id uuid,
  review_note text,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_booking_change_requests_provider
  on booking_management.booking_change_requests(service_provider_id, requested_at desc);
create index if not exists ix_booking_change_requests_staff
  on booking_management.booking_change_requests(staff_id, requested_at desc)
  where staff_id is not null;
create index if not exists ix_booking_change_requests_booking
  on booking_management.booking_change_requests(booking_id, requested_at desc);

create unique index if not exists ux_booking_change_requests_open_staff_type
  on booking_management.booking_change_requests(booking_id, staff_id, request_type)
  where staff_id is not null and status = 'requested';
