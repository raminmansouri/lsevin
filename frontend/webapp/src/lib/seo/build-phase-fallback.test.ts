import fs from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

// The image build has no database. A page prerendered there is empty, and as
// ISR it would be served as fresh for its whole revalidate window after every
// deploy. Catalog pages that depend on the database therefore render per
// request and must survive an outage (at build and at runtime) without failing.
const groups = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/features/service-providers/actions/categories/get-category-browser-groups", () => ({
  getCategoryBrowserGroups: groups,
}));
vi.mock("@/features/service-providers/components/categories/category-browser-client", () => ({
  CategoryBrowserClient: () => null,
}));
vi.mock("@/features/sponsered-slider/components/sponsored-placement-slot", () => ({
  SponsoredPlacementSlot: () => null,
}));
vi.mock("@/features/tours/server/platform/settings", () => ({
  getTourSettings: async () => ({ tourismCategoryId: null }),
}));
vi.mock("@/lib/seo/metadata", () => ({ buildPublicMetadata: async () => ({}) }));

afterEach(() => {
  vi.unstubAllEnvs();
  groups.mockReset();
});

describe("categories page", () => {
  const params = Promise.resolve({ locale: "fa" });

  it("is rendered per request, never a prerendered (empty) ISR copy", async () => {
    const page = await import("@/app/[locale]/n/app/mobile/categories/page");
    expect(page.dynamic).toBe("force-dynamic");
    expect("revalidate" in page).toBe(false);
  });

  for (const phase of ["phase-production-build", "phase-production-server"]) {
    it(`renders an empty tree instead of failing during a database outage (${phase})`, async () => {
      vi.stubEnv("NEXT_PHASE", phase);
      groups.mockRejectedValue(new Error("connect ECONNREFUSED"));
      const { default: Page } = await import("@/app/[locale]/n/app/mobile/categories/page");
      await expect(Page({ params })).resolves.toBeTruthy();
    });
  }
});

describe("search page", () => {
  it("is dynamic and tolerates an outage on both rails", () => {
    // The search page pulls a wide client tree; assert the contract on its source.
    const source = fs.readFileSync("src/app/[locale]/n/app/mobile/search/page.tsx", "utf8");
    expect(source).toContain('export const dynamic = "force-dynamic"');
    expect(source).not.toMatch(/export const revalidate/);
    expect(source).toMatch(/getPopularSearchCategoriesCached\(locale, 8\)\.catch\(\(\) => \[\]\)/);
    expect(source).toMatch(/getTrendingSearchesCached\(locale, 6\)\.catch\(\(\) => \[\]\)/);
  });
});
