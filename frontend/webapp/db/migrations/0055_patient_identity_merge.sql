-- ---------------------------------------------------------------------------
-- 0055 — Patient 360 V6: identity resolution, merge & reconciliation.
--
-- patient_match_candidates and patient_merges are genuinely new tables.
-- Reconciliation (V6.5) reuses the existing clinical tables' own rows as
-- "the sources" -- a reconciliation decision references two existing
-- record ids (e.g. two patient_conditions rows) rather than duplicating
-- their content into a new table.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.patient_match_candidates (
  id                uuid primary key default gen_random_uuid(),
  patient_a_id      uuid not null references patient.patients (id),
  patient_b_id      uuid not null references patient.patients (id),

  match_score       integer not null,
  match_reasons     text[] not null default '{}',

  candidate_status  text not null default 'pending'
                      check (candidate_status in ('pending', 'confirmed_same_person', 'confirmed_different', 'merged', 'ignored')),

  reviewed_by       uuid,
  reviewed_at       timestamptz,

  create_date       timestamptz not null default now(),

  constraint ck_patient_match_candidates_distinct check (patient_a_id != patient_b_id),
  -- Unordered-pair uniqueness (a,b) and (b,a) are the same candidate -- enforced
  -- by always storing the pair with patient_a_id < patient_b_id (see
  -- server/matching-repository.ts's recordMatchCandidate, which sorts before insert).
  constraint uq_patient_match_candidates_pair unique (patient_a_id, patient_b_id)
);
create index if not exists ix_patient_match_candidates_status on patient.patient_match_candidates (candidate_status);
create index if not exists ix_patient_match_candidates_a on patient.patient_match_candidates (patient_a_id);
create index if not exists ix_patient_match_candidates_b on patient.patient_match_candidates (patient_b_id);

-- V6.3/V6.4 merge + reversible unmerge. reassigned_record_ids/
-- reassigned_conflicts capture exactly which rows (and which of those had a
-- uniqueness-driven status/valid_until flip -- see server/merge-repository.ts)
-- were moved, so unmerge can restore precisely those rows rather than
-- guessing from current state (spec V6.4: "track pre-merge ownership").
create table if not exists patient.patient_merges (
  id                       uuid primary key default gen_random_uuid(),
  surviving_patient_id     uuid not null references patient.patients (id),
  merged_patient_id        uuid not null references patient.patients (id),

  reason                   text not null,
  reassigned_record_ids    jsonb not null default '{}'::jsonb,
  reassigned_conflicts     jsonb not null default '{}'::jsonb,

  merged_by                uuid,
  merged_at                timestamptz not null default now(),

  reversed_by              uuid,
  reversed_at              timestamptz,

  constraint ck_patient_merges_distinct check (surviving_patient_id != merged_patient_id)
);
create index if not exists ix_patient_merges_surviving on patient.patient_merges (surviving_patient_id);
create index if not exists ix_patient_merges_merged on patient.patient_merges (merged_patient_id);

commit;
