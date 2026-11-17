-- Admin access control: custom roles with per-area permissions for the admin panel.
--
-- Background. Every admin used to be all-or-nothing: the identity role `admin` or
-- `superadmin` opened every page. The .NET backend authorizes its admin endpoints with
-- that same JWT role, so a limited admin must STILL carry the identity `admin` role — what
-- narrows them is this layer, enforced by the Next.js app:
--
--   * identity `superadmin`                          -> unlimited, always
--   * identity `admin`, NOT in auth.staff_members    -> unlimited (today's behaviour; nobody
--                                                       loses access when this migration runs)
--   * identity `admin`, in auth.staff_members        -> limited to the union of the
--       status = 'active'                               permissions of their custom roles
--   * identity `admin`, in auth.staff_members        -> no access (revoked), even while an
--       status = 'disabled'                             old JWT still says `admin`
--
-- Custom roles live in the existing auth.roles / auth.user_roles tables. Their permissions are
-- (resource_key, level) pairs in the new auth.role_admin_permissions. A resource key names one
-- admin area, e.g. `shop.orders`; the catalogue of keys is derived from the admin routes by
-- src/lib/admin/access (nothing here enumerates them, so new pages need no migration).
--
-- Additive and idempotent: no existing row is changed except flagging the two built-in role
-- names as system roles. Safe to re-run. No deferrable constraints (they block SymmetricDS,
-- see 0092).

begin;

-- 1. Roles: a description, a system flag and timestamps. `admin` / `superadmin` rows were
--    mirrored here by 0001 for the table-grant layer; they are built-in, unlimited, and are
--    managed through identity roles, so the access-control UI must never edit or assign them.
alter table auth.roles
  add column if not exists description text,
  add column if not exists is_system   boolean     not null default false,
  add column if not exists created_at  timestamptz not null default now(),
  add column if not exists updated_at  timestamptz not null default now();

update auth.roles
   set is_system = true
 where lower(name) in ('admin', 'superadmin')
   and is_system = false;

-- 2. What a custom role may do. `manage` implies `view`; one row per (role, resource).
create table if not exists auth.role_admin_permissions (
  role_id      uuid        not null references auth.roles (id) on delete cascade,
  resource_key text        not null,
  level        text        not null,
  granted_by   uuid        null,
  granted_at   timestamptz not null default now(),
  constraint role_admin_permissions_pkey primary key (role_id, resource_key),
  constraint role_admin_permissions_level_check check (level in ('view', 'manage')),
  constraint role_admin_permissions_key_check  check (resource_key ~ '^[a-z0-9][a-z0-9._-]*$')
);

-- 3. Admins whose access is managed here. Absence = unmanaged legacy admin (unlimited).
--    `admin_role_auto_granted` records that the identity `admin` role was given by this
--    feature, so removing the person from staff can take it back again.
create table if not exists auth.staff_members (
  user_id                 uuid        primary key references identity.asp_net_users (id) on delete cascade,
  status                  text        not null default 'active',
  admin_role_auto_granted boolean     not null default false,
  created_by              uuid        null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint staff_members_status_check check (status in ('active', 'disabled'))
);

-- 4. Who changed what. Append-only by convention; the app never updates or deletes rows.
create table if not exists auth.admin_access_audit (
  id             uuid        primary key default gen_random_uuid(),
  actor_user_id  uuid        null,
  action         text        not null,
  role_id        uuid        null,
  target_user_id uuid        null,
  details        jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists ix_admin_access_audit_created on auth.admin_access_audit (created_at desc);
create index if not exists ix_role_admin_permissions_resource on auth.role_admin_permissions (resource_key);
create index if not exists ix_user_roles_role on auth.user_roles (role_id);

commit;
