-- Paying for a video consultation through the online gateway.
--
-- An unpaid request holds its slot until hold_expires_at. It starts 15 minutes
-- after booking and is pushed forward when the patient goes to the gateway, so
-- a slot can't be given away while they are on the bank's page.

alter table consultation.video_sessions
  add column if not exists hold_expires_at timestamp with time zone,
  add column if not exists paid_at timestamp with time zone;

update consultation.video_sessions
   set hold_expires_at = created_at + interval '15 minutes'
 where hold_expires_at is null;

alter table consultation.video_sessions
  alter column hold_expires_at set default (now() + interval '15 minutes'),
  alter column hold_expires_at set not null;

-- One row per trip to the gateway. amount/currency are what the session costs;
-- gateway_amount/gateway_currency are what the gateway was asked to charge.
create table if not exists consultation.video_session_payments (
  id uuid primary key default public.uuid_generate_v4(),
  session_id uuid not null references consultation.video_sessions (id) on delete restrict,
  user_id uuid references identity.asp_net_users (id) on delete set null,
  gateway text not null,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'cancelled', 'needs_refund')),
  amount numeric(18, 2) not null,
  currency text not null,
  gateway_amount numeric(18, 2) not null,
  gateway_currency text not null,
  authority text,
  reference_id text,
  card_pan text,
  failure_reason text,
  raw jsonb not null default '{}'::jsonb,
  verified_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists ux_consultation_video_session_payments_authority
  on consultation.video_session_payments (gateway, authority)
  where authority is not null;
create index if not exists ix_consultation_video_session_payments_session
  on consultation.video_session_payments (session_id, created_at desc);

drop trigger if exists trg_consultation_video_session_payments_touch on consultation.video_session_payments;
create trigger trg_consultation_video_session_payments_touch
  before update on consultation.video_session_payments
  for each row execute function consultation.fn_touch_updated_at();
