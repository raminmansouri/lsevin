-- ---------------------------------------------------------------------------
-- 0056 — Patient 360 V7: FHIR mapping/export & International Patient Summary.
--
-- The FHIR mapping itself (V7.1) and export (V7.3) are pure TypeScript +
-- API routes -- no new tables needed there, since they read the existing
-- V0-V6 tables and never store a copy of what they export. Two genuinely
-- new tables:
--
-- patient.terminology_mappings (V7.2) -- deliberately unseeded. Loading
-- real ICD-10/SNOMED CT/LOINC code systems is a licensing- and data-heavy
-- exercise well outside this migration; what's shipped is the table shape
-- and a lookup path the FHIR mapper already consults (falls back to a
-- text-only CodeableConcept when nothing is curated, which is every row
-- today). No curation UI is built in this pass either.
--
-- patient.patient_passports (V7.4) -- a stored snapshot + FHIR bundle,
-- versioned like the V4.5 medical case package it mirrors. PDF generation
-- is deliberately out of scope here for the same reason it was for V4.5:
-- it needs a new rendering dependency, and this repo's convention is no
-- new packages without sign-off.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.terminology_mappings (
  id               uuid primary key default gen_random_uuid(),

  source_system    text,
  source_code      text,
  source_text      text not null,

  target_system    text not null check (target_system in ('icd10', 'icd11', 'snomed_ct', 'loinc', 'lsevin_internal', 'provider_local')),
  target_code      text not null,
  target_display   text,
  target_version   text,

  create_date      timestamptz not null default now(),
  created_by       uuid
);
-- Case-insensitive exact match on the free-text source term is the lookup
-- path the FHIR mapper uses (source_code, when known, is a stronger key but
-- most of this codebase's clinical entry today is free text -- see V2's
-- display_name/substance/name columns).
create index if not exists ix_terminology_mappings_source_text on patient.terminology_mappings (lower(source_text));
create index if not exists ix_terminology_mappings_source_code on patient.terminology_mappings (source_system, source_code);

create table if not exists patient.patient_passports (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references patient.patients (id),

  language           text not null,
  included_sections  text[] not null default '{}',

  snapshot           jsonb not null,
  fhir_bundle        jsonb not null,

  generated_by       uuid,
  create_date        timestamptz not null default now()
);
create index if not exists ix_patient_passports_patient on patient.patient_passports (patient_id, create_date desc);

commit;
