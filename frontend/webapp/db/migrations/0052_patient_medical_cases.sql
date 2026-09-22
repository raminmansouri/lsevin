-- ---------------------------------------------------------------------------
-- 0052 — Patient 360 V4: medical case & medical tourism workflow.
--
-- A MedicalCase is a treatment journey (local or international); a patient
-- may have several, open at once or over time. Everything under V0-V3
-- (identifiers, clinical history, documents, labs, imaging) already reads
-- and writes independently of any case -- this migration adds the case
-- layer on top, reusing that history rather than owning a copy of it (spec
-- non-negotiable rule: "Medical cases MUST NOT own the patient's entire
-- medical history").
--
-- provider_id/organization_id/service_id remain soft cross-schema
-- references (no FK), same convention as every hand-written schema here.
-- Within this migration's own tables, real FKs are used (they're all in the
-- same `patient` schema) except where an array of ids is stored (Postgres
-- has no FK on array elements) -- those stay soft/application-validated.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.medical_cases (
  id                       uuid primary key default gen_random_uuid(),
  patient_id               uuid not null references patient.patients (id),
  case_number              text not null default ('MC' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10))),

  case_type                text not null,
  specialty                text,
  service_id               uuid,

  title                    text not null,
  description              text,
  chief_complaint          text,
  reason_for_care          text,

  case_status              text not null default 'draft' check (case_status in (
                              'draft', 'intake', 'awaiting_documents', 'ready_for_review', 'under_medical_review',
                              'awaiting_provider', 'treatment_proposed', 'quote_received', 'patient_decision',
                              'booked', 'travel_preparation', 'in_treatment', 'post_treatment', 'follow_up',
                              'completed', 'cancelled'
                            )),
  priority                 text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),

  origin_country           text,
  origin_city              text,
  desired_country          text,
  desired_city             text,

  assigned_coordinator_id  uuid,
  primary_provider_id      uuid,
  primary_organization_id  uuid,

  opened_at                timestamptz not null default now(),
  closed_at                timestamptz,

  create_date              timestamptz not null default now(),
  created_by               uuid,
  last_modified_date       timestamptz not null default now(),
  last_modified_by         uuid,

  constraint uq_medical_cases_case_number unique (case_number)
);
create index if not exists ix_medical_cases_patient on patient.medical_cases (patient_id, case_status);

-- V4.2 status workflow -- every transition recorded, actor + timestamp
-- always known (spec: "Record actor and timestamp for every transition").
-- Permitted from->to pairs are validated in application code (see
-- server/cases-repository.ts) rather than as a DB constraint, so the
-- transition graph can evolve without a migration.
create table if not exists patient.medical_case_status_history (
  id               uuid primary key default gen_random_uuid(),
  medical_case_id  uuid not null references patient.medical_cases (id),
  from_status      text,
  to_status        text not null,
  actor_id         uuid,
  note             text,
  occurred_at      timestamptz not null default now()
);
create index if not exists ix_medical_case_status_history_case on patient.medical_case_status_history (medical_case_id, occurred_at desc);

create table if not exists patient.clinical_encounters (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null references patient.patients (id),
  medical_case_id     uuid references patient.medical_cases (id),

  encounter_type      text not null check (encounter_type in (
                         'video_consultation', 'clinic_visit', 'hospital_admission', 'emergency_visit',
                         'diagnostic_visit', 'treatment_session', 'follow_up', 'other'
                       )),
  encounter_status    text not null default 'scheduled'
                        check (encounter_status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),

  started_at          timestamptz not null,
  ended_at            timestamptz,

  provider_id         uuid,
  organization_id     uuid,
  reason              text,
  summary             text,

  create_date         timestamptz not null default now(),
  created_by          uuid,
  last_modified_date  timestamptz not null default now()
);
create index if not exists ix_clinical_encounters_patient on patient.clinical_encounters (patient_id);
create index if not exists ix_clinical_encounters_case on patient.clinical_encounters (medical_case_id);

