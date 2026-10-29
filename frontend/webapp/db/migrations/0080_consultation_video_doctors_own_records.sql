-- Video consultation doctors are general practitioners the admin registers in the
-- consultation panel, not doctors picked from category.staff. 0079's pick-list
-- table only ever held development data, so it is replaced outright.
drop table if exists consultation.video_doctors;

create table consultation.video_doctors (
  id uuid primary key default public.uuid_generate_v4(),
  name_fa text not null,
  name_en text,
  bio_fa text,
  bio_en text,
  medical_council_number text,
  experience_years integer check (experience_years is null or experience_years between 0 and 80),
  image_media_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index ix_consultation_video_doctors_active_order
  on consultation.video_doctors (is_active, sort_order);

create trigger trg_consultation_video_doctors_touch
  before update on consultation.video_doctors
  for each row execute function consultation.fn_touch_updated_at();
