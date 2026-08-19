create table if not exists provider_portal.sso_sessions (
  token_hash text primary key,
  user_id uuid not null references identity.asp_net_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create index if not exists ix_provider_portal_sso_sessions_user
  on provider_portal.sso_sessions (user_id, expires_at desc)
  where revoked_at is null;

create index if not exists ix_provider_portal_sso_sessions_expiry
  on provider_portal.sso_sessions (expires_at);
