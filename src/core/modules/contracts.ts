export type EntityReference = {
  moduleCode: string;
  entityType: string;
  entityId: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
};

export type ModuleCapabilityRequest<TPayload = Record<string, unknown>> = {
  capability: string;
  requestedByUserId?: string;
  /** Legacy compatibility metadata. Prefer `source.moduleCode` in new code. */
  sourceModule?: string;
  /** Optional actor metadata retained for older standalone modules. */
  actor?: Record<string, unknown>;
  source?: EntityReference;
  payload: TPayload;
};

export type ModuleCapabilityResult<TData = Record<string, unknown>> = {
  ok: boolean;
  message?: string;
  data?: TData;
};

export type BillingInvoiceLineInput = {
  description: string;
  quantity: number;
  unitAmount: number;
  currencyCode: string;
  taxPercent?: number;
  metadata?: Record<string, unknown>;
};

export type IssueInvoicePayload = {
  invoiceType: "standard" | "tax_ir" | "proforma" | "international" | "subscription" | "profile_ownership";
  billTo: EntityReference;
  sourceDocument: EntityReference;
  title: string;
  currencyCode: string;
  dueDate?: string;
  lines: BillingInvoiceLineInput[];
  locale?: string;
  metadata?: Record<string, unknown>;
};

export type ModuleEntitlementCheck = {
  moduleCode: string;
  capability: string;
  subject: EntityReference;
  requestedByUserId?: string;
};
