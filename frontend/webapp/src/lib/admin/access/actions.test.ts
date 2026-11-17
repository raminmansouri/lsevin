import { describe, expect, it } from "vitest";

import { decideAdminAction, pagesForAction, workerToUrl } from "./actions";
import type { AdminAccess } from "./policy";

const limited = (grants: Record<string, "view" | "manage">): AdminAccess => ({ kind: "limited", grants });

describe("workerToUrl", () => {
  it("drops the app prefix, the locale, route groups and slots, and the trailing page/route", () => {
    expect(workerToUrl("app/[locale]/(admin)/admin/editorial/page")).toBe("/admin/editorial");
    expect(workerToUrl("app/[locale]/(admin)/admin/access-control/roles/[roleId]/page")).toBe("/admin/access-control/roles/[roleId]");
    expect(workerToUrl("app/[locale]/(auth)/sign-in/page")).toBe("/sign-in");
    expect(workerToUrl("app/[locale]/(admin)/admin/page")).toBe("/admin");
    expect(workerToUrl("app/[locale]/(main)/@modal/(.)photo/page")).toBe("/(.)photo");
  });

  it("a page at the site root has no admin prefix", () => {
    expect(workerToUrl("app/[locale]/(main)/page")).toBe("/");
  });
});

describe("pagesForAction", () => {
  const manifest = {
    node: {
      aaa: { workers: ["app/[locale]/(admin)/admin/editorial/page"] },
      bbb: { workers: { "app/[locale]/(admin)/admin/bookings/page": { moduleId: 1 } } },
      ccc: { workers: [] },
    },
  };
  it("reads the array and the object forms of `workers`", () => {
    expect(pagesForAction(manifest, "aaa")).toEqual(["app/[locale]/(admin)/admin/editorial/page"]);
    expect(pagesForAction(manifest, "bbb")).toEqual(["app/[locale]/(admin)/admin/bookings/page"]);
    expect(pagesForAction(manifest, "ccc")).toEqual([]);
  });
  it("returns null for an id that is not there, and for garbage", () => {
    expect(pagesForAction(manifest, "zzz")).toBeNull();
    expect(pagesForAction(null, "aaa")).toBeNull();
    expect(pagesForAction({}, "aaa")).toBeNull();
    expect(pagesForAction({ node: "nope" }, "aaa")).toBeNull();
  });
});

describe("decideAdminAction", () => {
  const editorial = ["app/[locale]/(admin)/admin/editorial/page"];
  const bookings = ["app/[locale]/(admin)/admin/bookings/page", "app/[locale]/(admin)/admin/bookings/add/page"];
  const accessControl = ["app/[locale]/(admin)/admin/access-control/page", "app/[locale]/(admin)/admin/access-control/roles/[roleId]/page"];

  it("unlimited admins may call anything; a revoked admin nothing", () => {
    expect(decideAdminAction({ kind: "unlimited", reason: "admin" }, accessControl)).toBe("allow");
    expect(decideAdminAction({ kind: "unlimited", reason: "admin" }, null)).toBe("allow");
    expect(decideAdminAction({ kind: "none", reason: "disabled" }, editorial)).toBe("forbidden");
  });

  it("a limited admin may call the actions of an area they can manage", () => {
    expect(decideAdminAction(limited({ editorial: "manage" }), editorial)).toBe("allow");
    expect(decideAdminAction(limited({ bookings: "manage" }), bookings)).toBe("allow");
  });

  it("…but not another area's action, even though they may manage the page they post it to (the replay)", () => {
    expect(decideAdminAction(limited({ editorial: "manage" }), bookings)).toBe("forbidden");
  });

  it("view is not enough to call an action", () => {
    expect(decideAdminAction(limited({ editorial: "view" }), editorial)).toBe("forbidden");
  });

  it("an action of the privileged screens is refused whatever rows exist", () => {
    expect(decideAdminAction(limited({ "access-control": "manage", editorial: "manage" }), accessControl)).toBe("forbidden");
  });

  it("an action shared by several areas is allowed if they can manage any one of them", () => {
    const shared = [...editorial, ...bookings];
    expect(decideAdminAction(limited({ editorial: "manage" }), shared)).toBe("allow");
    expect(decideAdminAction(limited({ bookings: "manage" }), shared)).toBe("allow");
    expect(decideAdminAction(limited({ customers: "manage" }), shared)).toBe("forbidden");
  });

  it("an action that a page outside the admin panel also imports is not an admin-only action", () => {
    expect(decideAdminAction(limited({}), ["app/[locale]/(auth)/sign-in/page"])).toBe("allow");
    expect(decideAdminAction(limited({}), [...bookings, "app/[locale]/(main)/categories/page"])).toBe("allow");
  });

  it("an id the manifest does not know, or one with no importers, is refused rather than guessed", () => {
    expect(decideAdminAction(limited({ editorial: "manage" }), null)).toBe("forbidden");
    expect(decideAdminAction(limited({ editorial: "manage" }), [])).toBe("forbidden");
  });

  it("an action only the no-access page imports is harmless", () => {
    expect(decideAdminAction(limited({}), ["app/[locale]/(admin)/admin/access-denied/page"])).toBe("allow");
  });
});
