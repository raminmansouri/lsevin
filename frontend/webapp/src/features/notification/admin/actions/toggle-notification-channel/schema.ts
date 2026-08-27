import * as z from "zod/v4";

export const ToggleNotificationChannelSchema = z.object({
  code: z.enum(["in_app", "email", "sms", "push", "whatsapp", "bale"]),
  isEnabled: z.boolean(),
});
