import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { describe, expect, it } from "vitest";

import { privateMetadata, searchMetadata } from "./robots-policy";
import { facetHeaders } from "./facet-headers";
import { routing } from "@/i18n/routing";

const app = resolve(process.cwd(), "src/app");
// Resolve the actual server layout chain: this catches accidental broad noindex
// placement as well as missing boundaries, including client-only leaf pages.
function policies(route: string) {
  const found: string[] = [];
  let directory = resolve(app, route);
  while (directory.startsWith(app)) {
    const file = resolve(directory, "layout.tsx");
    if (existsSync(file)) {
      const source = readFileSync(file, "utf8");
      const policy = source.match(/export const metadata = (privateMetadata|searchMetadata)/)?.[1];
      if (policy) found.push(policy);
    }
    if (directory === app) break;
    directory = dirname(directory);
  }
  return found;
}

describe("server robots boundaries", () => {
  it("limits facet headers to known queries on supported locale landings", () => {
    const headers = facetHeaders(routing.locales);
    expect(headers).toHaveLength(12);
    for (const rule of headers) {
      expect(rule.source).toMatch(/\/(category\/:slug|type\/:id)$/);
      expect(rule.source).toContain(routing.locales.join("|"));
      expect(rule.has).toHaveLength(1);
      expect(rule.has[0].type).toBe("query");
      expect(rule.has[0].key).not.toBe("utm_source");
      expect(rule.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, follow" }]);
    }
  });
  it("prevents indexing private pages and following private links", () => {
    expect(privateMetadata.robots).toEqual({ index: false, follow: false });
    expect(searchMetadata.robots).toEqual({ index: false, follow: true });
  });

  it.each([
    "[locale]/(admin)/admin", "[locale]/(auth)/sign-in", "[locale]/(auth)/sign-up",
    "[locale]/provider-panel", "[locale]/provider-portal", "[locale]/(main)/profile",
    "[locale]/n/app/admin", "(financial)/financial/sign-in", "(financial)/financial/(protected)",
    ...["booking", "booking-v2", "bookings", "bug-reports", "care", "medical", "notifications", "profile/wallet"].map(p => `[locale]/n/app/mobile/${p}`),
    ...["addresses", "cart", "checkout", "compare", "order", "orders", "wishlist"].map(p => `[locale]/n/app/mobile/shop/${p}`),
  ])("noindexes private route %s", (route) => {
    expect(policies(route)).toEqual(["privateMetadata"]);
  });

  it.each(["search", "search-results", "map-discovery", "shop/search"])("allows link discovery from %s", (route) => {
    expect(policies(`[locale]/n/app/mobile/${route}`)).toEqual(["searchMetadata"]);
  });

  it.each(["home", "provider/[id]", "service/[id]", "specialist/[id]", "shop", "shop/product/[slug]", "shop/category/[slug]", "categories", "explore"])("keeps public %s indexable", (route) => {
    expect(policies(`[locale]/n/app/mobile/${route}`)).toEqual([]);
  });

  it("keeps marketing routes outside the private boundary", () => {
    expect(policies("[locale]/(main)/type")).toEqual([]);
  });
});
