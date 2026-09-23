-- ---------------------------------------------------------------------------
-- 0058 — Patient 360 V9: advanced analytics & automation.
--
-- V9.1 (health timeline intelligence), V9.3 (case operations analytics) and
-- V9.4 (data quality) need no new tables at all -- they're read-only
-- aggregations over every table V0-V8 already built (see
-- server/analytics-repository.ts). Only V9.2's automation config is new
-- schema: a rule saying "N days after a case of this type completes,
-- create this follow-up."
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.followup_schedule_rules (
  id                  uuid primary key default gen_random_uuid(),
  case_type           text not null,
  days_after_completion integer not null check (days_after_completion >= 0),
  title               text not null,
  required_items      text,
  is_active           boolean not null default true,

  create_date         timestamptz not null default now(),
  created_by          uuid
);
create index if not exists ix_followup_schedule_rules_case_type on patient.followup_schedule_rules (case_type) where is_active;

commit;
