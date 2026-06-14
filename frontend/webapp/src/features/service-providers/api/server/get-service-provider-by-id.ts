import "server-only";

import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import {
  AdminServiceProviderDetails,
  getAdminServiceProviderById,
} from "../../db/admin-service-providers.queries";

export const getServiceProviderById = async (
  request: BaseRequest,
  id: string
): Promise<ApiReturnType<AdminServiceProviderDetails>> => {
  return getAdminServiceProviderById(request.locale || "fa", id);
};
