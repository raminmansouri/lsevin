import "server-only";
import type { BaseRequest } from "@/types/common";
import { getProviderPolicyTypes } from "../../lib/provider-policy-types-db";
export const getProviderPolicyTypesServer = (request?: Partial<BaseRequest>) => getProviderPolicyTypes(request);
