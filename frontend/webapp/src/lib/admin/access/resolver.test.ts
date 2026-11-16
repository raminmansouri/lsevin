import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ADMIN_NAV_LEAVES } from "@/features/shared/config/admin-nav";

import { allCatalogResources, buildCatalog, grantableResourceKeys } from "./catalog";
import { decideAdminRequest } from "./edge";
import { ADMIN_API_ROUTES, ADMIN_NAV_HREFS, ADMIN_PAGE_ROUTES } from "./manifest.generated";
import { SHARED_LOOKUPS, type AdminAccess } from "./policy";
import { allPageResourceKeys, resolveAdminPageResource, resourceKeyFromHref } from "./resolver";

const key = (p: string) => resolveAdminPageResource(p);

describe("resolveAdminPageResource", () => {
  it("maps a sidebar leaf and everything under it to the leaf's resource", () => {
    expect(key("/admin/bookings")).toEqual({ key: "bookings", kind: "resource" });
    expect(key("/admin/bookings/add").key).toBe("bookings");
    expect(key("/admin/bookings/8c1e9d52-0a4e-4d0c-9d6e-0f6d6a0f3a11/update").key).toBe("bookings");
    expect(key("/admin/bookings/8c1e9d52-0a4e-4d0c-9d6e-0f6d6a0f3a11/financial").key).toBe("bookings");
    expect(key("/admin/shop/orders").key).toBe("shop.orders");
    expect(key("/admin/shop/orders/42").key).toBe("shop.orders");
    expect(key("/admin/shop/products/new").key).toBe("shop.products");
  });

  it("accepts a trailing slash and a query string", () => {
    expect(key("/admin/shop/orders/?page=2").key).toBe("shop.orders");
  });

  it("does not let an overview leaf swallow pages that appear under it later", () => {
    // `/admin/shop` is the shop overview. A page nobody has put in the menu is its own resource —
    // so a role that holds the overview does not silently gain it.
    expect(key("/admin/shop").key).toBe("shop");
    // A URL no page file claims is served by the generic table page, which is unlimited-only.
    expect(key("/admin/shop/payouts-that-do-not-exist-yet").key).toBe("table-browser");
    const unlisted = ADMIN_PAGE_ROUTES.find(
      (r) => r.startsWith("/admin/shop/") && !r.includes("[") && !ADMIN_NAV_HREFS.includes(r)
    );
    if (unlisted) {
      const resolved = key(unlisted);
      expect(resolved.kind).toBe("resource");
      expect(resolved.key).not.toBe("shop");
    }
  });

  it("the generic table browser is `table-browser`, and a static page beats it", () => {
    expect(key("/admin")).toEqual({ key: "table-browser", kind: "resource" });
    expect(key("/admin/booking/payments").key).toBe("table-browser");
    expect(key("/admin/shop/orders").key).toBe("shop.orders");
  });

  it("the access screens are their own unlimited-only resource", () => {
    expect(key("/admin/access-control").key).toBe("access-control");
    expect(key("/admin/access-control/roles/8c1e9d52-0a4e-4d0c-9d6e-0f6d6a0f3a11").key).toBe("access-control");
  });

  it("the no-access landing page is exempt, so a denied person always has somewhere to go", () => {
    expect(key("/admin/access-denied")).toEqual({ key: "/admin/access-denied", kind: "exempt" });
  });

  it("anything outside /admin, or not a real page, is unclassified", () => {
    expect(key("/profile").kind).toBe("unclassified");
    expect(key("/admin/a/b/c/d/e/f").kind).toBe("unclassified");
  });
});

describe("the manifest and the catalogue", () => {
  it("is exactly what the filesystem produces — regenerate it when you add an admin page", async () => {
    const { buildManifest, renderManifest } = await import("../../../../scripts/admin-access-manifest.mjs");
    const committed = fs
      .readFileSync(path.join(__dirname, "manifest.generated.ts"), "utf8")
      .replace(/\r\n/g, "\n");
    expect(
      committed,
      "src/lib/admin/access/manifest.generated.ts is stale. Run `pnpm admin-access:manifest` and commit it."
    ).toBe(renderManifest(buildManifest()));
  });

  it("matches the sidebar tree it was parsed from", () => {
    const fromTree = ADMIN_NAV_LEAVES.map((l) => l.href).sort();
    expect([...ADMIN_NAV_HREFS].sort()).toEqual([...new Set(fromTree)].sort());
  });

  it("every page resolves to a resource — no admin page is left outside the model", () => {
    const unresolved = ADMIN_PAGE_ROUTES.filter((route) => {
      const r = resolveAdminPageResource(route);
      return r.kind === "unclassified";
    });
    expect(unresolved).toEqual([]);
  });

  it("every resource a page resolves to is in the permission catalogue (so it shows up in the matrix)", () => {
    const catalogued = new Set(allCatalogResources().map((r) => r.key));
    const missing = allPageResourceKeys().filter((k) => !catalogued.has(k));
    expect(missing).toEqual([]);
  });

  it("catalogue keys are unique and grantable ones exclude the privileged areas", () => {
    const all = allCatalogResources().map((r) => r.key);
    expect(new Set(all).size).toBe(all.length);
    const grantable = grantableResourceKeys();
    for (const privileged of ["access-control", "identity-users", "table-browser"]) {
      expect(all).toContain(privileged);
      expect(grantable.has(privileged)).toBe(false);
    }
    expect(grantable.has("bookings")).toBe(true);
  });

  it("the sidebar groups appear in the catalogue in sidebar order", () => {
    const groups = buildCatalog().map((g) => g.groupKey);
    expect(groups[0]).toBe("general");
    expect(groups).toContain("bookings");
    expect(groups).toContain("platform");
  });

  it("resourceKeyFromHref", () => {
    expect(resourceKeyFromHref("/admin")).toBe("table-browser");
    expect(resourceKeyFromHref("/admin/shop/orders")).toBe("shop.orders");
  });
});

