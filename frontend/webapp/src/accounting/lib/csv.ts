/**
 * CSV export for the accounting reports.
 *
 * Excel is the target, which drives two decisions that look odd otherwise:
 *
 *   * A UTF-8 BOM is prepended. Without it Excel on Windows reads the file as the local
 *     ANSI codepage and every Persian account name arrives as mojibake — the single most
 *     common way a "working" export turns out to be useless to the person who asked for it.
 *   * Amounts are written as plain unformatted decimals with no thousands separators, so
 *     Excel parses them as numbers. A grouped "1,234,567" is text, and a column of text
 *     will not sum.
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Prefixing with a
  // single quote keeps an IBAN or a note from being executed when the file is opened.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(",")).join("\r\n");
  return `﻿${header}\r\n${body}\r\n`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
