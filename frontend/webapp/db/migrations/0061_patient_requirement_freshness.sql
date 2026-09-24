-- ---------------------------------------------------------------------------
-- 0061 — Patient 360: requirement freshness + mandatory flag.
--
-- Per project owner: staff/providers sometimes need a file with a freshness
-- rule ("blood sugar test from the last 48 hours") and sometimes need to
-- mark a requirement as optional rather than mandatory. Confirmed decision:
-- freshness is informational only (staff/provider judges the uploaded
-- file's own date against this rule themselves) -- the system does not
-- auto-compare dates or auto-expire anything based on it.
-- ---------------------------------------------------------------------------
begin;

alter table patient.medical_case_requirements
  add column if not exists max_age_hours integer,
  add column if not exists is_mandatory boolean not null default true;

commit;