create table if not exists patient.medical_case_requirements (
  id                     uuid primary key default gen_random_uuid(),
  medical_case_id        uuid not null references patient.medical_cases (id),

  requirement_type       text not null check (requirement_type in ('document', 'lab_test', 'imaging', 'questionnaire', 'medical_clearance', 'passport', 'other')),
  title                  text not null,
  description            text,

  requirement_status     text not null default 'missing'
                           check (requirement_status in ('missing', 'requested', 'received', 'expired', 'rejected', 'accepted')),
  expires_at             date,
  -- Soft reference into patient.clinical_documents once the requirement is
  -- satisfied by an uploaded document.
  fulfilled_document_id  uuid references patient.clinical_documents (id),

  create_date            timestamptz not null default now(),
  created_by             uuid,
  last_modified_date     timestamptz not null default now()
);
create index if not exists ix_medical_case_requirements_case on patient.medical_case_requirements (medical_case_id, requirement_status);

-- V4.5 provider medical package -- a point-in-time snapshot (exact
-- records/versions included), never a live query, so what a provider was
-- actually shown stays reconstructable later even if the source records
-- change (spec: "Store package snapshot. Record exact records/versions
-- included."). PDF generation is explicitly deferred -- see
-- server/cases-repository.ts's header comment.
create table if not exists patient.medical_case_packages (
  id                uuid primary key default gen_random_uuid(),
  medical_case_id   uuid not null references patient.medical_cases (id),
  patient_id        uuid not null references patient.patients (id),

  included_scopes   text[] not null default '{}',
  snapshot          jsonb not null,

  generated_by      uuid,
  create_date       timestamptz not null default now()
);
create index if not exists ix_medical_case_packages_case on patient.medical_case_packages (medical_case_id);

create table if not exists patient.medical_case_provider_submissions (
  id                uuid primary key default gen_random_uuid(),
  medical_case_id   uuid not null references patient.medical_cases (id),

  provider_id       uuid not null,
  organization_id   uuid,
  sent_at           timestamptz not null default now(),

  response_status   text not null default 'pending' check (response_status in ('pending', 'accepted', 'declined', 'needs_more_info')),
  response_at       timestamptz,
  attachments       uuid[] not null default '{}',
  provider_notes    text,

  create_date       timestamptz not null default now(),
  created_by        uuid
);
create index if not exists ix_medical_case_submissions_case on patient.medical_case_provider_submissions (medical_case_id);

create table if not exists patient.medical_case_treatment_proposals (
  id                        uuid primary key default gen_random_uuid(),
  medical_case_id           uuid not null references patient.medical_cases (id),

  diagnosis                 text,
  suggested_procedure        text,
  treatment_plan             text,
  estimated_stay_days        integer,
  estimated_treatment_duration text,
  -- Deliberately just a reference/label, never a stored amount -- spec:
  -- "Keep medical proposal separate from financial quote." The real quote
  -- lives in whatever this deployment's commercial/quote system is; this
  -- column only lets staff note which quote a proposal corresponds to.
  price_quote_reference      text,

  provider_id                uuid,
  valid_until                date,
  supporting_documents       uuid[] not null default '{}',

  proposal_status            text not null default 'proposed'
                               check (proposal_status in ('proposed', 'accepted', 'rejected', 'expired', 'superseded')),

  create_date                timestamptz not null default now(),
  created_by                 uuid,
  last_modified_date         timestamptz not null default now()
);
create index if not exists ix_medical_case_proposals_case on patient.medical_case_treatment_proposals (medical_case_id);

-- Multiple competing opinions are preserved side by side -- no supersede
-- chain, just distinct rows (spec: "Preserve multiple competing opinions").
create table if not exists patient.medical_case_second_opinions (
  id                 uuid primary key default gen_random_uuid(),
  medical_case_id    uuid not null references patient.medical_cases (id),

  provider_id        uuid not null,
  related_documents  uuid[] not null default '{}',
  opinion_date       date not null,
  conclusion         text not null,

  create_date        timestamptz not null default now(),
  created_by         uuid
);
create index if not exists ix_medical_case_second_opinions_case on patient.medical_case_second_opinions (medical_case_id);

create table if not exists patient.medical_case_follow_ups (
  id                       uuid primary key default gen_random_uuid(),
  medical_case_id          uuid not null references patient.medical_cases (id),
  encounter_id             uuid references patient.clinical_encounters (id),

  scheduled_date           date not null,
  required_items           text,
  patient_reported_outcome text,
  provider_notes           text,

  followup_status          text not null default 'scheduled'
                             check (followup_status in ('scheduled', 'completed', 'missed', 'cancelled')),

  create_date              timestamptz not null default now(),
  created_by               uuid,
  last_modified_date       timestamptz not null default now()
);
create index if not exists ix_medical_case_follow_ups_case on patient.medical_case_follow_ups (medical_case_id, scheduled_date);

commit;
