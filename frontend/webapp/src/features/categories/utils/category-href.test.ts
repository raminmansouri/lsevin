import { describe, expect, it } from "vitest";

import { categoryCardHref, STAYS_HOME_PATH, subAppPathFor, TOURS_HOME_PATH } from "./category-href";

// Regression 2026-11-17: there was no way from the Lsevin home page to the stays app —
// the "Accommodation" card opened a plain provider list.
describe("category cards open their sub-application", () => {
  const parents: Record<string, string | null> = { hotel: "accommodation", accommodation: null, tour: "tourism", tourism: null, clinic: null };
  const apps = { tourismCategoryId: "tourism", staysCategoryId: "accommodation", parentOf: (id: string) => parents[id] };

  it("accommodation and its subcategories open /stays; tourism opens /tours", () => {
    expect(subAppPathFor("accommodation", apps)).toBe(STAYS_HOME_PATH);
    expect(subAppPathFor("hotel", apps)).toBe(STAYS_HOME_PATH);
    expect(subAppPathFor("tour", apps)).toBe(TOURS_HOME_PATH);
    expect(subAppPathFor("clinic", apps)).toBeNull();
    expect(categoryCardHref({ id: "accommodation", slug: "accommodation", childCount: 3 }, apps)).toBe("/stays");
  });

  it("without the setting, categories keep their normal destination", () => {
    expect(subAppPathFor("accommodation", { tourismCategoryId: "tourism" })).toBeNull();
    expect(categoryCardHref({ id: "clinic", slug: "clinic", childCount: 0 }, apps)).not.toBe("/stays");
  });
});
