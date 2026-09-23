BEGIN;

-- The original support table used shorter column names. Keep those columns for
-- rollback compatibility while exposing the names used by the current webapp.
ALTER TABLE support.bug_report_board_column_settings
  ADD COLUMN IF NOT EXISTS status_values text[],
  ADD COLUMN IF NOT EXISTS label_translations jsonb,
  ADD COLUMN IF NOT EXISTS display_order integer,
  ADD COLUMN IF NOT EXISTS is_enabled boolean,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_modified_date timestamptz;

UPDATE support.bug_report_board_column_settings
SET
  status_values = COALESCE(status_values, statuses),
  label_translations = COALESCE(label_translations, title_translations),
  display_order = COALESCE(display_order, position),
  is_enabled = COALESCE(is_enabled, is_visible, true),
  updated_by_user_id = COALESCE(updated_by_user_id, created_by),
  last_modified_date = COALESCE(last_modified_date, updated_at, created_at, now());

COMMIT;
