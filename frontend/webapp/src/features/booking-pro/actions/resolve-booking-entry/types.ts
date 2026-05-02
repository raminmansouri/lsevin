import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { BookingEntryResolution } from "@/features/booking-pro/server/booking-entry.repository";
import { ResolveBookingEntrySchema } from "./schema";

export type InputType = z.infer<typeof ResolveBookingEntrySchema>;
export type OutputType = BookingEntryResolution;
export type ReturnType = ActionState<InputType, OutputType>;
