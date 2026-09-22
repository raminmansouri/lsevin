-- ---------------------------------------------------------------------------
-- 0049 — Patient 360 V1.3: internal (non-clinical) patient notes.
--
-- Deliberately separate from any future clinical note/observation table
-- (V2+): these are operational notes ("called patient, no answer",
-- "prefers evening appointments"), never clinical fact, and must never be
-- exported into a medical summary or FHIR bundle. Visibility is scoped by
-- role rather than left open to every admin, per spec V1.3's "allow
-- role-based visibility" -- scoped to this codebase's actual two admin
-- roles (admin/superadmin, see src/lib/auth/admin-guard.ts) rather than the
-- spec's broader coordinator/provider role vocabulary, which doesn't exist
-- as distinct system roles here yet.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.patient_internal_notes (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null references patient.patients (id),

  body                text not null,
  visibility          text not null default 'admin' check (visibility in ('admin', 'superadmin')),

  status              text not null default 'active' check (status in ('active', 'archived')),

  author_id           uuid,
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now(),
  archived_at         timestamptz,
  archived_by         uuid
);

create index if not exists ix_patient_internal_notes_patient
  on patient.patient_internal_notes (patient_id, create_date desc);

commit;
