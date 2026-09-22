-- ---------------------------------------------------------------------------
-- 0048 — Patient 360 V0: identity foundation (new domain, additive).
--
-- New `patient` schema, deliberately separate from `customer.customers`
-- (the login-attached, 1-row-per-account record) and from the existing
-- `customer.medical_profiles*` tables (1:1 keyed by customer_id today).
-- Neither of those can play "canonical person, independent of login" --
-- `customer.customers` is joined to `identity.asp_net_users` by
-- lower(email), not a stable id, and a customer who signs up again with a
-- different mobile/email today becomes a second, unrelated row. This
-- migration does not touch or migrate that existing data; it only creates
-- the new tables. Backfilling `customer.medical_profiles*` into
-- `patient.*` is a deliberate later step (spec doc section 6), not part of
-- this migration.
--
-- Cross-schema references (account_id -> identity.asp_net_users.id) are
-- soft (application-validated uuid, no FK), matching every other
-- hand-written schema's cross-schema convention in this codebase (e.g.
-- transfer.routes -> category.provider_services).
--
-- Sensitive identifiers (national ID, passport, ...) are never stored in
-- plaintext: identifier_value_encrypted holds an AES-256-GCM ciphertext
-- blob, identifier_value_hash/normalized_value_hash hold deterministic
-- HMAC-SHA256 hex digests used for exact-match lookup and the uniqueness
-- constraint. See ../../src/features/patients/server/crypto.ts.
-- ---------------------------------------------------------------------------
begin;

create schema if not exists patient;

-- ---------------------------------------------------------------------------
-- patient.patients — the canonical person, independent of any login account.
-- ---------------------------------------------------------------------------
create table if not exists patient.patients (
  id                        uuid primary key default gen_random_uuid(),
  public_id                 text not null default ('PT' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10))),

  first_name                text not null,
  middle_name               text,
  last_name                 text not null,
  preferred_name            text,

  birth_date                date,
  birth_date_precision      text not null default 'day'
                              check (birth_date_precision in ('day', 'month', 'year', 'unknown')),
  sex_at_birth               text check (sex_at_birth in ('male', 'female', 'other', 'unknown')),
  gender                     text,

  nationality_country_code  text,
  primary_language          text,

  status                    text not null default 'active'
                              check (status in ('active', 'inactive', 'deceased', 'merged', 'archived')),

  -- Optimistic concurrency: every update must supply the version it read and
  -- bump it; a stale write (two staff editing the same patient) fails instead
  -- of silently overwriting the other's change.
  version                   integer not null default 1,

  create_date               timestamptz not null default now(),
  created_by                uuid,
  last_modified_date        timestamptz not null default now(),
  last_modified_by          uuid,

  constraint uq_patient_public_id unique (public_id)
);

create index if not exists ix_patient_patients_name on patient.patients (last_name, first_name);
create index if not exists ix_patient_patients_birth_date on patient.patients (birth_date);
create index if not exists ix_patient_patients_status on patient.patients (status);

-- ---------------------------------------------------------------------------
-- patient.patient_identifiers — national ID / passport / MRN / etc.
-- ---------------------------------------------------------------------------
create table if not exists patient.patient_identifiers (
  id                          uuid primary key default gen_random_uuid(),
  patient_id                  uuid not null references patient.patients (id),

  identifier_type              text not null check (identifier_type in (
                                  'ir_national_id', 'national_id', 'passport', 'foreigner_id',
                                  'residence_permit', 'insurance_id', 'hospital_mrn',
                                  'lsevin_patient_number', 'temporary_id', 'other'
                                )),

  -- AES-256-GCM ciphertext (base64: iv || tag || ciphertext), never plaintext.
  identifier_value_encrypted   text not null,
  -- Deterministic HMAC-SHA256(hex) of the raw (unnormalized) value — verbatim lookup.
  identifier_value_hash        text not null,
  -- e.g. "****1234" — safe to render in ordinary UI without an unmask permission.
  identifier_value_masked      text not null,
  -- Deterministic HMAC-SHA256(hex) of the normalized value — used for the
  -- uniqueness constraint below, so "12-345-678" and "12345678" collide.
  normalized_value_hash        text not null,

  issuing_country_code         text,
  issuing_authority            text,
  system                       text,

  is_primary                   boolean not null default false,
  is_verified                  boolean not null default false,
  verification_method          text,
  verified_at                  timestamptz,
  verified_by                  uuid,

  valid_from                   date,
  valid_until                  date,

  status                       text not null default 'active'
                                 check (status in ('active', 'inactive', 'superseded', 'entered_in_error')),

  create_date                  timestamptz not null default now(),
  last_modified_date           timestamptz not null default now()
);

create index if not exists ix_patient_identifiers_patient on patient.patient_identifiers (patient_id);

