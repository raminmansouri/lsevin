import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env/client", () => ({ env: { NEXT_PUBLIC_FILES_URL: "" } }));

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("crawl hygiene guards (SEO crawl audit 2026-11-28)", () => {
  it("never asks the image optimizer for a 3840 px rendition", () => {
    const config = read("next.config.ts");
    const sizes = /deviceSizes:\s*\[([^\]]+)\]/.exec(config)?.[1] ?? "";
    const widths = sizes.split(",").map((value) => Number(value.trim()));
    expect(widths.length).toBeGreaterThan(0);
    expect(Math.max(...widths)).toBeLessThanOrEqual(1920);
  });

  it("serves blocking (in <head>) metadata to every user agent", () => {
    expect(read("next.config.ts")).toMatch(/htmlLimitedBots:\s*\/\.\*\//);
  });

  it("keeps service galleries out of the index and canonical to the service page", () => {
    const page = read("src/app/[locale]/(site)/services/[slug]/gallery/page.tsx");
    expect(page).toContain("robots: { index: false, follow: true }");
    expect(page).toMatch(/path: `\/services\/\$\{ref\.slug \?\? id\}`/);
    expect(page).not.toContain('from "next/link"');
  });

  it("builds product-card links with the locale-aware Link", () => {
    expect(read("src/features/shop/components/ProductCard.tsx")).not.toContain('from "next/link"');
  });

  it("never emits a bare relative media path", async () => {
    const { resolveMediaUrl } = await import("@/features/service-providers/lib/media-url");
    expect(resolveMediaUrl("Categories/services/x.webp")).toMatch(/(^|\/)files\/Categories\/services\/x\.webp$|^https?:\/\//);
    expect(resolveMediaUrl("Categories/services/x.webp").startsWith("Categories")).toBe(false);
  });
});
