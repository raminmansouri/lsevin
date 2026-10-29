-- Video consultation, the GP side: whether the GP is taking calls right now, their
-- weekly working hours, and the consultations themselves (one 20 minute call each).
-- Times of day in video_doctor_hours are Tehran local time.

alter table consultation.video_doctors
  add column if not exists is_online boolean not null default false;

create table if not exists consultation.video_doctor_hours (
  id uuid primary key default public.uuid_generate_v4(),
  doctor_id uuid not null references consultation.video_doctors (id) on delete cascade,
  -- 0 = Saturday … 6 = Friday, the Iranian week.
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone not null default now(),
  check (end_time > start_time)
);

create index if not exists ix_consultation_video_doctor_hours_doctor
  on consultation.video_doctor_hours (doctor_id, weekday, start_time);

create table if not exists consultation.video_sessions (
  id uuid primary key default public.uuid_generate_v4(),
  doctor_id uuid not null references consultation.video_doctors (id) on delete restrict,
  patient_user_id uuid references identity.asp_net_users (id) on delete set null,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_at timestamp with time zone not null,
  duration_minutes integer not null default 20 check (duration_minutes between 5 and 180),
  price_amount numeric(18, 2) not null default 0,
  price_currency text not null default 'USD',
  -- What the patient wrote when requesting the call.
  patient_name text,
  patient_age integer check (patient_age is null or patient_age between 0 and 130),
  patient_gender text check (patient_gender is null or patient_gender in ('male', 'female', 'other')),
  patient_note text,
  -- media.media_library ids the patient attached.
  attachment_media_ids text[] not null default '{}',
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  -- The GP's write-up after the call.
  summary_advice text,
  summary_next_steps text,
  summary_suggestion text,
  summary_written_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists ix_consultation_video_sessions_doctor_time
  on consultation.video_sessions (doctor_id, scheduled_at);
create index if not exists ix_consultation_video_sessions_patient
  on consultation.video_sessions (patient_user_id, scheduled_at desc);

drop trigger if exists trg_consultation_video_sessions_touch on consultation.video_sessions;
create trigger trg_consultation_video_sessions_touch
  before update on consultation.video_sessions
  for each row execute function consultation.fn_touch_updated_at();
