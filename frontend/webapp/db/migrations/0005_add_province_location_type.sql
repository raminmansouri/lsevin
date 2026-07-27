-- Adds the Province tier to the location catalogue.
--
-- category.locations becomes three levels: country (1) -> province (3) -> city (2).
-- The tier is OPTIONAL: countries with no subdivisions in the catalogue keep parenting
-- their cities straight to the country, and every city that existed before this
-- migration keeps its country parent until the seed migration re-parents it. Consumers
-- must therefore resolve "the country of a city" as the nearest ancestor of type
-- Country, never as `parent_id`.
--
-- Mirrors LSevin.Modules.Category.Location.Enumerations.LocationType.Province.

insert into category."LocationType" (id, name)
select 3, 'Province'
where not exists (select 1 from category."LocationType" where id = 3);

-- Walking country -> province -> city and back happens on every location resolution,
-- so make the parent hop cheap in both directions.
create index if not exists ix_locations_type_parent
  on category.locations (location_type_id, parent_id);

create index if not exists ix_locations_type_code
  on category.locations (location_type_id, upper(code));
