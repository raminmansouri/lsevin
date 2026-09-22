-- ---------------------------------------------------------------------------
-- 0054 — Patient 360 V5: sharing, consent, family access & security.
--
-- V5.4 (family/proxy access) already exists as of 0048's
-- patient.account_patient_links (relationship_type, access_role,
-- valid_until as the revoke mechanism) -- nothing new to add there.
--
-- V5.6 (production-grade AuditEvent) extends patient.audit_log (0048)
-- rather than replacing it: `purpose` and `result` are the two fields the
-- spec lists that the original table didn't carry. Both are additive,
-- nullable/defaulted, so every existing insert (V0-V4, ~40 call sites)
-- keeps compiling unchanged; passing them explicitly is opt-in going
-- forward rather than retrofitted everywhere in this pass.
-- ---------------------------------------------------------------------------
begin;

alter table patient.audit_log add column if not exists purpose text;
alter table patient.audit_log add column if not exists result text not null default 'success' check (result in ('success', 'failure', 'denied'));

-- V5.1 Consent
create table if not exists patient.patient_consents (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references patient.patients (id),

  consent_type      text not null check (consent_type in ('data_sharing', 'marketing', 'treatment', 'research', 'family_access', 'other')),
  purpose           text not null,

  recipient_type    text not null check (recipient_type in ('family_member', 'coordinator', 'provider', 'organization', 'external_party', 'other')),
  recipient_id      uuid,

  -- Data scope values: demographics, identifiers, conditions, allergies,
  -- medications, procedures, labs, imaging, documents,
  -- reproductive_history, cosmetic_history, case_data,
  -- travel_information, billing_information (spec V5.2). Deny-by-default:
  -- an empty/absent scope grants nothing, never "everything."
  scope             text[] not null default '{}',

  valid_from        timestamptz not null default now(),
  valid_until       timestamptz,
  consent_status    text not null default 'active' check (consent_status in ('active', 'withdrawn', 'expired')),

  document_id       uuid references patient.clinical_documents (id),

  granted_at        timestamptz not null default now(),
  withdrawn_at      timestamptz,

  create_date       timestamptz not null default now(),
  created_by        uuid
);
create index if not exists ix_patient_consents_patient on patient.patient_consents (patient_id, consent_status);

-- V5.3 Temporary sharing. token_hash is the lookup key (HMAC-SHA256 of the
-- opaque random token the recipient holds) -- same deterministic-hash
-- pattern as patient_identifiers' lookup hash (0048), reused here for a
-- different secret. The plaintext token is never stored, only handed to
-- the creator once at generation time. pin_hash is optional, same idea.
create table if not exists patient.share_grants (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null references patient.patients (id),
  medical_case_id     uuid references patient.medical_cases (id),

  created_by          uuid,
  recipient_name      text,
  recipient_contact   text,
  scope               text[] not null default '{}',

  token_hash          text not null,
  pin_hash            text,

  valid_from          timestamptz not null default now(),
  expires_at          timestamptz not null,
  revoked_at          timestamptz,

  access_count        integer not null default 0,
  max_access_count    integer,

  create_date         timestamptz not null default now(),

  constraint uq_share_grants_token_hash unique (token_hash)
);
create index if not exists ix_share_grants_patient on patient.share_grants (patient_id);

commit;
