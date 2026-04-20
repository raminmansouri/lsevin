import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
import { homeSearchParamsCache } from "@/features/home/types";
import { getPublicServiceProviders } from "@/features/service-providers/api/server/get-public-service-providers";
import { IServiceProvider, ITrendingServiceResponse, IServiceProvidersGroupedResponse, ServiceProviderDetails, ServiceProviderService, TrendingService } from "@/features/service-providers/types";
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
import { getTrendingServices } from "@/features/service-providers/api/server/get-trending-services";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";



  const trendingservices = [
    { 
      id: 1,
      name: 'Hair Transplant', 
      growth: '+45%', 
      bookings: '2.3k',
      image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg' 
    },
    { 
      id: 2,
      name: 'Dental Implants', 
      growth: '+32%', 
      bookings: '1.8k',
      image: '/unsplash_images/photo-1606811971618-4486d14f3f99__w=600&h=400&fit=crop.jpg' 
    },
    { 
      id: 3,
      name: 'IVF service', 
      growth: '+28%', 
      bookings: '1.5k',
      image: '/unsplash_images/photo-1584515979956-d9f6e5d09982__w=600&h=400&fit=crop.jpg' 
    },
    { 
      id: 4,
      name: 'Laser Eye Surgery', 
      growth: '+25%', 
      bookings: '1.2k',
      image: '/unsplash_images/photo-1585435557343-3b092031a831__w=600&h=400&fit=crop.jpg' 
    },
  ];
  


const HomeTrendingServicesSuspenseBoundary = async ({
  params,
  searchParams,
}: PageProps) => {
  const searchParamsData = await searchParams;
  const {  } =
    homeSearchParamsCache.parse(searchParamsData);

  const serviceProviders = await withBaseHeaders((locale, token) =>
    getTrendingServices(
      { locale, token }
    )
  );

  return (
    <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
      {(t) => (
        <>
          <ServerFetchResult<ITrendingServiceResponse>
            result={serviceProviders}
          >
            {(TrendingServicesData) => (
              <>
                <HomeTrendingServices
                  TrendingServicesData={TrendingServicesData}
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


const HomeTrendingServices = ({
  TrendingServicesData,
  t,
}: {
  TrendingServicesData: ITrendingServiceResponse;
  t: TranslationType;
}) => {
  if (!TrendingServicesData?.services?.length) {
    return (
      <section>
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("serviceProviders.title")}
        </h2>
        <p className="text-muted-foreground text-center">
          {t("serviceProviders.noProviders")}
        </p>
      </section>
    );
  }

  return (
        TrendingServicesData?.services?.map((service, serviceIndex) => (
          <HomeTrendingService
            key={`${service.displayName}-${serviceIndex}`}
            index={serviceIndex+1}
            service={service}
            t={t}
          />
        ))
  );
};

const HomeTrendingService = ({
  service,
  index,
  t,
}: {
  index:number,
  service:TrendingService;
  t: TranslationType;
}) => {

    const locale = useLocale();
    const localeHeader = localeToHeader(locale as LocaleTypes);
  
  if (!service) {
    return null;
  }

  return (

            <Link 
              key={service.id}
              href={`/n/app/mobile/service/${service.id}`}
              // onClick={() => navigate(`/n/app/mobile/service/${service.id}`)}
              className="flex-none w-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
            >

              
              <div className="relative aspect-square">
                <ImageWithFallback
                fill 
                  src={`${env.NEXT_PUBLIC_FILES_URL}/${service?.url}`}
                  alt={service.displayName}
                  className="w-full h-full object-cover"
                /> 

                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Trend Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full">
                  <TrendingUp size={12} className="text-white" />
                  <span className="text-xs font-bold text-white">{service.growth ?? 5460}</span>
                </div>
                
                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">
                    {service.displayName}
                  </h3>
                  <div className="flex items-center gap-1 text-white/80">
                    <Users size={12} />
                    <span className="text-xs font-medium">
                      {service.bookings ?? 251} 
                      bookings</span>
                  </div>
                </div>
              </div>
            </Link>

           
          
    
  );
};



 const HomeTrendingServicesSkeleton = () => {
  return (
    <section>
      {/* Title skeleton */}
      <div className="mb-8 text-center">
        <Skeleton className="mx-auto h-8 w-64" />
      </div>

      {/* Groups skeleton */}
      <div className="space-y-12">
        {[...Array(3)].map((_, groupIndex) => (
          <div key={groupIndex}>
            {/* Group header skeleton */}
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Mobile carousel skeleton */}
            <div className="block md:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 basis-[85%]">
                    <ServiceProviderCardSkeleton />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop grid skeleton */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <ServiceProviderCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ServiceProviderCardSkeleton = () => {
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

export default HomeTrendingServicesSuspenseBoundary;
