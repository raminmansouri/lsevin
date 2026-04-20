// src/features/specialist-page/server/get-specialist-page.ts
import { CATEGORY_MODULE_BASE_PATH } from '@/features/shared/types/constants';
import { BaseRequest } from '@/types/common';
import { SpecialistPageResponse } from '../../types/specialist-page-types';
import { readData } from '@/config/http/http-service.server';
import { ApiReturnType } from '@/types/network';
import { getSpecialistPageByIdTag, getTrendingServicesTag } from '../../db/cache';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { cacheLife } from 'next/dist/server/use-cache/cache-life';

// cache‑friendly helper – runs in Node / Next‑API context
export const getSpecialistPageServer = async (
    request: BaseRequest,
    specialistId: string,
): Promise<ApiReturnType<SpecialistPageResponse>> => {
    "use cache: remote";
    cacheTag(getSpecialistPageByIdTag(specialistId));
    cacheLife("default");

  
  const response = await readData<SpecialistPageResponse>(
    `${CATEGORY_MODULE_BASE_PATH    }/service-providers/getSpecialistPage/${specialistId}`,
    {
      ...request,
    }
  );


  return response;
};
