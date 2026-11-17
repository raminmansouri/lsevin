import { describe, expect, it } from "vitest";

import type { AdminAccess } from "@/lib/admin/access/policy";

import { ADMIN_NAV, ADMIN_NAV_LEAVES, isNavGroup } from "./admin-nav";
import { allowedNavHrefs, restrictNav } from "./admin-nav-filter";

const limited = (grants: Record<string, "view" | "manage">): AdminAccess => ({ kind: "limited", grants });

const hrefsOf = (nav: ReturnType<typeof restrictNav>) =>
  nav.flatMap((entry) => (isNavGroup(entry) ? entry.items.map((i) => i.href) : [entry.href]));

describe("allowedNavHrefs / restrictNav", () => {
  it("unlimited admins see the whole tree", () => {
    expect(allowedNavHrefs({ kind: "unlimited", reason: "admin" })).toBeNull();
    expect(restrictNav(ADMIN_NAV, null)).toBe(ADMIN_NAV);
  });

  it("a revoked admin sees nothing", () => {
    expect(allowedNavHrefs({ kind: "none", reason: "disabled" })).toEqual([]);
    expect(restrictNav(ADMIN_NAV, [])).toEqual([]);
  });

  it("a limited admin sees exactly the rows they may open, and empty groups disappear", () => {
    const hrefs = allowedNavHrefs(limited({ bookings: "view", "shop.orders": "manage", dashboard: "view" }));
    expect(hrefs?.sort()).toEqual(["/admin/bookings", "/admin/dashboard", "/admin/shop/orders"]);
    const tree = restrictNav(ADMIN_NAV, hrefs);
    expect(hrefsOf(tree).sort()).toEqual(["/admin/bookings", "/admin/dashboard", "/admin/shop/orders"]);
    // only the groups that still have a row survive
    expect(tree.filter(isNavGroup).map((g) => g.titleKey).sort()).toEqual(["bookings", "shop"]);
  });

  it("never shows the privileged screens to a limited admin, even with stale rows for them", () => {
    const hrefs = allowedNavHrefs(
      limited({ "access-control": "manage", "identity-users": "manage", "table-browser": "manage", bookings: "view" })
    );
    expect(hrefs).toEqual(["/admin/bookings"]);
  });

  it("the menu agrees with the middleware: every shown row is one the resolver would allow", () => {
    const access = limited({ bookings: "view", customers: "manage", "shop.products": "view" });
    const shown = new Set(allowedNavHrefs(access));
    for (const leaf of ADMIN_NAV_LEAVES) {
      expect(shown.has(leaf.href)).toBe(
        ["/admin/bookings", "/admin/customers", "/admin/shop/products"].includes(leaf.href)
      );
    }
  });
});
