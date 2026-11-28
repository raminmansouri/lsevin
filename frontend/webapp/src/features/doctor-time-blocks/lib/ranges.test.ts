import { describe, expect, it } from "vitest";

import { addDaysIso, expandDates, isIsoDate, minutesToTime, subtractRange, timeToMinutes, todayIso } from "./ranges";

describe("timeToMinutes / minutesToTime", () => {
  it("reads HH:MM and HH:MM:SS", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("09:30:00")).toBe(570);
    expect(timeToMinutes("24:00")).toBe(1440);
  });
  it("rejects junk and times past the end of day", () => {
    expect(timeToMinutes("24:30")).toBeNull();
    expect(timeToMinutes("9:30")).toBeNull();
    expect(timeToMinutes("")).toBeNull();
    expect(timeToMinutes(null)).toBeNull();
  });
  it("round-trips", () => {
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(1440)).toBe("24:00");
  });
});

describe("subtractRange", () => {
  const block = { start: 600, end: 720 }; // 10:00-12:00
  it("keeps the block when the cut does not touch it", () => {
    expect(subtractRange(block, { start: 720, end: 750 })).toEqual([block]);
    expect(subtractRange(block, { start: 570, end: 600 })).toEqual([block]);
  });
  it("removes the whole block when the cut covers it", () => {
    expect(subtractRange(block, { start: 600, end: 720 })).toEqual([]);
    expect(subtractRange(block, { start: 500, end: 800 })).toEqual([]);
  });
  it("splits the block around a cut in the middle", () => {
    expect(subtractRange(block, { start: 630, end: 660 })).toEqual([
      { start: 600, end: 630 },
      { start: 660, end: 720 },
    ]);
  });
  it("trims either end", () => {
    expect(subtractRange(block, { start: 600, end: 630 })).toEqual([{ start: 630, end: 720 }]);
    expect(subtractRange(block, { start: 690, end: 750 })).toEqual([{ start: 600, end: 690 }]);
  });
});

describe("dates", () => {
  it("validates ISO days", () => {
    expect(isIsoDate("2026-11-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("28-11-2026")).toBe(false);
  });
  it("expands an inclusive range, across a month end", () => {
    expect(expandDates("2026-11-29", "2026-12-02")).toEqual(["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
    expect(expandDates("2026-11-28", "2026-11-28")).toEqual(["2026-11-28"]);
    expect(expandDates("2026-11-29", "2026-11-28")).toEqual([]);
  });
  it("adds days", () => {
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("reads today on the Tehran clock", () => {
    // 21:00 UTC on the 28th is 00:30 on the 29th in Tehran (UTC+03:30).
    expect(todayIso("Asia/Tehran", new Date("2026-11-28T21:00:00Z"))).toBe("2026-11-29");
  });
});
