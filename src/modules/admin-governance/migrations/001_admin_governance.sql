create table if not exists provider_portal.admin_governance_events (
  id uuid primary key default public.uuid_generate_v4(),
  actor_user_id uuid not null references identity.asp_net_users(id),
  target_user_id uuid not null references identity.asp_net_users(id),
  action text not null,
  role_name text,
  reason text not null,
  previous_roles jsonb not null default '[]'::jsonb,
  new_roles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ck_admin_governance_events_action check (action in ('assign_role', 'revoke_role')),
  constraint ck_admin_governance_events_reason check (length(trim(reason)) >= 5)
);

create index if not exists ix_admin_governance_events_target
  on provider_portal.admin_governance_events (target_user_id, created_at desc);

create index if not exists ix_admin_governance_events_actor
  on provider_portal.admin_governance_events (actor_user_id, created_at desc);

create index if not exists ix_admin_governance_events_role
  on provider_portal.admin_governance_events (role_name, created_at desc)
  where role_name is not null;