-- Two different identifier rows for the same type/issuer/value must resolve
-- to "same identifier", so a second signup with the same national ID is
-- caught before creating a duplicate patient. Only active identifiers
-- participate — a superseded/entered-in-error row must not block reuse.
create unique index if not exists uq_patient_identifiers_lookup
  on patient.patient_identifiers (identifier_type, coalesce(issuing_country_code, ''), coalesce(issuing_authority, ''), normalized_value_hash)
  where status = 'active';

-- Fast "does this hash exist anywhere" pre-check ahead of the composite lookup above.
create index if not exists ix_patient_identifiers_hash on patient.patient_identifiers (identifier_value_hash);
create index if not exists ix_patient_identifiers_normalized_hash on patient.patient_identifiers (normalized_value_hash);

-- ---------------------------------------------------------------------------
-- patient.account_patient_links — many UserAccounts <-> many Patients.
-- ---------------------------------------------------------------------------
create table if not exists patient.account_patient_links (
  id                   uuid primary key default gen_random_uuid(),
  -- Soft reference to identity.asp_net_users.id (EF-owned schema; no cross-schema FK).
  account_id           uuid not null,
  patient_id           uuid not null references patient.patients (id),

  relationship_type    text not null check (relationship_type in (
                          'self', 'parent', 'child', 'guardian', 'caregiver', 'authorized_person', 'other'
                        )),
  access_role          text not null default 'full' check (access_role in ('full', 'limited', 'view_only')),

  is_primary_profile   boolean not null default false,
  is_verified          boolean not null default false,

  valid_from           timestamptz not null default now(),
  valid_until          timestamptz,

  create_date          timestamptz not null default now(),
  created_by           uuid
);

create index if not exists ix_patient_account_links_account on patient.account_patient_links (account_id);
create index if not exists ix_patient_account_links_patient on patient.account_patient_links (patient_id);

-- One active (valid_until is null) link per account/patient pair — re-linking
-- an already-linked account is a no-op, not a duplicate row.
create unique index if not exists uq_patient_account_links_active
  on patient.account_patient_links (account_id, patient_id)
  where valid_until is null;

-- ---------------------------------------------------------------------------
-- patient.patient_contacts
-- ---------------------------------------------------------------------------
create table if not exists patient.patient_contacts (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patient.patients (id),

  contact_type         text not null check (contact_type in ('mobile', 'phone', 'whatsapp', 'email', 'emergency')),
  value                text not null,
  country_code         text,

  is_primary           boolean not null default false,
  is_verified          boolean not null default false,
  verification_method  text,

  valid_from           timestamptz not null default now(),
  valid_until          timestamptz,

  create_date          timestamptz not null default now(),
  last_modified_date   timestamptz not null default now()
);

create index if not exists ix_patient_contacts_patient on patient.patient_contacts (patient_id);

-- ---------------------------------------------------------------------------
-- patient.patient_addresses
-- ---------------------------------------------------------------------------
create table if not exists patient.patient_addresses (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patient.patients (id),

  country_code    text,
  city            text,
  region          text,
  postal_code     text,
  address_line1   text,
  address_line2   text,

  is_primary      boolean not null default false,

  valid_from      timestamptz not null default now(),
  valid_until     timestamptz,

  create_date     timestamptz not null default now(),
  last_modified_date timestamptz not null default now()
);

create index if not exists ix_patient_addresses_patient on patient.patient_addresses (patient_id);

-- ---------------------------------------------------------------------------
-- patient.audit_log — append-only, same shape as accounting.audit_log
-- (0007_accounting_audit.sql). One precedent in this codebase for "audit
-- records must be append-only"; copied rather than shared across schemas
-- so patient audit retention/access can diverge from accounting's later
-- without touching financial audit code.
-- ---------------------------------------------------------------------------
create table if not exists patient.audit_log (
  id             bigint generated always as identity primary key,
  actor_user_id  uuid,
  actor_roles    text[]      not null default '{}',
  action         text        not null,
  entity_type    text        not null,
  entity_id      uuid,
  entity_key     text,
  before_state   jsonb,
  after_state    jsonb,
  ip_address     inet,
  user_agent     text,
  request_id     text,
  occurred_at    timestamptz not null default now(),
  metadata       jsonb       not null default '{}'::jsonb
);

create index if not exists ix_patient_audit_entity on patient.audit_log (entity_type, entity_id, occurred_at desc);
create index if not exists ix_patient_audit_actor on patient.audit_log (actor_user_id, occurred_at desc);
create index if not exists ix_patient_audit_time on patient.audit_log (occurred_at desc);

create or replace function patient.fn_block_audit_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'patient.audit_log is append-only (attempted %)', tg_op
    using errcode = 'restrict_violation';
end $$;

drop trigger if exists trg_patient_audit_immutable on patient.audit_log;
create trigger trg_patient_audit_immutable
  before update or delete on patient.audit_log
  for each row execute function patient.fn_block_audit_mutation();

commit;
