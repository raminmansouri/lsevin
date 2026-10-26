/**
 * Tours domain rules. Calendar results are cross-checked against ICU (the
 * independent Intl implementation shipped with Node) as the trusted reference
 * for AT-23 / AT-34 / AT-43 / AT-48, in addition to fixed known dates.
 */
import { describe, expect, it } from "vitest";

import {
  CALENDAR_IDS,
  addDaysIso,
  defaultCalendarForLocale,
  formatIsoDate,
  isIsoDate,
  isoToParts,
  localToInstant,
  monthGrid,
  normalizeCalendarId,
  parseCalendarInput,
  partsToIso,
  weekStartForLocale,
  type CalendarId,
} from "./calendar";
import { refundQuote } from "./cancellation";
import { coverage, fallbackChain, resolveField, type ContentRow } from "./content";
import { acceptablePoints, trackingState, weatherFreshness, weatherModeFor } from "./live";
import { QuoteError, fromPrice, quote, type PricedOption } from "./pricing";
import { expandRule } from "./recurrence";
import { isolate, maskContact, normalizeSearchText } from "./text";

function icuParts(iso: string, calendar: CalendarId) {
  const parts = new Intl.DateTimeFormat("en-u-nu-latn", {
    calendar, year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC",
  }).formatToParts(new Date(`${iso}T12:00:00Z`));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: n("relatedYear") || n("year"), month: n("month"), day: n("day") };
}

