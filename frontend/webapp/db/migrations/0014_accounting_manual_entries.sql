-- ---------------------------------------------------------------------------
-- 0014 — manual journal entries: the document lifecycle, analytic dimensions,
--        attachments, templates and period locking.
--
-- Everything before this migration writes journal entries from *code*: a booking
-- is paid, a withdrawal is approved, and a service posts a balanced entry in one
-- transaction. That is why the ledger could assume every entry is born final.
--
-- An accountant working by hand does not work that way. They open a document,
-- type one side of it, look something up, come back, and only then does it
-- balance. Supporting that is what this migration is for, and it changes three
-- assumptions the ledger was built on:
--
--   1. Balance was enforced for every entry at commit, whatever its status. A
--      half-typed document could therefore never be saved. Balance is now
--      enforced when a document *leaves* the editable states — which is the real
--      rule anyway ("no unbalanced document may be posted"), just stated at the
--      right moment.
--   2. Only `draft` was editable. There are now two editable states, because
--      Iranian practice distinguishes پیش‌نویس (a scratch document) from موقت (a
--      real document awaiting review).
--   3. An entry had no analytic dimensions. Cost centre, project, branch and
--      department now sit on every line, and an account can demand them.
--
-- Automated entries are untouched: they are still created directly as `posted`,
-- so they still get the full balance check at commit exactly as before.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- Analytic dimensions
--
-- One table rather than four near-identical ones. `kind` says what a row is, and
-- the composite unique below lets each FK on journal_lines be constrained to the
-- right kind by the database itself — a project id cannot be filed as a cost
-- centre even by a buggy INSERT.
-- ---------------------------------------------------------------------------
create table if not exists accounting.dimensions (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('cost_center', 'project', 'branch', 'department')),
  code              text not null,
  name_translations jsonb not null default '{}'::jsonb,
  parent_id         uuid references accounting.dimensions (id),
  -- Budget is optional and only meaningful for cost centres and projects; the
  -- roadmap asks for over-budget warnings, which need a number to compare to.
  budget_amount     numeric(38,18),
  budget_currency   varchar(10) references finance.currencies (code),
  starts_on         date,
  ends_on           date,
  is_active         boolean not null default true,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  unique (kind, code),
  -- Referenced by the composite foreign keys on journal_lines.
  unique (id, kind),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists ix_accounting_dimensions_kind
  on accounting.dimensions (kind) where is_active;

-- ---------------------------------------------------------------------------
-- Accounts — controls an accountant expects the system to enforce for them
-- ---------------------------------------------------------------------------
alter table accounting.accounts
  add column if not exists requires_cost_center boolean not null default false,
  add column if not exists requires_project     boolean not null default false,
  add column if not exists requires_party       boolean not null default false,
  -- "ماهیت حساب": when true, a line may not push the account against its normal
  -- balance. Off by default because contra accounts legitimately swing both ways.
  add column if not exists enforce_normal_balance boolean not null default false,
  -- A closed account keeps its history but accepts nothing new, which is
  -- different from is_active (temporarily hidden) — hence a separate flag.
  add column if not exists is_blocked boolean not null default false;

-- ---------------------------------------------------------------------------
-- Fiscal periods — soft and hard locks
--
-- `status` already had open/closing/closed. A soft lock is a *permission* gate:
-- senior roles may still post. A hard lock is absolute; reopening is itself an
-- audited act. Keeping them apart is the difference between "month-end is in
-- progress" and "this year is filed".
-- ---------------------------------------------------------------------------
alter table accounting.fiscal_periods
  add column if not exists lock_level text not null default 'none'
    check (lock_level in ('none', 'soft', 'hard')),
  add column if not exists locked_at  timestamptz,
  add column if not exists locked_by  uuid,
  add column if not exists unlocked_at timestamptz,
  add column if not exists unlocked_by uuid,
  add column if not exists lock_note  text;

