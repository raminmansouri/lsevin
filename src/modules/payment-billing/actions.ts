"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { invokeModuleCapability } from "@core/modules/moduleBus";
import { numberFromForm, stringFromForm } from "@core/lib/forms";
import { isFileLike, storePrivateReceiptFile } from "@core/storage/privateFiles";

function paymentSource(providerId?: string) {
  return {
    moduleCode: "payment-billing",
    entityType: providerId ? "provider-billing-page" : "admin-billing-page",
    entityId: providerId ?? "00000000-0000-0000-0000-000000000000",
  };
}

export async function createPaymentIntentAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  if (providerId) await requireProviderPermission(user.id, providerId, "manageFinance");
  else await requireAdminUser("FINANCE_ADMIN");

  await invokeModuleCapability({
    capability: "payment.create_payment_intent",
    requestedByUserId: user.id,
    source: paymentSource(providerId),
    payload: {
      invoiceId: stringFromForm(formData, "invoiceId"),
      methodCode: stringFromForm(formData, "methodCode", "card_to_card"),
      authorizedProviderId: providerId || undefined,
      returnUrl: stringFromForm(formData, "returnUrl"),
      metadata: { createdFrom: "payment-billing-ui" },
    },
  });

  if (providerId) revalidatePath(`/providers/${providerId}/billing`);
  revalidatePath("/admin/billing");
}

export async function uploadReceiptAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  if (providerId) await requireProviderPermission(user.id, providerId, "manageFinance");
  else await requireAdminUser("FINANCE_ADMIN");

  const invoiceId = stringFromForm(formData, "invoiceId");
  const receiptFile = formData.get("receiptFile");
  if (!isFileLike(receiptFile)) {
    throw new Error("A receipt file is required for manual payment verification.");
  }

  const storedReceipt = await storePrivateReceiptFile({
    file: receiptFile,
    moduleCode: "payment-billing",
    ownerEntityType: providerId ? "provider" : "admin",
    ownerEntityId: providerId || invoiceId,
  });

  await invokeModuleCapability({
    capability: "payment.upload_manual_receipt",
    requestedByUserId: user.id,
    source: paymentSource(providerId),
    payload: {
      invoiceId,
      methodCode: stringFromForm(formData, "methodCode", "card_to_card"),
      authorizedProviderId: providerId || undefined,
      trackingNumber: stringFromForm(formData, "trackingNumber"),
      receiptFileUrl: storedReceipt.privateUrl,
      receiptStoragePath: storedReceipt.storagePath,
      receiptOriginalName: storedReceipt.originalName,
      receiptMimeType: storedReceipt.mimeType,
      receiptSizeBytes: storedReceipt.sizeBytes,
      receiptContentSha256: storedReceipt.contentSha256,
      payerNote: stringFromForm(formData, "payerNote"),
    },
  });

  if (providerId) revalidatePath(`/providers/${providerId}/billing`);
  revalidatePath("/admin/billing");
}

export async function verifyReceiptAction(formData: FormData) {
  const user = await requireAdminUser("FINANCE_ADMIN");
  await invokeModuleCapability({
    capability: "payment.verify_manual_receipt",
    requestedByUserId: user.id,
    source: paymentSource(),
    payload: {
      receiptId: stringFromForm(formData, "receiptId"),
      approved: stringFromForm(formData, "approved", "true") !== "false",
      verifiedByUserId: user.id,
      note: stringFromForm(formData, "note"),
    },
  });
  revalidatePath("/admin/billing");
}

export async function issueDirectInvoiceAction(formData: FormData) {
  const user = await requireAdminUser("FINANCE_ADMIN");
  const billToEntityId = stringFromForm(formData, "billToEntityId");
  const invoiceResponse = await invokeModuleCapability({
    capability: stringFromForm(formData, "capability", "billing.issue_invoice"),
    requestedByUserId: user.id,
    source: {
      moduleCode: "payment-billing",
      entityType: "admin-direct-invoice",
      entityId: billToEntityId,
    },
    payload: {
      invoiceType: stringFromForm(formData, "invoiceType", "standard"),
      billTo: {
        moduleCode: "payment-billing",
        entityType: stringFromForm(formData, "billToEntityType", "provider"),
        entityId: billToEntityId,
        displayName: stringFromForm(formData, "billToDisplayName"),
      },
      sourceDocument: {
        moduleCode: "payment-billing",
        entityType: "manual-admin-invoice",
        entityId: billToEntityId,
      },
      title: stringFromForm(formData, "title", "LSevin invoice"),
      currencyCode: stringFromForm(formData, "currencyCode", "IRR").toUpperCase(),
      dueDate: stringFromForm(formData, "dueDate") || undefined,
      locale: stringFromForm(formData, "locale", "fa-IR"),
      lines: [
        {
          description: stringFromForm(formData, "description", "LSevin service fee"),
          quantity: numberFromForm(formData, "quantity", 1),
          unitAmount: numberFromForm(formData, "unitAmount", 0),
          currencyCode: stringFromForm(formData, "currencyCode", "IRR").toUpperCase(),
          taxPercent: numberFromForm(formData, "taxPercent", 0),
          metadata: { manualAdminInvoice: true },
        },
      ],
      metadata: { createdFrom: "payment-billing.admin", createdByUserId: user.id },
    },
  });
  if (!invoiceResponse.ok) throw new Error(invoiceResponse.message ?? "Invoice was not issued.");
  revalidatePath("/admin/billing");
}