describe("calendar conversion (AT-23, AT-43, AT-48)", () => {
  it("matches known Jalali reference dates", () => {
    expect(partsToIso({ year: 1404, month: 1, day: 1 }, "persian")).toBe("2025-03-21"); // Nowruz 1404
    expect(partsToIso({ year: 1405, month: 1, day: 1 }, "persian")).toBe("2026-03-21"); // Nowruz 1405
    expect(partsToIso({ year: 1405, month: 8, day: 2 }, "persian")).toBe("2026-10-24"); // design: 2 Aban 1405
    expect(isoToParts("2026-10-24", "persian")).toEqual({ year: 1405, month: 8, day: 2 });
  });

  it("handles the Jalali leap day and rejects it in common years", () => {
    expect(partsToIso({ year: 1403, month: 12, day: 30 }, "persian")).toBe("2025-03-20"); // 1403 is leap
    expect(partsToIso({ year: 1404, month: 12, day: 30 }, "persian")).toBeNull(); // 1404 is not
    expect(partsToIso({ year: 1404, month: 7, day: 31 }, "persian")).toBeNull(); // Mehr has 30 days
  });

  it("handles Gregorian leap days", () => {
    expect(partsToIso({ year: 2028, month: 2, day: 29 }, "gregory")).toBe("2028-02-29");
    expect(partsToIso({ year: 2027, month: 2, day: 29 }, "gregory")).toBeNull();
    expect(isIsoDate("2027-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
  });

  it("uses Umm al-Qura for lunar Hijri, including a 29-day month boundary", () => {
    expect(partsToIso({ year: 1446, month: 9, day: 1 }, "islamic-umalqura")).toBe("2025-03-01"); // 1 Ramadan 1446
    expect(partsToIso({ year: 1446, month: 10, day: 1 }, "islamic-umalqura")).toBe("2025-03-30"); // 1 Shawwal 1446
    expect(partsToIso({ year: 1446, month: 9, day: 30 }, "islamic-umalqura")).toBeNull(); // Ramadan 1446 had 29 days
  });

  it("agrees with ICU for every day across two years in all three calendars", () => {
    for (const cal of CALENDAR_IDS) {
      for (let iso = "2025-12-01"; iso <= "2027-12-31"; iso = addDaysIso(iso, 1)) {
        const mine = isoToParts(iso, cal);
        expect(mine, `${cal} ${iso}`).toEqual(icuParts(iso, cal));
        expect(partsToIso(mine, cal), `${cal} roundtrip ${iso}`).toBe(iso);
      }
    }
  });

  it("parses typed input with Persian/Arabic digits and rejects ambiguous forms (S-067)", () => {
    expect(parseCalendarInput("۱۴۰۵/۰۸/۰۲", "persian")).toBe("2026-10-24");
    expect(parseCalendarInput("١٤٤٦-٠٩-٠١", "islamic-umalqura")).toBe("2025-03-01");
    expect(parseCalendarInput("02/08/1405", "persian")).toBeNull();
    expect(parseCalendarInput("26-10-24", "gregory")).toBeNull();
    expect(parseCalendarInput("2026-02-30", "gregory")).toBeNull();
  });

  it("maps legacy aliases and locale defaults without tying calendar to language", () => {
    expect(normalizeCalendarId("jalali")).toBe("persian");
    expect(normalizeCalendarId("hijri")).toBe("islamic-umalqura");
    expect(defaultCalendarForLocale("fa")).toBe("persian");
    expect(defaultCalendarForLocale("ar")).toBe("islamic-umalqura");
    expect(defaultCalendarForLocale("en")).toBe("gregory");
    expect(defaultCalendarForLocale("en", { en: "persian" })).toBe("persian");
  });
});

describe("month grid (AT-22, AT-34)", () => {
  it("emits canonical ISO cells; the same date appears in all calendars' grids", () => {
    const target = "2026-10-24";
    for (const cal of CALENDAR_IDS) {
      const { year, month } = isoToParts(target, cal);
      const cells = monthGrid(year, month, cal, 6).flat();
      const hit = cells.find((c) => c.iso === target && c.inMonth);
      expect(hit, cal).toBeTruthy();
      expect(hit!.day).toBe(isoToParts(target, cal).day);
    }
  });

  it("respects week start and month lengths", () => {
    const esfand1404 = monthGrid(1404, 12, "persian", 6).flat().filter((c) => c.inMonth);
    expect(esfand1404).toHaveLength(29);
    const esfand1403 = monthGrid(1403, 12, "persian", 6).flat().filter((c) => c.inMonth);
    expect(esfand1403).toHaveLength(30);
    const weeks = monthGrid(2026, 10, "gregory", 1);
    expect(weeks[0][0].weekday).toBe(1);
    expect(monthGrid(2026, 10, "gregory", 6)[0][0].weekday).toBe(6);
    expect(weekStartForLocale("fa")).toBe(6);
    expect(weekStartForLocale("de")).toBe(1);
  });

  it("year-end grids cross into the next year without gaps", () => {
    const cells = monthGrid(2026, 12, "gregory", 1).flat();
    const isos = cells.map((c) => c.iso);
    for (let i = 1; i < isos.length; i += 1) expect(isos[i]).toBe(addDaysIso(isos[i - 1], 1));
    expect(isos[isos.length - 1] >= "2026-12-31").toBe(true);
  });
});

describe("date vs instant separation (AT-41, S-066)", () => {
  it("converts tour-local time to one instant regardless of display calendar", () => {
    const instant = localToInstant("2026-10-24", "09:00", "Asia/Tehran");
    expect(instant.toISOString()).toBe("2026-10-24T05:30:00.000Z");
    const shown = CALENDAR_IDS.map((cal) => new Intl.DateTimeFormat("en", { calendar: cal, timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant));
    expect(new Set(shown).size).toBe(1);
  });

  it("rejects nonexistent and ambiguous local times around DST changes", () => {
    expect(() => localToInstant("2026-03-29", "02:30", "Europe/Berlin")).toThrow(/nonexistent_or_ambiguous/);
    expect(() => localToInstant("2026-10-25", "02:30", "Europe/Berlin")).toThrow(/nonexistent_or_ambiguous/);
    expect(localToInstant("2026-10-25", "04:00", "Europe/Berlin").toISOString()).toBe("2026-10-25T03:00:00.000Z");
    expect(() => localToInstant("2026-10-25", "25:00", "Europe/Berlin")).toThrow(/invalid_time/);
    expect(() => localToInstant("2026-10-25", "10:00", "Mars/Base")).toThrow(/invalid_timezone/);
  });

  it("labels the calendar when formatting", () => {
    expect(formatIsoDate("2026-10-24", { locale: "fa", calendar: "persian" })).toContain("۱۴۰۵");
    expect(formatIsoDate("2026-10-24", { locale: "en", calendar: "gregory" })).toContain("2026");
  });
});

describe("recurrence anchored to its own calendar (AT-42)", () => {
  const window = { from: "2026-09-01", to: "2027-04-30" };

  it("Jalali 'day 15 monthly' differs from Gregorian 'day 15 monthly'", () => {
    const jalali = expandRule({ kind: "monthly_day", calendar: "persian", startDate: "2026-09-01", monthDay: 15 }, window);
    const greg = expandRule({ kind: "monthly_day", calendar: "gregory", startDate: "2026-09-01", monthDay: 15 }, window);
    expect(greg.slice(0, 3)).toEqual(["2026-09-15", "2026-10-15", "2026-11-15"]);
    expect(jalali.every((iso) => isoToParts(iso, "persian").day === 15)).toBe(true);
    expect(jalali).not.toEqual(greg);
    expect(greg).toContain("2027-01-15"); // crosses Gregorian year boundary
    expect(jalali.some((iso) => isoToParts(iso, "persian").year === 1406)).toBe(true); // crosses Nowruz
  });

  it("skips days a month does not have instead of shifting them", () => {
    const d31 = expandRule({ kind: "monthly_day", calendar: "persian", startDate: "2026-03-21", monthDay: 30 }, { from: "2026-03-21", to: "2027-03-20" });
    // Esfand 1405 has 29 days → no occurrence in month 12.
    expect(d31.some((iso) => isoToParts(iso, "persian").month === 12)).toBe(false);
    expect(d31).toHaveLength(11);
  });

  it("weekly rules use ISO weekdays and honour blackouts", () => {
    const dates = expandRule({ kind: "weekly", calendar: "gregory", startDate: "2026-10-01", endDate: "2026-10-31", weekdays: [5] }, { from: "2026-10-01", to: "2026-12-31" }, [{ from: "2026-10-16", to: "2026-10-16" }]);
    expect(dates).toEqual(["2026-10-02", "2026-10-09", "2026-10-23", "2026-10-30"]);
  });
});

describe("pricing (AT-11, AT-32, AT-35)", () => {
  const publicOption: PricedOption = {
    id: "opt", kind: "public", minGroup: 1, maxGroup: 10, privateGroupPrice: null,
    tiers: [{ travelerClass: "adult", amount: 12_000_000 }, { travelerClass: "child", amount: 6_000_000 }],
  };

  it("quotes tiers × counts, add-ons, discount and fee deterministically", () => {
    const q = quote({
      currency: "IRR", currencyDecimals: 0, option: publicOption, departureDate: "2026-10-24",
      travelers: { adult: 2, child: 1 },
      availableAddons: [{ id: "a1", code: "lunch", pricing: "per_person", amount: 500_000, maxQty: 1 }],
      addons: [{ id: "a1", quantity: 1 }],
      serviceFeePercent: 5,
      discount: { kind: "percent", value: 10, code: "AUTUMN" },
    });
    expect(q.seats).toBe(3);
    expect(q.subtotal).toBe(30_000_000 + 1_500_000);
    expect(q.discount).toBe(3_150_000);
    expect(q.fees).toBe(1_417_500);
    expect(q.total).toBe(31_500_000 - 3_150_000 + 1_417_500);
  });

  it("private group price is per group, not per person", () => {
    const q = quote({ currency: "USD", currencyDecimals: 2, option: { ...publicOption, id: "p", kind: "private", privateGroupPrice: 450, tiers: [] }, departureDate: "2026-10-24", travelers: { adult: 4 } });
    expect(q.total).toBe(450);
  });

  it("applies a date price rule only inside its range; option rule beats tour rule", () => {
    const rules = [
      { optionId: null, dateFrom: "2026-10-20", dateTo: "2026-10-30", kind: "percent" as const, value: 20 },
      { optionId: "opt", dateFrom: "2026-10-24", dateTo: "2026-10-24", kind: "percent" as const, value: -50 },
    ];
    const base = { currency: "IRR", currencyDecimals: 0, option: publicOption, travelers: { adult: 1 } };
    expect(quote({ ...base, departureDate: "2026-10-19", priceRules: rules }).total).toBe(12_000_000);
    expect(quote({ ...base, departureDate: "2026-10-21", priceRules: rules }).total).toBe(14_400_000);
    expect(quote({ ...base, departureDate: "2026-10-24", priceRules: rules }).total).toBe(6_000_000);
  });

  it("rejects unpriced classes, empty parties and group limits", () => {
    const base = { currency: "IRR", currencyDecimals: 0, option: publicOption, departureDate: "2026-10-24" };
    expect(() => quote({ ...base, travelers: {} })).toThrow(QuoteError);
    expect(() => quote({ ...base, travelers: { infant: 1 } })).toThrow(/unpriced_traveler_class/);
    expect(() => quote({ ...base, travelers: { adult: 11 } })).toThrow(/group_size/);
    expect(() => quote({ ...base, travelers: { adult: -1 } })).toThrow(/invalid_count/);
  });

  it("from-price prefers per-person tiers", () => {
    expect(fromPrice([publicOption])).toEqual({ amount: 12_000_000, basis: "per_person" });
  });
});

describe("cancellation refunds (AT-12)", () => {
  const rules = [{ hoursBefore: 72, refundPercent: 100 }, { hoursBefore: 24, refundPercent: 50 }];
  const departureAt = new Date("2026-10-24T05:30:00Z");
  it("inside / outside the refund windows", () => {
    expect(refundQuote({ rules, departureAt, now: new Date("2026-10-20T00:00:00Z"), paidAmount: 1000, currencyDecimals: 0 }).refundAmount).toBe(1000);
    expect(refundQuote({ rules, departureAt, now: new Date("2026-10-22T12:00:00Z"), paidAmount: 1000, currencyDecimals: 0 }).refundAmount).toBe(500);
    const late = refundQuote({ rules, departureAt, now: new Date("2026-10-24T00:00:00Z"), paidAmount: 1000, currencyDecimals: 0 });
    expect(late.refundAmount).toBe(0);
    expect(late.feeAmount).toBe(1000);
    expect(refundQuote({ rules, departureAt, now: new Date("2026-10-24T00:00:00Z"), paidAmount: 1000, currencyDecimals: 0, operatorCancelled: true }).refundAmount).toBe(1000);
  });
});

describe("content fallback (AT-33, AT-39)", () => {
  const rows: ContentRow[] = [
    { fieldKey: "title", locale: "fa-IR", publishedValue: "تور تخت جمشید" },
    { fieldKey: "title", locale: "en-US", publishedValue: "Persepolis tour", draftValue: "Persepolis day tour" },
    { fieldKey: "summary", locale: "fa-IR", publishedValue: "خلاصه" },
    { fieldKey: "description", locale: "en-US", publishedValue: null, draftValue: "Draft only" },
  ];

  it("returns requested locale when present", () => {
    expect(resolveField(rows, "title", "en-US", "fa-IR")).toEqual({ value: "Persepolis tour", locale: "en-US", isFallback: false });
  });
  it("falls back to source with an explicit flag, never blank", () => {
    expect(resolveField(rows, "summary", "de-DE", "fa-IR")).toEqual({ value: "خلاصه", locale: "fa-IR", isFallback: true });
  });
  it("never leaks drafts to customers, but previews show them", () => {
    expect(resolveField(rows, "description", "en-US", "fa-IR")).toBeNull();
    expect(resolveField(rows, "description", "en-US", "fa-IR", { mode: "preview" })?.value).toBe("Draft only");
    expect(resolveField(rows, "title", "en-US", "fa-IR", { mode: "preview" })?.value).toBe("Persepolis day tour");
  });
  it("orders the chain: requested, same language, platform order, source", () => {
    expect(fallbackChain("fa-AF", "tr-TR", ["en-US"])).toEqual(["fa-AF", "*fa", "en-US", "tr-TR"]);
  });
  it("reports coverage per locale", () => {
    const c = coverage(rows, ["fa-IR", "en-US"], ["title", "summary"]);
    expect(c[0]).toMatchObject({ locale: "fa-IR", present: 2, missing: [] });
    expect(c[1]).toMatchObject({ locale: "en-US", present: 1, missing: ["summary"] });
  });
});

describe("search normalization and bidi (C-023, AT-44)", () => {
  it("folds Arabic/Persian variants and digits", () => {
    expect(normalizeSearchText("كيش")).toBe(normalizeSearchText("کیش"));
    expect(normalizeSearchText("تور ۳ روزه")).toBe("تور 3 روزه");
    expect(normalizeSearchText("إصفهان")).toBe(normalizeSearchText("اصفهان"));
    expect(normalizeSearchText("  Persepolis   TOUR ")).toBe("persepolis tour");
  });
  it("isolates mixed-direction runs and masks contacts", () => {
    expect(isolate("TR-8F3K2")).toBe("⁨TR-8F3K2⁩");
    expect(maskContact("+989121234567")).toMatch(/4567$/);
    expect(maskContact("ali@example.com")).toBe("a***@example.com");
  });
});

describe("live tracking and weather (AT-05, AT-19, AT-20)", () => {
  const now = new Date("2026-10-24T08:00:00Z");
  it("classifies tracking freshness without asserting 'live' on stale data", () => {
    expect(trackingState({ sessionStartedAt: null, sessionEndedAt: null, lastPointAt: null, now, staleSeconds: 120 }).kind).toBe("not_started");
    expect(trackingState({ sessionStartedAt: "2026-10-24T07:00:00Z", sessionEndedAt: null, lastPointAt: null, now, staleSeconds: 120 }).kind).toBe("no_signal");
    expect(trackingState({ sessionStartedAt: "2026-10-24T07:00:00Z", sessionEndedAt: null, lastPointAt: "2026-10-24T07:59:30Z", now, staleSeconds: 120 }).kind).toBe("live");
    expect(trackingState({ sessionStartedAt: "2026-10-24T07:00:00Z", sessionEndedAt: null, lastPointAt: "2026-10-24T07:50:00Z", now, staleSeconds: 120 }).kind).toBe("stale");
    expect(trackingState({ sessionStartedAt: "2026-10-24T07:00:00Z", sessionEndedAt: "2026-10-24T07:55:00Z", lastPointAt: "2026-10-24T07:54:00Z", now, staleSeconds: 120 }).kind).toBe("ended");
  });
  it("drops replayed, out-of-order and future points after reconnect", () => {
    const accepted = acceptablePoints(
      [
        { seq: 3, recordedAt: "2026-10-24T07:40:00Z", latitude: 35.7, longitude: 51.4 }, // replay
        { seq: 6, recordedAt: "2026-10-24T07:58:00Z", latitude: 35.7, longitude: 51.4 },
        { seq: 7, recordedAt: "2026-10-24T07:57:00Z", latitude: 35.7, longitude: 51.4 }, // older time
        { seq: 8, recordedAt: "2026-10-24T09:00:00Z", latitude: 35.7, longitude: 51.4 }, // future
        { seq: 9, recordedAt: "2026-10-24T07:59:00Z", latitude: 135, longitude: 51.4 }, // invalid
      ],
      { seq: 5, recordedAt: "2026-10-24T07:45:00Z" },
      now,
    );
    expect(accepted.map((p) => p.seq)).toEqual([6]);
  });
  it("never presents current weather as a far-future forecast", () => {
    expect(weatherModeFor("2026-10-24", "2026-10-24", 15).kind).toBe("current");
    expect(weatherModeFor("2026-10-30", "2026-10-24", 15)).toEqual({ kind: "forecast", daysAhead: 6 });
    expect(weatherModeFor("2026-12-30", "2026-10-24", 15).kind).toBe("climate");
    expect(weatherModeFor("2026-10-20", "2026-10-24", 15).kind).toBe("past");
    expect(weatherFreshness("2026-10-24T07:00:00Z", now, 30)).toBe("stale");
    expect(weatherFreshness("2026-10-24T07:45:00Z", now, 30)).toBe("fresh");
  });
});
