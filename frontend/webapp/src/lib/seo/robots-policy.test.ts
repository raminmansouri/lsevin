import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { describe, expect, it } from "vitest";

import { privateMetadata, searchMetadata } from "./robots-policy";
import { facetHeaders } from "./facet-headers";
import { routing } from "@/i18n/routing";
import robots from "@/app/robots";

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
  it("blocks private mobile URLs without blocking crawlable search", () => {
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow;
    expect(disallow).not.toContain("/*/n/app/mobile/support");
    expect(disallow).not.toContain("/*/n/app/mobile/shop/checkout");
    expect(disallow).not.toContain("/*/n/app/mobile/bookings");
    expect(disallow).not.toContain("/*/n/app/mobile/packages/*/checkout");
    expect(disallow).not.toContain("/*/admin");
    expect(disallow).toContain("/fa/admin");
    expect(disallow).not.toContain("/*/n/app/mobile/search");
    expect(disallow).not.toContain("/*/n/app/mobile/home");
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
  it("prevents indexing private pages and following private links", () => {
    expect(privateMetadata.robots).toEqual({ index: false, follow: false });
    expect(searchMetadata.robots).toEqual({ index: false, follow: true });
  });

  it.each([
    "[locale]/(admin)/admin", "[locale]/(auth)/sign-in", "[locale]/(auth)/sign-up",
    "[locale]/provider-panel", "[locale]/provider-portal", "[locale]/(main)/profile",
    "(financial)/financial/sign-in", "(financial)/financial/(protected)",
  ])("noindexes private route %s", (route) => {
    expect(policies(route)).toEqual(["privateMetadata"]);
  });

  // /fa, /fa/explore, /fa/shop, /fa/products/<slug>, ... are rewrites onto these
  // routes: a layout policy above them noindexes the public page (2026-11-23..26).
  it.each(["home", "provider/[id]", "service/[id]", "specialist/[id]", "shop", "shop/product/[slug]", "shop/category/[slug]", "categories", "explore", "offers", "providers", "packages", "featured"])("keeps public %s indexable", (route) => {
    expect(policies(`[locale]/n/app/mobile/${route}`)).toEqual([]);
  });

  it("noindexes the direct app addresses by response header, which follows the requested URL", async () => {
    const { default: config } = await import("../../../next.config");
    const rules = (await config.headers?.()) ?? [];
    const app = rules.find((rule) => rule.source === "/:locale/n/app/:path*");
    expect(app?.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, follow" }]);
  });

  it("keeps the public seller URL outside the app-only robots boundary", () => {
    expect(policies("[locale]/(site)/shop/seller/[slug]")).toEqual([]);
  });

  it("keeps the public consultation doctors URL outside the app-only robots boundary", () => {
    expect(policies("[locale]/(site)/consultation/doctors")).toEqual([]);
  });

  it("keeps marketing routes outside the private boundary", () => {
    expect(policies("[locale]/(main)/type")).toEqual([]);
  });
});
