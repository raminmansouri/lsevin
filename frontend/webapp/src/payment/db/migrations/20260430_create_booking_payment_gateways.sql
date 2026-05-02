create table if not exists booking.payment_gateways (
  id uuid default public.uuid_generate_v4() not null primary key,
  code text not null unique,
  provider text not null,
  display_name text not null,
  description text,
  is_enabled boolean default false not null,
  supports_refund boolean default false not null,
  sort_order integer default 100 not null,
  settings jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  updated_by uuid
);

create index if not exists ix_booking_payment_gateways_enabled
  on booking.payment_gateways (is_enabled, sort_order);

insert into booking.payment_gateways (
  code,
  provider,
  display_name,
  description,
  is_enabled,
  supports_refund,
  sort_order,
  settings
) values (
  'zarinpal',
  'zarinpal',
  'Zarinpal',
  'Iranian online payment gateway for booking checkout.',
  false,
  false,
  10,
  '{"merchantId":"","sandbox":true,"currency":"IRR","minimumAmount":10000,"descriptionTemplate":"LSevin booking {{bookingId}}","enabledContexts":["booking_online_card","wallet_topup"]}'::jsonb
)
on conflict (code) do nothing;
