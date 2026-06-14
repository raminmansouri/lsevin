import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type { BaseRequest } from "@/types/common";
import type { ApiReturnType } from "@/types/network";

import { getStaffIdTag } from "../../db/cache";
import { getStaffDetailsById } from "../../lib/staff-db";
import type { StaffDetails } from "../../types";

export const getStaffById = async (
  id: string,
  request?: Partial<BaseRequest>
): Promise<ApiReturnType<StaffDetails>> => {
  "use cache: remote";
  cacheTag(getStaffIdTag(id));
  cacheLife("default");

  return getStaffDetailsById(id, request);
};
