import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
import { homeSearchParamsCache } from "@/features/home/types";
import { Link } from "@/i18n/navigation";
import { PageProps, TranslationType } from "@/types/next";
import React from 'react'
import { env } from "@/config/env/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Heart, Star, TrendingUp, Users } from "lucide-react";
import { useLocale } from "next-intl";
import { localeToHeader } from "@/config/locales";
import { LocaleTypes } from "@/types/common";
import { getLocalizedValue } from "@/features/shared/utils/localization";
import { PaginatedResult } from "@/types/network";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { TrustedProvider } from "@/features/service-providers/types";
import { getTrustedProviders } from "@/features/service-providers/api/server/get-trusted-providers";
import { FilterParams } from "@/types/filter";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";



  const trustedProviders = [
    { 
      name: 'Istanbul Medical Center', 
      rating: 4.9, 
      verified: true,
      image: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=200&h=200&fit=crop.jpg'
    },
    { 
      name: 'Dubai Smile Clinic', 
      rating: 4.9, 
      verified: true,
      image: '/unsplash_images/photo-1629909613654-28e377c37b09__w=200&h=200&fit=crop.jpg'
    },
    { 
      name: 'Bali Wellness Resort', 
      rating: 5.0, 
      verified: true,
      image: '/unsplash_images/photo-1540555700478-4be289fbecef__w=200&h=200&fit=crop.jpg'
    },
    { 
      name: 'Cyprus Fertility Center', 
      rating: 4.8, 
      verified: true,
      image: '/unsplash_images/photo-1551190822-a9333d879b1f__w=200&h=200&fit=crop.jpg'
    },
  ];
  


const HomeTrustedProvidersSuspenseBoundary = async ({
  params,
  searchParams,
}: PageProps) => {
  const searchParamsData = await searchParams;
  const {  } =
    homeSearchParamsCache.parse(searchParamsData);

    const filterParams: FilterParams = {
        pageNumber: 1,
        pageSize: 5,
        filters: "",
        startDate: "",
        endDate: "",
        sortOrder: "",
      };

  const providerProviders = await withBaseHeaders((locale, token) =>
    getTrustedProviders(
      { locale, token },
      filterParams
    )
  );

  return (
    <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
      {(t) => (
        <>
          <ServerFetchResult<PaginatedResult<TrustedProvider>>
            result={providerProviders}
          >
            {(TrustedProvidersData) => (
              <>
                <HomeTrustedProviders
                  TrustedProvidersData={TrustedProvidersData}
                  t={t}
                />
              </>
            )}
          </ServerFetchResult>
        </>
      )}
    </LocaleBoundary>
  );
};


const HomeTrustedProviders = ({
  TrustedProvidersData,
  t,
}: {
  TrustedProvidersData: PaginatedResult<TrustedProvider>;
  t: TranslationType;
}) => {
  if (TrustedProvidersData?.items?.length==0) {
    return (
      <section>
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("providerProviders.title")}
        </h2>
        <p className="text-muted-foreground text-center">
          {t("providerProviders.noProviders")}
        </p>
      </section>
    );
  }

  return (
        TrustedProvidersData?.items?.map((provider, providerIndex) => (
          <HomeTrustedProvider
            key={`${provider.name}-${providerIndex}`}
            index={providerIndex+1}
            provider={provider}
            t={t}
          />
        ))
  );
};

const HomeTrustedProvider = ({
  provider,
  index,
  t,
}: {
  index:number,
  provider:TrustedProvider;
  t: TranslationType;
}) => {

    const locale = useLocale();
    const localeHeader = localeToHeader(locale as LocaleTypes);
  
  if (!provider) {
    return null;
  }

  return (

            <Link
              key={provider.id}
              href={`/n/app/mobile/provider/${provider.id }`}
              // onClick={() => navigate(`/n/app/mobile/clinic/${idx + 1}`)}
              className="flex-none w-44 bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >


              {/* {JSON.stringify(provider)} */}
              <div className="relative mb-3">
                <ImageWithFallback fill 
                  src={provider?.image ? `${env.NEXT_PUBLIC_FILES_URL}/${provider?.image}`:
                trustedProviders[0]?.image}
                  alt={provider.name}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                {provider.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                    <BadgeCheck size={18} className="text-[#eacb7f]" />
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 leading-tight">
                {provider.name}
              </h3>
              
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm text-gray-900">{provider.rating}</span>
                <span className="text-xs text-gray-500 ml-0.5">Verified</span>
              </div>
            </Link>
          
    
  );
};




const providerProviderCardSkeleton = () => {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-2">
      <div className="relative flex flex-1 flex-col">
        {/* Mobile: Horizontal Layout, Desktop: Vertical Layout */}
        <div className="flex h-full flex-row items-center md:flex-col md:items-stretch">
          {/* Image skeleton */}
          <div className="p-2 md:w-full md:p-0">
            <Skeleton className="h-24 w-24 flex-shrink-0 rounded-xl md:h-48 md:w-full md:rounded-none" />
          </div>

          {/* Content skeleton */}
          <CardContent className="flex h-full min-w-0 flex-1 flex-col py-2 ps-2 pe-4 md:p-2">
            {/* Main content area that can expand */}
            <div className="min-w-0 flex-1 space-y-1 md:space-y-2">
              {/* Name skeleton */}
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="ml-auto h-6 w-3/4" />
              </div>

              {/* Attributes skeleton - Mobile: visible, Desktop: hidden */}
              <div className="flex max-w-full min-w-0 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
                <Skeleton className="h-6 w-16 flex-shrink-0" />
                <Skeleton className="h-6 w-20 flex-shrink-0" />
                <Skeleton className="h-6 w-14 flex-shrink-0" />
              </div>

              {/* Attributes skeleton - Desktop: visible, Mobile: hidden */}
              <div className="hidden max-w-full min-w-0 gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
                <Skeleton className="h-6 w-16 flex-shrink-0" />
                <Skeleton className="h-6 w-20 flex-shrink-0" />
                <Skeleton className="h-6 w-14 flex-shrink-0" />
              </div>
            </div>

            {/* Price skeleton - Always at bottom */}
            <div className="mt-auto min-w-0">
              <div className="flex min-w-0 flex-row justify-between">
                <Skeleton className="ml-auto h-4 w-20 flex-shrink-0" />
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default HomeTrustedProvidersSuspenseBoundary;
