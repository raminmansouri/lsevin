import sql from "@/config/database/db";

import { requireIdentityUserId } from "./auth";
import type { PrivacySecurityPageData } from "./types";
import { formatLocation, formatRelativeActivity } from "./utils";

export async function getPrivacySecurityPageData(): Promise<PrivacySecurityPageData> {
  const userId = await requireIdentityUserId();

  const securityRows = await sql<{
    biometric_enabled: boolean;
    location_permission_status: "unknown" | "prompt" | "granted" | "denied" | "unsupported";
    notification_permission_status: "unknown" | "prompt" | "granted" | "denied" | "unsupported";
    location_permission_synced_at: string | null;
    notification_permission_synced_at: string | null;
  }[]>`
    select
      coalesce(s.biometric_enabled, false) as biometric_enabled,
      coalesce(s.location_permission_status, 'unknown') as location_permission_status,
      coalesce(s.notification_permission_status, 'unknown') as notification_permission_status,
      s.location_permission_synced_at::text as location_permission_synced_at,
      s.notification_permission_synced_at::text as notification_permission_synced_at
    from identity.asp_net_users u
    left join identity.user_security_settings s on s.user_id = u.id
    where u.id = ${userId}
    limit 1
  `;

  const sessionRows = await sql<{
    id: string;
    device_name: string | null;
    city: string | null;
    country: string | null;
    is_current: boolean;
    last_seen_at: string;
  }[]>`
    select
      s.id,
      s.device_name,
      s.city,
      s.country,
      s.is_current,
      s.last_seen_at
    from identity.user_sessions s
    where s.user_id = ${userId}
      and s.revoked_at is null
    order by s.is_current desc, s.last_seen_at desc
    limit 10
  `;

  const deletionRows = await sql<{ has_pending_request: boolean }[]>`
    select exists(
      select 1
      from identity.account_deletion_requests r
      where r.user_id = ${userId}
        and r.status in ('requested', 'under_review', 'approved')
    ) as has_pending_request
  `;

  const security = securityRows[0] ?? {
    biometric_enabled: false,
    location_permission_status: "unknown" as const,
    notification_permission_status: "unknown" as const,
    location_permission_synced_at: null,
    notification_permission_synced_at: null,
  };

  return {
    biometricEnabled: security.biometric_enabled,
    permissionSnapshot: {
      locationPermissionStatus: security.location_permission_status,
      notificationPermissionStatus: security.notification_permission_status,
      locationPermissionSyncedAt: security.location_permission_synced_at,
      notificationPermissionSyncedAt: security.notification_permission_synced_at,
    },
    hasPendingDeletionRequest: deletionRows[0]?.has_pending_request ?? false,
    activeSessions: sessionRows.map((row) => ({
      id: row.id,
      deviceName: row.device_name ?? "Unknown device",
      locationLabel: formatLocation(row.city, row.country),
      isCurrent: row.is_current,
      lastActiveLabel: formatRelativeActivity(row.last_seen_at),
    })),
  };
}
