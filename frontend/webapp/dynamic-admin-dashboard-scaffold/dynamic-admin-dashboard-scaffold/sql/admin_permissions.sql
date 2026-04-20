create schema if not exists auth;

create table if not exists auth.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique
);

create table if not exists auth.user_roles (
    user_id uuid not null,
    role_id uuid not null references auth.roles(id) on delete cascade,
    primary key (user_id, role_id)
);

create table if not exists auth.role_table_permissions (
    id uuid primary key default gen_random_uuid(),
    role_id uuid not null references auth.roles(id) on delete cascade,
    schema_name text not null,
    table_name text not null,
    can_read boolean not null default false,
    can_create boolean not null default false,
    can_update boolean not null default false,
    can_delete boolean not null default false,
    unique (role_id, schema_name, table_name)
);

create index if not exists ix_role_table_permissions_lookup
    on auth.role_table_permissions (role_id, schema_name, table_name);
