/**
 * The financial panel runs on its own host and is Persian-only, so it does not carry a
 * `[locale]` segment the way the customer app does. Accountants here work in one
 * language; a locale switcher would be a setting nobody changes and a URL shape to
 * maintain forever.
 */
export const PANEL_LOCALE = "fa";
