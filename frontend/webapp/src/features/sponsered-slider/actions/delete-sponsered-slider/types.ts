import type { z } from "zod/v4";

import type { ApiReturnType } from "@/types/network";

import type { DeleteSponseredSliderSchema } from "./schema";

export type InputType = z.infer<typeof DeleteSponseredSliderSchema>;
export type ReturnType = ApiReturnType<string>;
