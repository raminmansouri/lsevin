import { ExploreResponse } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";

interface ExploreFilterParams extends FilterParams {}

type ExploreClientFilters = {
  priceRange: number[];
  distance: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  responseTime: "any" | "fast" | "instant";
  currencyCode?: string | null;
  q?: string;
  categoryId?: string | null;
  providerTypeId?: string | null;
  countryCode?: string | null;
  cityCode?: string | null;
};

function normalizeRange(range?: number[]) {
  const values = Array.isArray(range)
    ? range.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  if (values.length >= 2) {
    const min = Math.max(0, values[0]);
    const max = Math.max(0, values[1]);
    return min > max ? [max, min] : [min, max];
  }

  if (values.length === 1) {
    return [0, Math.max(0, values[0])];
  }

  return [0, 0];
}

function normalizeFilters(filters?: ExploreClientFilters): ExploreClientFilters | undefined {
  if (!filters) return undefined;

  return {
    ...filters,
    priceRange: normalizeRange(filters.priceRange),
    distance: Math.max(0, Number(filters.distance) || 0),
    minRating: Math.max(0, Number(filters.minRating) || 0),
    languages: Array.isArray(filters.languages) ? filters.languages.filter(Boolean) : [],
    responseTime: filters.responseTime || "any",
    currencyCode: filters.currencyCode?.trim().toUpperCase() || null,
    q: filters.q?.trim() || "",
    categoryId: filters.categoryId?.trim() || null,
    providerTypeId: filters.providerTypeId?.trim() || null,
    countryCode: filters.countryCode?.trim() || null,
    cityCode: filters.cityCode?.trim() || null,
  };
}

const fetchExplore = async (
  params?: ExploreFilterParams,
  filters?: ExploreClientFilters,
): Promise<ExploreResponse> => {
  const searchParams = new URLSearchParams();
  const normalizedFilters = normalizeFilters(filters);

  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if (normalizedFilters) {
    addAllParams(searchParams, normalizedFilters);
  }

  const path = `/customer/explore?${searchParams.toString()}`;

  const httpService = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const options: AxiosRequestConfig = {
    method: "GET",
  };
  const response = await httpService(path, options);

  return response.data as ExploreResponse;
};

const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "explore";
const queryKey = (filters?: ExploreClientFilters) =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG, normalizeFilters(filters)] as const;

export const useFetchExplore = (filters: ExploreClientFilters) => {
  const options = queryOptions<ExploreResponse, IProblem>({
    queryKey: queryKey(filters),
    queryFn: () => fetchExplore(undefined, filters),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return {
    data,
    error,
    isFetching,
    refetch,
  };
};
