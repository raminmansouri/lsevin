\set ON_ERROR_STOP on
-- Run: psql -X -qAt -f snapshot.sql > snapshot.json
-- Read-only. The aggregate fingerprint covers every location, including countries
-- outside the import scope. It rejects concurrent admin/catalogue edits at apply.
-- Optional large-catalogue scope: psql -v country_codes=IR,BH ...
-- The fingerprint still covers ALL rows, even with a scoped snapshot.
\if :{?country_codes}
\else
\set country_codes ''
\endif
SELECT to_regclass('category.location_geonames_refs') IS NOT NULL AS has_refs \gset
\if :has_refs
WITH RECURSIVE scope AS (
    SELECT * FROM category.locations
    WHERE location_type_id = 1
      AND (:'country_codes' = '' OR upper(code) = ANY(string_to_array(:'country_codes', ',')))
    UNION ALL
    SELECT l.* FROM category.locations l JOIN scope s ON l.parent_id = s.id
)
SELECT jsonb_build_object(
    'fingerprint_version', 2,
    'fingerprint', (SELECT md5(string_agg(md5(row_to_json(l)::text), '' ORDER BY id)) FROM category.locations l),
    'locations', (SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM scope s),
    'refs', coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM category.location_geonames_refs r JOIN scope s ON s.id=r.location_id), '[]'::jsonb)
);
\else
WITH RECURSIVE scope AS (
    SELECT * FROM category.locations
    WHERE location_type_id = 1
      AND (:'country_codes' = '' OR upper(code) = ANY(string_to_array(:'country_codes', ',')))
    UNION ALL
    SELECT l.* FROM category.locations l JOIN scope s ON l.parent_id = s.id
)
SELECT jsonb_build_object(
    'fingerprint_version', 2,
    'fingerprint', (SELECT md5(string_agg(md5(row_to_json(l)::text), '' ORDER BY id)) FROM category.locations l),
    'locations', (SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM scope s),
    'refs', '[]'::jsonb
);
\endif
