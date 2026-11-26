-- 0123: public URL slugs for video consultation doctors.
--
-- The consultation doctors' public URLs move from
--   /<locale>/n/app/mobile/consultation/doctors/<uuid>/book
-- to
--   /<locale>/consultation/doctors/<slug>/book
-- (docs/seo/lsevin-url-tasks.md: no UUID and no /n/app/mobile in a public URL).
--
-- Same rules as the catalog slugs (0093): the English name first, else the
-- Persian name transliterated to lowercase ASCII; words joined by hyphens; a
-- taken slug gets -2, -3, ... It reuses category.public_slug_base and
-- category.public_slug_unique from 0093.
--
-- A slug is only filled in, never rewritten: renaming a doctor keeps the URL.
-- Until this runs the app keeps working: the doctor pages read the column
-- through to_jsonb(...) and fall back to the UUID.
--
-- Rollback: drop trigger video_doctors_public_slug on consultation.video_doctors;
--           drop function consultation.fill_video_doctor_slug();
--           drop index consultation.video_doctors_slug_uq;
--           alter table consultation.video_doctors drop column slug;
begin;

alter table consultation.video_doctors add column if not exists slug text null;

create unique index if not exists video_doctors_slug_uq
  on consultation.video_doctors (slug) where slug is not null;

create or replace function consultation.fill_video_doctor_slug()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.slug, '') <> '' then
    return new;
  end if;
  new.slug := category.public_slug_unique(
    'consultation.video_doctors'::regclass,
    category.public_slug_base(coalesce(nullif(trim(new.name_en), ''), new.name_fa), 'doctor'),
    new.id
  );
  return new;
end;
$$;

comment on function consultation.fill_video_doctor_slug() is
  'Gives a new or still slug-less video consultation doctor its permanent URL slug.';

create or replace trigger video_doctors_public_slug
  before insert or update on consultation.video_doctors
  for each row execute function consultation.fill_video_doctor_slug();

-- Existing doctors, one at a time and in their listing order, so the first
-- doctor with a given name keeps the plain slug.
do $$
declare
  row_id uuid;
begin
  for row_id in
    select id from consultation.video_doctors where slug is null order by sort_order, created_at, id
  loop
    update consultation.video_doctors set slug = null where id = row_id;
  end loop;
end;
$$;

commit;