describe("decideAdminRequest — what the middleware does", () => {
  const limited = (grants: Record<string, "view" | "manage">): AdminAccess => ({ kind: "limited", grants });
  const unlimited: AdminAccess = { kind: "unlimited", reason: "admin" };

  it("unlimited admins are never narrowed", () => {
    expect(decideAdminRequest(unlimited, "/admin/access-control", "POST")).toBe("allow");
  });

  it("a limited admin opens what they hold and nothing else", () => {
    const access = limited({ bookings: "view", customers: "manage" });
    expect(decideAdminRequest(access, "/admin/bookings", "GET")).toBe("allow");
    expect(decideAdminRequest(access, "/admin/bookings/123/update", "GET")).toBe("allow");
    expect(decideAdminRequest(access, "/admin/loyalty", "GET")).toBe("forbidden");
    expect(decideAdminRequest(access, "/admin/shop/orders", "GET")).toBe("forbidden");
  });

  it("view-only means a write (a server action is a POST to the page's URL) is refused", () => {
    const access = limited({ bookings: "view", customers: "manage" });
    expect(decideAdminRequest(access, "/admin/bookings/add", "POST")).toBe("forbidden");
    expect(decideAdminRequest(access, "/admin/customers/add", "POST")).toBe("allow");
  });

  it("limited admins never reach the privileged screens, whatever rows exist", () => {
    const access = limited({ "access-control": "manage", "identity-users": "manage", "table-browser": "manage" });
    for (const p of ["/admin/access-control", "/admin/identity-users", "/admin", "/admin/booking/payments"]) {
      expect(decideAdminRequest(access, p, "GET")).toBe("forbidden");
    }
  });

  it("a limited admin with no grants can still reach the no-access page (no redirect loop)", () => {
    expect(decideAdminRequest(limited({}), "/admin/access-denied", "GET")).toBe("allow");
    expect(decideAdminRequest(limited({}), "/admin/dashboard", "GET")).toBe("forbidden");
  });

  it("revoked / non-admin callers are treated as visitors", () => {
    expect(decideAdminRequest({ kind: "none", reason: "disabled" }, "/admin/dashboard", "GET")).toBe("not-admin");
    expect(decideAdminRequest({ kind: "none", reason: "not-admin" }, "/admin/access-denied", "GET")).toBe("not-admin");
  });

  it("an unknown or brand-new page is denied to limited admins until granted", () => {
    expect(decideAdminRequest(limited({ shop: "manage" }), "/admin/brand-new-thing", "GET")).toBe("forbidden");
  });
});

describe("guard coverage — new admin code must name its permission", () => {
  const srcRoot = path.resolve(__dirname, "../../..");

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
    }
    return out;
  }
  const files = walk(srcRoot);
  const known = new Set([...allCatalogResources().map((r) => r.key), SHARED_LOOKUPS]);

  it("every resource named in a guard exists in the catalogue (a typo would silently lock people out)", () => {
    const bad: string[] = [];
    const patterns = [
      /\bassertAdmin\(\s*["']([^"']+)["']/g,
      /\bassertAdminAccess\(\s*["']([^"']+)["']/g,
      /\brequireApiAdmin\(\s*["']([^"']+)["']/g,
      /\badminMay\(\s*[A-Za-z_]+\s*,\s*["']([^"']+)["']/g,
      /\bcan\(\s*[A-Za-z_.]+\s*,\s*["']([^"']+)["']/g,
    ];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      for (const re of patterns) {
        for (const match of text.matchAll(re)) {
          if (!known.has(match[1])) bad.push(`${path.relative(srcRoot, file)}: "${match[1]}"`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("every /api/admin handler that calls requireApiAdmin names a resource, or says why it is unlimited-only", () => {
    const offenders: string[] = [];
    for (const route of ADMIN_API_ROUTES) {
      const file = path.join(srcRoot, "app", route, "route.ts");
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, "utf8");
      for (const match of text.matchAll(/requireApiAdmin\(\s*\)(\s*\/\*[^*]*\*\/)?/g)) {
        if (!match[1] || !/unlimited/i.test(match[1])) offenders.push(route);
      }
    }
    expect(offenders).toEqual([]);
  });
});
