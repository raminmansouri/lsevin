/**
 * A calendar date as "YYYY-MM-DD", or null.
 *
 * postgres.js turns `date` columns into JavaScript Date objects (midnight UTC),
 * while the patient types and every page treat them as ISO date strings. A Date
 * that reaches a page as text crashes React ("Objects are not valid as a React
 * child"), so repositories map date columns through this.
 */
export function toDateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}
