-- ---------------------------------------------------------------------------
-- 0051 — Patient 360 V3: documents, labs & imaging.
--
-- File bytes are NOT stored here. This deployment already has a working
-- upload pipeline (media.media_library, backed by MinIO via the .NET API's
-- File/UploadAnyFile) used by the customer avatar picker, booking file
-- fields and the provider portal -- clinical documents reuse that same
-- transport instead of a parallel one. What's genuinely new here is
-- patient-scoping, clinical categorization, confidentiality, versioning
-- and audit -- none of which media.media_library has (it's a public,
-- unversioned, unaudited general-purpose file table). media_library_id is
-- a soft reference (no FK, cross-schema, same convention as every other
-- hand-written schema here); file_url/mime_type/file_size/original_name
-- are copied onto the row at upload time so a document's own metadata
-- survives even if the underlying media row is later edited or removed.
--
-- Known, deliberate gap: no sha256 checksum is computed in this pass --
-- the upload transport (browser -> /api/admin/media/storage -> .NET) never
-- hands the webapp raw bytes to hash, and wiring that up is out of scope
-- for this migration. Exact-duplicate detection instead uses the heuristic
-- (patient_id, original_name, file_size) and only warns, never blocks.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.clinical_documents (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),
  medical_case_id      uuid,
  encounter_id         uuid,

  document_type        text not null check (document_type in (
                          'lab_report', 'imaging_report', 'mri_image', 'ct_image', 'x_ray', 'ultrasound',
                          'prescription', 'discharge_summary', 'pathology', 'referral', 'doctor_note',
                          'operative_report', 'medical_history', 'insurance', 'consent', 'treatment_plan',
                          'second_opinion', 'passport', 'other'
                        )),
  title                text not null,

  media_library_id     uuid,
  file_url             text not null,
  mime_type            text,
  file_size            bigint,
  checksum             text,
  original_name        text,

  language              text,
  original_language     text,
  document_date         date,

  author_name          text,
  provider_id          uuid,
  organization_id      uuid,

  source_type          text not null default 'lsevin_coordinator',
  verification_status  text not null default 'unverified'
                         check (verification_status in ('patient_reported', 'imported', 'unverified', 'provisional', 'verified', 'refuted', 'entered_in_error')),

  is_confidential      boolean not null default false,
  -- V3.2 versioning: a new upload that replaces an old one is a new row
  -- chained via supersedes_document_id; the old row flips to status =
  -- 'superseded' rather than being overwritten or deleted (spec V3.2:
  -- "Never overwrite original medical documents silently. Preserve all
  -- uploaded versions."). "Latest" = status not in ('superseded','archived').
  status               text not null default 'active'
                         check (status in ('active', 'superseded', 'archived', 'entered_in_error')),
  version              integer not null default 1,
  supersedes_document_id uuid references patient.clinical_documents (id),
  replacement_reason   text,

  create_date          timestamptz not null default now(),
  created_by           uuid,
  last_modified_date   timestamptz not null default now(),
  last_modified_by     uuid
);
create index if not exists ix_patient_clinical_documents_patient on patient.clinical_documents (patient_id, status);
create index if not exists ix_patient_clinical_documents_dup_heuristic on patient.clinical_documents (patient_id, original_name, file_size);

create table if not exists patient.clinical_document_translations (
  id                     uuid primary key default gen_random_uuid(),
  document_id            uuid not null references patient.clinical_documents (id),

  source_language        text not null,
  target_language        text not null,
  translation_type       text not null check (translation_type in ('human', 'ai', 'provider')),
  translated_text        text,
  translated_media_library_id uuid,
  translated_file_url    text,

  translation_status     text not null default 'pending' check (translation_status in ('pending', 'in_progress', 'completed', 'rejected')),

  translated_by          uuid,
  verified_by            uuid,
  verified_at            timestamptz,

  create_date            timestamptz not null default now(),
  last_modified_date     timestamptz not null default now()
);
create index if not exists ix_patient_document_translations_document on patient.clinical_document_translations (document_id);

