/**
 * Labels for the metadata-driven ("Dynamic") admin.
 *
 * The admin builds table/column labels by humanizing English database names
 * ("display_order" -> "Display Order"). Those are locale-agnostic, so every
 * locale used to render English. This module maps them through the next-intl
 * bundles instead, which means all eleven languages get them rather than the one
 * that a hardcoded Persian dictionary used to cover.
 *
 * The dictionaries live in messages/<locale>.json under three namespaces —
 * AdminSchema (group headings), AdminTable (entities), AdminColumn (fields) —
 * generated from the live database by scripts/admin-labels-scaffold.mjs.
 *
 * Anything absent falls back to the humanized English the admin already
 * produced, so a table added to the database tomorrow degrades to readable text
 * rather than to a raw "AdminTable.foo" key path.
 */

/** next-intl's translator, narrowed to what this module needs. */
type Translator = ((key: string) => string) & { has?: (key: string) => boolean };

/**
 * Reads one key without letting a missing message reach the screen.
 *
 * next-intl behaves differently depending on version and environment when a key
 * is absent: it may throw, or return the key path itself. The second case is the
 * dangerous one — it renders "AdminTable.booking_addons" to a user and passes
 * every automated check. Both are treated as "no translation" here.
 */
function lookup(t: Translator, key: string, fallback: string): string {
  if (!key) return fallback;
  try {
    if (typeof t.has === "function" && !t.has(key)) return fallback;
    const value = t(key);
    if (!value || value === key || value.endsWith(`.${key}`)) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/** Humanizes a raw database name the way inferFieldLabel() does. */
function humanize(name: string): string {
  return name
    .replace(/_translations$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Localizes a schema group heading ("provider_portal" -> "Provider Portal"). */
export function localizeSchemaLabel(t: Translator, schema: string | undefined | null): string {
  if (!schema) return "";
  return lookup(t, schema, humanize(schema));
}

/** Localizes a table/entity label by its raw table name. */
export function localizeTableLabel(
  t: Translator,
  table: string | undefined | null,
  fallback: string,
): string {
  if (!table) return fallback;
  return lookup(t, table.toLowerCase(), fallback);
}

/**
 * Localizes a column/field label by its raw snake_case name.
 *
 * Falls back through the same derivations the Persian dictionary used, so a
 * column that is not listed verbatim still resolves when its base form is:
 * `name_translations` -> `name`, `is_active` -> `active`, `staff_id` -> `staff`.
 */
export function localizeColumnLabel(
  tColumn: Translator,
  tTable: Translator,
  columnName: string | undefined | null,
  fallback: string,
): string {
  if (!columnName) return fallback;
  const key = columnName.toLowerCase();

  const direct = lookup(tColumn, key, "");
  if (direct) return direct;

  if (key.endsWith("_translations")) {
    const base = lookup(tColumn, key.slice(0, -"_translations".length), "");
    if (base) return base;
  }

  if (key.startsWith("is_")) {
    const base = lookup(tColumn, key.slice(3), "");
    if (base) return base;
  }

  // Foreign keys read better as the thing they point at: `staff_id` -> "Staff".
  if (key.endsWith("_id")) {
    const stem = key.slice(0, -3);
    const asColumn = lookup(tColumn, stem, "");
    if (asColumn) return asColumn;
    const asTable = lookup(tTable, stem, "");
    if (asTable) return asTable;
  }

  return fallback;
}
