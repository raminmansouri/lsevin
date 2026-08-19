"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@core/db/client";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { numberFromForm, stringFromForm } from "@core/lib/forms";
import { invokeModuleCapability } from "@core/modules/moduleBus";
import { assertTimeZone } from "@core/lib/dateTime";
import { getProviderTimeZone } from "@core/providers/timezone";
import {
  addWalletManualAdjustment,
  approveSettlementBatch,
  approveWithdrawal,
  createManualMoneyTransfer,
  createReportSnapshot,
  createSettlementBatchFromLedger,
  ensureProviderWalletAccount,
  getProviderReportsBundle,
  getSettlementBatchForPayment,
  markSettlementPaid,
  markStaffBookingCompensationPaid,
  saveStaffCompensationRule,
  disableStaffCompensationRule,
  markWithdrawalPaid,
  attachPaymentBillingInvoiceToSettlement,
  rejectWithdrawal,
  requestWithdrawal,
  setCompensationPolicyActive,
  upsertCompensationPolicy,
} from "./repository";

async function requireFinanceAdmin(userId: string) {
  const rows = await sql<{ ok: boolean }[]>`
    select exists (
      select 1
      from identity.asp_net_user_roles ur
      join identity.asp_net_roles r on r.id = ur.role_id
      where ur.user_id = ${userId}::uuid
        and upper(coalesce(r.normalized_name, r.name, '')) in ('ADMIN','SUPERADMIN','SUPER_ADMIN','FINANCE','FINANCE_ADMIN','ACCOUNTING')
    ) as ok
  `;
  if (!rows[0]?.ok) {
    throw new Error("Only an LSevin finance/admin user can perform this action.");
  }
}

function providerFinancePaths(providerId: string) {
  return [`/providers/${providerId}/finance`, `/providers/${providerId}/finance/wallet`, `/providers/${providerId}/finance/settlements`, `/providers/${providerId}/reports`];
}

export async function ensureProviderWalletAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  const currencyCode = stringFromForm(formData, "currencyCode", "USD").toUpperCase();
  await requireProviderPermission(user.id, providerId, "manageFinance");
  await ensureProviderWalletAccount(providerId, currencyCode);
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
}

export async function requestWithdrawalAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageFinance");
  await requestWithdrawal({
    providerId,
    currencyCode: stringFromForm(formData, "currencyCode", "USD").toUpperCase(),
    amount: numberFromForm(formData, "amount"),
    payoutAccountId: stringFromForm(formData, "payoutAccountId") || undefined,
    requestedByUserId: user.id,
  });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
}

export async function createSettlementBatchAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  const timeZone = assertTimeZone(stringFromForm(formData, "timeZone", await getProviderTimeZone(providerId)));
  await createSettlementBatchFromLedger({
    providerId,
    periodStart: stringFromForm(formData, "periodStart"),
    periodEnd: stringFromForm(formData, "periodEnd"),
    currencyCode: stringFromForm(formData, "currencyCode", "USD").toUpperCase(),
    notes: stringFromForm(formData, "notes"),
    createdByUserId: user.id,
    timeZone,
  });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/settlements");
}

export async function approveSettlementBatchAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  await approveSettlementBatch({ settlementBatchId: stringFromForm(formData, "settlementBatchId"), approvedByUserId: user.id });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/settlements");
}

export async function markSettlementPaidAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  await markSettlementPaid({ settlementBatchId: stringFromForm(formData, "settlementBatchId"), paidByUserId: user.id, externalReference: stringFromForm(formData, "externalReference") });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/settlements");
}

export async function approveWithdrawalRequestAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  await approveWithdrawal({ withdrawalRequestId: stringFromForm(formData, "withdrawalRequestId"), reviewedByUserId: user.id, reviewNote: stringFromForm(formData, "reviewNote") });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
}

export async function rejectWithdrawalRequestAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  await rejectWithdrawal({ withdrawalRequestId: stringFromForm(formData, "withdrawalRequestId"), reviewedByUserId: user.id, reviewNote: stringFromForm(formData, "reviewNote") });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
}

export async function markWithdrawalPaidAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  await markWithdrawalPaid({ withdrawalRequestId: stringFromForm(formData, "withdrawalRequestId"), paidByUserId: user.id, gatewayReference: stringFromForm(formData, "gatewayReference") });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
}

