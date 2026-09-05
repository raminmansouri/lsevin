import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { BookingSettings } from "@/features/booking-pro/server/booking-settings.repository";
import { SaveBookingSettingsSchema } from "./schema";

export type InputType = z.infer<typeof SaveBookingSettingsSchema>;
export type OutputType = BookingSettings;
export type ReturnType = ActionState<InputType, OutputType>;
