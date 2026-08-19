-- Provider Access owns the provider membership lifecycle.
-- Existing provider_members rows are preserved and upgraded in place.

alter table provider_portal.provider_members
  add column if not exists status text not null default 'active',
  add column if not exists status_reason text,
  add column if not exists invited_by_user_id uuid,
  add column if not exists accepted_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists revoked_at timestamptz;

update provider_portal.provider_members
   set status = 'active',
       accepted_at = coalesce(accepted_at, create_date)
 where status is null or status = 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_provider_members_status'
      and conrelid = 'provider_portal.provider_members'::regclass
  ) then
    alter table provider_portal.provider_members
      add constraint ck_provider_members_status
      check (status in ('active','suspended','revoked'));
  end if;
end $$;

create index if not exists ix_provider_members_user_status
  on provider_portal.provider_members (user_id, status, is_default desc);
create index if not exists ix_provider_members_provider_status
  on provider_portal.provider_members (service_provider_id, status, create_date);

create table if not exists provider_portal.provider_member_invitations (
  id uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  intended_user_id uuid references identity.asp_net_users(id) on delete set null,
  intended_email text not null,
  role provider_portal.membership_role not null,
  token_hash text not null,
  status text not null default 'pending',
  created_by_user_id uuid not null references identity.asp_net_users(id),
  accepted_by_user_id uuid references identity.asp_net_users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_provider_member_invitations_status check (status in ('pending','accepted','declined','cancelled','expired')),
  constraint ck_provider_member_invitations_email check (length(trim(intended_email)) > 2),
  constraint ck_provider_member_invitations_expiry check (expires_at > create_date)
);

create index if not exists ix_provider_member_invitations_provider
  on provider_portal.provider_member_invitations (service_provider_id, status, create_date desc);
create index if not exists ix_provider_member_invitations_email
  on provider_portal.provider_member_invitations (lower(intended_email), status, expires_at);
create unique index if not exists ux_provider_member_invitations_pending_email
  on provider_portal.provider_member_invitations (service_provider_id, lower(intended_email))
  where status = 'pending';

create table if not exists provider_portal.provider_member_audit (
  id uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  member_id uuid references provider_portal.provider_members(id) on delete set null,
  target_user_id uuid references identity.asp_net_users(id) on delete set null,
  actor_user_id uuid not null references identity.asp_net_users(id),
  action text not null,
  reason text,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ck_provider_member_audit_action check (length(trim(action)) > 0)
);

create index if not exists ix_provider_member_audit_provider
  on provider_portal.provider_member_audit (service_provider_id, created_at desc);
create index if not exists ix_provider_member_audit_member
  on provider_portal.provider_member_audit (member_id, created_at desc)
  where member_id is not null;
