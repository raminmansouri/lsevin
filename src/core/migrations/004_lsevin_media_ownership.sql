create table if not exists provider_portal.media_ownership (
  id uuid primary key default public.uuid_generate_v4(),
  media_id uuid not null references media.media_library(id) on delete cascade,
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  owner_user_id uuid not null references identity.asp_net_users(id) on delete restrict,
  ownership_role text not null default 'owner' check (ownership_role in ('owner','admin','manager','editor')),
  source text not null default 'provider_portal' check (source in ('provider_portal','lsevin_admin','migration')),
  created_at timestamptz not null default now(),
  unique(media_id, service_provider_id)
);

create index if not exists ix_provider_portal_media_ownership_provider
  on provider_portal.media_ownership(service_provider_id, created_at desc);
create index if not exists ix_provider_portal_media_ownership_user
  on provider_portal.media_ownership(owner_user_id, created_at desc);
