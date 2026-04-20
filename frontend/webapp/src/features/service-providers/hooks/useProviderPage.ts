import { useQuery } from '@tanstack/react-query';
import { getProviderPage } from '../api/providerPageApi';
import { ProviderPage } from '../types/ProviderPage';

/**
 * React‑Query wrapper that can be used on the client or in a
 * `getServerSideProps` function (just change the import path).
 *
 * `staleTime` is set to 5 min so the UI doesn’t keep refetching
 * while you’re browsing the site – tweak as you like.
 */
export function useProviderPage(
    providerId: string,
    locale: string,
) {
    return useQuery<ProviderPage, Error>({
        queryKey: ['providerPage', providerId, locale],
        queryFn: () => getProviderPage(providerId, locale),
        enabled: !!providerId && !!locale,
        staleTime: 1000 * 60 * 5,      // 5 min
        refetchOnWindowFocus: false,   // no auto‑refetch when you tab back
    });
}
