-- ---------------------------------------------------------------------------
-- 0059 — Patient 360: provider case-collaboration grants.
--
-- Per project owner: the whole point of a centralized medical case is that a
-- customer can share it (or part of it) with a provider -- along a booking
-- or a consultation -- and a provider (a medical lab, in particular) can
-- then contribute results back onto it.
--
-- This is a different mechanism from patient.share_grants (V5.3): that one
-- is a token+PIN link for someone with NO account (an external doctor you
-- hand a URL to). Here the recipient is an in-platform provider organization
-- (category.service_providers) with its own real session via the existing
-- provider-portal (src/features/provider-portal) -- so the grant is a
-- row-level authorization, not a bearer secret.
--
-- permission:
--   'view'       -- provider staff can read the case (respecting scope).
--   'contribute' -- can also add results, but ONLY against a lab_order that
--                   already exists on the case (see case-provider-actions.ts
--                   in the provider-portal feature) -- never freeform, so a
--                   grant is not itself a license to add arbitrary records.
--
-- provider_id and booking_id are soft cross-schema references (category and
-- booking schemas), same convention as medical_cases.primary_provider_id --
-- no FK, consistent with this schema's existing cross-schema references.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.case_provider_grants (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null,
  medical_case_id      uuid not null references patient.medical_cases(id),
  provider_id          uuid not null,
  booking_id           uuid,

  permission           text not null check (permission in ('view', 'contribute')),
  scope                text[] not null default '{}',
  status               text not null default 'active' check (status in ('active', 'revoked')),

  granted_by           uuid not null,
  granted_at           timestamptz not null default now(),
  revoked_by           uuid,
  revoked_at           timestamptz,

  create_date          timestamptz not null default now(),
  last_modified_date   timestamptz
);
create index if not exists ix_case_provider_grants_case on patient.case_provider_grants (medical_case_id) where status = 'active';
create index if not exists ix_case_provider_grants_provider on patient.case_provider_grants (provider_id) where status = 'active';

commit;
