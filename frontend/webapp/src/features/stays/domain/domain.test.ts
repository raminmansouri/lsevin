import { describe, expect, it } from "vitest";

import { checkInInstant, freeCancellationUntil, stayRefundQuote } from "./cancellation";
import { nightsBetween, rangesOverlap, stayNights, todayIn, validateStayDates } from "./dates";
import { allocateRooms, occupancyFits, quoteStay, StayQuoteError, type QuoteInput } from "./pricing";
import { activeFilterCount, parseStaySearch, toSearchParams } from "./search";

describe("stay dates (half-open ranges)", () => {
  it("counts nights between dates, across month and year ends", () => {
    expect(nightsBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(nightsBetween("2027-02-27", "2027-03-01")).toBe(2);
  });

  it("sells arrival night through the night before departure", () => {
    expect(stayNights("2026-11-20", "2026-11-23")).toEqual(["2026-11-20", "2026-11-21", "2026-11-22"]);
  });

  it("back-to-back stays do not overlap; shared nights do", () => {
    expect(rangesOverlap({ checkIn: "2026-11-20", checkOut: "2026-11-22" }, { checkIn: "2026-11-22", checkOut: "2026-11-24" })).toBe(false);
    expect(rangesOverlap({ checkIn: "2026-11-20", checkOut: "2026-11-23" }, { checkIn: "2026-11-22", checkOut: "2026-11-24" })).toBe(true);
  });

  it("validates field-specific errors", () => {
    const opts = { today: "2026-11-14", maxNights: 30, windowDays: 365 };
    expect(validateStayDates(null, "2026-11-20", opts)).toBe("check_in_required");
    expect(validateStayDates("2026-11-20", "", opts)).toBe("check_out_required");
    expect(validateStayDates("2026-11-20", "2026-11-20", opts)).toBe("check_out_before_check_in");
    expect(validateStayDates("2026-11-13", "2026-11-15", opts)).toBe("check_in_in_past");
    expect(validateStayDates("2027-12-01", "2027-12-02", opts)).toBe("too_far_ahead");
    expect(validateStayDates("2026-11-20", "2026-12-25", opts)).toBe("too_many_nights");
    expect(validateStayDates("2026-11-14", "2026-11-15", opts)).toBeNull();
  });

  it("today is computed in Asia/Tehran, not UTC", () => {
    // 2026-11-14 21:00 UTC is already 2026-11-15 00:30 in Tehran.
    expect(todayIn("Asia/Tehran", new Date("2026-11-14T21:00:00Z"))).toBe("2026-11-15");
    expect(todayIn("UTC", new Date("2026-11-14T21:00:00Z"))).toBe("2026-11-14");
  });
});

const CAP = { baseOccupancy: 2, maxAdults: 3, maxChildren: 2, maxOccupancy: 4, units: 5 };
const RATE = { id: "r", basePrice: 3_000_000, extraAdultPrice: 1_000_000, childPrice: 500_000, minNights: 1, maxNights: 30, longStayNights: null, longStayPercent: null };
const base = (over: Partial<QuoteInput> = {}): QuoteInput => ({
  currency: "IRR",
  currencyDecimals: 0,
  checkIn: "2026-11-20",
  checkOut: "2026-11-22",
  occupancy: { rooms: 1, adults: 2, childAges: [] },
  capacity: CAP,
  rate: RATE,
  childFreeUnderAge: 5,
  taxPercent: 0,
  serviceFeePercent: 0,
  ...over,
});

describe("room allocation", () => {
  it("spreads adults round-robin and children into the emptiest room", () => {
    expect(allocateRooms({ rooms: 2, adults: 3, childAges: [8, 3] })).toEqual([
      { adults: 2, childAges: [3] },
      { adults: 1, childAges: [8] },
    ]);
  });

  it("infants do not take a place", () => {
    expect(occupancyFits({ rooms: 1, adults: 2, childAges: [0, 1, 4, 9] }, { ...CAP, maxChildren: 2 })).toBe(true);
    expect(occupancyFits({ rooms: 1, adults: 3, childAges: [4, 9] }, CAP)).toBe(false);
  });

  it("cannot sell more rooms than the room type has", () => {
    expect(occupancyFits({ rooms: 2, adults: 2, childAges: [] }, { ...CAP, units: 1 })).toBe(false);
  });
});

describe("stay quote", () => {
  it("prices every night for every room", () => {
    const q = quoteStay(base({ occupancy: { rooms: 2, adults: 4, childAges: [] } }));
    expect(q.nights).toBe(2);
    expect(q.roomsSubtotal).toBe(12_000_000);
    expect(q.total).toBe(12_000_000);
    expect(q.perNight).toBe(6_000_000);
  });

  it("uses dated overrides night by night", () => {
    const q = quoteStay(base({ overrides: { "2026-11-21": 4_500_000 } }));
    expect(q.nightly).toEqual([
      { date: "2026-11-20", amount: 3_000_000 },
      { date: "2026-11-21", amount: 4_500_000 },
    ]);
    expect(q.total).toBe(7_500_000);
  });

  it("charges extra adults and paying children beyond base occupancy; young children are free", () => {
    // 3 adults (1 extra) + child 9 (paying) + child 3 (free) in one room, 2 nights.
    const q = quoteStay(base({ occupancy: { rooms: 1, adults: 3, childAges: [9, 3] }, capacity: { ...CAP, maxOccupancy: 5 } }));
    expect(q.lines.find((l) => l.kind === "extra_adult")?.amount).toBe(2_000_000);
    expect(q.lines.find((l) => l.kind === "child")?.amount).toBe(1_000_000);
    expect(q.total).toBe(6_000_000 + 2_000_000 + 1_000_000);
  });

  it("a paying child fills an empty base place without charge", () => {
    const q = quoteStay(base({ occupancy: { rooms: 1, adults: 1, childAges: [10] } }));
    expect(q.lines.some((l) => l.kind === "child")).toBe(false);
    expect(q.total).toBe(6_000_000);
  });

  it("applies the long-stay discount, then tax and service fee on the discounted amount, in minor units", () => {
    const q = quoteStay(
      base({
        checkOut: "2026-11-27",
        rate: { ...RATE, basePrice: 1_234_567, longStayNights: 7, longStayPercent: 10 },
        taxPercent: 9,
        serviceFeePercent: 2.5,
      }),
    );
    const rooms = 1_234_567 * 7; // 8_641_969
    const discount = Math.round(rooms * 0.1); // 864_197
    const after = rooms - discount;
    expect(q.discount).toBe(discount);
    expect(q.tax).toBe(Math.round(after * 0.09));
    expect(q.fees).toBe(Math.round(after * 0.025));
    expect(q.total).toBe(after + q.tax + q.fees);
    expect(Number.isInteger(q.total)).toBe(true);
  });

  it("rounds decimal currencies exactly (no float drift)", () => {
    const q = quoteStay(base({ currency: "USD", currencyDecimals: 2, rate: { ...RATE, basePrice: 0.1 }, checkOut: "2026-11-23", taxPercent: 0 }));
    expect(q.total).toBe(0.3);
  });

  it.each([
    [{ occupancy: { rooms: 2, adults: 1, childAges: [] } }, "adult_per_room_required"],
    [{ occupancy: { rooms: 1, adults: 4, childAges: [] } }, "too_many_adults"],
    [{ occupancy: { rooms: 1, adults: 2, childAges: [6, 7, 8] } }, "too_many_children"],
    [{ occupancy: { rooms: 1, adults: 3, childAges: [6, 7] } }, "over_capacity"],
    [{ occupancy: { rooms: 6, adults: 6, childAges: [] } }, "too_many_rooms"],
    [{ occupancy: { rooms: 1, adults: 0, childAges: [] } }, "invalid_occupancy"],
    [{ occupancy: { rooms: 1, adults: 2, childAges: [18] } }, "invalid_occupancy"],
    [{ rate: { ...RATE, minNights: 3 } }, "min_nights"],
    [{ rate: { ...RATE, maxNights: 1 } }, "max_nights"],
    [{ checkOut: "2026-11-20" }, "invalid_dates"],
  ] as [Partial<QuoteInput>, string][])("rejects %j with %s", (over, code) => {
    expect(() => quoteStay(base(over))).toThrowError(new StayQuoteError(code as never));
  });
});

describe("stay cancellation", () => {
  const rules = [
    { hoursBefore: 72, refundPercent: 100 },
    { hoursBefore: 24, refundPercent: 50 },
  ];
  const at = (iso: string) => new Date(iso);

  it("check-in instant is the local check-in time in the property zone", () => {
    expect(checkInInstant("2026-11-20", "14:00:00", "Asia/Tehran").toISOString()).toBe("2026-11-20T10:30:00.000Z");
  });

  it("refunds by the rule in force at cancellation time", () => {
    const q = (now: string) =>
      stayRefundQuote({ rules, refundable: true, checkIn: "2026-11-20", checkInTime: "14:00", timeZone: "Asia/Tehran", now: at(now), paidAmount: 10_000_000, currencyDecimals: 0 });
    expect(q("2026-11-16T10:00:00Z").refundAmount).toBe(10_000_000);
    expect(q("2026-11-18T10:00:00Z").refundAmount).toBe(5_000_000);
    expect(q("2026-11-20T00:00:00Z").refundAmount).toBe(0);
    // After the cutoff passes, cancelling never silently becomes a free refund.
    expect(q("2026-11-21T00:00:00Z")).toMatchObject({ refundAmount: 0, reason: "after_departure" });
  });

  it("non-refundable rates refund nothing unless the operator cancelled", () => {
    const common = { rules, refundable: false, checkIn: "2026-11-20", checkInTime: "14:00", timeZone: "Asia/Tehran", now: at("2026-11-01T00:00:00Z"), paidAmount: 8_000_000, currencyDecimals: 0 };
    expect(stayRefundQuote(common).refundAmount).toBe(0);
    expect(stayRefundQuote({ ...common, operatorCancelled: true }).refundAmount).toBe(8_000_000);
  });

  it("free cancellation deadline comes from the latest 100% rule", () => {
    const checkIn = checkInInstant("2026-11-20", "14:00", "Asia/Tehran");
    expect(freeCancellationUntil(rules, true, checkIn)?.toISOString()).toBe("2026-11-17T10:30:00.000Z");
    expect(freeCancellationUntil(rules, false, checkIn)).toBeNull();
    expect(freeCancellationUntil([{ hoursBefore: 24, refundPercent: 50 }], true, checkIn)).toBeNull();
  });
});

describe("search params", () => {
  it("round-trips to one canonical URL", () => {
    const s = parseStaySearch(new URLSearchParams("stars=5,4&city=shiraz&in=2026-11-20&out=2026-11-22&adults=3&ages=4,9&type=villa,hotel&amen=wifi,pool&sort=price_asc&free=1"));
    expect(toSearchParams(s).toString()).toBe(
      "city=shiraz&in=2026-11-20&out=2026-11-22&adults=3&ages=4%2C9&type=hotel%2Cvilla&stars=4%2C5&amen=pool%2Cwifi&free=1&sort=price_asc",
    );
    expect(activeFilterCount(s)).toBe(7);
  });

  it("drops invalid or hostile values instead of failing", () => {
    const s = parseStaySearch({ city: "../etc", in: "2026-11-22", out: "2026-11-20", adults: "0", rooms: "99", ages: "3,40,x", type: "castle", stars: "9", amen: "WIFI;drop", sort: "evil", page: "-1" });
    expect(s).toMatchObject({ city: null, checkIn: null, checkOut: null, adults: 2, rooms: 1, childAges: [3], kinds: [], stars: [], amenities: [], sort: "recommended", page: 1 });
  });
});
