import { afterEach, describe, expect, it, vi } from "vitest";

// The image build has no database. Pages that refuse to publish empty data at
// runtime must still let `next build` finish, or every deploy fails.
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

describe("categories page during a database outage", () => {
  const params = Promise.resolve({ locale: "fa" });

  it("rejects at runtime so ISR keeps the last good tree", async () => {
    groups.mockRejectedValue(new Error("db down"));
    const { default: Page } = await import("@/app/[locale]/n/app/mobile/categories/page");
    await expect(Page({ params })).rejects.toThrow("db down");
  });

  it("renders an empty tree during next build instead of failing the deploy", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    groups.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const { default: Page } = await import("@/app/[locale]/n/app/mobile/categories/page");
    const element = await Page({ params });
    expect(element).toBeTruthy();
  });
});

describe("search page during a database outage", () => {
  it("source keeps the build-only fallback on both rails", async () => {
    // The search page pulls a wide client tree; assert the contract on its source.
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/app/[locale]/n/app/mobile/search/page.tsx", "utf8");
    expect(source).toMatch(/getPopularSearchCategoriesCached\(locale, 8\)\.catch\(duringBuild\(\[\]\)\)/);
    expect(source).toMatch(/getTrendingSearchesCached\(locale, 6\)\.catch\(duringBuild\(\[\]\)\)/);
    expect(source).toContain('process.env.NEXT_PHASE !== "phase-production-build"');
  });
});
