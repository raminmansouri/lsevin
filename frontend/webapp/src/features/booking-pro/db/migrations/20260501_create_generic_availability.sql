-- Generic availability model for all bookable targets: provider, provider service, staff, and resources such as hotel rooms.
-- Run after the current booking/provider_portal schema.

create table if not exists provider_portal.bookable_resources (
  id uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  provider_service_id uuid references category.provider_services(id) on delete cascade,
  resource_type text not null default 'generic',
  code text,
  name_translations jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  total_capacity integer not null default 1,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_bookable_resources_type check (resource_type in ('generic', 'room', 'bed', 'seat', 'table', 'vehicle', 'equipment', 'unit')),
  constraint ck_bookable_resources_capacity check (total_capacity > 0),
  constraint ck_bookable_resources_name_object check (jsonb_typeof(name_translations) = 'object'),
  constraint ck_bookable_resources_description_object check (jsonb_typeof(description_translations) = 'object')
);

create index if not exists ix_bookable_resources_provider on provider_portal.bookable_resources(service_provider_id) where is_active = true;
create index if not exists ix_bookable_resources_provider_service on provider_portal.bookable_resources(provider_service_id) where is_active = true;

create table if not exists provider_portal.generic_availability_rules (
  id uuid primary key default public.uuid_generate_v4(),
  target_type text not null,
  target_id uuid not null,
  service_provider_id uuid references category.service_providers(id) on delete cascade,
  provider_service_id uuid references category.provider_services(id) on delete cascade,
  resource_id uuid references provider_portal.bookable_resources(id) on delete cascade,
  day_of_week smallint,
  specific_date date,
  starts_at time without time zone,
  ends_at time without time zone,
  is_available boolean not null default true,
  capacity integer,
  slot_interval_minutes integer,
  min_booking_minutes integer,
  max_booking_minutes integer,
  priority integer not null default 100,
  timezone_id text not null default 'UTC',
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_generic_availability_target_type check (target_type in ('provider', 'provider_service', 'service_definition', 'staff', 'provider_staff', 'bookable_resource')),
  constraint ck_generic_availability_day_or_date check (day_of_week is not null or specific_date is not null),
  constraint ck_generic_availability_day check (day_of_week is null or (day_of_week >= 1 and day_of_week <= 7)),
  constraint ck_generic_availability_time_range check (starts_at is null or ends_at is null or starts_at < ends_at),
  constraint ck_generic_availability_capacity check (capacity is null or capacity > 0),
  constraint ck_generic_availability_slot_interval check (slot_interval_minutes is null or slot_interval_minutes > 0),
  constraint ck_generic_availability_min_booking check (min_booking_minutes is null or min_booking_minutes > 0),
  constraint ck_generic_availability_max_booking check (max_booking_minutes is null or max_booking_minutes > 0)
);

create index if not exists ix_generic_availability_target on provider_portal.generic_availability_rules(target_type, target_id, day_of_week, specific_date);
create index if not exists ix_generic_availability_provider on provider_portal.generic_availability_rules(service_provider_id, provider_service_id);
create index if not exists ix_generic_availability_resource on provider_portal.generic_availability_rules(resource_id);

create or replace function provider_portal.set_last_modified_date() returns trigger
language plpgsql
as $$
begin
  new.last_modified_date = now();
  return new;
end;
$$;

drop trigger if exists trg_bookable_resources_last_modified on provider_portal.bookable_resources;
create trigger trg_bookable_resources_last_modified
before update on provider_portal.bookable_resources
for each row execute function provider_portal.set_last_modified_date();

drop trigger if exists trg_generic_availability_rules_last_modified on provider_portal.generic_availability_rules;
create trigger trg_generic_availability_rules_last_modified
before update on provider_portal.generic_availability_rules
for each row execute function provider_portal.set_last_modified_date();

comment on table provider_portal.bookable_resources is 'Optional concrete/capacity resources for bookable services, e.g. hotel rooms, beds, seats, vehicles, equipment.';
comment on table provider_portal.generic_availability_rules is 'Generic availability rules for providers, services, staff, provider staff rows, or concrete bookable resources. Replaces staff-only availability for new booking flows.';
