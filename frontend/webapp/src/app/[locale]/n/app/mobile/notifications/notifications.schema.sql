-- Notification subsystem for app + channel deliveries
create schema if not exists notify;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'notification_type' and n.nspname = 'notify'
  ) then
    create type notify.notification_type as enum ('booking', 'offer', 'system');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'delivery_channel' and n.nspname = 'notify'
  ) then
    create type notify.delivery_channel as enum ('in_app', 'email', 'sms', 'push', 'phone_call');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'notification_status' and n.nspname = 'notify'
  ) then
    create type notify.notification_status as enum ('queued', 'processing', 'sent', 'failed', 'cancelled');
  end if;
end $$;

create table if not exists notify.notifications (
  id uuid primary key default public.uuid_generate_v4(),
  customer_id uuid not null references customer.customers(id) on delete cascade,
  notification_type notify.notification_type not null,
  title varchar(250) not null,
  body text not null,
  entity_type varchar(100),
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status notify.notification_status not null default 'queued',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notify.notification_deliveries (
  id uuid primary key default public.uuid_generate_v4(),
  notification_id uuid not null references notify.notifications(id) on delete cascade,
  channel notify.delivery_channel not null,
  recipient_email varchar(250),
  recipient_phone varchar(25),
  recipient_push_token text,
  provider_response text,
  status notify.notification_status not null default 'queued',
  attempted_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_notify_notifications_customer_created
  on notify.notifications (customer_id, created_at desc);

create index if not exists ix_notify_notifications_customer_read
  on notify.notifications (customer_id, read_at);

create index if not exists ix_notify_notifications_type
  on notify.notifications (notification_type, created_at desc);

create index if not exists ix_notify_deliveries_notification
  on notify.notification_deliveries (notification_id);

create index if not exists ix_notify_deliveries_channel_status
  on notify.notification_deliveries (channel, status, created_at);

create or replace function notify.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notify_notifications_updated_at on notify.notifications;
create trigger trg_notify_notifications_updated_at
before update on notify.notifications
for each row execute function notify.set_updated_at();

drop trigger if exists trg_notify_notification_deliveries_updated_at on notify.notification_deliveries;
create trigger trg_notify_notification_deliveries_updated_at
before update on notify.notification_deliveries
for each row execute function notify.set_updated_at();

-- Optional helper for booking events
create or replace function notify.create_booking_notification(
  p_customer_id uuid,
  p_title varchar,
  p_body text,
  p_booking_id uuid,
  p_email varchar default null,
  p_phone varchar default null,
  p_push_token text default null
)
returns uuid
language plpgsql
as $$
declare
  v_notification_id uuid;
begin
  insert into notify.notifications (
    customer_id,
    notification_type,
    title,
    body,
    entity_type,
    entity_id,
    status
  )
  values (
    p_customer_id,
    'booking',
    p_title,
    p_body,
    'booking',
    p_booking_id,
    'queued'
  )
  returning id into v_notification_id;

  insert into notify.notification_deliveries (
    notification_id,
    channel,
    recipient_email,
    recipient_phone,
    recipient_push_token,
    status
  )
  values
    (v_notification_id, 'in_app', null, null, null, 'sent'),
    (v_notification_id, 'email', p_email, null, null, 'queued'),
    (v_notification_id, 'sms', null, p_phone, null, 'queued'),
    (v_notification_id, 'push', null, null, p_push_token, 'queued');

  return v_notification_id;
end;
$$;