export async function createManualTransferAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId") || undefined;
  await createManualMoneyTransfer({
    providerId,
    bookingId: stringFromForm(formData, "bookingId") || undefined,
    sourcePartyType: stringFromForm(formData, "sourcePartyType", "lsevin"),
    targetPartyType: stringFromForm(formData, "targetPartyType", "provider"),
    amount: numberFromForm(formData, "amount"),
    currencyCode: stringFromForm(formData, "currencyCode", "USD").toUpperCase(),
    transferType: stringFromForm(formData, "transferType", "manual_adjustment"),
    notes: stringFromForm(formData, "notes"),
    createdByUserId: user.id,
  });
  if (providerId) providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
}

export async function createWalletAdjustmentAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  await addWalletManualAdjustment({
    providerId,
    currencyCode: stringFromForm(formData, "currencyCode", "USD").toUpperCase(),
    amount: numberFromForm(formData, "amount"),
    direction: stringFromForm(formData, "direction", "credit") === "debit" ? "debit" : "credit",
    notes: stringFromForm(formData, "notes"),
    createdByUserId: user.id,
  });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance");
}

export async function saveCompensationPolicyAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const scopeType = stringFromForm(formData, "scopeType", "global");
  const appliesTo = stringFromForm(formData, "appliesTo", "main_booking");
  const feeMode = stringFromForm(formData, "feeMode", "percent");
  const gatewayFeeMode = stringFromForm(formData, "gatewayFeeMode", "platform_pays");
  if (!["global", "provider_type", "provider", "service_definition", "provider_service", "addon"].includes(scopeType)) throw new Error("Invalid compensation scope.");
  if (!["main_booking", "child_booking", "addon"].includes(appliesTo)) throw new Error("Invalid compensation target.");
  if (!["percent", "fixed", "hybrid"].includes(feeMode)) throw new Error("Invalid compensation fee mode.");
  if (!["platform_pays", "provider_pays", "split"].includes(gatewayFeeMode)) throw new Error("Invalid gateway fee mode.");
  const platformPercent = numberFromForm(formData, "platformPercent");
  const providerOverrideRaw = stringFromForm(formData, "providerPercentOverride");
  if (platformPercent < 0 || platformPercent > 100) throw new Error("Platform percent must be between 0 and 100.");
  const providerPercentOverride = providerOverrideRaw === "" ? null : Number(providerOverrideRaw);
  if (providerPercentOverride !== null && (!Number.isFinite(providerPercentOverride) || providerPercentOverride < 0 || providerPercentOverride > 100)) throw new Error("Provider percent override must be between 0 and 100.");
  await upsertCompensationPolicy({
    id: stringFromForm(formData, "policyId"),
    name: stringFromForm(formData, "name"),
    description: stringFromForm(formData, "description"),
    scopeType,
    scopeId: stringFromForm(formData, "scopeId"),
    appliesTo,
    feeMode,
    platformPercent,
    platformFixedAmount: numberFromForm(formData, "platformFixedAmount"),
    minimumPlatformAmount: numberFromForm(formData, "minimumPlatformAmount"),
    providerPercentOverride,
    gatewayFeeMode,
    currencyCode: stringFromForm(formData, "currencyCode"),
    priority: numberFromForm(formData, "priority", 100),
    isActive: true,
    effectiveFrom: stringFromForm(formData, "effectiveFrom"),
    effectiveTo: stringFromForm(formData, "effectiveTo"),
    actorUserId: user.id,
  });
  revalidatePath("/admin/finance");
}

export async function setCompensationPolicyActiveAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  await setCompensationPolicyActive({
    policyId: stringFromForm(formData, "policyId"),
    isActive: stringFromForm(formData, "isActive") === "true",
    actorUserId: user.id,
  });
  revalidatePath("/admin/finance");
}

export async function createProviderReportSnapshotAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "view");
  const from = stringFromForm(formData, "from");
  const to = stringFromForm(formData, "to");
  const currencyCode = stringFromForm(formData, "currencyCode", "USD").toUpperCase();
  const timeZone = assertTimeZone(stringFromForm(formData, "timeZone", await getProviderTimeZone(providerId)));
  const bundle = await getProviderReportsBundle(providerId, { from, to, currencyCode, timeZone });
  await createReportSnapshot({
    providerId,
    reportKey: "provider_performance",
    title: `Provider performance ${from} to ${to}`,
    periodStart: from,
    periodEnd: to,
    currencyCode,
    payload: bundle,
    createdByUserId: user.id,
  });
  revalidatePath(`/providers/${providerId}/reports`);
}


