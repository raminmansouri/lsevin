import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  directoryHref,
  isCategoryProvidersPath,
  mapHref,
  setListingParams,
  slugLookup,
} from "@/lib/routes/filter-paths";

const HOTEL = "019c23b5-72a4-abd9-2d5a-3278b64712c0";
const CLINIC_TYPE = "019c84d7-13e4-46cd-f1e6-65cbeabfc407";
const slugs = {
  category: slugLookup([{ id: HOTEL, slug: "hotel" }]),
  type: slugLookup([{ id: CLINIC_TYPE, slug: "clinic" }]),
};
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Reported 2026-11-10: /fa/categories?parent=<uuid>, /fa/map?categoryId=<uuid>&view=list
// and /fa/explore?providerTypeId=<uuid> were the links the site produced.
describe("listing URLs carry slugs, never ids", () => {
  it("explore: a type is its own page, a category a readable filter", () => {
    expect(directoryHref({ providerTypeId: CLINIC_TYPE }, slugs)).toBe("/specialties/clinic");
    expect(directoryHref({ categoryId: HOTEL }, slugs)).toBe("/explore?category=hotel");
    expect(directoryHref({ categoryId: HOTEL, providerTypeId: CLINIC_TYPE }, slugs)).toBe(
      "/specialties/clinic?category=hotel"
    );
    expect(directoryHref({ categoryId: "all", providerTypeId: null }, slugs)).toBe("/explore");
  });

  it("explore keeps the other filters and drops any id parameter", () => {
    const params = new URLSearchParams("city=tehran&categoryId=" + HOTEL + "&sort=rating");
    expect(directoryHref({ providerTypeId: CLINIC_TYPE }, slugs, params)).toBe(
      "/specialties/clinic?city=tehran&sort=rating"
    );
  });

  it("map: a category alone is its provider page, which opens on the list", () => {
    expect(mapHref({ categoryId: HOTEL }, slugs, new URLSearchParams(), "list")).toBe("/categories/hotel/providers");
    expect(mapHref({ categoryId: HOTEL }, slugs, new URLSearchParams(), "map")).toBe(
      "/categories/hotel/providers?view=map"
    );
    expect(mapHref({ categoryId: HOTEL }, slugs, new URLSearchParams("lat=35.7&lng=51.4"), "list")).toBe(
      "/categories/hotel/providers?lat=35.7&lng=51.4"
    );
  });

  it("map: anything else stays /map, with slug values", () => {
    expect(mapHref({}, slugs)).toBe("/map");
    expect(mapHref({}, slugs, new URLSearchParams(), "list")).toBe("/map?view=list");
    expect(mapHref({ categoryId: HOTEL, providerTypeId: CLINIC_TYPE }, slugs, new URLSearchParams(), "list")).toBe(
      "/map?view=list&category=hotel&type=clinic"
    );
  });

  it("falls back to the id only for a record without a slug (the page redirects it)", () => {
    const params = setListingParams(new URLSearchParams(), { categoryId: "x-id" }, slugs);
    expect(params.toString()).toBe("category=x-id");
  });

  it("no generated URL contains a UUID when slugs are known", () => {
    const urls = [
      directoryHref({ categoryId: HOTEL, providerTypeId: CLINIC_TYPE }, slugs),
      mapHref({ categoryId: HOTEL }, slugs),
      mapHref({ categoryId: HOTEL, providerTypeId: CLINIC_TYPE }, slugs),
      setListingParams(new URLSearchParams(), { categoryId: HOTEL, providerTypeId: CLINIC_TYPE }, slugs).toString(),
    ];
    for (const url of urls) expect(url).not.toMatch(UUID);
  });

  it("recognises a category provider page", () => {
    expect(isCategoryProvidersPath("/fa/categories/hotel/providers")).toBe(true);
    expect(isCategoryProvidersPath("/fa/categories/hotel")).toBe(false);
    expect(isCategoryProvidersPath("/fa/map")).toBe(false);
  });
});

const resolve = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("./public-slugs", () => ({ resolvePublicEntity: (...args: unknown[]) => resolve(...args) }));

describe("resolveListingParams", () => {
  beforeEach(() => {
    resolve.mockReset();
    resolve.mockImplementation(async (kind: string, value: string) => {
      if (kind === "category" && (value === "hotel" || value === HOTEL || value === "old-hotel")) return { id: HOTEL, slug: "hotel" };
      if (kind === "specialty" && (value === "clinic" || value === CLINIC_TYPE)) return { id: CLINIC_TYPE, slug: "clinic" };
      return null;
    });
  });

  it("reads slugs and is canonical when spelled by slug", async () => {
    const { resolveListingParams } = await import("./listing-params");
    const result = await resolveListingParams({ category: "hotel", type: "clinic", city: "tehran" });
    expect(result).toMatchObject({ categoryId: HOTEL, providerTypeId: CLINIC_TYPE, stale: false });
    expect(result.params).toEqual({ city: "tehran", categoryId: HOTEL, providerTypeId: CLINIC_TYPE });
  });

  it("marks old id parameters, ids, previous slugs and unknown values stale", async () => {
    const { resolveListingParams } = await import("./listing-params");
    expect((await resolveListingParams({ categoryId: HOTEL })).stale).toBe(true);
    expect((await resolveListingParams({ providerTypeId: CLINIC_TYPE })).stale).toBe(true);
    expect((await resolveListingParams({ category: HOTEL })).stale).toBe(true);
    expect((await resolveListingParams({ category: "old-hotel" })).stale).toBe(true);
    const unknown = await resolveListingParams({ category: "nope" });
    expect(unknown).toMatchObject({ stale: true, categoryId: null });
    expect(unknown.params).toEqual({});
  });

  it("keeps the other filters in order for the redirect", async () => {
    const { otherFilters } = await import("./listing-params");
    expect(otherFilters({ q: "spa", categoryId: HOTEL, view: "list", city: "x" }, ["view"]).toString()).toBe("q=spa&city=x");
  });
});
