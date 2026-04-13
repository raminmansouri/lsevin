import axios from "axios";
// import { LocationsResponse } from "@/types/location";
import { useLocale } from "next-intl";
import {queryOptions, useQuery} from "@tanstack/react-query";
import {LocationsResponse} from "@/app/[locale]/n/app/mobile/home/components/location-types.ts";

/**
 * Hook that fetches the list of available locations.
 * It automatically adds a language query string based on the
 * current locale from `next-intl`.
 */
export const useGetLocations = () => {
    const locale = useLocale();

    return useQuery<LocationsResponse>(
        ["locations", locale],
        async () => {
            const { data } = await axios.get<LocationsResponse>(
                `/api/locations?lang=${locale}`
            );
            return data;
        },
        queryOptions
    );
};
