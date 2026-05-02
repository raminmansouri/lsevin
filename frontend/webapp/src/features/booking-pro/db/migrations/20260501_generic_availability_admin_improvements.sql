-- Admin improvements for the generic availability model.
-- Safe to run after 20260501_create_generic_availability.sql.

alter table provider_portal.generic_availability_rules
  add column if not exists is_active boolean not null default true;

create index if not exists ix_generic_availability_rules_active_target
  on provider_portal.generic_availability_rules(target_type, target_id, is_active, day_of_week, specific_date);

create index if not exists ix_generic_availability_rules_active_provider_service
  on provider_portal.generic_availability_rules(provider_service_id, is_active);

comment on column provider_portal.generic_availability_rules.is_active is
  'Admin toggle. Inactive rules are ignored by booking availability resolvers without deleting historical configuration.';
