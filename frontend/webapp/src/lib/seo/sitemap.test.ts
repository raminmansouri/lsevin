import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { routing } from "@/i18n/routing";

import { seoOrigin } from "./origin";

const query = vi.hoisted(() => vi.fn());
vi.mock("@/config/database/db", () => ({ default: query }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_URL", "https://appmain.lsevin.com");
  vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com");
  query.mockReset();
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
  it("includes canonical discovery and entity routes once per locale", async () => {
    query.mockResolvedValue([
      { path: "/n/app/mobile/provider/p" },
      { path: "/n/app/mobile/service/s" },
      { path: "/n/app/mobile/specialist/t" },
      { path: "/n/app/mobile/service/s" },
    ]);
    const result = await sitemap();
    expect(result).toHaveLength(8 * routing.locales.length);
    expect(new Set(result.map((x) => x.url)).size).toBe(result.length);
    for (const item of result) {
      expect(item.url.startsWith("https://lsevincare.com/")).toBe(true);
      expect(item.url).not.toContain("/service-providers/");
      expect(Object.values(item.alternates!.languages!)).toContain(item.url);
    }
    const sql = query.mock.calls[0][0].join("?");
    expect(sql).toContain("ps.is_active = true and sp.is_active = true");
    expect(sql).toContain("psf.is_active = true and sp.is_active = true");
    expect(sql).toContain("category.provider_type_is_public(sp.provider_type_id)");
    expect(query).toHaveBeenCalledTimes(1);
  });
  it("recovers catalog discovery after a transient database failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      query.mockRejectedValueOnce(new Error("private connection detail"));
      expect(await sitemap()).toHaveLength(5 * routing.locales.length);
      expect(log.mock.calls.flat().join(" ")).not.toContain(
        "private connection detail"
      );
      query.mockResolvedValueOnce([
        { path: "/n/app/mobile/service/recovered" },
      ]);
      expect(await sitemap()).toHaveLength(6 * routing.locales.length);
    } finally {
      log.mockRestore();
    }
  });
  it("fails rather than silently exceeding the sitemap URL limit", async () => {
    query.mockResolvedValue(
      Array.from({ length: 4600 }, (_, i) => ({
        path: `/n/app/mobile/service/${i}`,
      }))
    );
    await expect(sitemap()).rejects.toThrow("sharded sitemaps");
  });
});
