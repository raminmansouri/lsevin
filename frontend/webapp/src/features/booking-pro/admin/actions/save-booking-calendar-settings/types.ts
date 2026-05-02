import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { BookingCalendarSettings } from "@/features/booking-pro/server/booking-calendar-settings.repository";
import { SaveBookingCalendarSettingsSchema } from "./schema";

export type InputType = z.infer<typeof SaveBookingCalendarSettingsSchema>;
export type OutputType = BookingCalendarSettings;
export type ReturnType = ActionState<InputType, OutputType>;
