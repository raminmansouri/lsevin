import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import { CreateBaleLinkCodeSchema } from "./schema";

export type InputType = z.infer<typeof CreateBaleLinkCodeSchema>;
export type OutputType = { code: string };
export type ReturnType = ActionState<InputType, OutputType>;
