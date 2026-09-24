-- Older development databases predate the delivery outbox even though the
-- current schema snapshot already contains it. This remains safe on databases
-- initialized from the newer snapshot.

do $$
begin
  if to_regclass('notify.notifications') is null then
    raise exception
      'notify.notifications is missing; restore the base schema before applying notification delivery migrations';
  end if;

  if to_regtype('notify.delivery_channel') is null
     or to_regtype('notify.notification_status') is null then
    raise exception
      'notify delivery enum types are missing; restore the base schema before applying notification delivery migrations';
  end if;
end
$$;

create table if not exists notify.notification_deliveries (
  id uuid primary key default public.uuid_generate_v4(),
  notification_id uuid not null
    references notify.notifications(id) on delete cascade,
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

create index if not exists ix_notify_deliveries_channel_status
  on notify.notification_deliveries (channel, status, created_at);

create index if not exists ix_notify_deliveries_notification
  on notify.notification_deliveries (notification_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'notify.notification_deliveries'::regclass
      and tgname = 'trg_notify_notification_deliveries_updated_at'
      and not tgisinternal
  ) then
    create trigger trg_notify_notification_deliveries_updated_at
      before update on notify.notification_deliveries
      for each row execute function notify.set_updated_at();
  end if;
end
$$;
