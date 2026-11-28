import { describe, expect, it } from "vitest";

import { toDateOnly } from "./date-only";

describe("toDateOnly", () => {
  it("turns the Date postgres.js returns for a date column into YYYY-MM-DD", () => {
    // postgres.js parses date '1990-05-01' as new Date('1990-05-01'): midnight UTC.
    expect(toDateOnly(new Date("1990-05-01"))).toBe("1990-05-01");
    expect(toDateOnly(new Date("2000-12-31"))).toBe("2000-12-31");
  });

  it("keeps ISO strings and trims a time part", () => {
    expect(toDateOnly("1990-05-01")).toBe("1990-05-01");
    expect(toDateOnly("1990-05-01T00:00:00.000Z")).toBe("1990-05-01");
  });

  it("returns null for empty, invalid and non-date values", () => {
    expect(toDateOnly(null)).toBeNull();
    expect(toDateOnly(undefined)).toBeNull();
    expect(toDateOnly("")).toBeNull();
    expect(toDateOnly(new Date("not a date"))).toBeNull();
    expect(toDateOnly("yesterday")).toBeNull();
    expect(toDateOnly({})).toBeNull();
  });
});
