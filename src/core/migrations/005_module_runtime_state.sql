create table if not exists provider_portal.module_states (
  module_id text primary key,
  is_enabled boolean not null default true,
  reason text not null,
  updated_by uuid not null references identity.asp_net_users(id),
  updated_at timestamptz not null default now(),
  constraint ck_provider_portal_module_states_reason check (length(trim(reason)) >= 5)
);

create table if not exists provider_portal.module_state_events (
  id uuid primary key default public.uuid_generate_v4(),
  module_id text not null,
  action text not null,
  previous_enabled boolean not null,
  new_enabled boolean not null,
  actor_user_id uuid not null references identity.asp_net_users(id),
  reason text not null,
  created_at timestamptz not null default now(),
  constraint ck_provider_portal_module_state_events_action check (action in ('enable', 'disable')),
  constraint ck_provider_portal_module_state_events_changed check (previous_enabled is distinct from new_enabled),
  constraint ck_provider_portal_module_state_events_reason check (length(trim(reason)) >= 5)
);

create index if not exists ix_provider_portal_module_state_events_module
  on provider_portal.module_state_events (module_id, created_at desc);

create index if not exists ix_provider_portal_module_state_events_actor
  on provider_portal.module_state_events (actor_user_id, created_at desc);

comment on table provider_portal.module_states is 'Runtime enable/disable state for registered Providers Portal extended modules. Missing rows mean enabled.';
comment on table provider_portal.module_state_events is 'Immutable audited history of module enable/disable changes.';
