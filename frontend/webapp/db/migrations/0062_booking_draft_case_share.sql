-- ---------------------------------------------------------------------------
-- 0062 — Booking wizard: "share this medical case with the provider I'm
-- booking" as a deferred intent, not an immediate grant.
--
-- The customer picks a case/permission/scope while still inside the booking
-- wizard (before the booking exists), but per project owner the actual
-- patient.case_provider_grants row must only be created once checkoutDraft
-- turns the draft into a real, confirmed booking.bookings row -- inside the
-- same transaction, so an abandoned wizard never leaves a dangling grant and
-- a confirmed booking never silently drops the customer's chosen intent.
--
-- Single intent per draft (unlike booking_draft_documents, which is
-- one-row-per-requirement): a customer shares at most one case with the one
-- provider they are actively booking in a given draft, so plain nullable
-- columns on the draft row itself are enough -- no child table needed.
--
-- patient_id/medical_case_id are soft cross-schema references into the
-- patient schema, same convention already used by patient.case_provider_
-- grants.provider_id/booking_id (0059) and medical_cases.primary_provider_id
-- -- no FK, so the booking schema stays decoupled from the patient schema.
-- permission is validated at the Zod schema layer (view/contribute), same
-- as this project's other ad-hoc schema evolutions that skip a DB check
-- constraint in favor of application-level validation.
-- ---------------------------------------------------------------------------
begin;

alter table booking.booking_drafts
  add column if not exists case_share_patient_id uuid,
  add column if not exists case_share_medical_case_id uuid,
  add column if not exists case_share_permission text,
  add column if not exists case_share_scope text[];

commit;
