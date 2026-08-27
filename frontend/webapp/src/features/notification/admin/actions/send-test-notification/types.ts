import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import { SendTestNotificationSchema } from "./schema";

export type InputType = z.infer<typeof SendTestNotificationSchema>;
export type OutputType = {
  status: "sent" | "failed" | "cancelled" | "queued";
  providerResponse: string | null;
  errorMessage: string | null;
};
export type ReturnType = ActionState<InputType, OutputType>;
