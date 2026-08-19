"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { stringFromForm } from "@core/lib/forms";
import { createExportJob, createSnapshot, getProviderMetrics } from "./repository";

export async function createProviderSnapshotAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "viewAnalytics");
  const metrics = await getProviderMetrics(providerId);
  await createSnapshot({ scopeType: "provider", scopeId: providerId, reportKey: stringFromForm(formData, "reportKey", "provider_dashboard"), metrics, createdByUserId: user.id });
  revalidatePath(`/providers/${providerId}/analytics`);
}

export async function createAdminSnapshotAction(formData: FormData) {
  const user = await requireAdminUser("ANALYTICS_ADMIN");
  const metrics = await getProviderMetrics();
  await createSnapshot({ scopeType: "global", reportKey: stringFromForm(formData, "reportKey", "admin_dashboard"), metrics, createdByUserId: user.id });
  revalidatePath("/admin/analytics");
}

export async function createExportJobAction(formData: FormData) {
  await requireAdminUser("ANALYTICS_ADMIN");
  await createExportJob({ snapshotId: stringFromForm(formData, "snapshotId"), exportFormat: stringFromForm(formData, "exportFormat", "xlsx") });
  revalidatePath("/admin/analytics");
}
