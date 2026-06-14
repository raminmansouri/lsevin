"use client";

import { useQueryState } from "nuqs";

import { defaultQueryStateOptions } from "@/hooks/use-filter-params";

import { providerTypeFilterParams } from "../types/filters";

interface UseProviderTypeFilterProps {
  startTransition: React.TransitionStartFunction;
}

export const useProviderTypeFilter = ({
  startTransition,
}: UseProviderTypeFilterProps) => {
  const [providerTypeIds, setProviderTypeIds] = useQueryState(
    "providerTypeIds",
    providerTypeFilterParams.providerTypeIds.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const setProviderTypeFilter = (values: string[]) => {
    setProviderTypeIds(values);
  };

  const resetProviderTypeFilter = () => {
    setProviderTypeIds([]);
  };

  return {
    providerTypeIds,
    setProviderTypeFilter,
    resetProviderTypeFilter,
  };
};
