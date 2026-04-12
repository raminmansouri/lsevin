/* client/fetch-addons.ts */
import { queryOptions, useQuery } from "@tanstack/react-query";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

export interface Addon {
    id: string;           // e.g. 'addon1'
    name: string;         // e.g. 'Premium Support'
    description: string;  // e.g. '24‑hr support'
    price: number;        // e.g. 49.99
    icon: any;            // component – kept as `any` on the client
    popular?: boolean;    // optional
    details: string[];    // e.g. ['24‑hr support', 'Email support']
}

export interface GetAddonsResponse {
    addons: Addon[];
}

/* ------------------------------------------- */
export const getAddonsClient = async (
    providerId,
    serviceId,
    specialistId, locale
): Promise<GetAddonsResponse> => {

    const searchParams = new URLSearchParams();
    if (providerId) {
        searchParams.set("providerId", providerId);
    } if (serviceId) {
        searchParams.set("serviceId", serviceId);
    } if (specialistId) {
        searchParams.set("specialistId", specialistId);
    } if (locale) {
        searchParams.set("locale", locale);
    }
    return await readData<GetAddonsResponse>(`/booking/getAddons?${searchParams.toString()}`);
};

/* ------------------------------------------- */
const tag = "booking-getAddons";
const queryAddonsKey = () => [tag] as const;

export const useGetAddons = (providerId,
    serviceId,
    specialistId, locale) => {
    const options = queryOptions<GetAddonsResponse, IProblem>({
        queryKey: queryAddonsKey(),
        queryFn: ({ pageParam }) =>
            getAddonsClient(providerId,
                serviceId,
                specialistId, locale),
                enabled:providerId && serviceId && specialistId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
    });

    const { data, error, isFetching, refetch } = useQuery(options);

    return { data, error, isFetching, refetch };
};
