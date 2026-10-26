-- ---------------------------------------------------------------------------
-- 0081 — Tours administration panel (Tours.md §11–12, M-015..M-023).
--
-- Additive only. Builds on 0078/0079; no existing column, constraint or row
-- is rewritten except the backfill of the new tour.bookings.commission_*
-- snapshot columns (NULL before this migration).
--
--   * tour.admin_roles          — dispute approval hierarchy (agent → manager → finance), M-018
--   * tour.disputes (+columns)  — required level, currency, decision note; tour.dispute_decisions log
--   * tour.bookings (+columns)  — commission snapshot taken at booking time, immutable (M-017):
--                                 a later agreement never changes a past reservation
--   * tour.effective_commission — one rule for "which agreement applies on a date"
--   * tour.provider_flags       — trust / quality / compliance flags (M-023)
-- ---------------------------------------------------------------------------

-- Dispute approval hierarchy (M-018) -----------------------------------------

create table if not exists tour.admin_roles (
  user_id    uuid primary key,
  role       text not null check (role in ('agent','manager','finance')),
  granted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tour.disputes add column if not exists required_level text;
alter table tour.disputes add column if not exists currency_code varchar(10);
alter table tour.disputes add column if not exists decision_note text;
alter table tour.disputes add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table tour.disputes add constraint ck_disputes_required_level
    check (required_level is null or required_level in ('agent','manager','finance'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table tour.disputes add constraint ck_disputes_amount
    check (amount is null or amount >= 0);
exception when duplicate_object then null; end $$;

create index if not exists ix_disputes_status on tour.disputes (status, approval_level, created_at desc);
create index if not exists ix_disputes_booking on tour.disputes (booking_id);

create table if not exists tour.dispute_decisions (
  id          uuid primary key default gen_random_uuid(),
  dispute_id  uuid not null references tour.disputes(id) on delete cascade,
  level       text not null check (level in ('agent','manager','finance')),
  decision    text not null check (decision in ('approve','reject','escalate')),
  note        text not null,
  decided_by  uuid not null,
  created_at  timestamptz not null default now()
);
create index if not exists ix_dispute_decisions_dispute on tour.dispute_decisions (dispute_id, created_at);

-- Commission snapshot (M-017) --------------------------------------------------

create index if not exists ix_commission_agreements_provider
  on tour.commission_agreements (service_provider_id, effective_from desc);

-- Provider-specific agreement first, then the platform default (provider null),
-- then the platform setting. Deterministic for any date.
create or replace function tour.effective_commission(p_provider uuid, p_on date)
returns table (agreement_id uuid, percent numeric)
language sql
stable
as $$
  with hit as (
    select a.id, a.commission_percent
      from tour.commission_agreements a
     where (a.service_provider_id = p_provider or a.service_provider_id is null)
       and a.effective_from <= p_on
       and (a.effective_to is null or a.effective_to >= p_on)
     order by (a.service_provider_id is null), a.effective_from desc, a.created_at desc
     limit 1
  )
  select h.id, h.commission_percent from hit h
  union all
  select null::uuid, coalesce((select (value #>> '{}')::numeric from tour.settings where key = 'platform_commission_percent'), 0)
   where not exists (select 1 from hit)
$$;

alter table tour.bookings add column if not exists commission_percent numeric(5,2);
alter table tour.bookings add column if not exists commission_agreement_id uuid;

create or replace function tour.booking_commission_snapshot()
returns trigger
language plpgsql
as $$
declare r record;
begin
  if tg_op = 'INSERT' then
    if new.commission_percent is null then
      select * into r from tour.effective_commission(new.service_provider_id, coalesce(new.created_at, now())::date);
      new.commission_percent := r.percent;
      new.commission_agreement_id := r.agreement_id;
    end if;
    return new;
  end if;
  -- UPDATE: a commission recorded on a reservation is never rewritten (M-017).
  if old.commission_percent is not null
     and (new.commission_percent is distinct from old.commission_percent
          or new.commission_agreement_id is distinct from old.commission_agreement_id) then
    raise exception 'COMMISSION_SNAPSHOT_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_booking_commission_snapshot on tour.bookings;
create trigger trg_booking_commission_snapshot
  before insert or update of commission_percent, commission_agreement_id on tour.bookings
  for each row execute function tour.booking_commission_snapshot();

-- Backfill reservations made before this migration with the rule in force on
-- their booking date (the update sets a NULL column, which the trigger allows).
update tour.bookings b
   set (commission_percent, commission_agreement_id) =
       (select e.percent, e.agreement_id from tour.effective_commission(b.service_provider_id, b.created_at::date) e limit 1)
 where b.commission_percent is null;

-- Provider trust / compliance flags (M-023) -------------------------------------

create table if not exists tour.provider_flags (
  id                  uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id),
  flag                text not null check (flag in ('trusted','watch','quality_review','documents_missing','listing_suspended')),
  note                text,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  cleared_at          timestamptz,
  cleared_by          uuid
);
create unique index if not exists ux_provider_flags_open on tour.provider_flags (service_provider_id, flag) where cleared_at is null;

-- Audit lookups by action (PII reveals, admin overrides) ---------------------------
create index if not exists ix_audit_action on tour.audit_log (action, created_at desc);
