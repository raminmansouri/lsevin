"use server";

import { revalidatePath } from "next/cache";
import sql from "@/config/database/db";

import { requireIdentityUserId } from "./auth";
import { changePasswordWithIdentityProvider } from "./security-adapter";
import type { ChangePasswordInput, PermissionStatusValue } from "./types";

function validatePasswordInput(input: ChangePasswordInput) {
  if (!input.currentPassword.trim()) throw new Error("Current password is required.");
  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  if (input.newPassword !== input.confirmPassword) throw new Error("New password and confirmation do not match.");
}

function assertPermissionValue(value: PermissionStatusValue) {
  if (!["unknown", "prompt", "granted", "denied", "unsupported"].includes(value)) {
    throw new Error("Invalid permission status.");
  }
}

export async function changePassword(input: ChangePasswordInput) {
  validatePasswordInput(input);
  await requireIdentityUserId();
  await changePasswordWithIdentityProvider(input);
  return { ok: true as const };
}

export async function updateBiometricEnabled(enabled: boolean) {
  const userId = await requireIdentityUserId();

  await sql`
    insert into identity.user_security_settings (
      user_id,
      biometric_enabled,
      create_date,
      last_modified_date
    )
    values (${userId}, ${enabled}, now(), now())
    on conflict (user_id)
    do update set
      biometric_enabled = excluded.biometric_enabled,
      last_modified_date = now()
  `;

  revalidatePath("/app/privacy-security");
  revalidatePath("/privacy-security");
  return { ok: true as const };
}

export async function syncPermissionSnapshot(input: {
  locationPermissionStatus: PermissionStatusValue;
  notificationPermissionStatus: PermissionStatusValue;
}) {
  assertPermissionValue(input.locationPermissionStatus);
  assertPermissionValue(input.notificationPermissionStatus);

  const userId = await requireIdentityUserId();

  await sql`
    insert into identity.user_security_settings (
      user_id,
      location_permission_status,
      notification_permission_status,
      location_permission_synced_at,
      notification_permission_synced_at,
      create_date,
      last_modified_date
    )
    values (
      ${userId},
      ${input.locationPermissionStatus},
      ${input.notificationPermissionStatus},
      now(),
      now(),
      now(),
      now()
    )
    on conflict (user_id)
    do update set
      location_permission_status = excluded.location_permission_status,
      notification_permission_status = excluded.notification_permission_status,
      location_permission_synced_at = now(),
      notification_permission_synced_at = now(),
      last_modified_date = now()
  `;

  revalidatePath("/app/privacy-security");
  revalidatePath("/privacy-security");
  return { ok: true as const };
}

export async function revokeSession(sessionId: string) {
  const userId = await requireIdentityUserId();

  await sql`
    update identity.user_sessions
    set revoked_at = now(),
        revoke_reason = 'revoked_by_user',
        is_current = false,
        last_modified_date = now()
    where id = ${sessionId}
      and user_id = ${userId}
      and coalesce(is_current, false) = false
      and revoked_at is null
  `;

  revalidatePath("/app/privacy-security");
  revalidatePath("/privacy-security");
  return { ok: true as const };
}

export async function requestAccountDeletion(reason: string | null) {
  const userId = await requireIdentityUserId();

  await sql`
    insert into identity.account_deletion_requests (
      user_id,
      reason,
      status,
      requested_at,
      create_date,
      last_modified_date
    )
    values (
      ${userId},
      ${reason?.trim() || null},
      'requested',
      now(),
      now(),
      now()
    )
    on conflict do nothing
  `;

  revalidatePath("/app/privacy-security");
  revalidatePath("/privacy-security");
  return { ok: true as const };
}
