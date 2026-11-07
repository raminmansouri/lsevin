-- Add optional, stable public slugs before changing routes. Existing rows and
-- UUID links remain valid until a separately reviewed backfill is published.
alter table category.service_providers add column if not exists slug text null;
alter table category.provider_types add column if not exists slug text null;
alter table category.provider_services add column if not exists slug text null;
alter table category.staff add column if not exists slug text null;
alter table marketing.special_packages add column if not exists slug text null;

create unique index if not exists service_providers_slug_uq
  on category.service_providers (slug) where slug is not null;
create unique index if not exists provider_types_slug_uq
  on category.provider_types (slug) where slug is not null;
create unique index if not exists provider_services_slug_uq
  on category.provider_services (slug) where slug is not null;
create unique index if not exists staff_slug_uq
  on category.staff (slug) where slug is not null;
create unique index if not exists special_packages_slug_uq
  on marketing.special_packages (slug) where slug is not null;