create table if not exists patient.lab_orders (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references patient.patients (id),
  medical_case_id       uuid,

  ordering_provider_id  uuid,
  requested_tests       text[] not null default '{}',
  order_status          text not null default 'ordered' check (order_status in ('ordered', 'in_progress', 'completed', 'cancelled')),
  external_lab          text,
  notes                 text,

  status                text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  create_date           timestamptz not null default now(),
  created_by            uuid,
  last_modified_date    timestamptz not null default now()
);
create index if not exists ix_patient_lab_orders_patient on patient.lab_orders (patient_id, status);

create table if not exists patient.diagnostic_reports (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references patient.patients (id),
  medical_case_id       uuid,
  encounter_id          uuid,
  lab_order_id          uuid references patient.lab_orders (id),

  report_type           text not null,
  title                 text not null,
  report_status         text not null default 'preliminary'
                          check (report_status in ('registered', 'preliminary', 'final', 'amended', 'cancelled')),

  issued_at             timestamptz,
  effective_at          timestamptz,

  provider_id           uuid,
  organization_id       uuid,
  document_id           uuid references patient.clinical_documents (id),
  summary               text,

  status                text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  create_date           timestamptz not null default now(),
  created_by            uuid,
  last_modified_date    timestamptz not null default now()
);
create index if not exists ix_patient_diagnostic_reports_patient on patient.diagnostic_reports (patient_id, status);

create table if not exists patient.clinical_observations (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references patient.patients (id),
  medical_case_id       uuid,
  encounter_id          uuid,
  diagnostic_report_id  uuid references patient.diagnostic_reports (id),

  code                  text,
  coding_system         text,
  display_name          text not null,

  value_number          numeric,
  value_text            text,
  value_boolean         boolean,
  value_code            text,
  unit                  text,

  reference_low         numeric,
  reference_high        numeric,
  reference_text        text,
  -- 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low' | 'abnormal' -- stored, never inferred at render time (spec V3.7: "Do not infer medical diagnosis from an abnormal value.")
  interpretation         text,

  effective_at          timestamptz not null default now(),
  obs_status            text not null default 'final'
                          check (obs_status in ('registered', 'preliminary', 'final', 'amended', 'cancelled', 'entered_in_error')),

  provider_id           uuid,
  organization_id       uuid,
  source_document_id    uuid references patient.clinical_documents (id),

  status                text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  create_date           timestamptz not null default now(),
  created_by            uuid,

  -- spec V3.6: "Prevent invalid simultaneous value types" -- at most one of
  -- the four typed value columns may be populated on a given observation.
  constraint ck_clinical_observations_single_value check (
    (case when value_number is not null then 1 else 0 end
     + case when value_text is not null then 1 else 0 end
     + case when value_boolean is not null then 1 else 0 end
     + case when value_code is not null then 1 else 0 end) <= 1
  )
);
create index if not exists ix_patient_observations_patient on patient.clinical_observations (patient_id, status);
-- Trend queries (V3.7) group by patient + code/display_name ordered by time.
create index if not exists ix_patient_observations_trend on patient.clinical_observations (patient_id, code, effective_at);

create table if not exists patient.imaging_studies (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references patient.patients (id),
  medical_case_id       uuid,

  modality              text not null check (modality in ('mri', 'ct', 'pet', 'x_ray', 'ultrasound', 'mammography', 'other')),
  body_part             text,

  study_date            date not null,
  organization_id       uuid,
  radiologist           text,

  -- Imaging FILES (DICOM etc.) are explicitly out of scope for this release
  -- (spec V3.8: "Prepare future DICOM integration. Do not require DICOM in
  -- first release.") -- only the written report is linked, as an ordinary
  -- clinical_documents row.
  report_document_id    uuid references patient.clinical_documents (id),
  external_reference    text,

  status                text not null default 'active' check (status in ('active', 'archived', 'entered_in_error')),
  create_date           timestamptz not null default now(),
  created_by            uuid,
  last_modified_date    timestamptz not null default now()
);
create index if not exists ix_patient_imaging_studies_patient on patient.imaging_studies (patient_id, status);

commit;
