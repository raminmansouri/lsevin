import type { EntityReference, IssueInvoicePayload } from "@core/modules/contracts";

export type PaymentBillingEntity = {
  id: string;
  source?: EntityReference;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type IssuedInvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  paymentUrl: string;
};

export type CreatePaymentIntentPayload = {
  invoiceId: string;
  methodCode: string;
  authorizedProviderId?: string;
  amount?: number;
  currencyCode?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CreatePaymentIntentResult = {
  paymentIntentId: string;
  invoiceId: string;
  methodCode: string;
  status: string;
  amount: string;
  currencyCode: string;
  redirectUrl?: string | null;
  gatewayReference?: string | null;
};

export type UploadReceiptPayload = {
  invoiceId: string;
  methodCode: string;
  authorizedProviderId?: string;
  amount?: number;
  currencyCode?: string;
  trackingNumber?: string;
  receiptFileUrl: string;
  receiptStoragePath?: string;
  receiptOriginalName?: string;
  receiptMimeType?: string;
  receiptSizeBytes?: number;
  receiptContentSha256?: string;
  payerNote?: string;
};

export type VerifyReceiptPayload = {
  receiptId: string;
  approved: boolean;
  verifiedByUserId?: string;
  note?: string;
};

export type ReconcileBankStatementPayload = {
  bankAccountCode: string;
  currencyCode: string;
  statementReference?: string;
  lines: Array<{
    postedAt: string;
    amount: number;
    trackingNumber?: string;
    description?: string;
  }>;
};

export type BillingCapabilityPayload =
  | IssueInvoicePayload
  | CreatePaymentIntentPayload
  | UploadReceiptPayload
  | VerifyReceiptPayload
  | ReconcileBankStatementPayload;
