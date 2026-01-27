import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { removeGalleryItemSchema } from "./schema";

export type InputType = z.infer<typeof removeGalleryItemSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "ServiceProvider.gallery" as const;
