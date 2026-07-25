-- Seed auth.role_table_permissions so the restored assertAdminPermission actually
-- restricts, instead of falling back to "this admin has no grants, let them through".
--
-- Why this is needed: the guard in src/lib/admin/guard.ts was a no-op (`return;` as its
-- first statement). Turning it back on against the production data as-is would have
-- emptied the panel — auth.role_table_permissions held ~9 rows for a single role, and
-- auth.user_roles listed 2 users while 6 accounts carry the identity 'admin' role. So
-- the guard degrades to role-only when an admin has no rows. This migration gives every
-- admin explicit grants; once it has run, that degradation stops firing.
--
-- Idempotent: safe to re-run. Uses `where not exists` rather than ON CONFLICT because
-- the unique constraints on these tables are not recorded anywhere in the repo.

begin;

-- 1. The app-level RBAC layer (auth.*) is separate from ASP.NET Identity roles
--    (identity.asp_net_roles). Make sure both role names exist here.
insert into auth.roles (id, name)
select gen_random_uuid(), r.name
from (values ('admin'), ('superadmin')) as r(name)
where not exists (select 1 from auth.roles x where lower(x.name) = r.name);

-- 2. Mirror identity's admin/superadmin holders into auth.user_roles. Without this,
--    an account that can reach /admin (middleware checks the identity role) has no
--    row here at all, so getUserAllowedTables returns nothing for them.
insert into auth.user_roles (user_id, role_id)
select iur.user_id, ar.id
from identity.asp_net_user_roles iur
join identity.asp_net_roles ir on ir.id = iur.role_id
join auth.roles ar on lower(ar.name) = lower(ir.name)
where lower(ir.name) in ('admin', 'superadmin')
  and not exists (
    select 1 from auth.user_roles x
    where x.user_id = iur.user_id and x.role_id = ar.id
  );

-- 3. Grant table permissions.
--
--    Scope: the schemas the generic admin panel is meant to manage. auth.* and
--    identity.* are deliberately excluded — they have bespoke admin pages, and
--    granting generic CRUD on them would let the panel edit its own access rules.
--
--    Money and ledger tables are granted READ ONLY. They must only ever change
--    through the guarded flows (wallet approval, refund engine, gateway settlement),
--    which enforce locking, idempotency and audit. Generic row editing on a ledger is
--    how balances silently stop reconciling. Widen a specific one deliberately if you
--    ever need to, rather than loosening the list.
with target_tables as (
  select n.nspname as schema_name, c.relname as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r'                 -- ordinary tables only: 'p' would add the
                                        -- partitioned parent alongside every leaf
    and n.nspname in (
      'booking', 'category', 'commercial', 'common', 'customer', 'finance',
      'form_builder', 'loyalty', 'marketing', 'media', 'notify',
      'provider_portal', 'shop', 'support'
    )
    and c.relname not like '%outbox%'
    and c.relname not like '%inbox%'
    and c.relname not like 'internal_command%'
    and c.relname not like '\_\_EF%'
),
classified as (
  select
    t.schema_name,
    t.table_name,
    not (
      (t.schema_name = 'customer'   and t.table_name like 'wallet%')
      or (t.schema_name = 'booking'    and t.table_name in ('payments'))
      or (t.schema_name = 'commercial' and t.table_name in (
            'refunds', 'refund_lines', 'refund_requests',
            'provider_ledgers', 'provider_settlement_reversals',
            'booking_charge_lines'
          ))
      or (t.schema_name = 'finance'    and t.table_name in ('exchange_rates', 'fx_quotes'))
      or (t.schema_name = 'shop'       and t.table_name in ('payment_transactions', 'refunds'))
    ) as is_writable
  from target_tables t
)
insert into auth.role_table_permissions (
  id, role_id, schema_name, table_name, can_read, can_create, can_update, can_delete
)
select
  gen_random_uuid(), ar.id, c.schema_name, c.table_name,
  true, c.is_writable, c.is_writable, c.is_writable
from classified c
cross join auth.roles ar
where lower(ar.name) in ('admin', 'superadmin')
  and not exists (
    select 1 from auth.role_table_permissions p
    where p.role_id = ar.id
      and p.schema_name = c.schema_name
      and p.table_name = c.table_name
  );

commit;
