-- Shared auditable control surface for cross-module administration actions.
-- Business tables remain owned by their corresponding modules; this table stores
-- only the administrator decision trail needed for release and operations review.

create table if not exists provider_portal.admin_catalog_actions (
  id uuid primary key default public.uuid_generate_v4(),
  entity_type text not null,
  entity_id text not null,
  service_provider_id uuid,
  action text not null,
  reason text,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint ck_admin_catalog_actions_entity_type_not_blank check (length(trim(entity_type)) > 0),
  constraint ck_admin_catalog_actions_entity_id_not_blank check (length(trim(entity_id)) > 0),
  constraint ck_admin_catalog_actions_action_not_blank check (length(trim(action)) > 0)
);

create index if not exists ix_admin_catalog_actions_entity
  on provider_portal.admin_catalog_actions (entity_type, entity_id, created_at desc);

create index if not exists ix_admin_catalog_actions_provider
  on provider_portal.admin_catalog_actions (service_provider_id, created_at desc)
  where service_provider_id is not null;

create index if not exists ix_admin_catalog_actions_actor
  on provider_portal.admin_catalog_actions (actor_user_id, created_at desc);