export async function issueSettlementPaymentDocumentAction(formData: FormData) {
  const user = await requireCurrentUser();
  await requireFinanceAdmin(user.id);
  const providerId = stringFromForm(formData, "providerId");
  const settlementBatchId = stringFromForm(formData, "settlementBatchId");
  const settlement = await getSettlementBatchForPayment(providerId, settlementBatchId);
  if (!settlement) throw new Error("Settlement batch was not found.");

  const response = await invokeModuleCapability({
    capability: "billing.issue_invoice",
    requestedByUserId: user.id,
    source: { moduleCode: "provider-finance-analytics", entityType: "settlement-batch", entityId: settlement.id },
    payload: {
      invoiceType: "standard",
      billTo: { moduleCode: "core", entityType: "lsevin-company", entityId: "00000000-0000-0000-0000-000000000000", displayName: "LSevin" },
      sourceDocument: { moduleCode: "provider-finance-analytics", entityType: "settlement-batch", entityId: settlement.id },
      title: `Provider settlement payment document - ${settlement.settlementNumber}`,
      currencyCode: settlement.currencyCode,
      lines: [{ description: `Provider settlement ${settlement.settlementNumber}`, quantity: 1, unitAmount: Number(settlement.payoutAmount), currencyCode: settlement.currencyCode, metadata: { providerId, settlementBatchId } }],
      locale: "fa-IR",
      metadata: { integration: "provider-finance-analytics.settlement", providerId, settlementBatchId },
    },
  });

  if (!response.ok || !response.data) throw new Error(response.message ?? "PaymentBilling did not issue settlement payment document.");
  const invoice = response.data as { invoiceId: string; invoiceNumber: string };
  await attachPaymentBillingInvoiceToSettlement({ settlementBatchId: settlement.id, invoiceId: invoice.invoiceId, invoiceNumber: invoice.invoiceNumber });
  providerFinancePaths(providerId).forEach((path) => revalidatePath(path));
  revalidatePath("/admin/finance/settlements");
  revalidatePath("/admin/billing");
}


export async function saveStaffCompensationRuleAction(formData:FormData){ const user=await requireCurrentUser(); const providerId=stringFromForm(formData,'providerId'); const staffId=stringFromForm(formData,'staffId'); await requireProviderPermission(user.id,providerId,'manageFinance'); const raw=stringFromForm(formData,'calculationMode','percent'); const calculationMode=raw==='fixed'?'fixed':raw==='hybrid'?'hybrid':'percent'; await saveStaffCompensationRule({providerId,staffId,calculationMode,percentValue:numberFromForm(formData,'percentValue',0),fixedAmount:numberFromForm(formData,'fixedAmount',0),currencyCode:stringFromForm(formData,'currencyCode','USD').toUpperCase(),effectiveFrom:stringFromForm(formData,'effectiveFrom',new Date().toISOString().slice(0,10)),effectiveTo:stringFromForm(formData,'effectiveTo')||undefined,notes:stringFromForm(formData,'notes')||undefined,createdByUserId:user.id}); providerFinancePaths(providerId).forEach((path) => revalidatePath(path)); }
export async function disableStaffCompensationRuleAction(formData:FormData){ const user=await requireCurrentUser(); const providerId=stringFromForm(formData,'providerId'); await requireProviderPermission(user.id,providerId,'manageFinance'); await disableStaffCompensationRule({providerId,ruleId:stringFromForm(formData,'ruleId')}); providerFinancePaths(providerId).forEach((path) => revalidatePath(path)); }
export async function markStaffBookingCompensationPaidAction(formData:FormData){ const user=await requireCurrentUser(); const providerId=stringFromForm(formData,'providerId'); const staffId=stringFromForm(formData,'staffId'); await requireProviderPermission(user.id,providerId,'manageFinance'); await markStaffBookingCompensationPaid({providerId,staffId,bookingId:stringFromForm(formData,'bookingId'),currencyCode:stringFromForm(formData,'currencyCode','USD').toUpperCase(),paidByUserId:user.id,notes:stringFromForm(formData,'notes')||undefined}); providerFinancePaths(providerId).forEach((path) => revalidatePath(path)); revalidatePath(`/staff/${staffId}/finance`); revalidatePath('/staff/finance'); }
