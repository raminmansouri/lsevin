export type GatewayPaymentRequest = {
  paymentIntentId: string;
  invoiceId: string;
  amount: number;
  currencyCode: string;
  description: string;
  callbackUrl: string;
  payerEmail?: string | null;
  payerMobile?: string | null;
  metadata?: Record<string, unknown>;
};

export type GatewayPaymentStartResult = {
  gatewayReference: string;
  redirectUrl: string;
  rawResponse: Record<string, unknown>;
};

export type GatewayVerificationRequest = {
  paymentIntentId?: string;
  authority?: string;
  transactionId?: string;
  status?: string;
  amount?: number;
  currencyCode?: string;
  rawPayload?: Record<string, unknown>;
};

export type GatewayVerificationResult = {
  verified: boolean;
  gatewayReference?: string;
  verifiedAmount?: number | null;
  cardPan?: string | null;
  rawResponse: Record<string, unknown>;
};
