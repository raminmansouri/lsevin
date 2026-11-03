-- Video consultation: the doctors an admin offers on the home card's doctors page.
-- Only doctors listed here (and active) are shown to patients; the list is curated
-- by hand in the admin consultation panel rather than derived from categories.
create table if not exists consultation.video_doctors (
  staff_id uuid primary key references category.staff (id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  added_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists ix_consultation_video_doctors_active_order
  on consultation.video_doctors (is_active, sort_order);

drop trigger if exists trg_consultation_video_doctors_touch on consultation.video_doctors;
create trigger trg_consultation_video_doctors_touch
  before update on consultation.video_doctors
  for each row execute function consultation.fn_touch_updated_at();
