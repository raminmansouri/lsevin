-- Provider Portal standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists provider_portal_ext;

    create table if not exists provider_portal_ext.profile_claims (
      id uuid primary key default gen_random_uuid(),
      target_type text not null check (target_type in ('provider','staff','service')),
      target_id uuid not null,
      claimant_user_id uuid not null,
      service_provider_id uuid,
      clinic_review_status text not null default 'pending' check (clinic_review_status in ('pending','approved','rejected')),
      lsevin_review_status text not null default 'pending' check (lsevin_review_status in ('pending','approved','rejected')),
      payment_status text not null default 'not_required' check (payment_status in ('not_required','required','invoiced','paid','waived')),
      status text not null default 'submitted' check (status in ('draft','submitted','clinic_review','lsevin_review','payment_required','approved','rejected','revoked','disabled')),
      evidence jsonb not null default '{}',
      note text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists provider_portal_ext.editable_sections (
      id uuid primary key default gen_random_uuid(),
      service_provider_id uuid not null,
      entity_type text not null check (entity_type in ('provider','service','staff')),
      entity_id uuid not null,
      locale text not null default 'fa-IR',
      section_key text not null,
      draft_payload jsonb not null default '{}',
      moderation_status text not null default 'draft' check (moderation_status in ('draft','submitted','approved','rejected')),
      submitted_by_user_id uuid,
      reviewed_by_user_id uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

-- vNext publishable content/moderation workflow.
alter table if exists provider_portal_ext.profile_claims
  add column if not exists clinic_reviewed_by_user_id uuid,
  add column if not exists clinic_reviewed_at timestamptz,
  add column if not exists lsevin_reviewed_by_user_id uuid,
  add column if not exists lsevin_reviewed_at timestamptz,
  add column if not exists decision_reason text;

create table if not exists provider_portal_ext.content_drafts (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null,
  entity_type text not null check (entity_type in ('provider','service','staff')),
  entity_id uuid not null,
  locale text not null default 'fa-IR',
  section_key text not null,
  title text,
  draft_payload jsonb not null default '{}',
  previous_snapshot jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','published','rolled_back')),
  submitted_by_user_id uuid,
  reviewed_by_user_id uuid,
  decision_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists provider_portal_ext.published_content_snapshots (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null,
  entity_type text not null check (entity_type in ('provider','service','staff')),
  entity_id uuid not null,
  locale text not null default 'fa-IR',
  section_key text not null,
  snapshot_payload jsonb not null default '{}',
  source_draft_id uuid,
  version_no integer not null default 1,
  is_current boolean not null default true,
  published_by_user_id uuid,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists provider_portal_ext.audit_events (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid,
  actor_user_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ix_provider_portal_claims_provider_status on provider_portal_ext.profile_claims(service_provider_id, status, created_at desc);
create index if not exists ix_provider_portal_content_drafts_provider_status on provider_portal_ext.content_drafts(service_provider_id, status, created_at desc);
create index if not exists ix_provider_portal_snapshots_current on provider_portal_ext.published_content_snapshots(entity_type, entity_id, locale, section_key, is_current);
create index if not exists ix_provider_portal_audit_events_provider on provider_portal_ext.audit_events(service_provider_id, created_at desc);
