-- A duplicate service ("-2", "-3" slug) that is switched off keeps answering
-- its old URL with a permanent redirect to the service it duplicates.
alter table category.provider_services
  add column if not exists merged_into_service_id uuid null
  references category.provider_services (id) on delete set null;

alter table category.provider_services
  drop constraint if exists provider_services_not_merged_into_self;
alter table category.provider_services
  add constraint provider_services_not_merged_into_self
  check (merged_into_service_id is null or merged_into_service_id <> id);

create index if not exists provider_services_merged_into_ix
  on category.provider_services (merged_into_service_id)
  where merged_into_service_id is not null;

comment on column category.provider_services.merged_into_service_id is
  'Set when this (inactive) service was a duplicate of another one; its URL redirects there.';
