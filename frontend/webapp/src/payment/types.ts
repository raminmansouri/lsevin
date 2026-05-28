export type PaymentGatewayCode = "zarinpal";

export type PaymentGatewaySettings = {
  merchantId?: string | null;
  sandbox?: boolean;
  currency?: "IRR" | "IRT";
  minimumAmount?: number | null;
  requestEndpoint?: string | null;
  verificationEndpoint?: string | null;
  descriptionTemplate?: string | null;
  enabledContexts?: Array<"booking_online_card" | "wallet_topup">;
  metadata?: Record<string, unknown>;
};

export type PaymentGatewayRuntimeConfig = {
  code: PaymentGatewayCode;
  provider: string;
  displayName: string;
  isEnabled: boolean;
  settings: PaymentGatewaySettings;
};

export type GatewayPaymentStatus = "pending" | "requires_action" | "succeeded" | "failed" | "cancelled";

export type PaymentAttempt = {
  paymentId: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  sourceAmount: number;
  sourceCurrency: string;
  exchangeRate?: number | null;
  description: string;
  customer?: {
    email?: string | null;
    mobile?: string | null;
  };
  metadata?: Record<string, unknown>;
};

export type PaymentInitiationRequest = {
  payment: PaymentAttempt;
  locale: string;
  callbackUrl: string;
};

export type PaymentInitiationResult = {
  paymentId: string;
  bookingId: string;
  gateway: PaymentGatewayCode;
  status: GatewayPaymentStatus;
  redirectUrl: string;
  authority?: string;
  amount: number;
  currency: string;
  raw?: unknown;
};

export type PaymentVerificationRequest = {
  authority: string;
  status?: string | null;
  amount: number;
  currency: string;
};

export type PaymentVerificationResult = {
  success: boolean;
  alreadyVerified?: boolean;
  referenceId?: string | number | null;
  cardPan?: string | null;
  fee?: number | string | null;
  code?: number | string | null;
  message?: string | null;
  raw?: unknown;
};

export type PaymentProvider = {
  code: PaymentGatewayCode;
  initiate(input: PaymentInitiationRequest, config?: PaymentGatewayRuntimeConfig): Promise<PaymentInitiationResult>;
  verify(input: PaymentVerificationRequest, config?: PaymentGatewayRuntimeConfig): Promise<PaymentVerificationResult>;
};

export type InitiateBookingPaymentInput = {
  bookingId: string;
  gateway?: PaymentGatewayCode;
};

export type InitiateBookingPaymentOutput = PaymentInitiationResult;

export type VerifyGatewayPaymentInput = {
  gateway: PaymentGatewayCode;
  authority: string;
  status?: string | null;
};

export type VerifyGatewayPaymentOutput = {
  bookingId?: string;
  paymentId?: string;
  status: GatewayPaymentStatus;
  referenceId?: string | number | null;
  message?: string | null;
};
