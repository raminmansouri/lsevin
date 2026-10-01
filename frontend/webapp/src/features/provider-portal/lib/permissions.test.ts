import { describe, expect, it } from "vitest";

import { buildPermissionMap, hasPortalPermission } from "./permissions";

describe("provider portal permissions", () => {
  it("keeps viewers read-only", () => {
    expect(hasPortalPermission("viewer", "viewDashboard")).toBe(true);
    expect(hasPortalPermission("viewer", "manageBookings")).toBe(false);
    expect(hasPortalPermission("viewer", "manageSettings")).toBe(false);
  });

  it("lets staff operate bookings without granting finance or settings", () => {
    expect(hasPortalPermission("staff", "manageBookings")).toBe(true);
    expect(hasPortalPermission("staff", "manageAvailability")).toBe(true);
    expect(hasPortalPermission("staff", "managePayouts")).toBe(false);
    expect(hasPortalPermission("staff", "manageSettings")).toBe(false);
  });

  it("reserves payout and settings changes for owner/admin", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(hasPortalPermission(role, "managePayouts")).toBe(true);
      expect(hasPortalPermission(role, "manageSettings")).toBe(true);
    }
    expect(buildPermissionMap("manager").managePayouts).toBe(false);
  });
});
