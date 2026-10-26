-- Apply a fix_names_census.py plan. Run on server B (the SymmetricDS hub) only; the updates
-- replicate to A like any other edit. Usage (from frontend/webapp):
--   psql -X -v ON_ERROR_STOP=1 -v plan=/secure/plan.csv -f scripts/locations/fix_names_apply.sql
-- Each row changes only while it still holds the exact value the plan was computed from, so a
-- stale plan or a later admin edit is skipped, never overwritten. Rollback: fix_names_rollback.sql.
\set ON_ERROR_STOP on
CREATE TABLE IF NOT EXISTS public.location_name_fix_20261026 (
    id uuid PRIMARY KEY,
    old jsonb NOT NULL,
    new jsonb NOT NULL,
    reasons text NOT NULL,
    applied_at timestamptz,
    rolled_back_at timestamptz
);
COMMENT ON TABLE public.location_name_fix_20261026 IS
    'Backup + audit of the 2026-10-26 census name correction of category.locations.value_translations (fix_names_census.py).';
CREATE TEMP TABLE plan_rows (id uuid, old jsonb, new jsonb, reasons text, en_before text, en_after text, fa_before text, fa_after text);
-- \copy does not expand variables itself; build the command, then run it
\set copy_plan '\\copy plan_rows FROM ' :'plan' ' WITH (FORMAT csv, HEADER)'
:copy_plan
INSERT INTO public.location_name_fix_20261026 (id, old, new, reasons)
SELECT id, old, new, reasons FROM plan_rows
ON CONFLICT (id) DO NOTHING;
ANALYZE public.location_name_fix_20261026;

-- Walk the plan in id order, 5000 rows per transaction, so each replication burst stays small.
-- Every update is a primary-key lookup.
DO $$
DECLARE last_id uuid := '00000000-0000-0000-0000-000000000000'; batch_max uuid; n integer; total integer := 0;
BEGIN
    LOOP
        -- uuid has no max() aggregate
        SELECT b.id INTO batch_max FROM (
            SELECT id FROM public.location_name_fix_20261026
            WHERE id > last_id AND applied_at IS NULL AND rolled_back_at IS NULL
            ORDER BY id LIMIT 5000) b
        ORDER BY b.id DESC LIMIT 1;
        EXIT WHEN batch_max IS NULL;
        WITH upd AS (
            UPDATE category.locations l SET value_translations = f.new, last_modified_date = now()
            FROM public.location_name_fix_20261026 f
            WHERE f.id > last_id AND f.id <= batch_max AND f.applied_at IS NULL AND f.rolled_back_at IS NULL
              AND l.id = f.id AND l.value_translations = f.old
            RETURNING l.id
        )
        UPDATE public.location_name_fix_20261026 f SET applied_at = now() FROM upd WHERE f.id = upd.id;
        GET DIAGNOSTICS n = ROW_COUNT;
        total := total + n;
        last_id := batch_max;
        COMMIT;
    END LOOP;
    RAISE NOTICE 'applied % rows', total;
END $$;

SELECT count(*) FILTER (WHERE applied_at IS NOT NULL) AS applied,
       count(*) FILTER (WHERE applied_at IS NULL) AS skipped_changed_since_plan
FROM public.location_name_fix_20261026;
