-- Extend the existing calendar settings; preserve existing defaults and scopes.
ALTER TABLE booking.booking_calendar_settings
  DROP CONSTRAINT IF EXISTS ck_booking_calendar_settings_default_calendar,
  DROP CONSTRAINT IF EXISTS ck_booking_calendar_settings_enabled_calendars;
ALTER TABLE booking.booking_calendar_settings
  ADD CONSTRAINT ck_booking_calendar_settings_default_calendar
    CHECK (default_calendar IN ('gregorian', 'jalali', 'hijri')),
  ADD CONSTRAINT ck_booking_calendar_settings_enabled_calendars
    CHECK (enabled_calendars <@ ARRAY['gregorian', 'jalali', 'hijri']::text[]);
