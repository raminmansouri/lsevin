-- Video consultation: cancelling, refunds and paying by receipt.
--
-- * A patient can cancel their own consultation. Up to 24 hours before the start they get their
--   money back (the payment becomes 'needs_refund'); later than that the cancellation keeps the fee.
-- * When the doctor side cancels or the doctor never joins the call, the patient chooses between
--   their money back and a new time (video_sessions.cancel_resolution, from migration 0085).
-- * Patients outside Iran pay by bank transfer and upload the receipt; an admin approves or
--   rejects it. Such a payment is a 'receipt' row that waits in 'awaiting_review'.
-- * An admin marks a refund as done ('refunded').

alter table consultation.video_sessions
  -- Who cancelled: 'patient', 'doctor' or 'admin'. Null when not cancelled (or cancelled before this migration).
  add column if not exists cancelled_by text,
  add column if not exists cancelled_at timestamp with time zone;

alter table consultation.video_session_payments
  -- The receipt image or PDF a patient uploaded (media.media_library id), for gateway = 'receipt'.
  add column if not exists receipt_media_id text,
  add column if not exists reviewed_by uuid references identity.asp_net_users (id) on delete set null,
  add column if not exists reviewed_at timestamp with time zone,
  -- Why a receipt was rejected, shown to the patient.
  add column if not exists review_note text,
  add column if not exists refunded_at timestamp with time zone,
  add column if not exists refunded_by uuid references identity.asp_net_users (id) on delete set null;

do $$
declare
  existing text;
begin
  -- The status check from migration 0083 has a generated name; replace it with a wider one.
  for existing in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'consultation.video_session_payments'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%needs_refund%'
      and c.conname <> 'ck_video_session_payments_status'
  loop
    execute format('alter table consultation.video_session_payments drop constraint %I', existing);
  end loop;

  if not exists (select 1 from pg_constraint where conname = 'ck_video_session_payments_status') then
    alter table consultation.video_session_payments
      add constraint ck_video_session_payments_status check (status in (
        'pending', 'awaiting_review', 'succeeded', 'failed', 'cancelled', 'rejected', 'needs_refund', 'refunded'
      ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'ck_video_sessions_cancelled_by') then
    alter table consultation.video_sessions
      add constraint ck_video_sessions_cancelled_by
      check (cancelled_by is null or cancelled_by in ('patient', 'doctor', 'admin'));
  end if;
end
$$;

create index if not exists ix_consultation_video_session_payments_review
  on consultation.video_session_payments (status, created_at)
  where status in ('awaiting_review', 'needs_refund');
