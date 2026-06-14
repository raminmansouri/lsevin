// src/features/specialist-page/client/fetch-specialist-page.ts
import {
    useQuery,
    UseQueryOptions,
    UseQueryResult
  } from '@tanstack/react-query';
import { IProblem } from '@/types/error';
import { SpecialistPageResponse } from '../../types/specialist-page-types';
import { Locale } from 'next-intl';
import { readData } from '@/config/http/http-service.client';
  
  export type SpecialistPageQueryOptions = Omit<
    UseQueryOptions<SpecialistPageResponse, IProblem>,
    'queryKey' | 'queryFn'
  >;
  
  const ENDPOINT = '/service-providers/get-specialist-page';
  
  /**
   * Server‑only fetcher
   */
  export const getSpecialistPageClient = async (
    specialistId: string,
    locale: Locale
  ): Promise<SpecialistPageResponse> => {
    const query = new URLSearchParams({
      SpecialistId: specialistId,
      Locale: locale
    });
  
    const url = `${ENDPOINT}?${query.toString()}`;
    return readData<SpecialistPageResponse>(url);
  };
  
  /**
   * Tanstack‑React‑Query hook
   */
  export const useFetchSpecialistPage = (
    specialistId: string,
    locale: Locale,
    options?: SpecialistPageQueryOptions
  ): UseQueryResult<SpecialistPageResponse, unknown> => {
    const queryKey = ['booking-getSpecialistPageResponse', { specialistId, locale }];
  
    return useQuery<SpecialistPageResponse>({
      queryKey,
      queryFn: ({ pageParam }) =>
      getSpecialistPageClient(specialistId, locale),
      staleTime: 1000 * 60 * 5,          // 5 min – tweak as needed
      gcTime: 1000 * 60 * 30          // 30 min – tweak as needed
    });

    
  };
  