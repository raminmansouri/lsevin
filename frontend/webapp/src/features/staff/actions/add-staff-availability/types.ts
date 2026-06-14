import { IProblem } from "@/types/error";

import { AddStaffAvailabilityFormData } from "./schema";

export type InputType = AddStaffAvailabilityFormData;
export type ReturnType = {
  data?: string;
  error?: IProblem;
};
