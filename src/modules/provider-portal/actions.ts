"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { invokeModuleCapability } from "@core/modules/moduleBus";
import { numberFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { attachInvoiceToProfileClaim, getProfileClaim, reviewContentDraft, submitContentDraft, updateClaimReview, waiveProfileClaimPayment } from "./repository";
import { sendTemplateNotification } from "@core/notifications/capability";

type PriceResult = {
  amount: number;
  currencyCode: string;
  planCode: string;
  billingCycle: string;
  isFree: boolean;
};

type InvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: string;
  currencyCode: string;
  paymentUrl: string;
};

function zeroUuid() {
  return "00000000-0000-0000-0000-000000000000";
}

export async function issueProfileClaimInvoiceAction(formData: FormData) {
  const user = await requireAdminUser("FINANCE_ADMIN");
  const claimId = stringFromForm(formData, "claimId");
  const requestedPlanCode = stringFromForm(formData, "planCode", "verified-provider");
  const currencyCode = stringFromForm(formData, "currencyCode", "IRR").toUpperCase();
  const manualAmount = numberFromForm(formData, "amount", -1);
  const taxPercent = numberFromForm(formData, "taxPercent", 0);

  const claim = await getProfileClaim(claimId);
  if (!claim) throw new Error("Profile claim was not found.");

  const priceResponse = await invokeModuleCapability<{
    subjectType: string;
    subjectId: string;
    requestedPlanCode?: string;
    currencyCode?: string;
  }, PriceResult>({
    capability: "plans.calculate_profile_ownership_price",
    requestedByUserId: user.id,
    source: {
      moduleCode: "provider-portal",
      entityType: "profile-claim",
      entityId: claim.id,
    },
    payload: {
      subjectType: claim.targetType,
      subjectId: claim.targetId,
      requestedPlanCode,
      currencyCode,
    },
  });

  const calculated = priceResponse.data;
  const amount = manualAmount >= 0 ? manualAmount : calculated?.amount ?? 0;
  const invoiceCurrency = currencyCode || calculated?.currencyCode || "IRR";

  if (amount <= 0) {
    await waiveProfileClaimPayment(claim.id);
    revalidatePath("/admin/provider-claims");
    if (claim.serviceProviderId) revalidatePath(`/providers/${claim.serviceProviderId}/portal`);
    return;
  }

  const invoiceResponse = await invokeModuleCapability({
    capability: "billing.issue_invoice",
    requestedByUserId: user.id,
    source: {
      moduleCode: "provider-portal",
      entityType: "profile-claim",
      entityId: claim.id,
    },
    payload: {
      invoiceType: "profile_ownership",
      billTo: {
        moduleCode: "provider-portal",
        entityType: claim.targetType,
        entityId: claim.serviceProviderId ?? claim.targetId,
        displayName: `${claim.targetType} profile ownership`,
      },
      sourceDocument: {
        moduleCode: "provider-portal",
        entityType: "profile-claim",
        entityId: claim.id,
      },
      title: "LSevin provider/staff profile ownership invoice",
      currencyCode: invoiceCurrency,
      dueDate: stringFromForm(formData, "dueDate") || undefined,
      locale: "fa-IR",
      lines: [
        {
          description: `Profile ownership: ${claim.targetType} / ${requestedPlanCode}`,
          quantity: 1,
          unitAmount: amount,
          currencyCode: invoiceCurrency,
          taxPercent,
          metadata: {
            claimId: claim.id,
            targetType: claim.targetType,
            targetId: claim.targetId,
            claimantUserId: claim.claimantUserId,
            planCode: requestedPlanCode,
          },
        },
      ],
      metadata: {
        integration: "provider-portal.profile-claim",
        claimId: claim.id,
        requestedByUserId: user.id,
      },
    },
  });

  if (!invoiceResponse.ok || !invoiceResponse.data) {
    throw new Error(invoiceResponse.message ?? "PaymentBilling did not issue the invoice.");
  }

  const invoice = invoiceResponse.data as InvoiceResult;
  await attachInvoiceToProfileClaim({
    claimId: claim.id,
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    currencyCode: invoice.currencyCode,
    paymentUrl: invoice.paymentUrl,
  });
  await sendTemplateNotification({
    recipientEntityType: "user",
    recipientEntityId: claim.claimantUserId,
    templateKey: "payment.required",
    variables: { invoiceId: invoice.invoiceId, amount: invoice.totalAmount },
    sourceModule: "provider-portal",
    sourceEntityType: "profile-claim",
    sourceEntityId: claim.id,
  });

  revalidatePath("/admin/provider-claims");
  revalidatePath("/admin/billing");
  if (claim.serviceProviderId) {
    revalidatePath(`/providers/${claim.serviceProviderId}/portal`);
    revalidatePath(`/providers/${claim.serviceProviderId}/billing`);
  }
}

