-- Media Library standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists media_library;

    create table if not exists media_library.media_assets (
      id uuid primary key default gen_random_uuid(),
      original_name text not null,
      file_url text not null,
      storage_key text,
      mime_type text not null,
      media_kind text not null default 'image' check (media_kind in ('image','video','file')),
      size_bytes bigint not null default 0,
      width int,
      height int,
      title_translations jsonb not null default '{}',
      alt_translations jsonb not null default '{}',
      created_by_user_id uuid,
      is_public boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists media_library.media_usages (
      id uuid primary key default gen_random_uuid(),
      media_asset_id uuid not null references media_library.media_assets(id) on delete cascade,
      owner_entity_type text not null,
      owner_entity_id uuid not null,
      usage_kind text not null default 'gallery',
      display_order int not null default 0,
      is_primary boolean not null default false,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now()
    );

-- vNext media moderation and public-front compatibility fields.
alter table if exists media_library.media_assets
  add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('pending','approved','rejected','hidden')),
  add column if not exists reviewed_by_user_id uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists decision_reason text;

alter table if exists media_library.media_usages
  add column if not exists owner_service_provider_id uuid,
  add column if not exists public_visibility text not null default 'approved' check (public_visibility in ('pending','approved','hidden'));

create index if not exists ix_media_library_assets_status on media_library.media_assets(moderation_status, created_at desc);
create index if not exists ix_media_library_usages_owner on media_library.media_usages(owner_entity_type, owner_entity_id, usage_kind, display_order);
create index if not exists ix_media_library_usages_provider on media_library.media_usages(owner_service_provider_id, created_at desc);
