-- Explicit provider-media grants for approved staff workspaces.
-- Provider media remains private by default; this table grants read visibility only.
create table if not exists provider_portal.media_staff_access (
  id uuid primary key default public.uuid_generate_v4(),
  media_id uuid not null references media.media_library(id) on delete cascade,
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  staff_id uuid not null references category.staff(id) on delete cascade,
  granted_by_user_id uuid not null references identity.asp_net_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(media_id, service_provider_id, staff_id)
);

create index if not exists ix_provider_portal_media_staff_access_staff
  on provider_portal.media_staff_access(staff_id, service_provider_id, created_at desc);
create index if not exists ix_provider_portal_media_staff_access_provider
  on provider_portal.media_staff_access(service_provider_id, created_at desc);

comment on table provider_portal.media_staff_access is
  'Explicit read-only grants from a provider media workspace to one staff profile. Access is additionally gated by the active approved staff claim at read time.';
