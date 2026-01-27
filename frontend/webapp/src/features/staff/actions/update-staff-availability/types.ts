import { IProblem } from "@/types/error";

import { UpdateStaffAvailabilityFormData } from "./schema";

export type InputType = UpdateStaffAvailabilityFormData;
export type ReturnType = {
  data?: string;
  error?: IProblem;
};
