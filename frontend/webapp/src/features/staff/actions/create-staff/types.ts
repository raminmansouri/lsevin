import type { IProblem } from "@/types/error";
import type { CreateStaffFormData } from "./schema";
export type InputType = CreateStaffFormData;
export type ReturnType = { data?: string; error?: IProblem };
