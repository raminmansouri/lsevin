import "server-only";
import type { BaseRequest } from "@/types/common";
import { getProviderPolicyTypeById } from "../../lib/provider-policy-types-db";
export const getProviderPolicyTypeByIdServer = (id: string, request?: Partial<BaseRequest>) => getProviderPolicyTypeById(id, request);
