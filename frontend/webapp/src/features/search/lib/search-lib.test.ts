import { describe, expect, it } from "vitest";

import { fold as foldIndex } from "../../../../scripts/search/lib.mjs";
import { fold } from "./fold";
import { reciprocalRankFusion } from "./fusion";
import { distanceKm, proximityBoost } from "./geo";
import { parseQuery } from "./parse-query";
import type { Place, SearchContext } from "../types";

const place = (kind: Place["kind"], name: string, citySlug: string, aliases: string[] = []): Place => ({
  kind, name: fold(name), aliases, citySlug, lat: 35.79, lng: 51.44, radiusM: 2000,
});

const context: SearchContext = {
  places: [
    place("city", "تهران", "tehran", ["tehran"]),
    place("city", "قم", "qom"),
    place("city", "اصفهان", "isfahan", ["isfahan", "esfahan"]),
    place("neighborhood", "قیطریه", "tehran", ["gheytarieh", "qeytarieh"]),
    place("neighborhood", "شهرک غرب", "tehran", ["shahrak gharb"]),
  ],
  synonyms: new Map([
    ["هیر ترانسپلنت", "کاشت مو"],
    ["hair transplant", "کاشت مو"],
    ["fue", "کاشت مو"],
    ["عمل بینی", "جراحی بینی"],
  ]),
};

describe("fold", () => {
  const samples = [
    "کاشت مو قیطریه تهران", "كاشت موي سر", "هیر‌ترانسپلنت", "۱۲۳ قیمت", "Hair-Transplant, ISTANBUL!", "  چند   فاصله ",
    "سَلام", "کشیــــده", "«نقل قول»", "a_b/c+d", "٤٥٦",
  ];
  it("is identical in the indexer and the query side", () => {
    for (const sample of samples) expect(fold(sample)).toBe(foldIndex(sample));
  });
  it("unifies Arabic and Persian letters, digits and ZWNJ", () => {
    expect(fold("كاشت موي سر")).toBe(fold("کاشت موی سر"));
    expect(fold("۱۲۳")).toBe("123");
    expect(fold("هیر‌ترانسپلنت")).toBe("هیر ترانسپلنت");
    expect(fold("کشیــده")).toBe(fold("کشیده"));
  });
});

describe("parseQuery", () => {
  it("splits service, neighborhood and city", () => {
    const parsed = parseQuery("کاشت مو قیطریه تهران", context);
    expect(parsed.serviceTokens).toEqual(["کاشت", "مو"]);
    expect(parsed.neighborhood?.name).toBe("قیطریه");
    expect(parsed.city?.name).toBe("تهران");
    expect(parsed.citySlug).toBe("tehran");
  });
  it("derives the city from the neighborhood when the city is not typed", () => {
    const parsed = parseQuery("کاشت مو قیطریه", context);
    expect(parsed.neighborhood?.name).toBe("قیطریه");
    expect(parsed.citySlug).toBe("tehran");
    expect(parsed.city?.name).toBe("تهران");
  });
  it("accepts Latin spellings and Arabic letters", () => {
    expect(parseQuery("hair transplant gheytarieh tehran", context).neighborhood?.name).toBe("قیطریه");
    expect(parseQuery("كاشت مو قيطريه", context).neighborhood?.name).toBe("قیطریه");
  });
  it("matches multi-word places before single words", () => {
    const parsed = parseQuery("دندانپزشکی شهرک غرب", context);
    expect(parsed.neighborhood?.name).toBe("شهرک غرب");
    expect(parsed.serviceTokens).toEqual(["دندانپزشکی"]);
  });
  it("resolves synonyms and keeps what was typed", () => {
    const parsed = parseQuery("هیر ترانسپلنت تهران", context);
    expect(parsed.serviceTokens).toEqual(["کاشت", "مو"]);
    expect(parsed.typedTokens).toEqual(["هیر", "ترانسپلنت"]);
    expect(parseQuery("FUE", context).serviceTokens).toEqual(["کاشت", "مو"]);
  });
  it("drops stop words but never leaves the query empty of meaning", () => {
    expect(parseQuery("بهترین کلینیک کاشت مو", context).serviceTokens).toEqual(["کاشت", "مو"]);
    expect(parseQuery("قیطریه", context).serviceTokens).toEqual([]);
  });
  it("treats a plain query without places as service words only", () => {
    const parsed = parseQuery("لیزر موهای زائد", context);
    expect(parsed.neighborhood).toBeNull();
    expect(parsed.citySlug).toBeNull();
    expect(parsed.serviceTokens).toEqual(["لیزر", "موهای", "زائد"]);
  });
  it("is safe on hostile or huge input", () => {
    expect(() => parseQuery("a ".repeat(5000), context)).not.toThrow();
    expect(parseQuery("a ".repeat(5000), context).serviceTokens.length).toBeLessThanOrEqual(12);
    expect(parseQuery("'; drop table unified_search.documents; --", context).serviceTokens.join(" ")).not.toContain(";");
    expect(parseQuery("", context).serviceTokens).toEqual([]);
  });
});

describe("reciprocalRankFusion", () => {
  it("rewards agreement between lists", () => {
    const fused = reciprocalRankFusion([
      { name: "keyword", weight: 1, ids: ["a", "b", "c"] },
      { name: "meaning", weight: 1, ids: ["b", "a", "d"] },
    ]);
    const order = [...fused.entries()].sort((x, y) => y[1].score - x[1].score).map(([id]) => id);
    expect(order.slice(0, 2).sort()).toEqual(["a", "b"]);
    expect(order.indexOf("c")).toBeLessThan(order.indexOf("d") + 1);
    expect(fused.get("a")?.lists.size).toBe(2);
    expect(fused.get("c")?.lists.has("meaning")).toBe(false);
  });
  it("respects weights", () => {
    const fused = reciprocalRankFusion([
      { name: "keyword", weight: 1, ids: ["a"] },
      { name: "place", weight: 0.1, ids: ["b"] },
    ]);
    expect(fused.get("a")!.score).toBeGreaterThan(fused.get("b")!.score);
  });
});

describe("geo", () => {
  it("measures Tehran landmarks plausibly", () => {
    const gheytarieh = { lat: 35.795, lng: 51.443 };
    const elahieh = { lat: 35.793, lng: 51.422 };
    expect(distanceKm(gheytarieh, elahieh)).toBeGreaterThan(1.5);
    expect(distanceKm(gheytarieh, elahieh)).toBeLessThan(2.5);
    expect(distanceKm(gheytarieh, gheytarieh)).toBe(0);
  });
  it("proximity falls with distance", () => {
    expect(proximityBoost(0)).toBe(1);
    expect(proximityBoost(3)).toBeCloseTo(0.5);
    expect(proximityBoost(30)).toBeLessThan(0.1);
  });
});
