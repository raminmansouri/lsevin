import * as z from "zod/v4";

export const SavePaymentGatewaySchema = z.object({
  code: z.enum(["zarinpal"]),
  displayName: z.string().trim().min(1, "Display name is required.").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  isEnabled: z.boolean().default(false),
  supportsRefund: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(100),
  settings: z.object({
    merchantId: z.string().trim().optional().nullable(),
    sandbox: z.boolean().default(true),
    currency: z.enum(["IRR", "IRT"]).default("IRR"),
    minimumAmount: z.coerce.number().int().positive().default(10000),
    requestEndpoint: z.string().trim().optional().nullable(),
    verificationEndpoint: z.string().trim().optional().nullable(),
    descriptionTemplate: z.string().trim().max(250).default("LSevin booking {{bookingId}}"),
    enabledContexts: z
      .array(z.enum(["booking_online_card", "wallet_topup"]))
      .default(["booking_online_card", "wallet_topup"]),
  }),
});
