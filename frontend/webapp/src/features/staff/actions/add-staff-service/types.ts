import { IProblem } from "@/types/error";

import { AddStaffServiceFormData } from "./schema";

export type InputType = AddStaffServiceFormData;
export type ReturnType = {
  data?: string;
  error?: IProblem;
};
