-- Stable source identity without changing any existing location UUID/code/parent.
-- Only the offline catalogue importer writes this table; application reads are unchanged.
create table if not exists category.location_geonames_refs (
    geoname_id bigint primary key check (geoname_id > 0),
    location_id uuid not null unique references category.locations(id),
    source_metadata jsonb not null check (jsonb_typeof(source_metadata) = 'object'),
    created_at timestamptz not null default now()
);
comment on table category.location_geonames_refs is
    'GeoNames CC BY 4.0 source identities. Existing locations and references are never replaced.';
