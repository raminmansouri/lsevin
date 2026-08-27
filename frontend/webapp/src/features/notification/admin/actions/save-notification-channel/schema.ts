import * as z from "zod/v4";

export const SaveNotificationChannelSchema = z.object({
  code: z.enum(["in_app", "email", "sms", "push", "whatsapp", "bale"]),
  isEnabled: z.boolean().default(false),
  settings: z.object({
    smtpHost: z.string().trim().optional().nullable(),
    smtpPort: z.coerce.number().int().positive().max(65535).optional().nullable(),
    smtpUser: z.string().trim().optional().nullable(),
    smtpPassword: z.string().trim().optional().nullable(),
    smtpSecure: z.boolean().default(false),
    fromAddress: z.string().trim().optional().nullable(),
    fromName: z.string().trim().optional().nullable(),
    smsUsername: z.string().trim().optional().nullable(),
    smsPassword: z.string().trim().optional().nullable(),
    smsBaseUrl: z.string().trim().optional().nullable(),
    vapidPublicKey: z.string().trim().optional().nullable(),
    vapidPrivateKey: z.string().trim().optional().nullable(),
    vapidSubject: z.string().trim().optional().nullable(),
    whatsappApiKey: z.string().trim().optional().nullable(),
    whatsappBaseUrl: z.string().trim().optional().nullable(),
    baleBotToken: z.string().trim().optional().nullable(),
    baleBotUsername: z.string().trim().optional().nullable(),
  }),
});
