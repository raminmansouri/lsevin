import { describe, expect, it } from "vitest";

import { compareByPriority, parsePriorityInput, priorityRank } from "./priority";

type Row = { name: string; displayOrder?: number | null };
const byName = (a: Row, b: Row) => a.name.localeCompare(b.name);

describe("category priority", () => {
  it("puts prioritised categories first in ascending order, the rest after them by the tie-break", () => {
    const rows = [
      { name: "Tourism", displayOrder: 0 },
      { name: "Beauty", displayOrder: 2 },
      { name: "Accommodation", displayOrder: 0 },
      { name: "Wellness", displayOrder: 1 },
      { name: "Clinic", displayOrder: null },
    ];
    expect([...rows].sort(compareByPriority<Row>(byName)).map((row) => row.name)).toEqual([
      "Wellness", "Beauty", "Accommodation", "Clinic", "Tourism",
    ]);
  });

  it("treats 0, null, negative and garbage as no priority", () => {
    for (const value of [0, null, undefined, -3, Number.NaN]) expect(priorityRank(value)).toBe(Number.POSITIVE_INFINITY);
    expect(priorityRank(4)).toBe(4);
  });

  it("parses admin input: empty clears, Persian/Arabic digits accepted, out of range or non-integers rejected", () => {
    expect(parsePriorityInput("", 999)).toEqual({ ok: true, value: 0 });
    expect(parsePriorityInput("  3 ", 999)).toEqual({ ok: true, value: 3 });
    expect(parsePriorityInput("۱۲", 999)).toEqual({ ok: true, value: 12 });
    expect(parsePriorityInput("٧", 999)).toEqual({ ok: true, value: 7 });
    for (const bad of ["-1", "1.5", "abc", "1000", "1e2"]) expect(parsePriorityInput(bad, 999)).toEqual({ ok: false });
  });
});