-- ---------------------------------------------------------------------------
-- Journal entries — the document lifecycle
-- ---------------------------------------------------------------------------
alter table accounting.journal_entries
  -- شماره عطف: the number of the paper the document came from (bank advice,
  -- invoice, receipt). Distinct from entry_number, which the system assigns.
  add column if not exists reference_number text,
  add column if not exists entry_type text not null default 'general'
    check (entry_type in ('general', 'receipt', 'payment', 'provider_settlement',
                          'patient_refund', 'fx_revaluation', 'opening', 'closing',
                          'adjustment')),
  -- entry_date is when the event happened; this is when it hit the books.
  add column if not exists posted_at timestamptz,
  add column if not exists submitted_by uuid,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by uuid,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists posted_by uuid,
  add column if not exists template_id uuid,
  add column if not exists recurring_schedule_id uuid,
  -- Set when a document is created with "copy from", so the lineage is visible.
  add column if not exists copied_from_entry_id uuid references accounting.journal_entries (id),
  add column if not exists is_manual boolean not null default false;

-- A reference number, when given, is unique inside its fiscal year — the point
-- of عطف is to make double-entering the same bank advice impossible.
create unique index if not exists ux_accounting_entries_reference
  on accounting.journal_entries (fiscal_period_id, reference_number)
  where reference_number is not null;

create index if not exists ix_accounting_entries_status_manual
  on accounting.journal_entries (status, is_manual, entry_date desc);

-- Widen the status ladder. draft/posted/reversed came first; `temporary` and
-- `approved` are the two review states a manual document passes through.
alter table accounting.journal_entries
  drop constraint if exists journal_entries_status_check;
alter table accounting.journal_entries
  add constraint journal_entries_status_check
  check (status in ('draft', 'temporary', 'approved', 'posted', 'reversed', 'rejected'));

-- ---------------------------------------------------------------------------
-- Journal lines — analytic dimensions
--
-- Each FK carries a generated column holding the kind it must point at, so the
-- composite foreign key does the type checking. No trigger, no application-level
-- discipline required.
-- ---------------------------------------------------------------------------
alter table accounting.journal_lines
  add column if not exists cost_center_id uuid,
  add column if not exists project_id     uuid,
  add column if not exists branch_id      uuid,
  add column if not exists department_id  uuid;

alter table accounting.journal_lines
  add column if not exists cost_center_kind text
    generated always as ('cost_center') stored,
  add column if not exists project_kind text
    generated always as ('project') stored,
  add column if not exists branch_kind text
    generated always as ('branch') stored,
  add column if not exists department_kind text
    generated always as ('department') stored;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_lines_cost_center') then
    alter table accounting.journal_lines
      add constraint fk_lines_cost_center
      foreign key (cost_center_id, cost_center_kind)
      references accounting.dimensions (id, kind);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_lines_project') then
    alter table accounting.journal_lines
      add constraint fk_lines_project
      foreign key (project_id, project_kind)
      references accounting.dimensions (id, kind);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_lines_branch') then
    alter table accounting.journal_lines
      add constraint fk_lines_branch
      foreign key (branch_id, branch_kind)
      references accounting.dimensions (id, kind);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_lines_department') then
    alter table accounting.journal_lines
      add constraint fk_lines_department
      foreign key (department_id, department_kind)
      references accounting.dimensions (id, kind);
  end if;
end $$;

create index if not exists ix_accounting_lines_cost_center
  on accounting.journal_lines (cost_center_id) where cost_center_id is not null;
create index if not exists ix_accounting_lines_project
  on accounting.journal_lines (project_id) where project_id is not null;

-- ---------------------------------------------------------------------------
-- Attachments
-- ---------------------------------------------------------------------------
create table if not exists accounting.entry_attachments (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references accounting.journal_entries (id) on delete cascade,
  file_url     text not null,
  file_name    text not null,
  content_type text,
  size_bytes   bigint check (size_bytes is null or size_bytes >= 0),
  kind         text not null default 'other'
    check (kind in ('invoice', 'receipt', 'bank_advice', 'contract', 'other')),
  note         text,
  uploaded_by  uuid,
  uploaded_at  timestamptz not null default now()
);

