-- ---------------------------------------------------------------------------
-- 0060 — Patient 360: customer self-service family-member link requests.
--
-- Per project owner: cover the remaining customer-side gap (self-service
-- linking of a family member's record). This does NOT insert directly into
-- patient.account_patient_links from the customer side -- every list/read
-- function this feature has built across the whole session (V0's own
-- listPatientsForAccount included) grants full access to any row in that
-- table regardless of is_verified, so an unreviewed insert there would be an
-- immediate, unauthenticated-identity access grant. This table is a
-- separate, inert queue: a request only ever becomes a real
-- account_patient_links row through an admin's explicit approval action
-- (patient/server/link-request-actions.ts), which reuses the existing,
-- unmodified linkAccountToPatient().
--
-- identifier_value is stored the same way patient.patient_identifiers
-- stores identifiers -- hash + masked display value, never plaintext.
-- ---------------------------------------------------------------------------
begin;

create table if not exists patient.account_link_requests (
  id                      uuid primary key default gen_random_uuid(),
  account_id              uuid not null,

  relationship_type       text not null check (relationship_type in (
                             'parent', 'child', 'guardian', 'caregiver', 'authorized_person', 'other'
                           )),

  identifier_type         text not null,
  identifier_value_hash   text not null,
  identifier_value_masked text not null,
  first_name              text not null,
  last_name               text not null,
  birth_date              date,

  -- Set automatically at submission time if an exact, verified identifier
  -- match was found (spec V0.6: "If an exact verified identifier exists").
  -- Null means no automatic match -- the admin reviewing the request has to
  -- search/resolve it manually, same as any other unmatched intake.
  matched_patient_id      uuid references patient.patients (id),

  request_status          text not null default 'pending' check (request_status in ('pending', 'approved', 'rejected')),
  reviewed_by             uuid,
  reviewed_at             timestamptz,
  review_notes            text,

  create_date             timestamptz not null default now(),
  last_modified_date      timestamptz not null default now()
);
create index if not exists ix_account_link_requests_account on patient.account_link_requests (account_id);
create index if not exists ix_account_link_requests_status on patient.account_link_requests (request_status);

commit;
