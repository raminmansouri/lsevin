-- Booking Management standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists booking_management;

    create table if not exists booking_management.booking_status_changes (
      id uuid primary key default gen_random_uuid(),
      booking_id uuid not null,
      service_provider_id uuid,
      old_status text,
      new_status text not null,
      changed_by_user_id uuid,
      note text,
      created_at timestamptz not null default now()
    );
    create table if not exists booking_management.booking_assignments (
      id uuid primary key default gen_random_uuid(),
      booking_id uuid not null,
      service_provider_id uuid not null,
      staff_id uuid,
      resource_id uuid,
      assignment_status text not null default 'assigned' check (assignment_status in ('assigned','reassigned','cancelled')),
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

-- vNext operational booking workflow.
alter table if exists booking_management.booking_assignments
  add column if not exists assigned_by_user_id uuid,
  add column if not exists note text;

create table if not exists booking_management.provider_booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  service_provider_id uuid not null,
  staff_id uuid,
  note text not null,
  visibility text not null default 'internal' check (visibility in ('internal','customer_visible')),
  created_by_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists ix_booking_management_assignments_booking on booking_management.booking_assignments(booking_id, service_provider_id);
create index if not exists ix_booking_management_assignments_staff on booking_management.booking_assignments(staff_id, created_at desc);
create index if not exists ix_booking_management_notes_booking on booking_management.provider_booking_notes(booking_id, created_at desc);
