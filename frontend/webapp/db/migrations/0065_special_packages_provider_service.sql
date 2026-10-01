-- Links a special package to one specific bookable service, so "Reserve" can
-- skip the normal provider/service/time/specialist wizard entirely and go
-- straight to payment. Nullable: existing packages have nothing assigned yet,
-- and an admin sets this per package after the fact.
begin;

alter table marketing.special_packages
    add column if not exists provider_service_id uuid null
    references category.provider_services (id);

create index if not exists ix_special_packages_provider_service_id
    on marketing.special_packages (provider_service_id);

commit;