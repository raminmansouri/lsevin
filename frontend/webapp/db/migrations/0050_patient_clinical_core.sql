-- ---------------------------------------------------------------------------
-- 0050 — Patient 360 V2: clinical record core (conditions, procedures,
-- allergies, medications, product usage, symptoms).
--
-- Every table shares the V2.1 "common clinical fields" shape: a soft,
-- nullable link to a future medical case/encounter (patient.medical_cases /
-- patient.clinical_encounters don't exist until V4 -- these columns are
-- added now, nullable and FK-less, so V4 doesn't need to re-migrate every
-- V2 table to add them), explicit source/provenance (section 4 of the spec
-- doc), a verification_status distinguishing patient-reported from
-- clinician-verified fact, and an optimistic-concurrency `version` column
-- matching patient.patients' own pattern.
--
-- provider_id/organization_id are soft references to
-- category.service_providers -- no FK, same cross-schema convention as
-- every other hand-written schema here (e.g. transfer.routes).
-- ---------------------------------------------------------------------------
begin;

-- Reused by every table below via a domain-style CHECK list (Postgres has no
-- shared enum-by-reference without a real CREATE TYPE, and this codebase's
-- other hand-written schemas consistently prefer plain `text + check` over
-- custom types -- see patient.patients.status in 0048).
-- source_type values: patient, family_member, doctor, hospital, clinic, lab,
--   lsevin_coordinator, imported_ehr, api, document, ocr, ai_extraction, shop
-- verification_status values: patient_reported, imported, unverified,
--   provisional, verified, refuted, entered_in_error

create table if not exists patient.medications (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  generic_name   text,
  brand_name     text,
  create_date    timestamptz not null default now()
);

create table if not exists patient.patient_conditions (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  encounter_id         uuid,

  code                 text,
  coding_system        text,
  display_name         text not null,
  patient_entered_name text,

  clinical_status      text not null default 'active'
                         check (clinical_status in ('active', 'inactive', 'resolved', 'remission', 'recurrence', 'unknown')),
  severity             text,
  body_site            text,

  onset_date           date,
  resolved_date        date,
  notes                text,

  status               text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  effective_from       date,
  effective_to         date,
  source_type          text not null default 'lsevin_coordinator',
  source_id            uuid,
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),
  provider_id          uuid,
  organization_id      uuid,

  version              integer not null default 1,
  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid
);
create index if not exists ix_patient_conditions_patient on patient.patient_conditions (patient_id, status);

create table if not exists patient.patient_procedures (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  encounter_id         uuid,

  procedure_code       text,
  procedure_name       text not null,
  category             text,
  procedure_status      text not null default 'completed'
                         check (procedure_status in ('planned', 'in_progress', 'completed', 'cancelled', 'entered_in_error')),

  performed_from       date not null,
  performed_until      date,

  body_site            text,
  outcome              text,
  complications        text,
  country_code         text,
  city                 text,
  notes                text,

  status               text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  effective_from       date,
  effective_to         date,
  source_type          text not null default 'lsevin_coordinator',
  source_id            uuid,
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),
  provider_id          uuid,
  organization_id      uuid,

  version              integer not null default 1,
  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid
);
create index if not exists ix_patient_procedures_patient on patient.patient_procedures (patient_id, status);

create table if not exists patient.patient_allergies (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  encounter_id         uuid,

  -- category = 'no_known_allergies' is the explicit affirmative "assessed,
  -- and there are none" statement -- distinct from no row existing at all,
  -- which means never assessed / unknown (spec V2.4).
  substance            text,
  allergen_code        text,
  category             text not null check (category in ('food', 'medication', 'environmental', 'biologic', 'no_known_allergies', 'other')),
  reaction             text,
  severity             text,
  criticality          text,
  onset_date           date,
  notes                text,

  status               text not null default 'active' check (status in ('active', 'inactive', 'resolved', 'archived', 'entered_in_error')),
  effective_from       date,
  effective_to         date,
  source_type          text not null default 'lsevin_coordinator',
  source_id            uuid,
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),
  provider_id          uuid,
  organization_id      uuid,

  version              integer not null default 1,
  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid,

  constraint ck_patient_allergies_substance check (category = 'no_known_allergies' or substance is not null)
);
create index if not exists ix_patient_allergies_patient on patient.patient_allergies (patient_id, status);

create table if not exists patient.patient_medications (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  encounter_id         uuid,
  medication_id        uuid references patient.medications (id),

  name                 text not null,
  generic_name         text,
  brand_name           text,
  dose                 text,
  dose_unit            text,
  route                text,
  frequency            text,

  start_date           date,
  end_date             date,

  medication_status    text not null default 'active'
                         check (medication_status in ('planned', 'active', 'completed', 'stopped', 'unknown')),
  -- Distinguishes "patient reports taking" from "doctor prescribed" per spec
  -- V2.5, orthogonal to source_type (a coordinator can enter either kind).
  reported_or_prescribed text not null default 'patient_reported'
                         check (reported_or_prescribed in ('patient_reported', 'prescribed')),
  reason               text,
  prescribed_by        uuid,
  notes                text,

  status               text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  effective_from       date,
  effective_to         date,
  source_type          text not null default 'lsevin_coordinator',
  source_id            uuid,
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),
  provider_id          uuid,
  organization_id      uuid,

  version              integer not null default 1,
  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid
);
create index if not exists ix_patient_medications_patient on patient.patient_medications (patient_id, status);

create table if not exists patient.patient_product_usage (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  -- Soft refs into shop.products / shop.order_items -- cross-schema, no FK,
  -- same rule every other hand-written schema here follows.
  product_id           uuid,
  shop_order_item_id   uuid,

  product_name         text not null,
  category             text not null check (category in ('supplement', 'cosmetic', 'medical_device', 'nutrition', 'other')),

  started_at           date,
  ended_at             date,
  usage_frequency      text,

  reason               text,
  effect_reported      text,
  adverse_effect       text,
  recommended_by       uuid,
  notes                text,

  status               text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  effective_from       date,
  effective_to         date,
  source_type          text not null default 'lsevin_coordinator',
  source_id            uuid,
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),
  provider_id          uuid,
  organization_id      uuid,

  version              integer not null default 1,
  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid
);
create index if not exists ix_patient_product_usage_patient on patient.patient_product_usage (patient_id, status);

create table if not exists patient.patient_symptoms (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  encounter_id         uuid,

  name                 text not null,
  body_site            text,
  severity             text,
  patient_description  text,

  onset_date           date,
  resolved_date        date,

  status               text not null default 'active' check (status in ('active', 'resolved', 'archived', 'entered_in_error')),
  effective_from       date,
  effective_to         date,
  source_type          text not null default 'lsevin_coordinator',
  source_id            uuid,
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),
  provider_id          uuid,
  organization_id      uuid,

  version              integer not null default 1,
  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid
);
create index if not exists ix_patient_symptoms_patient on patient.patient_symptoms (patient_id, status);

commit;
