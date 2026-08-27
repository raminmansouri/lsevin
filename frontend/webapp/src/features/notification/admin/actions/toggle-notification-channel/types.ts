import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { NotificationChannelConfig } from "@/features/notification/server/channel.repository";
import { ToggleNotificationChannelSchema } from "./schema";

export type InputType = z.infer<typeof ToggleNotificationChannelSchema>;
export type OutputType = NotificationChannelConfig;
export type ReturnType = ActionState<InputType, OutputType>;
