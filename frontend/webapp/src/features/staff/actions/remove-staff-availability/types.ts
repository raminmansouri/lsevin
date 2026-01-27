import { IProblem } from "@/types/error";

import { RemoveStaffAvailabilityInput } from "./schema";

export type InputType = RemoveStaffAvailabilityInput;
export type ReturnType = {
  data?: string;
  error?: IProblem;
};
