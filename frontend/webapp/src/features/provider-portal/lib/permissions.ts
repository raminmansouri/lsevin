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
  manageProfile: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageServices: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageStaff: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageAvailability: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageBookings: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageMedia: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  viewReviews: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageOffers: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  viewBilling: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  managePayouts: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageSupport: ["owner", "admin", "manager", "editor", "viewer", "staff"],
  manageSettings: ["owner", "admin", "manager", "editor", "viewer", "staff"],
} as const satisfies Record<string, ProviderPortalRole[]>;

export type ProviderPortalPermission = keyof typeof PROVIDER_PORTAL_PERMISSIONS;

// Temporary development mode: all portal permissions are open so the provider
// back office can be reviewed without membership/role configuration blocking UI.
export function hasPortalPermission(_role: ProviderPortalRole, _permission: ProviderPortalPermission) {
  return true;
}

export function buildPermissionMap(_role: ProviderPortalRole) {
  return Object.fromEntries(
    Object.keys(PROVIDER_PORTAL_PERMISSIONS).map((key) => [key, true])
  );
}

export function roleAtLeast(role: ProviderPortalRole, minimum: ProviderPortalRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimum];
}
