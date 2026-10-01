import type { ProviderPortalRole } from "../types";

const ROLE_WEIGHT: Record<ProviderPortalRole, number> = {
  viewer: 10,
  staff: 20,
  editor: 30,
  manager: 40,
  admin: 50,
  owner: 60,
};

export const PROVIDER_PORTAL_PERMISSIONS = {
  viewDashboard: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageProfile: ["owner", "admin", "manager", "editor"],
  manageServices: ["owner", "admin", "manager", "editor"],
  manageStaff: ["owner", "admin", "manager"],
  manageAvailability: ["owner", "admin", "manager", "staff"],
  manageBookings: ["owner", "admin", "manager", "staff"],
  manageMedia: ["owner", "admin", "manager", "editor"],
  viewReviews: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageOffers: ["owner", "admin", "manager", "editor"],
  viewBilling: ["owner", "admin", "manager"],
  managePayouts: ["owner", "admin"],
  manageSupport: ["owner", "admin", "manager", "staff"],
  manageSettings: ["owner", "admin"],
} as const satisfies Record<string, ProviderPortalRole[]>;

export type ProviderPortalPermission = keyof typeof PROVIDER_PORTAL_PERMISSIONS;

// Temporary development mode: all portal permissions are open so the provider
// back office can be reviewed without membership/role configuration blocking UI.
export function hasPortalPermission(
  role: ProviderPortalRole,
  permission: ProviderPortalPermission,
) {
  const allowed: readonly ProviderPortalRole[] = PROVIDER_PORTAL_PERMISSIONS[permission];
  return allowed.includes(role);
}

export function buildPermissionMap(role: ProviderPortalRole) {
  return Object.fromEntries(
    (Object.keys(PROVIDER_PORTAL_PERMISSIONS) as ProviderPortalPermission[])
      .map((key) => [key, hasPortalPermission(role, key)]),
  );
}

export function roleAtLeast(
  role: ProviderPortalRole,
  minimum: ProviderPortalRole,
) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimum];
}
