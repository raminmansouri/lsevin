-- ---------------------------------------------------------------------------
-- 0064 — Support conversations: attach a thread to a booking or a
-- consultation request, and widen the participant model to a provider-
-- portal sender.
--
-- support.* predates this migration folder (no earlier migration created
-- it -- support.conversations/messages already exist live, confirmed via
-- auto_backups/schema_backup.sql). Everything here is additive: existing
-- rows keep context_type = 'general' and sender_type in
-- ('customer','agent','system'); nothing existing reads the new columns
-- until the webapp code that uses them ships.
--
-- booking_id / consultation_request_id / patient_id / medical_case_id /
-- sender_provider_id are soft cross-schema references -- no FK -- same
-- convention already used by support.bug_reports.booking_id,
-- patient.case_provider_grants.booking_id (0059), and
-- booking.booking_drafts.case_share_medical_case_id (0062). support stays
-- decoupled from booking/consultation/patient schemas.
-- ---------------------------------------------------------------------------
begin;

alter table support.conversations
  add column if not exists context_type text not null default 'general',
  add column if not exists booking_id uuid,
  add column if not exists consultation_request_id uuid,
  add column if not exists patient_id uuid,
  add column if not exists medical_case_id uuid;

alter table support.conversations
  drop constraint if exists support_conversations_context_type;
alter table support.conversations
  add constraint support_conversations_context_type
  check (context_type in ('general', 'booking', 'consultation'));

-- A context conversation always carries its anchor id, so "which booking is
-- this thread about" is never ambiguous or silently dropped.
alter table support.conversations
  drop constraint if exists support_conversations_context_consistency;
alter table support.conversations
  add constraint support_conversations_context_consistency
  check (
    (context_type = 'general' and booking_id is null and consultation_request_id is null)
    or (context_type = 'booking' and booking_id is not null)
    or (context_type = 'consultation' and consultation_request_id is not null)
  );

-- 'booking'/'provider_page' already existed in this constraint (this schema
-- already anticipated booking-originated conversations); 'consultation' is
-- new, for a مشاوره-context conversation's entry point.
alter table support.conversations drop constraint if exists support_conversations_source;
alter table support.conversations add constraint support_conversations_source
  check (source = any (array[
    'floating_widget', 'support_page', 'booking', 'provider_page',
    'service_page', 'admin_created', 'consultation'
  ]));

-- Lookup indexes -- non-unique: a booking/consultation can accumulate more
-- than one conversation over time. "The" open thread is resolved at the
-- application layer the same way getOrCreateConversationForUser already
-- does for customer_user_id.
create index if not exists ix_support_conversations_booking
  on support.conversations (booking_id) where booking_id is not null;
create index if not exists ix_support_conversations_consultation
  on support.conversations (consultation_request_id) where consultation_request_id is not null;
create index if not exists ix_support_conversations_patient
  on support.conversations (patient_id) where patient_id is not null;

-- Widen sender_type: a provider-portal user replying is neither the LSevin
-- 'agent' nor the 'customer' -- a distinct realm so access control and the
-- thread UI can tell them apart, per project owner decision.
alter table support.messages drop constraint if exists support_messages_sender_type;
alter table support.messages add constraint support_messages_sender_type
  check (sender_type = any (array['customer', 'agent', 'provider', 'system']));

-- Which provider org a 'provider' sender was acting as -- sender_user_id
-- (existing column) already carries the real identity.asp_net_users id
-- (the provider portal's SSO session is backed by that same table), so no
-- new identity concept is needed, only which org.
alter table support.messages
  add column if not exists sender_provider_id uuid;

-- Two structured, actionable message kinds -- rendered as cards, not parsed
-- from free text. Payload goes in the existing metadata jsonb column
-- (already present, already validated as an object by
-- support_messages_json_shapes) so no new column is needed for it.
alter table support.messages drop constraint if exists support_messages_message_type;
alter table support.messages add constraint support_messages_message_type
  check (message_type = any (array[
    'text', 'image', 'file', 'system', 'note',
    'requirement_request', 'clinical_record'
  ]));

commit;
