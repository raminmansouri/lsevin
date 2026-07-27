import { describe, expect, it } from "vitest";

import { toCsv, type CsvColumn } from "./csv";

type Row = { name: string; amount: string; note: string | null };

const columns: CsvColumn<Row>[] = [
  { header: "name", value: (r) => r.name },
  { header: "amount", value: (r) => r.amount },
  { header: "note", value: (r) => r.note },
];

describe("CSV export", () => {
  it("starts with a UTF-8 BOM so Excel reads Persian correctly", () => {
    const csv = toCsv([{ name: "حساب تسویه زرین‌پال", amount: "1000", note: null }], columns);
    // Without this byte Excel on Windows falls back to the local codepage and every
    // Persian name arrives as mojibake.
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("حساب تسویه زرین‌پال");
  });

  it("writes amounts unformatted so Excel treats the column as numbers", () => {
    const csv = toCsv([{ name: "a", amount: "1234567.89", note: null }], columns);
    expect(csv).toContain("1234567.89");
    // A grouped "1,234,567.89" would be text, and a column of text will not sum.
    expect(csv).not.toContain("1,234,567");
  });

  it("quotes values containing commas, quotes or newlines", () => {
    const csv = toCsv(
      [{ name: 'Smith, "Bob"', amount: "1", note: "line1\nline2" }],
      columns
    );
    expect(csv).toContain('"Smith, ""Bob"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it("neutralises values Excel would execute as a formula", () => {
    const csv = toCsv([{ name: "=1+1", amount: "1", note: "@SUM(A1)" }], columns);
    // Prefixed with an apostrophe so an IBAN or a note is shown, not evaluated.
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@SUM(A1)");
  });

  it("renders null as an empty cell rather than the word null", () => {
    const csv = toCsv([{ name: "a", amount: "1", note: null }], columns);
    expect(csv.trimEnd().endsWith("a,1,")).toBe(true);
  });
});
