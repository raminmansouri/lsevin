-- Undo fix_names_apply.sql. Restores a row only while it still holds the value the fix wrote,
-- so later admin edits are kept. psql -X -v ON_ERROR_STOP=1 -f scripts/locations/fix_names_rollback.sql
\set ON_ERROR_STOP on
DO $$
DECLARE last_id uuid := '00000000-0000-0000-0000-000000000000'; batch_max uuid; n integer; total integer := 0;
BEGIN
    LOOP
        SELECT b.id INTO batch_max FROM (
            SELECT id FROM public.location_name_fix_20261026
            WHERE id > last_id AND applied_at IS NOT NULL AND rolled_back_at IS NULL
            ORDER BY id LIMIT 5000) b
        ORDER BY b.id DESC LIMIT 1;
        EXIT WHEN batch_max IS NULL;
        WITH restored AS (
            UPDATE category.locations l SET value_translations = f.old, last_modified_date = now()
            FROM public.location_name_fix_20261026 f
            WHERE f.id > last_id AND f.id <= batch_max AND f.applied_at IS NOT NULL AND f.rolled_back_at IS NULL
              AND l.id = f.id AND l.value_translations = f.new
            RETURNING l.id
        )
        UPDATE public.location_name_fix_20261026 f SET rolled_back_at = now() FROM restored r WHERE f.id = r.id;
        GET DIAGNOSTICS n = ROW_COUNT;
        total := total + n;
        last_id := batch_max;
        COMMIT;
    END LOOP;
    RAISE NOTICE 'rolled back % rows', total;
END $$;
