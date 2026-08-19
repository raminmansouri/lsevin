import "server-only";
import { sql } from "@core/db/client";
import { redirect } from "next/navigation";
import { getCurrentUser, requireCurrentUser } from "@core/auth/session";

export type ProviderRole = "owner" | "admin" | "manager" | "editor" | "viewer" | "staff";
export type ProviderPermission =
  | "view"
  | "manageProfile"
  | "manageServices"
  | "manageStaff"
  | "manageMedia"
  | "manageAvailability"
  | "manageBookings"
  | "manageFinance"
  | "manageMembers"
  | "viewAnalytics";

export type StaffProfilePermission = "view" | "manageOwnProfile" | "manageOwnAvailability" | "replyToOwnReviews" | "viewOwnBookings" | "viewOwnFinance";

export type AdminPermission =
  | "ADMIN_PORTAL"
  | "SUPERADMIN"
  | "ADMIN"
  | "PROVIDER_ADMIN"
  | "FINANCE_ADMIN"
  | "SUPPORT_ADMIN"
  | "CONTENT_ADMIN"
  | "ANALYTICS_ADMIN"
  | "REVIEW_ADMIN"
  | "CONVERSION_ADMIN";

const rolePermissions: Record<ProviderRole, ProviderPermission[]> = {
  owner: ["view", "manageProfile", "manageServices", "manageStaff", "manageMedia", "manageAvailability", "manageBookings", "manageFinance", "manageMembers", "viewAnalytics"],
  admin: ["view", "manageProfile", "manageServices", "manageStaff", "manageMedia", "manageAvailability", "manageBookings", "manageFinance", "manageMembers", "viewAnalytics"],
  manager: ["view", "manageProfile", "manageServices", "manageStaff", "manageAvailability", "manageBookings", "viewAnalytics"],
  editor: ["view", "manageProfile", "manageServices", "manageMedia"],
  viewer: ["view", "viewAnalytics"],
  staff: ["view", "manageBookings"],
};

const staffClaimPermissions: StaffProfilePermission[] = ["view", "manageOwnProfile", "manageOwnAvailability", "replyToOwnReviews", "viewOwnBookings", "viewOwnFinance"];

const adminRolePermissionMap: Record<AdminPermission, AdminPermission[]> = {
  ADMIN_PORTAL: ["ADMIN_PORTAL", "ADMIN", "PROVIDER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN", "ANALYTICS_ADMIN", "REVIEW_ADMIN", "CONVERSION_ADMIN"],
  SUPERADMIN: ["ADMIN_PORTAL", "SUPERADMIN", "ADMIN", "PROVIDER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN", "ANALYTICS_ADMIN", "REVIEW_ADMIN", "CONVERSION_ADMIN"],
  ADMIN: ["ADMIN_PORTAL", "ADMIN", "PROVIDER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN", "ANALYTICS_ADMIN", "REVIEW_ADMIN", "CONVERSION_ADMIN"],
  PROVIDER_ADMIN: ["PROVIDER_ADMIN", "CONTENT_ADMIN", "REVIEW_ADMIN"],
  FINANCE_ADMIN: ["FINANCE_ADMIN"],
  SUPPORT_ADMIN: ["SUPPORT_ADMIN"],
  CONTENT_ADMIN: ["CONTENT_ADMIN"],
  ANALYTICS_ADMIN: ["ANALYTICS_ADMIN"],
  REVIEW_ADMIN: ["REVIEW_ADMIN"],
  CONVERSION_ADMIN: ["CONVERSION_ADMIN", "CONTENT_ADMIN"],
};

function normalizeAdminPermission(permission?: string): AdminPermission {
  const normalized = (permission || "ADMIN").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_") as AdminPermission;
  if (normalized in adminRolePermissionMap) return normalized;
  return "ADMIN";
}

export function can(role: ProviderRole, permission: ProviderPermission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export async function getProviderRole(userId: string, providerId: string): Promise<ProviderRole | null> {
  const rows = await sql<{ role: ProviderRole }[]>`
    select pm.role::text as role
    from provider_portal.provider_members pm
    where pm.user_id = ${userId}::uuid
      and pm.service_provider_id = ${providerId}::uuid
      and coalesce(pm.status, 'active') = 'active'
    limit 1
  `;
  return rows[0]?.role ?? null;
}

export async function requireProviderPermission(userId: string, providerId: string, permission: ProviderPermission) {
  const role = await getProviderRole(userId, providerId);
  if (!role || !can(role, permission)) {
    throw new Error(`Provider permission required: ${permission}.`);
  }
  return role;
}

export async function hasApprovedStaffProfileClaim(userId: string, staffId: string) {
  const rows = await sql<{ allowed: boolean; serviceProviderId: string | null }[]>`
    select true as allowed, service_provider_id::text as "serviceProviderId"
    from provider_portal_ext.profile_claims
    where claimant_user_id = ${userId}::uuid
      and target_type = 'staff'
      and target_id = ${staffId}::uuid
      and status = 'approved'
      and clinic_review_status = 'approved'
      and lsevin_review_status = 'approved'
      and payment_status in ('not_required','paid','waived')
    order by updated_at desc
    limit 1
  `;
  return rows[0] ?? { allowed: false, serviceProviderId: null };
}

export async function requireStaffProfilePermission(userId: string, staffId: string, permission: StaffProfilePermission) {
  if (!staffClaimPermissions.includes(permission)) {
    throw new Error(`Unknown staff profile permission: ${permission}.`);
  }
  const claim = await hasApprovedStaffProfileClaim(userId, staffId);
  if (!claim.allowed) {
    throw new Error("Approved clinic + LSevin staff profile ownership is required before managing this staff profile.");
  }
  return claim;
}

export async function listAdminRoleNames(userId: string) {
  const rows = await sql<{ roleName: string }[]>`
    select upper(coalesce(r.normalized_name, r.name, '')) as "roleName"
    from identity.asp_net_user_roles ur
    join identity.asp_net_roles r on r.id = ur.role_id
    where ur.user_id = ${userId}::uuid
    order by "roleName"
  `;
  return rows.map((row) => row.roleName).filter(Boolean);
}

export function adminRoleGrants(roleNames: string[], permission?: string) {
  const requiredPermission = normalizeAdminPermission(permission);
  const allowedRoles = adminRolePermissionMap[requiredPermission];
  return roleNames.some((roleName) => {
    const normalized = roleName.trim().toUpperCase();
    if (requiredPermission === "SUPERADMIN") return normalized === "SUPERADMIN";
    if (normalized === "SUPERADMIN" || normalized === "ADMIN") return true;
    return allowedRoles.includes(normalized as AdminPermission);
  });
}

export async function requireAdminUser(permission?: string) {
  const user = await requireCurrentUser();

  const requiredPermission = normalizeAdminPermission(permission);
  const roleNames = await listAdminRoleNames(user.id);
  const hasRequiredRole = adminRoleGrants(roleNames, requiredPermission);

  const devOverrideAllowed = process.env.NODE_ENV !== "production" && process.env.PROVIDER_PORTAL_DEV_USER_ID === user.id;
  if (!hasRequiredRole && !devOverrideAllowed) {
    redirect(`/dashboard?access=admin-denied&permission=${encodeURIComponent(requiredPermission)}`);
  }

  return user;
}
