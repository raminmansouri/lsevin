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
vi.mock("@/config/database/db", () => ({ default: query }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const isCatalogQuery = (first: unknown) =>
  Array.isArray(first) && "raw" in first && first.join("?").includes("union all");
const catalogSql = () =>
  (query.mock.calls.find(([first]) => isCatalogQuery(first))![0] as string[]).join("?");

const STATIC_COUNT = 6 * routing.locales.length;
const GUIDE_COUNT = allGuides().reduce((sum, guide) => sum + guideLocales(guide).length, 0);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_URL", "https://appmain.lsevin.com");
  vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com");
  query.mockReset();
  catalogRows.mockReset();
  query.mockImplementation((first: unknown) => (isCatalogQuery(first) ? catalogRows() : { fragment: true }));
});
afterEach(() => vi.unstubAllEnvs());

describe("public search domain and sitemap", () => {
  it("uses the SEO domain independently of authentication origin", () => {
    expect(seoOrigin()).toBe("https://lsevincare.com");
    expect(robots().sitemap).toBe("https://lsevincare.com/sitemap.xml");
  });
  it("preserves existing deployments without an SEO override", () => {
    vi.stubEnv("NEXT_PUBLIC_SEO_URL", "");
    expect(seoOrigin()).toBe("https://appmain.lsevin.com");
  });
  it("rejects an unsafe SEO domain rather than emitting poisoned canonicals", () => {
    vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://example.com/path");
    expect(seoOrigin).toThrow();
  });

  it("lists each entity only in the locales whose text exists", async () => {
    catalogRows.mockResolvedValue([
      { path: "/n/app/mobile/provider/p", keys: ["fa-IR", "en-US", "ar-SA"], persian_only: false },
      { path: "/n/app/mobile/service/s", keys: ["fa-IR"], persian_only: false },
      { path: "/n/app/mobile/specialist/t", keys: [], persian_only: false },
      { path: "/n/app/mobile/service/s", keys: ["fa-IR"], persian_only: false },
      { path: "/n/app/mobile/shop/product/x", keys: null, persian_only: true },
    ]);
    const result = await sitemap();
    const urls = result.map((x) => x.url);

    expect(result).toHaveLength(STATIC_COUNT + GUIDE_COUNT + 3 + 1 + 1 + 1);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith("https://lsevincare.com/"))).toBe(true);
    expect(urls.some((url) => url.includes("/service-providers/") || url.includes("/type/"))).toBe(false);

    const provider = result.filter((x) => x.url.endsWith("/n/app/mobile/provider/p"));
    expect(provider.map((x) => x.url.split("/")[3]).sort()).toEqual(["ar", "en", "fa"]);
    for (const item of provider) {
      const languages = item.alternates!.languages!;
      expect(Object.values(languages)).toContain(item.url);
      expect(Object.keys(languages).sort()).toEqual(["ar", "en", "fa", "x-default"]);
    }

    // Persian-only entities: one URL, no alternates to reciprocate.
    for (const path of ["/n/app/mobile/service/s", "/n/app/mobile/specialist/t", "/n/app/mobile/shop/product/x"]) {
      const items = result.filter((x) => x.url.endsWith(path));
      expect(items.map((x) => x.url)).toEqual([`https://lsevincare.com/fa${path}`]);
      expect(items[0].alternates).toBeUndefined();
    }

    // Guides carry their review date and only their written languages.
    const hub = result.filter((x) => /\/medical-tourism$/.test(x.url));
    expect(hub.map((x) => x.url.split("/")[3]).sort()).toEqual(["ar", "en", "fa"]);
    expect(hub[0].lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const sql = catalogSql();
    expect(sql).toContain("ps.is_active = true and sp.is_active = true");
    expect(sql).toContain("psf.is_active = true and sp.is_active = true");
    expect(sql).toContain("category.provider_type_is_public(sp.provider_type_id)");
    expect(sql).toContain("p.deleted_at is null and p.status = 'active'");
    expect(catalogRows).toHaveBeenCalledTimes(1);
  });

  it("recovers catalog discovery after a transient database failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      catalogRows.mockRejectedValueOnce(new Error("private connection detail"));
      expect(await sitemap()).toHaveLength(STATIC_COUNT + GUIDE_COUNT);
      expect(log.mock.calls.flat().join(" ")).not.toContain("private connection detail");
      catalogRows.mockResolvedValueOnce([
        { path: "/n/app/mobile/service/recovered", keys: ["fa-IR"], persian_only: false },
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
        path: `/n/app/mobile/service/${i}`,
        keys: everyKey,
        persian_only: false,
      }))
    );
    await expect(sitemap()).rejects.toThrow("sharded sitemaps");
  });
});
