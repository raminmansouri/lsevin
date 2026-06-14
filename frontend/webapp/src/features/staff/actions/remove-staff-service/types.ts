import { IProblem } from "@/types/error";

import { RemoveStaffServiceInput } from "./schema";

export type InputType = RemoveStaffServiceInput;
export type ReturnType = {
  data?: string;
  error?: IProblem;
};
