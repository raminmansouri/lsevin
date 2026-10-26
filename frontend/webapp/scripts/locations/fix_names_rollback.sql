-- Undo fix_names_apply.sql. Restores a row only while it still holds the value the fix wrote,
-- so later admin edits are kept. psql -X -v ON_ERROR_STOP=1 -f scripts/locations/fix_names_rollback.sql
\set ON_ERROR_STOP on
WITH restored AS (
    UPDATE category.locations l SET value_translations = f.old, last_modified_date = now()
    FROM public.location_name_fix_20261026 f
    WHERE l.id = f.id AND f.applied_at IS NOT NULL AND f.rolled_back_at IS NULL AND l.value_translations = f.new
    RETURNING l.id
)
UPDATE public.location_name_fix_20261026 f SET rolled_back_at = now() FROM restored r WHERE f.id = r.id;
