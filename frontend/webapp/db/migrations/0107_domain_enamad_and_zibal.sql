-- Per-domain Enamad seals and the Zibal payment gateway.
--
-- lsevincare.com, appmain.lsevin.com and lsevin.ir each have their own Enamad seal and their own
-- Zibal merchant token. Both are data the admin enters, never hostnames in code: site A's image
-- rewrites every "appmain.lsevin.com" string it was built with (build-site-variant.sh).
--
-- Every row this migration creates has a fixed id, because it runs separately on site A and
-- site B and SymmetricDS copies rows between them: two random ids for the same natural key
-- would collide on the unique key and stop replication (the 2026-11-07 stall).
--
-- Idempotent: safe to run again.

begin;

-- 1. Enamad seal per domain ------------------------------------------------------------------

create table if not exists content.domain_trust_seals (
  host        text        primary key check (host = lower(host) and host ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  enamad_id   text        not null check (enamad_id ~ '^[0-9]{1,20}$'),
  enamad_code text        not null check (enamad_code ~ '^[A-Za-z0-9]{8,64}$'),
  is_active   boolean     not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

comment on table content.domain_trust_seals is
  'Enamad trust seal per public domain (host without www). Edited in Admin > Content > Enamad.';

-- The seal lsevincare.com has shown since 2026-11-03 (was hard-coded in enamad-seal.tsx), so the
-- footer keeps it after this release. The other domains show no seal until their code is pasted.
insert into content.domain_trust_seals (host, enamad_id, enamad_code)
values ('lsevincare.com', '7764782', 'XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d')
on conflict (host) do nothing;

-- 2. Zibal gateway ---------------------------------------------------------------------------

-- Same definition the application creates on first use (payment-gateway.repository.ts).
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

-- Disabled: nothing changes for customers until the admin adds a token for a domain and enables it.
-- sort_order 5 puts it before Zarinpal (10) once enabled; the admin can change that.
insert into booking.payment_gateways (id, code, provider, display_name, description, is_enabled, supports_refund, sort_order, settings)
values (
  md5('lsevin:payment-gateway:zibal')::uuid,
  'zibal', 'zibal', 'Zibal',
  'Iranian card gateway (Zibal). One merchant token per domain.',
  false, false, 5,
  jsonb_build_object(
    'merchantId', '',
    'sandbox', false,
    'currency', 'IRR',
    'minimumAmount', 10000,
    'descriptionTemplate', 'LSevin booking {{bookingId}}',
    'enabledContexts', jsonb_build_array('booking_online_card', 'wallet_topup'),
    'domainMerchants', '[]'::jsonb
  )
)
on conflict (code) do nothing;

-- 3. Accounting: Zibal's own clearing account --------------------------------------------------

-- Wallet top-ups post to the gateway's clearing account. Zibal money must not land in Zarinpal's.
-- Cloned from clearing_zarinpal (same parent, type, currency) so it sits beside it in whichever
-- chart of accounts this database has (0008 or the Iranian chart of 0097).
do $$
declare
  zp accounting.accounts%rowtype;
  new_code text;
begin
  if to_regclass('accounting.accounts') is null then return; end if;
  if exists (select 1 from accounting.accounts where system_key = 'clearing_zibal') then return; end if;
  select * into zp from accounting.accounts where system_key = 'clearing_zarinpal';
  if not found then return; end if;

  new_code := case when zp.code = '1100102' then '1100106' else zp.code || '-zibal' end;
  if exists (select 1 from accounting.accounts where code = new_code) then
    new_code := zp.code || '-zibal';
  end if;

  insert into accounting.accounts (
    id, code, parent_id, level, name_translations, account_type, normal_balance,
    currency_code, is_postable, is_active, is_system, system_key, description
  ) values (
    md5('lsevin:accounting:clearing_zibal')::uuid, new_code, zp.parent_id, zp.level,
    jsonb_build_object('fa-IR', 'درگاه زیبال', 'en-US', 'Zibal gateway'),
    zp.account_type, zp.normal_balance, zp.currency_code, true, true, true, 'clearing_zibal',
    'Card payments received through Zibal, before they are the customer''s.'
  )
  on conflict (id) do nothing;
end $$;

commit;
