-- ---------------------------------------------------------------------------
-- 0122 — Patient health questionnaire (customer "my health record" intake).
--
-- The step-by-step questionnaire on /n/app/mobile/profile/my-health-record
-- writes list-shaped answers into the tables that already exist for them
-- (patient_conditions, patient_allergies, patient_medications,
-- patient_procedures, clinical_documents -- all stamped source_type 'patient'
-- / 'patient_reported'). This table holds only what has no home there:
-- body measurements, the main reason for coming, yes/no screening answers,
-- pregnancy, anesthesia history and lifestyle.
--
-- One row per patient (not per account): a parent filling the questionnaire
-- for a child edits the child's row. Answers are self-reported and never
-- verified by this table; the admin patient page shows them labelled as such.
--
-- condition_answers shape:
--   { "<key>": { "answer": "yes" | "no" | "unsure", "details": "...",
--                "conditionId": "<patient_conditions.id, when answer = yes>" } }
-- conditionId is how a later "no" archives the condition row a previous "yes"
-- created, instead of leaving it behind or creating duplicates.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.health_intakes (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references patient.patients (id),

  height_cm             numeric(5, 1) check (height_cm is null or height_cm between 30 and 260),
  weight_kg             numeric(5, 1) check (weight_kg is null or weight_kg between 1 and 400),
  blood_type            text check (blood_type is null or blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),

  main_concern          text,
  concern_body_area     text,
  concern_duration      text check (concern_duration is null or concern_duration in ('days', 'weeks', 'months', 'years')),
  concern_severity      smallint check (concern_severity is null or concern_severity between 0 and 10),
  desired_treatment     text,

  condition_answers     jsonb not null default '{}'::jsonb,
  pregnancy_status      text check (pregnancy_status is null or pregnancy_status in ('pregnant', 'breastfeeding', 'trying', 'none', 'unsure')),

  anesthesia_problems   text check (anesthesia_problems is null or anesthesia_problems in ('yes', 'no', 'unsure')),
  anesthesia_details    text,
  takes_blood_thinners  text check (takes_blood_thinners is null or takes_blood_thinners in ('yes', 'no', 'unsure')),

  smoking               text check (smoking is null or smoking in ('never', 'former', 'current')),
  alcohol               text check (alcohol is null or alcohol in ('never', 'occasional', 'regular')),
  activity_level        text check (activity_level is null or activity_level in ('low', 'moderate', 'high')),

  completed_steps       text[] not null default '{}',
  completed_at          timestamptz,

  version               integer not null default 1,
  create_date           timestamptz not null default now(),
  created_by            uuid,
  last_modified_date    timestamptz not null default now(),
  last_modified_by      uuid,

  constraint uq_patient_health_intakes_patient unique (patient_id)
);

commit;
