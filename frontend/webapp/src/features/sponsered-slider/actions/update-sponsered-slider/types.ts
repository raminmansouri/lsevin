import type { z } from "zod/v4";

import type { ApiReturnType } from "@/types/network";

import type { UpdateSponseredSliderSchema } from "./schema";

export type InputType = z.infer<typeof UpdateSponseredSliderSchema>;
export type ReturnType = ApiReturnType<string>;
