-- Accounting: audit trail and rate limiting.

-- ---------------------------------------------------------------------------
-- Immutable audit log for every financial and administrative action.
--
-- Append-only for the same reason the ledger is: an audit trail that can be edited is
-- not an audit trail. Who, when, what, from where.
-- ---------------------------------------------------------------------------
create table if not exists accounting.audit_log (
  id             bigint generated always as identity primary key,
  actor_user_id  uuid,
  actor_roles    text[]      not null default '{}',
  action         text        not null,
  entity_type    text        not null,
  entity_id      uuid,
  entity_key     text,
  before_state   jsonb,
  after_state    jsonb,
  ip_address     inet,
  user_agent     text,
  request_id     text,
  occurred_at    timestamptz not null default now(),
  metadata       jsonb       not null default '{}'::jsonb
);

create index if not exists ix_accounting_audit_entity on accounting.audit_log (entity_type, entity_id, occurred_at desc);
create index if not exists ix_accounting_audit_actor on accounting.audit_log (actor_user_id, occurred_at desc);
create index if not exists ix_accounting_audit_time on accounting.audit_log (occurred_at desc);

create or replace function accounting.fn_block_audit_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'accounting.audit_log is append-only (attempted %)', tg_op
    using errcode = 'restrict_violation';
end $$;

drop trigger if exists trg_accounting_audit_immutable on accounting.audit_log;
create trigger trg_accounting_audit_immutable
  before update or delete on accounting.audit_log
  for each row execute function accounting.fn_block_audit_mutation();

-- ---------------------------------------------------------------------------
-- Rate limiting for deposit/withdrawal endpoints.
--
-- Database-backed because the webapp has no Redis (the lsevin-redis container exists but
-- nothing in src/ connects to it). A fixed window is enough here: these are money
-- endpoints where the goal is stopping abuse and accidental double-submits, not shaping
-- high-frequency traffic.
-- ---------------------------------------------------------------------------
create table if not exists accounting.rate_limits (
  bucket_key    text        not null,
  window_start  timestamptz not null,
  request_count integer     not null default 0 check (request_count >= 0),
  updated_at    timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

create index if not exists ix_accounting_rate_limits_window on accounting.rate_limits (window_start);

-- Atomic consume-one-token. Returns true when the caller is allowed to proceed.
-- The whole check-and-increment is one INSERT ... ON CONFLICT, so two concurrent
-- requests can never both see the same count and both be let through.
create or replace function accounting.fn_consume_rate_limit(
  p_bucket_key   text,
  p_limit        integer,
  p_window_secs  integer
) returns boolean
language plpgsql as $$
declare
  v_window_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_secs) * p_window_secs);
  v_count        integer;
begin
  insert into accounting.rate_limits (bucket_key, window_start, request_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start) do update
    set request_count = accounting.rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into v_count;

  return v_count <= p_limit;
end $$;
