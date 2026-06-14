import "server-only";

import { postData } from "@/config/http/http-service.server";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

export interface VerifyOtpRequest {
  code: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
}

export const verifyOtp = async (
  request: BaseRequest,
  data: VerifyOtpRequest
): Promise<ApiReturnType<VerifyOtpResponse>> => {
  return postData<VerifyOtpRequest, VerifyOtpResponse>(
    `${IDENTITY_MODULE_BASE_PATH}/otp/verify`,
    data,
    { ...request }
  );
};
