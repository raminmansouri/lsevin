import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { allGuides, guideLocales } from "@/features/guides/registry";
import { routing } from "@/i18n/routing";

import { seoOrigin } from "./origin";

// `sql` is both a tagged template (queries and fragments) and an identifier
// helper. Only the catalog query (the one with UNION ALL) returns rows.
const query = vi.hoisted(() => vi.fn());
const catalogRows = vi.hoisted(() => vi.fn());
const categoryRows = vi.hoisted(() => vi.fn());
vi.mock("@/config/database/db", () => ({ default: query }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/features/tours/server/platform/settings", () => ({
  getTourSettings: async () => ({ tourismCategoryId: "tourism-root" }),
}));

const isCatalogQuery = (first: unknown) =>
  Array.isArray(first) && "raw" in first && first.join("?").includes("select '/providers/' ||");
// The category pages query (migration 0095); its CTE fragment is a separate call.
const isCategoryQuery = (first: unknown) =>
  Array.isArray(first) && "raw" in first && first.join("?").includes('as "childCount"');
const catalogSql = () =>
  (query.mock.calls.find(([first]) => isCatalogQuery(first))![0] as string[]).join("?");

// home, explore, consulting, privacy and the providers listing in every locale.
const STATIC_COUNT = 5 * routing.locales.length + 2 + 1 + 3;
const GUIDE_COUNT = allGuides().reduce((sum, guide) => sum + guideLocales(guide).length, 0);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_URL", "https://appmain.lsevin.com");
  vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com");
  query.mockReset();
  catalogRows.mockReset();
  categoryRows.mockReset();
  categoryRows.mockResolvedValue([]);
  query.mockImplementation((first: unknown) =>
    isCatalogQuery(first) ? catalogRows() : isCategoryQuery(first) ? categoryRows() : { fragment: true }
  );
});
afterEach(() => vi.unstubAllEnvs());

