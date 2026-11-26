-- ---------------------------------------------------------------------------
-- 0124 — Video consultation <-> patient health record.
--
-- When booking a video consultation the patient picks which parts of their
-- health record (patient.*) the doctor may see. The choice lives on the
-- session itself rather than in patient.case_provider_grants: that table is
-- per medical case and per provider/booking, while a consultation is about
-- the patient's own record and its doctor may be an LSevin GP with no
-- provider at all.
--
--   record_patient_id        the patient.patients row the session belongs to
--                            (the account's own record, created at booking
--                            when the account had none).
--   record_share_scope       which parts the doctor may see. Deny by default:
--                            an empty array shares nothing. Values:
--                            allergies, medications, conditions, labs,
--                            imaging, documents.
--   record_share_revoked_at  set when the patient stops sharing.
--   record_encounter_id      the patient.clinical_encounters row that holds
--                            the doctor's summary in the patient's record.
--
-- Access is only live while the session is paid (scheduled, in progress or
-- completed), not revoked, and until 21 days after the call ends
-- (consultation.fn_record_share_expires_at). Every view from the doctor side
-- is written to patient.audit_log by the provider portal.
--
-- The summary write-back is a trigger, so it works the same whether the
-- summary is saved from the LSevin app or from the provider portal.
-- ---------------------------------------------------------------------------
begin;

alter table consultation.video_sessions
  add column if not exists record_patient_id uuid,
  add column if not exists record_share_scope text[] not null default '{}',
  add column if not exists record_share_revoked_at timestamptz,
  add column if not exists record_encounter_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ck_video_sessions_record_share_scope') then
    alter table consultation.video_sessions
      add constraint ck_video_sessions_record_share_scope
      check (record_share_scope <@ array['allergies', 'medications', 'conditions', 'labs', 'imaging', 'documents']::text[]);
  end if;
end $$;

create index if not exists ix_video_sessions_record_patient
  on consultation.video_sessions (record_patient_id, scheduled_at desc)
  where record_patient_id is not null;

-- When the doctor's access ends: 21 days after the later of the real end of
-- the call and its booked end.
create or replace function consultation.fn_record_share_expires_at(
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_ended_at timestamptz
) returns timestamptz
language sql immutable as $$
  select greatest(
    coalesce(p_ended_at, p_scheduled_at + make_interval(mins => p_duration_minutes)),
    p_scheduled_at + make_interval(mins => p_duration_minutes)
  ) + interval '21 days'
$$;

-- Doctor's summary -> the patient's record, as a video_consultation encounter.
create or replace function consultation.fn_session_summary_to_record() returns trigger
language plpgsql as $$
declare
  v_summary text;
  v_encounter_id uuid;
begin
  if new.record_patient_id is null or new.summary_written_at is null then
    return new;
  end if;
  if new.record_encounter_id is not null
     and old.summary_written_at is not distinct from new.summary_written_at
     and old.summary_advice is not distinct from new.summary_advice
     and old.summary_next_steps is not distinct from new.summary_next_steps
     and old.summary_suggestion is not distinct from new.summary_suggestion then
    return new;
  end if;

  v_summary := nullif(concat_ws(E'\n\n',
    nullif(btrim(new.summary_advice), ''),
    nullif(btrim(new.summary_next_steps), ''),
    nullif(btrim(new.summary_suggestion), '')
  ), '');

  if new.record_encounter_id is not null then
    update patient.clinical_encounters
       set summary = v_summary,
           encounter_status = 'completed',
           ended_at = coalesce(new.ended_at, ended_at),
           last_modified_date = now()
     where id = new.record_encounter_id;
    v_encounter_id := new.record_encounter_id;
  else
    insert into patient.clinical_encounters (
      patient_id, encounter_type, encounter_status, started_at, ended_at,
      provider_id, reason, summary
    ) values (
      new.record_patient_id, 'video_consultation', 'completed',
      coalesce(new.started_at, new.scheduled_at), new.ended_at,
      new.service_provider_id, nullif(btrim(new.patient_note), ''), v_summary
    )
    returning id into v_encounter_id;
    new.record_encounter_id := v_encounter_id;
  end if;

  insert into patient.audit_log (action, entity_type, entity_id, metadata, purpose)
  values (
    'consultation_summary_recorded', 'clinical_encounter', v_encounter_id,
    jsonb_build_object('patientId', new.record_patient_id, 'videoSessionId', new.id),
    'video_consultation'
  );
  return new;
end $$;

drop trigger if exists trg_video_sessions_summary_to_record on consultation.video_sessions;
create trigger trg_video_sessions_summary_to_record
  before update on consultation.video_sessions
  for each row execute function consultation.fn_session_summary_to_record();

commit;
