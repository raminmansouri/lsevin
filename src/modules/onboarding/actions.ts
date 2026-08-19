"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser } from "@core/auth/permissions";
import { phoneCountryCodeFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { approvalFailureFromError } from "./approval-errors";
import {
  approveApplication,
  createApplication,
  markApplicationInReview,
  rejectApplication,
  requestApplicationChanges,
} from "./repository";

export async function createApplicationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const applicationAudience = stringFromForm(formData, "applicationAudience", "provider") === "staff" ? "staff" : "provider";

  await createApplication({
    userId: user.id,
    providerTypeId: stringFromForm(formData, "providerTypeId"),
    legalName: stringFromForm(formData, "legalName"),
    displayNameTranslations: translationsFromForm(formData, "displayName"),
    email: stringFromForm(formData, "email", user.email),
    phoneCountryCode: phoneCountryCodeFromForm(formData, "phoneCountryCode", "+98"),
    phoneNumber: stringFromForm(formData, "phoneNumber"),
    addressText: stringFromForm(formData, "addressText"),
    websiteUrl: stringFromForm(formData, "websiteUrl"),
    submissionPayload: {
      applicationAudience,
      contactPerson: stringFromForm(formData, "contactPerson"),
      notes: stringFromForm(formData, "notes"),
      country: stringFromForm(formData, "country"),
      city: stringFromForm(formData, "city"),
      staffTitle: stringFromForm(formData, "staffTitle"),
      staffSpecialty: stringFromForm(formData, "staffSpecialty"),
      existingProfileReference: stringFromForm(formData, "existingProfileReference"),
      requiredVerificationFlow: applicationAudience === "staff" ? ["clinic_confirmation", "lsevin_review", "payment_or_waiver"] : ["lsevin_review", "payment_or_waiver"],
    },
  });
  redirect("/applications");
}

export async function markApplicationInReviewAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const applicationId = stringFromForm(formData, "applicationId");
  await markApplicationInReview({ applicationId, reviewerUserId: user.id, note: stringFromForm(formData, "note") });
  revalidateApplicationPaths(applicationId);
}

export async function requestApplicationChangesAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const applicationId = stringFromForm(formData, "applicationId");
  await requestApplicationChanges({
    applicationId,
    reviewerUserId: user.id,
    reason: stringFromForm(formData, "reason"),
    note: stringFromForm(formData, "note"),
  });
  revalidateApplicationPaths(applicationId);
}

export async function rejectApplicationAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const applicationId = stringFromForm(formData, "applicationId");
  await rejectApplication({
    applicationId,
    reviewerUserId: user.id,
    reason: stringFromForm(formData, "reason"),
    note: stringFromForm(formData, "note"),
  });
  revalidateApplicationPaths(applicationId);
}

export async function approveApplicationAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const applicationId = stringFromForm(formData, "applicationId");
  const mode = stringFromForm(formData, "mode", "create") === "attach" ? "attach" : "create";
  let providerId: string;
  try {
    providerId = await approveApplication({
      applicationId,
      reviewerUserId: user.id,
      mode,
      existingProviderId: stringFromForm(formData, "existingProviderId"),
      country: stringFromForm(formData, "country"),
      city: stringFromForm(formData, "city"),
      timezoneId: stringFromForm(formData, "timezoneId", "Asia/Tehran"),
      reviewNote: stringFromForm(formData, "reviewNote"),
    });
  } catch (error) {
    console.error("Provider application approval failed", { applicationId, mode, error });
    const failure = approvalFailureFromError(error);
    redirect(`/admin/applications/${applicationId}?approvalError=${encodeURIComponent(failure.message)}&approvalErrorCode=${failure.code}`);
  }

  revalidateApplicationPaths(applicationId);
  revalidatePath("/providers");
  revalidatePath(`/providers/${providerId}/dashboard`);
  redirect(`/admin/applications/${applicationId}?approved=1`);
}

function revalidateApplicationPaths(applicationId: string) {
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
}
