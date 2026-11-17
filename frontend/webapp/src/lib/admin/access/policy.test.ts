import { describe, expect, it } from "vitest";

import {
  type AdminAccess,
  can,
  canArea,
  deriveAccess,
  hasAnyAdminAccess,
  isGrantable,
  levelForMethod,
  SHARED_LOOKUPS,
} from "./policy";

const limited = (grants: Record<string, "view" | "manage">): AdminAccess => ({ kind: "limited", grants });

describe("deriveAccess — the model, branch by branch", () => {
  const none = { grants: [] as never[] };

  it("superadmin is unlimited, whatever the database says", () => {
    expect(deriveAccess({ jwtRoles: ["superadmin"], staffStatus: "disabled", ...none })).toEqual({
      kind: "unlimited",
      reason: "superadmin",
    });
  });

  it("an admin nobody put under management stays unlimited (nobody loses access on rollout)", () => {
    expect(deriveAccess({ jwtRoles: ["admin"], staffStatus: null, ...none })).toEqual({
      kind: "unlimited",
      reason: "admin",
    });
  });

  it("a managed admin gets exactly the union of their roles' grants, manage beating view", () => {
    const access = deriveAccess({
      jwtRoles: ["admin"],
      staffStatus: "active",
      grants: [
        { resourceKey: "bookings", level: "view" },
        { resourceKey: "bookings", level: "manage" },
        { resourceKey: "customers", level: "view" },
        { resourceKey: "shop.orders", level: "view" },
        { resourceKey: "shop.orders", level: "view" },
      ],
    });
    expect(access).toEqual({
      kind: "limited",
      grants: { bookings: "manage", customers: "view", "shop.orders": "view" },
    });
  });

  it("manage is not downgraded by a later view row", () => {
    const access = deriveAccess({
      jwtRoles: ["admin"],
      staffStatus: "active",
      grants: [
        { resourceKey: "bookings", level: "manage" },
        { resourceKey: "bookings", level: "view" },
      ],
    });
    expect(access).toEqual({ kind: "limited", grants: { bookings: "manage" } });
  });

  it("a managed admin with no role has no access — never unlimited", () => {
    const access = deriveAccess({ jwtRoles: ["admin"], staffStatus: "active", ...none });
    expect(access).toEqual({ kind: "limited", grants: {} });
    expect(hasAnyAdminAccess(access)).toBe(false);
    expect(can(access, "dashboard", "view")).toBe(false);
  });

  it("a disabled admin has no access even while their token still says admin", () => {
    expect(deriveAccess({ jwtRoles: ["admin"], staffStatus: "disabled", ...none })).toEqual({
      kind: "none",
      reason: "disabled",
    });
  });

  it("non-admin tokens get nothing; roles are compared case-insensitively", () => {
    expect(deriveAccess({ jwtRoles: ["user"], staffStatus: null, ...none }).kind).toBe("none");
    expect(deriveAccess({ jwtRoles: ["financeadmin", "accountant"], staffStatus: null, ...none }).kind).toBe("none");
    expect(deriveAccess({ jwtRoles: [" ADMIN "], staffStatus: null, ...none }).kind).toBe("unlimited");
  });

  it("ignores stored levels it does not understand", () => {
    const access = deriveAccess({
      jwtRoles: ["admin"],
      staffStatus: "active",
      grants: [
        { resourceKey: "bookings", level: "owner" },
        { resourceKey: "customers", level: "view" },
      ],
    });
    expect(access).toEqual({ kind: "limited", grants: { customers: "view" } });
  });
});

describe("can()", () => {
  it("unlimited can do anything, none can do nothing", () => {
    expect(can({ kind: "unlimited", reason: "admin" }, "anything", "manage")).toBe(true);
    expect(can({ kind: "none", reason: "disabled" }, "dashboard", "view")).toBe(false);
  });

  it("view grant allows view but not manage; manage allows both", () => {
    const access = limited({ bookings: "view", customers: "manage" });
    expect(can(access, "bookings", "view")).toBe(true);
    expect(can(access, "bookings", "manage")).toBe(false);
    expect(can(access, "customers", "view")).toBe(true);
    expect(can(access, "customers", "manage")).toBe(true);
    expect(can(access, "loyalty", "view")).toBe(false);
  });

  it("matches whole keys only — `shop` does not grant `shop.orders`, nor `shop.orders` grant `shop`", () => {
    expect(can(limited({ shop: "manage" }), "shop.orders", "view")).toBe(false);
    expect(can(limited({ "shop.orders": "manage" }), "shop", "view")).toBe(false);
  });

  it("the unlimited-only areas can never be reached by a limited admin, even if a row exists", () => {
    const access = limited({ "access-control": "manage", "identity-users": "manage", "table-browser": "manage" });
    for (const key of ["access-control", "identity-users", "table-browser"]) {
      expect(isGrantable(key)).toBe(false);
      expect(can(access, key, "view")).toBe(false);
    }
  });

  it("areas pending migration cannot be used even if a stale row exists", () => {
    const access = limited({ "tours-platform.tours": "manage", tours: "manage", stays: "view" });
    expect(can(access, "tours-platform.tours", "view")).toBe(false);
    expect(can(access, "tours", "view")).toBe(false);
    expect(can(access, "stays", "view")).toBe(false);
  });

  it("unclassified routes are never allowed", () => {
    expect(can(limited({ unclassified: "manage" }), "unclassified", "view")).toBe(false);
  });

  it("shared lookups: view for anyone holding at least one grant, never manage", () => {
    expect(can(limited({ bookings: "view" }), SHARED_LOOKUPS, "view")).toBe(true);
    expect(can(limited({ bookings: "manage" }), SHARED_LOOKUPS, "manage")).toBe(false);
    expect(can(limited({}), SHARED_LOOKUPS, "view")).toBe(false);
  });
});

describe("canArea()", () => {
  it("is true for the area itself or anything beneath it, honouring the level", () => {
    const access = limited({ "shop.orders": "view", "finance.currencies": "manage" });
    expect(canArea(access, "shop", "view")).toBe(true);
    expect(canArea(access, "shop", "manage")).toBe(false);
    expect(canArea(access, "finance", "manage")).toBe(true);
    expect(canArea(access, "shopping", "view")).toBe(false);
    expect(canArea({ kind: "none", reason: "disabled" }, "shop", "view")).toBe(false);
    expect(canArea({ kind: "unlimited", reason: "admin" }, "shop", "manage")).toBe(true);
  });
});

describe("levelForMethod()", () => {
  it("reads are view; everything that can write (every server action is a POST) is manage", () => {
    for (const m of ["GET", "HEAD", "OPTIONS", "get", undefined, null]) expect(levelForMethod(m)).toBe("view");
    for (const m of ["POST", "PUT", "PATCH", "DELETE", "post"]) expect(levelForMethod(m)).toBe("manage");
  });
});