describe("public search domain and sitemap", () => {
  it("uses the SEO domain independently of authentication origin", () => {
    expect(seoOrigin()).toBe("https://lsevincare.com");
    expect(robots().sitemap).toBe("https://lsevincare.com/sitemap.xml");
  });
  it("maps the production app host to lsevincare.com when the build has no SEO override", () => {
    // Regression: release 99a03678 shipped without NEXT_PUBLIC_SEO_URL and kept
    // every canonical on appmain.lsevin.com.
    vi.stubEnv("NEXT_PUBLIC_SEO_URL", "");
    expect(seoOrigin()).toBe("https://lsevincare.com");
    expect(robots().sitemap).toBe("https://lsevincare.com/sitemap.xml");
  });
  it("keeps other deployments (staging, local) on their own origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SEO_URL", "");
    vi.stubEnv("NEXT_PUBLIC_URL", "https://staging.example.com");
    expect(seoOrigin()).toBe("https://staging.example.com");
  });
  it("rejects an unsafe SEO domain rather than emitting poisoned canonicals", () => {
    vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://example.com/path");
    expect(seoOrigin).toThrow();
  });

  it("lists each entity only in the locales whose text exists", async () => {
    catalogRows.mockResolvedValue([
      { path: "/providers/p", keys: ["fa-IR", "en-US", "ar-SA"], persian_only: false },
      { path: "/services/s", keys: ["fa-IR"], persian_only: false },
      { path: "/specialists/t", keys: [], persian_only: false },
      { path: "/services/s", keys: ["fa-IR"], persian_only: false },
      { path: "/products/x", keys: null, persian_only: true },
      { path: "/packages/package-id", keys: null, persian_only: true },
    ]);
    const result = await sitemap();
    const urls = result.map((x) => x.url);

    expect(result).toHaveLength(STATIC_COUNT + GUIDE_COUNT + 3 + 1 + 1 + 1 + 1);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith("https://lsevincare.com/"))).toBe(true);
    expect(urls.some((url) => url.includes("/service-providers/") || url.includes("/type/"))).toBe(false);

    const categories = result.filter((x) => x.url.endsWith("/categories"));
    expect(categories.map((x) => x.url.split("/")[3]).sort()).toEqual(["en", "fa"]);
    for (const item of categories) {
      expect(item.alternates?.languages).toEqual({
        fa: "https://lsevincare.com/fa/categories",
        en: "https://lsevincare.com/en/categories",
        "x-default": "https://lsevincare.com/fa/categories",
      });
    }
    expect(result.filter((x) => x.url.endsWith("/shop")).map((x) => x.url.split("/")[3])).toEqual(["fa"]);
    for (const path of ["offers", "featured", "packages", "packages/package-id"]) {
      expect(result.filter((x) => x.url.endsWith(`/${path}`)).map((x) => x.url.split("/")[3])).toEqual(["fa"]);
    }

    const provider = result.filter((x) => x.url.endsWith("/providers/p"));
    expect(provider.map((x) => x.url.split("/")[3]).sort()).toEqual(["ar", "en", "fa"]);
    for (const item of provider) {
      const languages = item.alternates!.languages!;
      expect(Object.values(languages)).toContain(item.url);
      expect(Object.keys(languages).sort()).toEqual(["ar", "en", "fa", "x-default"]);
    }

    // Persian-only entities: one URL, no alternates to reciprocate.
    for (const path of ["/services/s", "/specialists/t", "/products/x"]) {
      const items = result.filter((x) => x.url.endsWith(path));
      expect(items.map((x) => x.url)).toEqual([`https://lsevincare.com/fa${path}`]);
      expect(items[0].alternates).toBeUndefined();
    }

    // Guides carry their review date and only their written languages.
    const hub = result.filter((x) => /\/medical-tourism$/.test(x.url));
    expect(hub.map((x) => x.url.split("/")[3]).sort()).toEqual(["ar", "en", "fa"]);
    expect(hub[0].lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const sql = catalogSql();
    expect(sql).toContain("ps.is_active = true and ps.slug is not null and sp.is_active = true");
    expect(sql).toContain("psf.is_active = true and sp.is_active = true");
    expect(sql).toContain("category.provider_type_is_public(sp.provider_type_id)");
    expect(sql).toContain("p.deleted_at is null and p.status = 'active'");
    expect(sql).toContain("from marketing.special_packages p");
    expect(sql).toContain("p.title_translations ->> 'fa-IR'");
    expect(catalogRows).toHaveBeenCalledTimes(1);
  });

  // Reported 2026-11-10: category pages were /categories?parent=<uuid> and
  // /map?categoryId=<uuid>&view=list, so none of them could be listed.
  it("lists category pages by slug, in the category locales, without Tourism", async () => {
    catalogRows.mockResolvedValue([]);
    categoryRows.mockResolvedValue([
      { id: "acc", parentId: null, slug: "accommodation", childCount: 2, providerCount: 9 },
      { id: "hotel", parentId: "acc", slug: "hotel", childCount: 0, providerCount: 9 },
      { id: "villa", parentId: "acc", slug: "villa", childCount: 0, providerCount: 0 },
      { id: "tourism-root", parentId: null, slug: "tourism", childCount: 1, providerCount: 4 },
      { id: "urban", parentId: "tourism-root", slug: "urban", childCount: 0, providerCount: 4 },
    ]);
    const urls = (await sitemap()).map((x) => x.url).filter((url) => url.includes("/categories/"));
    expect(urls.sort()).toEqual([
      "https://lsevincare.com/en/categories/accommodation",
      "https://lsevincare.com/en/categories/accommodation/providers",
      "https://lsevincare.com/en/categories/hotel/providers",
      "https://lsevincare.com/fa/categories/accommodation",
      "https://lsevincare.com/fa/categories/accommodation/providers",
      "https://lsevincare.com/fa/categories/hotel/providers",
    ]);
  });

  it("keeps the entity catalog when only the category query fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      catalogRows.mockResolvedValue([{ path: "/services/kept", keys: ["fa-IR"], persian_only: false }]);
      categoryRows.mockRejectedValueOnce(new Error("private connection detail"));
      const urls = (await sitemap()).map((x) => x.url);
      expect(urls).toContain("https://lsevincare.com/fa/services/kept");
      expect(log.mock.calls.flat().join(" ")).not.toContain("private connection detail");
    } finally {
      log.mockRestore();
    }
  });

  it("recovers catalog discovery after a transient database failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      catalogRows.mockRejectedValueOnce(new Error("private connection detail"));
      expect(await sitemap()).toHaveLength(STATIC_COUNT + GUIDE_COUNT);
      expect(log.mock.calls.flat().join(" ")).not.toContain("private connection detail");
      catalogRows.mockResolvedValueOnce([
        { path: "/services/recovered", keys: ["fa-IR"], persian_only: false },
      ]);
      expect(await sitemap()).toHaveLength(STATIC_COUNT + GUIDE_COUNT + 1);
    } finally {
      log.mockRestore();
    }
  });

  it("fails rather than silently exceeding the sitemap URL limit", async () => {
    const everyKey = ["fa-IR", "en-US", "ar-SA", "tr-TR", "ru-RU", "ku-KU", "tg-TJ", "zh-CN", "de-DE", "fr-FR", "es-ES"];
    catalogRows.mockResolvedValue(
      Array.from({ length: 4600 }, (_, i) => ({
        path: `/services/${i}`,
        keys: everyKey,
        persian_only: false,
      }))
    );
    await expect(sitemap()).rejects.toThrow("sharded sitemaps");
  });
});
