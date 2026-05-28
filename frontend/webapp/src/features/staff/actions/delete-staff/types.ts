import type { IProblem } from "@/types/error";
import type { DeleteStaffInput } from "./schema";
export type InputType = DeleteStaffInput;
export type ReturnType = { data?: "deleted" | "deactivated"; error?: IProblem };
