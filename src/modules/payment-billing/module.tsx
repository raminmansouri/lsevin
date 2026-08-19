import type { ExtendedModuleDefinition } from "@core/modules/types";
import type { IssueInvoicePayload, ModuleCapabilityRequest } from "@core/modules/contracts";
import { registerModuleCapability } from "@core/modules/moduleBus";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";
import { handleIDPayCallback, handleZarinPalCallback } from "./api";
import {
  createPaymentIntent,
  issueInvoice,
  reconcileBankStatement,
  uploadPaymentReceipt,
  verifyPaymentReceipt,
} from "./repository";
import type {
  CreatePaymentIntentPayload,
  ReconcileBankStatementPayload,
  UploadReceiptPayload,
  VerifyReceiptPayload,
} from "./contracts";

let capabilitiesRegistered = false;

function registerPaymentBillingCapabilities() {
  if (capabilitiesRegistered) return;
  capabilitiesRegistered = true;

  registerModuleCapability<IssueInvoicePayload>("billing.issue_invoice", async (request: ModuleCapabilityRequest<IssueInvoicePayload>) => {
    const invoice = await issueInvoice(request.payload);
    return { ok: true, message: "Invoice issued by PaymentBilling module.", data: invoice };
  });

  registerModuleCapability<IssueInvoicePayload>("billing.issue_proforma", async (request: ModuleCapabilityRequest<IssueInvoicePayload>) => {
    const invoice = await issueInvoice({ ...request.payload, invoiceType: "proforma" });
    return { ok: true, message: "Proforma invoice issued by PaymentBilling module.", data: invoice };
  });

  registerModuleCapability<IssueInvoicePayload>("billing.issue_tax_invoice", async (request: ModuleCapabilityRequest<IssueInvoicePayload>) => {
    const invoice = await issueInvoice({ ...request.payload, invoiceType: "tax_ir" });
    return { ok: true, message: "Iranian tax invoice issued by PaymentBilling module.", data: invoice };
  });

  registerModuleCapability<CreatePaymentIntentPayload>("payment.create_payment_intent", async (request: ModuleCapabilityRequest<CreatePaymentIntentPayload>) => {
    const intent = await createPaymentIntent(request.payload);
    return { ok: true, message: "Payment intent created by PaymentBilling module.", data: intent };
  });

  registerModuleCapability<UploadReceiptPayload>("payment.upload_manual_receipt", async (request: ModuleCapabilityRequest<UploadReceiptPayload>) => {
    const receipt = await uploadPaymentReceipt(request.payload, request.requestedByUserId);
    return { ok: true, message: "Manual payment receipt uploaded for verification.", data: receipt };
  });

  registerModuleCapability<VerifyReceiptPayload>("payment.verify_manual_receipt", async (request: ModuleCapabilityRequest<VerifyReceiptPayload>) => {
    const receipt = await verifyPaymentReceipt(request.payload);
    return { ok: true, message: "Manual receipt verification completed.", data: receipt };
  });

  registerModuleCapability<ReconcileBankStatementPayload>("payment.reconcile_bank_statement", async (request: ModuleCapabilityRequest<ReconcileBankStatementPayload>) => {
    const batch = await reconcileBankStatement(request.payload);
    return { ok: true, message: "Bank statement imported for reconciliation.", data: batch };
  });
}

registerPaymentBillingCapabilities();

const moduleDefinition: ExtendedModuleDefinition = {
  id: "payment-billing",
  name: "Payment & Billing",
  version: "1.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/payment-billing",
  databaseSchema: "payment_billing",
  installMode: "optional",
  capabilities: [
    "billing.issue_invoice",
    "billing.issue_proforma",
    "billing.issue_tax_invoice",
    "payment.create_payment_intent",
    "payment.upload_manual_receipt",
    "payment.verify_manual_receipt",
    "payment.reconcile_bank_statement",
  ],
  migrations: ["migrations/001_payment_billing.sql", "migrations/002_payment_integrity.sql"],
  routes: [
    { key: "payment-billing.provider", scope: "provider", path: "providers/:providerId/billing", title: "Provider Billing", icon: "receipt", providerPermission: "manageFinance", component: ProviderPage },
    { key: "payment-billing.admin", scope: "admin", path: "admin/billing", title: "Payment & Billing Control", icon: "receipt", adminPermission: "FINANCE_ADMIN", component: AdminPage },
  ],
  apiRoutes: [
    { key: "payment-billing.zarinpal.callback", public: true, method: "GET", path: "billing/zarinpal/callback", handler: handleZarinPalCallback },
    { key: "payment-billing.idpay.callback.get", public: true, method: "GET", path: "billing/idpay/callback", handler: handleIDPayCallback },
    { key: "payment-billing.idpay.callback.post", public: true, method: "POST", path: "billing/idpay/callback", handler: handleIDPayCallback },
  ],
  navigation: [
    { scope: "provider", label: "Billing", hrefTemplate: "/providers/:providerId/billing", icon: "receipt", routeKey: "payment-billing.provider", providerPermission: "manageFinance", order: 130 },
    { scope: "admin", label: "Billing", hrefTemplate: "/admin/billing", icon: "receipt", routeKey: "payment-billing.admin", adminPermission: "FINANCE_ADMIN", order: 130 },
  ],
};

export default moduleDefinition;
