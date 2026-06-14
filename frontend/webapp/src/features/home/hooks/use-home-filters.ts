import { useQueryState } from "nuqs";

import { defaultQueryStateOptions } from "@/hooks/use-filter-params";

import { homeFilterParams } from "../types";

interface HomeFiltersProps {
  startTransition: React.TransitionStartFunction;
}

export const useHomeFilters = ({ startTransition }: HomeFiltersProps) => {
  const [countryCode, setCountryCode] = useQueryState(
    "countryCode",
    homeFilterParams.countryCode.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );
  const [cityCode, setCityCode] = useQueryState(
    "cityCode",
    homeFilterParams.cityCode.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const handleCountryChange = (countryCode: string) => {
    setCountryCode(countryCode);
    setCityCode(null);
  };

  const handleCityChange = (cityCode: string) => {
    setCityCode(cityCode);
  };

  return {
    countryCode,
    cityCode,
    handleCountryChange,
    handleCityChange,
  };
};
