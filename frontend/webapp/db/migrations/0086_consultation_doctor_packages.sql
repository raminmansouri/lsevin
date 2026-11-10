-- Video consultation: packages for the doctors an admin registers in this app. A clinic's doctor
-- gets up to three packages (20, 45 and 60 minutes) in the provider portal
-- (provider_consultations.package_prices); a doctor the admin adds here, with no clinic, now gets
-- the same three packages from the admin page, replacing the single length and price that the
-- consultation settings held for every doctor. Same rule as the portal: each package has a toman
-- price for Iranian patients and a dollar price for everyone else, and can only be switched on
-- once both are set.

create table if not exists consultation.video_doctor_packages (
  id uuid primary key default public.uuid_generate_v4(),
  video_doctor_id uuid not null references consultation.video_doctors (id) on delete cascade,
  duration_minutes smallint not null,
  price_toman bigint,
  price_usd numeric(10, 2),
  is_active boolean not null default false,
  updated_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ck_video_doctor_packages_duration check (duration_minutes in (20, 45, 60)),
  constraint ck_video_doctor_packages_toman check (price_toman is null or price_toman > 0),
  constraint ck_video_doctor_packages_usd check (price_usd is null or price_usd > 0),
  constraint ck_video_doctor_packages_active_priced
    check (not is_active or (price_toman is not null and price_usd is not null)),
  constraint uq_video_doctor_packages_doctor_duration unique (video_doctor_id, duration_minutes)
);

comment on table consultation.video_doctor_packages is
  'Packages (20, 45, 60 minutes) of a doctor registered by an admin in this app. Doctors added by a clinic in the provider portal use provider_consultations.package_prices instead.';