export async function waiveProfileClaimPaymentAction(formData: FormData) {
  await requireAdminUser("FINANCE_ADMIN");
  const claimId = stringFromForm(formData, "claimId");
  await waiveProfileClaimPayment(claimId || zeroUuid());
  revalidatePath("/admin/provider-claims");
}

export async function reviewProfileClaimAction(formData: FormData) {
  const scope = stringFromForm(formData, "scope", "clinic") === "lsevin" ? "lsevin" : "clinic";
  const decision = stringFromForm(formData, "decision", "approved") === "rejected" ? "rejected" : "approved";
  const claimId = stringFromForm(formData, "claimId");
  const reason = stringFromForm(formData, "reason");
  const providerId = stringFromForm(formData, "providerId");

  if (scope === "lsevin") {
    const user = await requireAdminUser("PROVIDER_ADMIN");
    await updateClaimReview({ claimId, scope, decision, actorUserId: user.id, reason });
    revalidatePath("/admin/provider-claims");
    revalidatePath("/admin/moderation");
    return;
  }

  const user = await requireCurrentUser();
  if (!providerId) throw new Error("Provider ID is required for clinic confirmation.");
  await requireProviderPermission(user.id, providerId, "manageMembers");
  await updateClaimReview({ claimId, scope, decision, actorUserId: user.id, reason });
  revalidatePath(`/providers/${providerId}/portal`);
}

export async function submitContentDraftAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageProfile");
  const entityType = stringFromForm(formData, "entityType", "provider");
  const entityId = stringFromForm(formData, "entityId", providerId);
  const locale = stringFromForm(formData, "locale", "fa-IR");
  const sectionKey = stringFromForm(formData, "sectionKey", "profile_summary");
  const titleTranslations = translationsFromForm(formData, "title");
  const textTranslations = translationsFromForm(formData, "text");
  const localizedTitle = titleTranslations[locale] || titleTranslations["fa-IR"] || titleTranslations["en-US"] || "";
  const localizedText = textTranslations[locale] || textTranslations["fa-IR"] || textTranslations["en-US"] || "";

  await submitContentDraft({
    providerId,
    entityType,
    entityId,
    locale,
    sectionKey,
    title: localizedTitle,
    draftPayload: {
      title: localizedTitle,
      text: localizedText,
      titleTranslations,
      translations: textTranslations,
      publicPagePath: stringFromForm(formData, "publicPagePath"),
      submittedFrom: "provider-portal",
    },
    submittedByUserId: user.id,
  });

  revalidatePath(`/providers/${providerId}/portal`);
  revalidatePath("/admin/moderation");
}

export async function reviewContentDraftAction(formData: FormData) {
  const user = await requireAdminUser("CONTENT_ADMIN");
  const decision = stringFromForm(formData, "decision", "approved") === "rejected" ? "rejected" : "approved";
  const providerId = stringFromForm(formData, "providerId");
  await reviewContentDraft({
    draftId: stringFromForm(formData, "draftId"),
    decision,
    reviewedByUserId: user.id,
    reason: stringFromForm(formData, "reason"),
  });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/provider-claims");
  if (providerId) revalidatePath(`/providers/${providerId}/portal`);
}
