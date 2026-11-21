import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { describe, expect, it } from "vitest";

import { appOnlyMetadata, privateMetadata, searchMetadata } from "./robots-policy";
import { facetHeaders } from "./facet-headers";
import { routing } from "@/i18n/routing";
import robots from "@/app/robots";
import { metadata as appMetadata } from "@/app/[locale]/n/app/layout";

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
      const policy = source.match(/export const metadata = (privateMetadata|searchMetadata|appOnlyMetadata)/)?.[1];
      if (policy) found.push(policy);
    }
    if (directory === app) break;
    directory = dirname(directory);
  }
  return found;
}

describe("server robots boundaries", () => {
  it("lets crawlers read noindex on app-only URLs", () => {
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow;
    for (const path of ["support", "shop/checkout", "bookings", "search", "home"]) {
      expect(disallow).not.toContain(`/*/n/app/mobile/${path}`);
    }
    const allow = (Array.isArray(rules) ? rules[0] : rules).allow;
    expect(allow).toContain("/*/n/app/");
    expect(appMetadata.robots).toEqual({ index: false, follow: true });
  });
  // Product photos, og:image and Product.image go through /api/shop/img.
  it("lets crawlers fetch shop images while the rest of /api stays blocked", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.allow).toContain("/api/shop/img");
    expect(rule.disallow).toContain("/api/");
    // Google and Bing apply the longest matching rule.
    const allow = [rule.allow].flat().filter((p) => "/api/shop/img?u=x".startsWith(p as string));
    const block = [rule.disallow].flat().filter((p) => "/api/shop/img?u=x".startsWith(p as string));
    expect(Math.max(...allow.map((p) => String(p).length))).toBeGreaterThan(Math.max(...block.map((p) => String(p).length)));
  });
  it("limits facet headers to known queries on supported locale landings", () => {
    const headers = facetHeaders(routing.locales);
    // shop 8 + specialties 15 + category providers 14 (filters and view).
    expect(headers).toHaveLength(37);
    for (const rule of headers) {
      expect(rule.source).toMatch(/\/(shop\/:slug|specialties\/:slug|categories\/:slug\/providers)$/);
      expect(rule.source).toContain(routing.locales.join("|"));
      expect(rule.has).toHaveLength(1);
      expect(rule.has[0].type).toBe("query");
      expect(rule.has[0].key).not.toBe("utm_source");
      expect(rule.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, follow" }]);
    }
  });
  it("keeps private policy scoped while allowing app-only link discovery", () => {
    expect(privateMetadata.robots).toEqual({ index: false, follow: false });
    expect(appOnlyMetadata.robots).toEqual({ index: false, follow: true });
    expect(searchMetadata.robots).toEqual({ index: false, follow: true });
  });

  it.each([
    "[locale]/(admin)/admin", "[locale]/(auth)/sign-in", "[locale]/(auth)/sign-up",
    "[locale]/provider-panel", "[locale]/provider-portal", "[locale]/(main)/profile",
    "[locale]/n/app/admin", "(financial)/financial/sign-in", "(financial)/financial/(protected)",
    ...["booking", "booking-v2", "bookings", "bug-reports", "care", "medical", "notifications", "profile/wallet", "support", "packages/[packageId]/checkout"].map(p => `[locale]/n/app/mobile/${p}`),
    ...["addresses", "cart", "checkout", "compare", "order", "orders", "wishlist"].map(p => `[locale]/n/app/mobile/shop/${p}`),
  ])("noindexes private route %s", (route) => {
    expect(policies(route)).toEqual([route.includes("/n/app/") ? "appOnlyMetadata" : "privateMetadata"]);
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
