import * as z from "zod/v4";

export const SavePaymentGatewaySchema = z.object({
  code: z.enum(["zarinpal", "btcpay"]),
  displayName: z.string().trim().min(1, "Display name is required.").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  isEnabled: z.boolean().default(false),
  supportsRefund: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(100),
  settings: z.object({
    merchantId: z.string().trim().optional().nullable(),
    sandbox: z.boolean().default(true),
    currency: z.enum(["IRR", "IRT", "USD", "EUR"]).default("IRR"),
    minimumAmount: z.coerce.number().int().positive().default(10000),
    requestEndpoint: z.string().trim().optional().nullable(),
    verificationEndpoint: z.string().trim().optional().nullable(),
    descriptionTemplate: z.string().trim().max(250).default("LSevin booking {{bookingId}}"),
    enabledContexts: z
      .array(z.enum(["booking_online_card", "wallet_topup"]))
      .default(["booking_online_card", "wallet_topup"]),
    // BTCPay Server connection (optional; secrets normally provided via env).
    serverUrl: z.string().trim().optional().nullable(),
    storeId: z.string().trim().optional().nullable(),
    apiKey: z.string().trim().optional().nullable(),
    webhookSecret: z.string().trim().optional().nullable(),
    expirationMinutes: z.coerce.number().int().positive().max(1440).optional().nullable(),
  }),
});
