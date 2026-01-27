import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

import { ILocationCity } from "../../types/location";

export const getAllCitiesByCountryClient = async (
  countryCode: string,
  locale: Locale
) => {
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", locale);

  return await readData<ILocationCity[]>(
    `/location/all-cities-by-country/${countryCode}?${searchParams.toString()}`
  );
};

const CITIES_BY_COUNTRY_CACHE_TAG = "all-cities-by-country";
const queryAllCitiesByCountryKey = (countryCode: string, locale: Locale) =>
  [CITIES_BY_COUNTRY_CACHE_TAG, countryCode, locale] as const;

export const useAllCitiesByCountry = (countryCode: string, locale: Locale) => {
  const options = queryOptions<ILocationCity[], IProblem>({
    queryKey: queryAllCitiesByCountryKey(countryCode, locale),
    queryFn: () => getAllCitiesByCountryClient(countryCode, locale),
    enabled: !!countryCode, // Only run when countryCode is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return {
    data: data || [],
    error,
    isFetching,
    refetch,
  };
};

export const useAllCitiesByCountryCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({ queryKey: [CITIES_BY_COUNTRY_CACHE_TAG] });
  };

  const invalidateCountryCache = (countryCode: string, locale: Locale) => {
    queryClient.invalidateQueries({
      queryKey: queryAllCitiesByCountryKey(countryCode, locale),
    });
  };

  return {
    invalidateAllCache,
    invalidateCountryCache,
  };
};
