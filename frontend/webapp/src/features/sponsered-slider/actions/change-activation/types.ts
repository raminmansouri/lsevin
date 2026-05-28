import type { z } from "zod/v4";

import type { ApiReturnType } from "@/types/network";

import type { ChangeSponseredSliderActivationSchema } from "./schema";

export type InputType = z.infer<typeof ChangeSponseredSliderActivationSchema>;
export type ReturnType = ApiReturnType<string>;
