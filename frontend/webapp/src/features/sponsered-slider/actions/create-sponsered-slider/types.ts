import type { z } from "zod/v4";

import type { ApiReturnType } from "@/types/network";

import type { CreateSponseredSliderSchema } from "./schema";

export type InputType = z.infer<typeof CreateSponseredSliderSchema>;
export type ReturnType = ApiReturnType<string>;
