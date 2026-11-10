-- Video consultation: what each consultation was bought with. Clinics now set three packages
-- (20, 45 and 60 minutes) per doctor in the provider portal (provider_consultations.package_prices),
-- with a toman price for Iranian patients and a dollar price for everyone else. A session keeps a
-- copy of what the patient picked and paid, so later price or share changes never rewrite it.
-- All columns are nullable: sessions booked before this migration keep null.

alter table consultation.video_sessions
  -- provider_consultations.package_prices.id (owned by the portal, so no foreign key).
  add column if not exists package_price_id uuid,
  -- The clinic the doctor gave this consultation for; a doctor can work for several clinics.
  add column if not exists service_provider_id uuid references category.service_providers (id) on delete set null,
  -- 'iran' paid the toman price, 'international' the dollar price.
  add column if not exists patient_region text,
  -- The patient's phone country code when booking (e.g. '+98'), which decided the region.
  add column if not exists patient_country_code text,
  -- LSevin's fixed share in percent at booking time.
  add column if not exists platform_percent numeric(5, 2),
  -- Where the booking started.
  add column if not exists source text,
  -- A treatment booking this consultation belongs to, if any (no foreign key: bookings live elsewhere).
  add column if not exists booking_id uuid,
  -- The clinic service the consultation is about, if any.
  add column if not exists service_id uuid references category.provider_services (id) on delete set null,
  -- When the doctor side cancels a paid consultation, what the patient chose: their money back or a new time.
  add column if not exists cancel_resolution text,
  add column if not exists cancel_resolution_at timestamp with time zone;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ck_video_sessions_patient_region') then
    alter table consultation.video_sessions
      add constraint ck_video_sessions_patient_region
      check (patient_region is null or patient_region in ('iran', 'international'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_video_sessions_platform_percent') then
    alter table consultation.video_sessions
      add constraint ck_video_sessions_platform_percent
      check (platform_percent is null or (platform_percent >= 0 and platform_percent <= 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_video_sessions_source') then
    alter table consultation.video_sessions
      add constraint ck_video_sessions_source
      check (source is null or source in ('home_card', 'doctors_page', 'service', 'specialist', 'booking'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_video_sessions_cancel_resolution') then
    alter table consultation.video_sessions
      add constraint ck_video_sessions_cancel_resolution
      check (cancel_resolution is null or cancel_resolution in ('refund', 'reschedule'));
  end if;
end $$;

create index if not exists ix_consultation_video_sessions_provider
  on consultation.video_sessions (service_provider_id, scheduled_at desc)
  where service_provider_id is not null;
