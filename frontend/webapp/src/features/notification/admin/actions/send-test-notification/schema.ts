import * as z from "zod/v4";

export const SendTestNotificationSchema = z.object({
  targetUserId: z.string().trim().min(1),
  channel: z.enum(["in_app", "email", "sms", "push", "whatsapp", "bale"]),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(1000),
});
