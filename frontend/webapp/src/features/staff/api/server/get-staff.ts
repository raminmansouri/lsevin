import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type { BaseRequest } from "@/types/common";
import type { FilterParams } from "@/types/filter";
import type { ApiReturnType, PaginatedResult } from "@/types/network";

import { getStaffGlobalTag } from "../../db/cache";
import { getStaffRows } from "../../lib/staff-db";
import type { Staff } from "../../types";

export const getStaff = async (
  request: Partial<BaseRequest>,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<Staff>>> => {
  "use cache: remote";
  cacheTag(getStaffGlobalTag());
  cacheLife("default");

  return getStaffRows(request, params);
};
