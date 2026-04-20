/* ----------------------------------------------------
 * This file turns the API call into a query‑friendly
 * wrapper that you can consume with React‑Query or
 * whatever state‑management you prefer.
 * ---------------------------------------------------- */

import { readData } from '@/config/http/http-service.client';
import { useQuery } from '@tanstack/react-query';
import {  GetServicePageQueryKey } from '../../types/service-page.types';
import { CUSTOMER_MODULE_BASE_PATH } from '@/features/shared/types/constants';
import { Locale } from 'next-intl';

export const getServicePageQueryKey = (serviceId: string, locale: string): GetServicePageQueryKey =>
  ['service-page', serviceId, locale];


  export const fetchServicePageData = async (
    serviceId: string,
    locale: Locale
  ) => {
    const searchParams = new URLSearchParams();

    console.log('fetch fetchServicePageData')
  
    return await readData<GetServicePageByIdResponse>(
      `/service-providers/get-service-page?serviceId=${serviceId}`
    );
  };

export const useFetchServicePage = (serviceId: string, locale: string) => {

  console.log('useFetchServicePage')
  const queryKey = getServicePageQueryKey(serviceId, locale);

  return useQuery<GetServicePageByIdResponse>({
    queryKey,
    queryFn: ({ pageParam }) =>
    fetchServicePageData(
      serviceId,
      locale
    ),
    enabled:true,
    staleTime: 1000 * 60 * 5,          // 5 min – tweak as needed
    gcTime: 1000 * 60 * 30          // 30 min – tweak as needed
  });
};


