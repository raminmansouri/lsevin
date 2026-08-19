-- Allow international provider calling prefixes. The previous varchar(3)
-- accepted +98 but rejected valid prefixes such as +358 and +994, and the
-- onboarding staging table should use the same international-safe width.

alter table if exists category.service_providers
  alter column phone_number_country_code type character varying(8);

alter table if exists provider_portal.onboarding_applications
  alter column phone_number_country_code type character varying(8);