create index if not exists ix_accounting_attachments_entry
  on accounting.entry_attachments (entry_id);

-- ---------------------------------------------------------------------------
-- Templates and recurring documents
-- ---------------------------------------------------------------------------
create table if not exists accounting.entry_templates (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name_translations jsonb not null default '{}'::jsonb,
  entry_type        text not null default 'general',
  description       text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  created_by        uuid
);

create table if not exists accounting.entry_template_lines (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references accounting.entry_templates (id) on delete cascade,
  line_no        smallint not null,
  account_id     uuid not null references accounting.accounts (id),
  side           text not null check (side in ('debit', 'credit')),
  -- Null means "ask when the template is used"; a value pre-fills the amount.
  amount         numeric(38,18) check (amount is null or amount >= 0),
  currency_code  varchar(10) references finance.currencies (code),
  cost_center_id uuid references accounting.dimensions (id),
  project_id     uuid references accounting.dimensions (id),
  memo           text,
  unique (template_id, line_no)
);

create table if not exists accounting.recurring_schedules (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references accounting.entry_templates (id),
  code           text not null unique,
  frequency      text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  interval_count integer not null default 1 check (interval_count > 0),
  starts_on      date not null,
  ends_on        date,
  next_run_on    date not null,
  last_run_at    timestamptz,
  -- Generated documents land as `temporary` so a human still reviews them.
  created_status text not null default 'temporary'
    check (created_status in ('draft', 'temporary')),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  created_by     uuid,
  check (ends_on is null or ends_on >= starts_on)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_entries_template') then
    alter table accounting.journal_entries
      add constraint fk_entries_template foreign key (template_id)
      references accounting.entry_templates (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_entries_recurring') then
    alter table accounting.journal_entries
      add constraint fk_entries_recurring foreign key (recurring_schedule_id)
      references accounting.recurring_schedules (id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Which statuses are editable, and which mean "this is in the books"
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_status_is_editable(p_status text)
returns boolean language sql immutable as $$
  select p_status in ('draft', 'temporary');
$$;

create or replace function accounting.fn_status_is_committed(p_status text)
returns boolean language sql immutable as $$
  select p_status in ('approved', 'posted', 'reversed');
$$;

-- ---------------------------------------------------------------------------
-- Balance — enforced when the document leaves the editable states
--
-- Replaces the unconditional check from 0004. A draft may be unbalanced while it
-- is being typed; nothing unbalanced may ever reach approved or posted, which is
-- the rule that actually matters.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_assert_entry_balanced() returns trigger
language plpgsql as $$
declare
  v_entry_id uuid := coalesce(new.entry_id, old.entry_id);
  v_status   text;
  v_bad      record;
  v_base_debit  numeric(38,18);
  v_base_credit numeric(38,18);
begin
  select status into v_status
    from accounting.journal_entries
   where id = v_entry_id;

  -- The entry can be gone already when lines cascade away on delete.
  if v_status is null then
    return null;
  end if;

  if accounting.fn_status_is_editable(v_status) then
    return null;
  end if;

  select currency_code, sum(debit_amount) as d, sum(credit_amount) as c
    into v_bad
    from accounting.journal_lines
   where entry_id = v_entry_id
   group by currency_code
  having sum(debit_amount) <> sum(credit_amount)
   limit 1;

  if found then
    raise exception 'Journal entry % is unbalanced in %: debit % <> credit %',
      v_entry_id, v_bad.currency_code, v_bad.d, v_bad.c
      using errcode = 'check_violation';
  end if;

  select coalesce(sum(base_debit_amount), 0), coalesce(sum(base_credit_amount), 0)
    into v_base_debit, v_base_credit
    from accounting.journal_lines
   where entry_id = v_entry_id;

  if v_base_debit <> v_base_credit then
    raise exception 'Journal entry % is unbalanced in base currency: debit % <> credit %',
      v_entry_id, v_base_debit, v_base_credit
      using errcode = 'check_violation';
  end if;

  if not exists (select 1 from accounting.journal_lines where entry_id = v_entry_id) then
    raise exception 'Journal entry % has no lines', v_entry_id
      using errcode = 'check_violation';
  end if;

  return null;
end $$;

-- Same relaxation for the empty-document guard: a draft may legitimately have no
-- lines yet, a committed document may not.
create or replace function accounting.fn_assert_entry_has_lines() returns trigger
language plpgsql as $$
begin
  if accounting.fn_status_is_editable(new.status) then
    return null;
  end if;
  if not exists (select 1 from accounting.journal_lines where entry_id = new.id) then
    raise exception 'Journal entry % has no lines', new.id using errcode = 'check_violation';
  end if;
  return null;
end $$;

-- The has-lines guard only fired on INSERT, so a draft that was later promoted to
-- posted skipped it entirely. It now fires on the promotion too.
drop trigger if exists trg_accounting_entries_have_lines on accounting.journal_entries;
create constraint trigger trg_accounting_entries_have_lines
  after insert or update of status on accounting.journal_entries
  deferrable initially deferred
  for each row execute function accounting.fn_assert_entry_has_lines();

-- The balance guard hangs off journal_lines and therefore never fires for a
-- status change that touches only the entry. This covers promotion.
create or replace function accounting.fn_assert_entry_balanced_on_status() returns trigger
language plpgsql as $$
declare
  v_bad record;
  v_base_debit numeric(38,18);
  v_base_credit numeric(38,18);
begin
  if accounting.fn_status_is_editable(new.status) then
    return null;
  end if;

  select currency_code, sum(debit_amount) as d, sum(credit_amount) as c
    into v_bad
    from accounting.journal_lines
   where entry_id = new.id
   group by currency_code
  having sum(debit_amount) <> sum(credit_amount)
   limit 1;

  if found then
    raise exception 'Journal entry % cannot become % while unbalanced in %: debit % <> credit %',
      new.id, new.status, v_bad.currency_code, v_bad.d, v_bad.c
      using errcode = 'check_violation';
  end if;

  select coalesce(sum(base_debit_amount), 0), coalesce(sum(base_credit_amount), 0)
    into v_base_debit, v_base_credit
    from accounting.journal_lines
   where entry_id = new.id;

  if v_base_debit <> v_base_credit then
    raise exception 'Journal entry % cannot become % while unbalanced in base currency: % <> %',
      new.id, new.status, v_base_debit, v_base_credit
      using errcode = 'check_violation';
  end if;

  return null;
end $$;

drop trigger if exists trg_accounting_entries_balanced_on_status on accounting.journal_entries;
create constraint trigger trg_accounting_entries_balanced_on_status
  after insert or update of status on accounting.journal_entries
  deferrable initially deferred
  for each row execute function accounting.fn_assert_entry_balanced_on_status();

-- ---------------------------------------------------------------------------
-- Immutability — widened for the second editable state, and for lines
--
-- This replaces accounting.fn_block_ledger_mutation from 0004, which both the
-- entries and the lines trigger call. Two changes:
--
--   1. `temporary` joins `draft` as an editable state.
--   2. Lines of an editable entry become editable. 0004 blocked every UPDATE and
--      DELETE on journal_lines unconditionally — correct while entries were only
--      ever written by code in one shot, but it makes a manual entry form
--      impossible, since editing a document means changing and removing lines.
--      Lines of a committed entry stay as immutable as they were.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_block_ledger_mutation() returns trigger
language plpgsql as $$
declare
  v_entry_status text;
begin
  if tg_op = 'UPDATE' and tg_table_name = 'journal_entries' then
    if accounting.fn_status_is_editable(old.status) then
      return new;
    end if;

    -- A committed document may still record its own supersession and the
    -- workflow stamps that go with it, but nothing financial.
    if to_jsonb(new) - 'reversed_by_entry_id' - 'status' - 'posted_at' - 'posted_by'
         - 'approved_at' - 'approved_by' - 'rejected_at' - 'rejected_by'
         - 'rejection_reason'
       = to_jsonb(old) - 'reversed_by_entry_id' - 'status' - 'posted_at' - 'posted_by'
         - 'approved_at' - 'approved_by' - 'rejected_at' - 'rejected_by'
         - 'rejection_reason'
       and new.status in ('approved', 'posted', 'reversed', 'rejected')
    then
      return new;
    end if;
  end if;

  if tg_table_name = 'journal_lines' then
    select status into v_entry_status
      from accounting.journal_entries
     where id = coalesce(new.entry_id, old.entry_id);

    -- The parent is already gone when an entry cascades away; let the cascade run.
    if v_entry_status is null then
      return coalesce(new, old);
    end if;

    if accounting.fn_status_is_editable(v_entry_status) then
      return coalesce(new, old);
    end if;
  end if;

  raise exception
    'accounting.% is append-only (attempted %). Correct a posted entry with a reversing entry.',
    tg_table_name, tg_op
    using errcode = 'restrict_violation';
end $$;

-- ---------------------------------------------------------------------------
-- Required dimensions
--
-- An account may demand a cost centre, a project or a party. Checked when the
-- document commits rather than on every keystroke, so a half-filled draft is
-- still saveable.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_assert_line_dimensions() returns trigger
language plpgsql as $$
declare
  v_status  text;
  v_account record;
begin
  select status into v_status from accounting.journal_entries where id = new.entry_id;
  if v_status is null or accounting.fn_status_is_editable(v_status) then
    return null;
  end if;

  select code, requires_cost_center, requires_project, requires_party,
         enforce_normal_balance, normal_balance, is_blocked
    into v_account
    from accounting.accounts
   where id = new.account_id;

  if v_account.is_blocked then
    raise exception 'Account % is blocked and cannot receive postings', v_account.code
      using errcode = 'check_violation';
  end if;

  if v_account.requires_cost_center and new.cost_center_id is null then
    raise exception 'Account % requires a cost centre on every line', v_account.code
      using errcode = 'check_violation';
  end if;

  if v_account.requires_project and new.project_id is null then
    raise exception 'Account % requires a project on every line', v_account.code
      using errcode = 'check_violation';
  end if;

  if v_account.requires_party and new.party_id is null then
    raise exception 'Account % requires a party on every line', v_account.code
      using errcode = 'check_violation';
  end if;

  if v_account.enforce_normal_balance then
    if v_account.normal_balance = 'debit' and new.credit_amount > 0 and new.debit_amount = 0 then
      raise exception 'Account % has a debit nature; a credit-only line contradicts it', v_account.code
        using errcode = 'check_violation';
    end if;
    if v_account.normal_balance = 'credit' and new.debit_amount > 0 and new.credit_amount = 0 then
      raise exception 'Account % has a credit nature; a debit-only line contradicts it', v_account.code
        using errcode = 'check_violation';
    end if;
  end if;

  return null;
end $$;

drop trigger if exists trg_accounting_lines_dimensions on accounting.journal_lines;
create constraint trigger trg_accounting_lines_dimensions
  after insert or update on accounting.journal_lines
  deferrable initially deferred
  for each row execute function accounting.fn_assert_line_dimensions();

-- The line trigger above cannot fire when only the *entry* changes, so a draft
-- with a missing cost centre would sail through the moment it was promoted. This
-- re-runs the same checks over every line at the point of commitment — the same
-- gap the balance check has, and it has to be closed the same way.
create or replace function accounting.fn_assert_entry_dimensions() returns trigger
language plpgsql as $$
declare
  v_line record;
begin
  if accounting.fn_status_is_editable(new.status) then
    return null;
  end if;

  for v_line in
    select l.cost_center_id, l.project_id, l.party_id,
           l.debit_amount, l.credit_amount,
           a.code, a.requires_cost_center, a.requires_project, a.requires_party,
           a.enforce_normal_balance, a.normal_balance, a.is_blocked
      from accounting.journal_lines l
      join accounting.accounts a on a.id = l.account_id
     where l.entry_id = new.id
  loop
    if v_line.is_blocked then
      raise exception 'Account % is blocked and cannot receive postings', v_line.code
        using errcode = 'check_violation';
    end if;
    if v_line.requires_cost_center and v_line.cost_center_id is null then
      raise exception 'Account % requires a cost centre on every line', v_line.code
        using errcode = 'check_violation';
    end if;
    if v_line.requires_project and v_line.project_id is null then
      raise exception 'Account % requires a project on every line', v_line.code
        using errcode = 'check_violation';
    end if;
    if v_line.requires_party and v_line.party_id is null then
      raise exception 'Account % requires a party on every line', v_line.code
        using errcode = 'check_violation';
    end if;
    if v_line.enforce_normal_balance then
      if v_line.normal_balance = 'debit'
         and v_line.credit_amount > 0 and v_line.debit_amount = 0 then
        raise exception 'Account % has a debit nature; a credit-only line contradicts it', v_line.code
          using errcode = 'check_violation';
      end if;
      if v_line.normal_balance = 'credit'
         and v_line.debit_amount > 0 and v_line.credit_amount = 0 then
        raise exception 'Account % has a credit nature; a debit-only line contradicts it', v_line.code
          using errcode = 'check_violation';
      end if;
    end if;
  end loop;

  return null;
end $$;

drop trigger if exists trg_accounting_entries_dimensions on accounting.journal_entries;
create constraint trigger trg_accounting_entries_dimensions
  after insert or update of status on accounting.journal_entries
  deferrable initially deferred
  for each row execute function accounting.fn_assert_entry_dimensions();

-- ---------------------------------------------------------------------------
-- Period locking on write
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_assert_period_writable() returns trigger
language plpgsql as $$
declare
  v_lock text;
  v_code text;
begin
  select lock_level, code into v_lock, v_code
    from accounting.fiscal_periods
   where id = new.fiscal_period_id;

  if v_lock = 'hard' then
    raise exception 'Fiscal period % is hard-locked; reopen it before posting', v_code
      using errcode = 'check_violation';
  end if;

  return new;
end $$;

drop trigger if exists trg_accounting_entries_period_writable on accounting.journal_entries;
create trigger trg_accounting_entries_period_writable
  before insert or update of fiscal_period_id, status on accounting.journal_entries
  for each row execute function accounting.fn_assert_period_writable();

-- ---------------------------------------------------------------------------
-- Seed the dimensions the business already talks about
-- ---------------------------------------------------------------------------
insert into accounting.dimensions (kind, code, name_translations)
values
  ('branch',      'IR',      '{"fa":"ایران","en":"Iran"}'::jsonb),
  ('branch',      'TR',      '{"fa":"ترکیه","en":"Türkiye"}'::jsonb),
  ('branch',      'IQ',      '{"fa":"عراق","en":"Iraq"}'::jsonb),
  ('cost_center', 'OPS',     '{"fa":"عملیات","en":"Operations"}'::jsonb),
  ('cost_center', 'MKT',     '{"fa":"بازاریابی","en":"Marketing"}'::jsonb),
  ('cost_center', 'TECH',    '{"fa":"فناوری و توسعه","en":"Technology"}'::jsonb),
  ('cost_center', 'ADMIN',   '{"fa":"اداری و پشتیبانی","en":"Administration"}'::jsonb),
  ('department',  'FIN',     '{"fa":"مالی","en":"Finance"}'::jsonb),
  ('department',  'SUPPORT', '{"fa":"پشتیبانی","en":"Support"}'::jsonb)
on conflict (kind, code) do nothing;

commit;
