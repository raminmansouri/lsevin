create table if not exists booking.booking_calendar_settings (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null default 'global',
  scope_id text,
  default_calendar text not null default 'gregorian',
  enabled_calendars text[] not null default array['gregorian', 'jalali']::text[],
  timezone_id text not null default 'UTC',
  week_starts_on smallint not null default 6,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_booking_calendar_settings_scope_type check (scope_type in ('global', 'provider_type', 'provider', 'service_definition', 'provider_service')),
  constraint ck_booking_calendar_settings_default_calendar check (default_calendar in ('gregorian', 'jalali')),
  constraint ck_booking_calendar_settings_enabled_calendars check (enabled_calendars <@ array['gregorian', 'jalali']::text[]),
  constraint ck_booking_calendar_settings_week_starts_on check (week_starts_on between 0 and 6)
);

create unique index if not exists ux_booking_calendar_settings_scope
  on booking.booking_calendar_settings (scope_type, (coalesce(scope_id, '')));

create or replace function booking.set_booking_calendar_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_booking_calendar_settings_updated_at on booking.booking_calendar_settings;
create trigger trg_booking_calendar_settings_updated_at
before update on booking.booking_calendar_settings
for each row execute function booking.set_booking_calendar_settings_updated_at();

insert into booking.booking_calendar_settings (
  scope_type,
  scope_id,
  default_calendar,
  enabled_calendars,
  timezone_id,
  week_starts_on,
  is_active
)
values (
  'global',
  null,
  'gregorian',
  array['gregorian', 'jalali']::text[],
  'UTC',
  6,
  true
)
on conflict (scope_type, (coalesce(scope_id, ''))) do nothing;
