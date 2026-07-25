-- Independent credentials for the financial panel (financial.lsevin.com).
--
-- Deliberately NOT identity.asp_net_users. The whole point of moving accounting off the
-- admin panel is that the two are different jobs with different people: an accountant
-- must be able to sign in to the books without holding an account that can also reach
-- the rest of the platform, and an admin account being compromised must not hand over
-- the ledger. Sharing the user table would keep exactly the coupling we are removing.
--
-- Sessions are stored server-side rather than carried in a signed cookie, so revoking
-- access is a DELETE that takes effect immediately — with a stateless JWT an accountant
-- who is dismissed keeps working until the token expires.

create table if not exists accounting.panel_users (
  id              uuid        primary key default gen_random_uuid(),
  username        text        not null unique,
  display_name    text        not null,
  email           text,

  -- scrypt. Node ships it, so this adds no dependency, and it is a memory-hard KDF —
  -- unlike a bare SHA, which a GPU walks through at billions of guesses per second.
  -- Format: scrypt$N$r$p$<salt-b64>$<hash-b64>, so the parameters can be raised later
  -- without invalidating existing hashes.
  password_hash   text        not null,

  role            text        not null default 'accountant'
                              check (role in ('accountant', 'finance_admin')),
  is_active       boolean     not null default true,

  -- Lockout after repeated failures, so the login form is not an offline-speed oracle.
  failed_attempts integer     not null default 0 check (failed_attempts >= 0),
  locked_until    timestamptz,
  last_login_at   timestamptz,
  password_changed_at timestamptz not null default now(),
  -- Forces a change on first sign-in, so the seeded password cannot become permanent.
  must_change_password boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid
);

create index if not exists ix_panel_users_username on accounting.panel_users (lower(username));

create table if not exists accounting.panel_sessions (
  -- The cookie carries this id and nothing else; it is a lookup key, not a claim.
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references accounting.panel_users(id) on delete cascade,
  issued_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_seen_at  timestamptz not null default now(),
  ip_address    inet,
  user_agent    text,
  revoked_at    timestamptz,
  revoke_reason text
);

create index if not exists ix_panel_sessions_user on accounting.panel_sessions (user_id);
create index if not exists ix_panel_sessions_expiry on accounting.panel_sessions (expires_at);

-- Sign-in attempts, successful or not. A financial panel that cannot say who tried to
-- get in is missing half of its audit trail.
create table if not exists accounting.panel_login_attempts (
  id          bigint generated always as identity primary key,
  username    text        not null,
  succeeded   boolean     not null,
  reason      text,
  ip_address  inet,
  user_agent  text,
  attempted_at timestamptz not null default now()
);

create index if not exists ix_panel_login_attempts_time on accounting.panel_login_attempts (attempted_at desc);
create index if not exists ix_panel_login_attempts_user on accounting.panel_login_attempts (lower(username), attempted_at desc);

-- Append-only, same as the rest of the accounting audit surface.
drop trigger if exists trg_panel_login_attempts_immutable on accounting.panel_login_attempts;
create trigger trg_panel_login_attempts_immutable
  before update or delete on accounting.panel_login_attempts
  for each row execute function accounting.fn_block_audit_mutation();
