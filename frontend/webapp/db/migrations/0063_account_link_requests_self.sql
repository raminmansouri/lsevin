-- ---------------------------------------------------------------------------
-- 0063 — account_link_requests must accept "self", not just family members.
--
-- The TS-side schema (SubmitAccountLinkRequestSchema) and the customer-facing
-- form were widened to offer "self" -- a first-time customer requesting their
-- own first patient record -- but this table's own check constraint (0060)
-- was never updated to match, and still only allows
-- 'parent','child','guardian','caregiver','authorized_person','other'.
-- Every "self" submission was failing an INSERT with a check-constraint
-- violation, thrown unhandled out of createAccountLinkRequest with no
-- client-visible error -- the request silently never got created, so the
-- customer's My Health Record page never had anything new to show.
--
-- patient.account_patient_links (0048) already allows 'self' -- it's the
-- first value in that table's own list -- so this brings the request table
-- in line with the table a request actually turns into on approval.
-- ---------------------------------------------------------------------------
begin;

alter table patient.account_link_requests drop constraint if exists account_link_requests_relationship_type_check;
alter table patient.account_link_requests add constraint account_link_requests_relationship_type_check
  check (relationship_type in ('self', 'parent', 'child', 'guardian', 'caregiver', 'authorized_person', 'other'));

commit;
