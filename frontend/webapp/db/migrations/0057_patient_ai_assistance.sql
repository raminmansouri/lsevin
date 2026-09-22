-- ---------------------------------------------------------------------------
-- 0057 — Patient 360 V8: AI-assisted medical record.
--
-- No AI provider is wired into this deployment (see
-- src/features/patients/server/ai-provider.ts's header comment) -- sending
-- patient PHI to a third-party model needs a vendor choice, a data-handling
-- agreement and a cost budget, none of which is an engineering decision to
-- make unilaterally. What ships here is the complete data model and human
-- verification workflow around AI assistance, so the only remaining step
-- once a provider is chosen is implementing ai-provider.ts's functions for
-- real -- nothing about this schema or the review queue changes.
--
-- V8.5 (Case Readiness Assistant) needs no new table: it's rule-based
-- (missing/expired requirements, duplicate documents), computed from V3/V4
-- tables that already exist -- see server/readiness-repository.ts.
-- V8.6 (Translation Assistance) needs no new table either:
-- patient.clinical_document_translations already supports
-- translation_type = 'ai' since V3.3.
-- ---------------------------------------------------------------------------
begin;

-- V8.1 AI document classification
create table if not exists patient.document_classifications (
  id                 uuid primary key default gen_random_uuid(),
  document_id        uuid not null references patient.clinical_documents (id),

  suggested_type     text not null,
  confidence         numeric not null check (confidence >= 0 and confidence <= 1),
  model              text not null,
  model_version      text not null,

  requires_review    boolean not null default true,
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  accepted_type      text,

  create_date        timestamptz not null default now()
);
create index if not exists ix_document_classifications_document on patient.document_classifications (document_id);

-- V8.2/V8.3 AI extraction candidates + human verification queue
create table if not exists patient.ai_extraction_candidates (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  document_id          uuid not null references patient.clinical_documents (id),

  candidate_type       text not null check (candidate_type in ('condition', 'medication', 'lab_observation', 'procedure', 'provider_facility')),
  extracted_data        jsonb not null,
  confidence           numeric not null check (confidence >= 0 and confidence <= 1),
  model                text not null,
  model_version        text not null,
  extracted_at         timestamptz not null default now(),

  review_status        text not null default 'pending' check (review_status in ('pending', 'approved', 'corrected', 'rejected', 'deferred')),
  reviewed_by          uuid,
  reviewed_at          timestamptz,
  review_note          text,

  -- Set once a reviewer approves/corrects and the resulting structured
  -- record is created -- spec V8.3: "Maintain relationship between final
  -- value and source extraction."
  resulting_record_type text,
  resulting_record_id   uuid
);
create index if not exists ix_ai_extraction_candidates_patient on patient.ai_extraction_candidates (patient_id, review_status);
create index if not exists ix_ai_extraction_candidates_document on patient.ai_extraction_candidates (document_id);

-- V8.4 AI longitudinal summary
create table if not exists patient.ai_summaries (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references patient.patients (id),

  summary_text       text not null,
  -- [{ recordType, recordId }, ...] -- spec: "every important statement
  -- MUST reference source records."
  source_references  jsonb not null default '[]'::jsonb,

  model              text not null,
  model_version      text not null,

  version            integer not null default 1,
  is_current         boolean not null default true,

  generated_by       uuid,
  create_date        timestamptz not null default now()
);
create index if not exists ix_ai_summaries_patient on patient.ai_summaries (patient_id, is_current);

commit;
