import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import { GeneratePushKeysSchema } from "./schema";

export type InputType = z.infer<typeof GeneratePushKeysSchema>;
export type OutputType = { publicKey: string };
export type ReturnType = ActionState<InputType, OutputType>;
