import { readData } from "@/config/http/http-service.client";

import { StaffDetails } from "../../types";

export const getStaffDetailsClient = async (
  staffId: string
): Promise<StaffDetails> =>
  await readData<StaffDetails>(`/staff/${staffId}/details`);
