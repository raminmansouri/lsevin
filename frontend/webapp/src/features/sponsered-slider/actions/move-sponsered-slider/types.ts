import type { z } from "zod/v4";

import type { ApiReturnType } from "@/types/network";

import type { MoveSponseredSliderSchema } from "./schema";

export type InputType = z.infer<typeof MoveSponseredSliderSchema>;
export type ReturnType = ApiReturnType<string>;
