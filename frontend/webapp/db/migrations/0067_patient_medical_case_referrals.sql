-- Clinical referral lifecycle shared by Patient 360, the provider portal,
-- and booking case management. A referral is always anchored to an existing
-- medical case and records every state change as an immutable event.
begin;

create table if not exists patient.medical_case_referrals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient.patients(id),
  medical_case_id uuid not null references patient.medical_cases(id),
  source_provider_id uuid not null,
  source_staff_id uuid,
  destination_provider_id uuid not null,
  destination_staff_id uuid,
  booking_case_id uuid references case_management.cases(id) on delete set null,
  lab_order_id uuid references patient.lab_orders(id) on delete set null,
  diagnostic_report_id uuid references patient.diagnostic_reports(id) on delete set null,
  referral_type text not null check (referral_type in ('laboratory','doctor','specialist','imaging','other')),
  priority text not null default 'routine' check (priority in ('routine','urgent')),
  reason text not null,
  clinical_question text,
  instructions text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','in_progress','result_submitted','result_reviewed','completed','cancelled')),
  status_note text,
  created_by uuid not null,
  last_modified_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  result_submitted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_referral_distinct_provider check (source_provider_id <> destination_provider_id)
);

create index if not exists ix_medical_case_referrals_case
  on patient.medical_case_referrals(medical_case_id, create_date desc);
create index if not exists ix_medical_case_referrals_destination
  on patient.medical_case_referrals(destination_provider_id, status, create_date desc);
create index if not exists ix_medical_case_referrals_source
  on patient.medical_case_referrals(source_provider_id, status, create_date desc);

create table if not exists patient.medical_case_referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references patient.medical_case_referrals(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  actor_user_id uuid,
  actor_provider_id uuid,
  create_date timestamptz not null default now()
);
create index if not exists ix_medical_case_referral_events_referral
  on patient.medical_case_referral_events(referral_id, create_date);

create or replace function patient.record_medical_case_referral_event()
returns trigger language plpgsql as $$
declare v_event_type text;
begin
  v_event_type := case when tg_op = 'INSERT' then 'referral.created' else 'referral.status_changed' end;
  insert into patient.medical_case_referral_events(referral_id,event_type,from_status,to_status,actor_user_id,actor_provider_id)
  values(new.id,v_event_type,case when tg_op='UPDATE' then old.status end,new.status,coalesce(new.last_modified_by,new.created_by),
    case when tg_op='INSERT' then new.source_provider_id else new.destination_provider_id end);

  if new.booking_case_id is not null then
    insert into case_management.case_events(case_id,event_type,actor_user_id,actor_role,from_status,to_status,metadata)
    values(new.booking_case_id,v_event_type,coalesce(new.last_modified_by,new.created_by),'provider',case when tg_op='UPDATE' then old.status end,new.status,
      jsonb_build_object('referralId',new.id,'medicalCaseId',new.medical_case_id,'sourceProviderId',new.source_provider_id,
        'destinationProviderId',new.destination_provider_id,'referralType',new.referral_type));
  end if;
  return new;
end $$;

drop trigger if exists trg_medical_case_referral_event on patient.medical_case_referrals;
create trigger trg_medical_case_referral_event
after insert or update of status on patient.medical_case_referrals
for each row execute function patient.record_medical_case_referral_event();

comment on table patient.medical_case_referrals is 'Provider-to-provider clinical referrals attached to a Patient 360 medical case and mirrored into booking case management.';
commit;
