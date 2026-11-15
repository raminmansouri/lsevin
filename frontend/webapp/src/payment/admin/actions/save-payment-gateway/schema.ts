import * as z from "zod/v4";
import { normalizeHost } from "@/lib/http/host";
import { PAYMENT_GATEWAY_CODES } from "@/payment/gateways";

export const SavePaymentGatewaySchema = z.object({
  code: z.enum(PAYMENT_GATEWAY_CODES),
  displayName: z.string().trim().min(1, "Display name is required.").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  isEnabled: z.boolean().default(false),
  supportsRefund: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(100),
  settings: z.object({
    merchantId: z.string().trim().optional().nullable(),
    // Zibal: one merchant token per domain. A blank token keeps the stored one for that domain.
    domainMerchants: z
      .array(
        z.object({
          host: z
            .string()
            .trim()
            .min(1, "Enter a domain.")
            .refine((value) => normalizeHost(value) !== null, "Enter a domain like lsevincare.com."),
          merchant: z.string().trim().max(200).default(""),
        })
      )
      .max(20)
      .refine(
        (rows) => new Set(rows.map((row) => normalizeHost(row.host))).size === rows.length,
        "Each domain can only be listed once."
      )
      .optional(),
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
