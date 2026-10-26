/**
 * Safe CSV encoding for admin exports (M-022).
 *
 *   * UTF-8 with a BOM so spreadsheet apps detect Persian/Arabic text correctly.
 *   * RFC 4180 quoting (",", quotes, CR/LF).
 *   * Formula-injection protection (OWASP "CSV injection"): a TEXT cell that
 *     begins with =, +, -, @, TAB or CR is prefixed with an apostrophe so it is
 *     shown as text, never evaluated. Numeric cells are written as plain numbers
 *     (they come from typed columns, not from user input) so amounts stay numeric.
 *
 * Pure module: no server dependencies, unit-tested directly.
 */
export const CSV_BOM = "﻿";
const DANGEROUS_START = /^[=+\-@\t\r]/;

export type CsvCell = string | number | boolean | null | undefined;

export function escapeCsvCell(value: CsvCell): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "true" : "false";
  let s = String(value);
  if (DANGEROUS_START.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header.map(escapeCsvCell).join(","), ...rows.map((r) => r.map(escapeCsvCell).join(","))];
  return CSV_BOM + lines.join("\r\n") + "\r\n";
}
