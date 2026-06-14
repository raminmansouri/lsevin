import { useQueryState } from "nuqs";

import { defaultQueryStateOptions } from "@/hooks/use-filter-params";

import type { AttributeFilterValue } from "../types";
import { byTypeFilterParams } from "../types";

interface ByTypeFiltersProps {
  startTransition: React.TransitionStartFunction;
}

export const useByTypeFilters = ({ startTransition }: ByTypeFiltersProps) => {
  const [search, setSearch] = useQueryState(
    "search",
    byTypeFilterParams.search.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const [countryCode, setCountryCode] = useQueryState(
    "countryCode",
    byTypeFilterParams.countryCode.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const [cityCode, setCityCode] = useQueryState(
    "cityCode",
    byTypeFilterParams.cityCode.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const [attributeFilters, setAttributeFilters] = useQueryState(
    "attributeFilters",
    byTypeFilterParams.attributeFilters.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setCityCode(null);
  };

  const handleCityChange = (code: string) => {
    setCityCode(code);
  };

  const handleAttributeFilterAdd = (filter: AttributeFilterValue) => {
    setAttributeFilters((current) => {
      const curr = (current as AttributeFilterValue[]) || [];
      return [...curr, filter];
    });
  };

  const handleAttributeFilterRemove = (attributeId: string, value: string) => {
    setAttributeFilters((current) => {
      const curr = (current as AttributeFilterValue[]) || [];
      return curr.filter(
        (f: AttributeFilterValue) =>
          !(f.attributeDefinitionId === attributeId && f.value === value)
      );
    });
  };

  const handleAttributeFiltersClear = () => {
    setAttributeFilters([]);
  };

  const handleClearAll = () => {
    setSearch("");
    setCountryCode(null);
    setCityCode(null);
    setAttributeFilters([]);
  };

  return {
    search,
    countryCode,
    cityCode,
    attributeFilters,
    handleSearchChange,
    handleCountryChange,
    handleCityChange,
    handleAttributeFilterAdd,
    handleAttributeFilterRemove,
    handleAttributeFiltersClear,
    handleClearAll,
  };
};
