-- Adds the optional media field used as the fallback image for provider services.
alter table category.service_definitions
  add column if not exists image_url text;

comment on column category.service_definitions.image_url is
  'Media id, path, or legacy URL used as the service-definition fallback image when a provider-service image is empty.';
