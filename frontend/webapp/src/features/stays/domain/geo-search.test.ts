import { describe, expect, it } from "vitest";

import { DEFAULT_RADIUS_M, distanceM, driveMinutes, formatNear, parseNear, parseRadius, preferWalking, walkMinutes } from "./geo";
import { parentPathOf } from "./navigation";
import { activeFilterCount, DEFAULT_SEARCH, parseStaySearch, toSearchParams, withoutFilters } from "./search";

describe("location anchors (near=…)", () => {
  it("parses landmarks, points and Lsevin providers", () => {
    expect(parseNear("lm:mashhad/haram")).toEqual({ type: "lm", city: "mashhad", slug: "haram" });
    expect(parseNear("pt:36.28803,59.61575")).toEqual({ type: "pt", lat: 36.28803, lng: 59.61575 });
    // Lsevin ids are not RFC-4122 (version nibble 0, odd variants): must still be accepted.
    expect(parseNear("sp:019c2371-d3fb-285f-cd11-f94cd64a5c75")).toEqual({ type: "sp", id: "019c2371-d3fb-285f-cd11-f94cd64a5c75" });
  });

  it("rejects malformed or out-of-range anchors instead of guessing", () => {
    for (const bad of ["", "lm:mashhad", "lm:Mashhad/haram", "lm:../x", "pt:91,10", "pt:10,181", "pt:abc,1", "pt:1", "pt:,", "sp:not-a-uuid", "xx:1"]) {
      expect(parseNear(bad)).toBeNull();
    }
  });

  it("rounds points to ~1 m so equal searches share one URL", () => {
    const n = parseNear("pt:36.2880312345,59.6157498765");
    expect(n).toEqual({ type: "pt", lat: 36.28803, lng: 59.61575 });
    expect(formatNear(n!)).toBe("pt:36.28803,59.61575");
  });

  it("accepts only the offered radii", () => {
    expect(parseRadius("1000")).toBe(1000);
    expect(parseRadius("1500")).toBeNull();
    expect(parseRadius("-1")).toBeNull();
  });
});

describe("distances and travel-time estimates", () => {
  it("matches known straight-line distances", () => {
    // Imam Reza shrine → Mashhad airport ≈ 6.3 km (OpenStreetMap coordinates).
    expect(Math.round(distanceM(36.28803, 59.61575, 36.23409, 59.64187) / 100) / 10).toBeCloseTo(6.4, 0);
    expect(distanceM(36.28803, 59.61575, 36.28803, 59.61575)).toBe(0);
  });

  it("estimates walking and driving conservatively", () => {
    expect(walkMinutes(600)).toBe(10); // 600 m × 1.3 / 80 m·min⁻¹
    expect(walkMinutes(10)).toBe(1); // never "0 minutes"
    expect(driveMinutes(6000)).toBe(22);
    expect(preferWalking(1500)).toBe(true);
    expect(preferWalking(2000)).toBe(false);
  });
});

describe("search URL with place, radius and breakfast", () => {
  it("round-trips a location search canonically", () => {
    const s = parseStaySearch(new URLSearchParams("city=mashhad&near=lm:mashhad/haram&r=1000&bf=1&sort=distance"));
    expect(s.near).toEqual({ type: "lm", city: "mashhad", slug: "haram" });
    expect(s.radius).toBe(1000);
    expect(s.breakfast).toBe(true);
    expect(s.sort).toBe("distance");
    expect(toSearchParams(s).toString()).toBe("city=mashhad&bf=1&near=lm%3Amashhad%2Fharam&r=1000&sort=distance");
  });

  it("defaults the radius when a place is set, and keeps 'any distance' explicit", () => {
    expect(parseStaySearch(new URLSearchParams("near=lm:qom/haram")).radius).toBe(DEFAULT_RADIUS_M);
    const any = parseStaySearch(new URLSearchParams("near=lm:qom/haram&r=any"));
    expect(any.radius).toBeNull();
    expect(toSearchParams(any).get("r")).toBe("any");
    expect(toSearchParams(parseStaySearch(new URLSearchParams("near=lm:qom/haram"))).has("r")).toBe(false);
  });

  it("ignores a radius or a distance sort without a place", () => {
    const s = parseStaySearch(new URLSearchParams("r=1000&sort=distance"));
    expect(s.near).toBeNull();
    expect(s.radius).toBeNull();
    expect(s.sort).toBe("recommended");
    expect(toSearchParams({ ...DEFAULT_SEARCH, sort: "distance" }).has("sort")).toBe(false);
  });

  it("counts breakfast as a filter; the place is not a filter", () => {
    const s = parseStaySearch(new URLSearchParams("bf=1&free=1&near=lm:mashhad/haram"));
    expect(activeFilterCount(s)).toBe(2);
    const cleared = withoutFilters(s);
    expect(activeFilterCount(cleared)).toBe(0);
    expect(cleared.near).toEqual(s.near); // removing filters keeps the place and the trip
  });
});

describe("header back arrow (regression: it used to leave stays for the Lsevin landing page)", () => {
  it("goes one level up inside stays", () => {
    expect(parentPathOf("/stays", null)).toBeNull();
    expect(parentPathOf("/stays/explore", null)).toBe("/stays");
    expect(parentPathOf("/stays/city/mashhad", null)).toBe("/stays");
    expect(parentPathOf("/stays/bookings", null)).toBe("/stays");
    expect(parentPathOf("/stays/bookings/abc", null)).toBe("/stays/bookings");
  });

  it("returns from a stay to the exact search the guest came from", () => {
    expect(parentPathOf("/stays/palace-international-hotel", "/stays/explore?city=mashhad&near=lm%3Amashhad%2Fharam")).toBe(
      "/stays/explore?city=mashhad&near=lm%3Amashhad%2Fharam",
    );
    expect(parentPathOf("/stays/palace-international-hotel", null)).toBe("/stays/explore");
    // A tampered value is never followed off-site.
    expect(parentPathOf("/stays/x", "https://evil.example/")).toBe("/stays/explore");
    expect(parentPathOf("/stays/x", "//evil.example/stays/")).toBe("/stays/explore");
  });
});
