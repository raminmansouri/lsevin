import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
import { homeSearchParamsCache } from "@/features/home/types";
import { getPublicServiceProviders } from "@/features/service-providers/api/server/get-public-service-providers";
import { IServiceProvider, IFeaturedServiceResponse, IServiceProvidersGroupedResponse, ServiceProviderDetails, ServiceProviderService } from "@/features/service-providers/types";
import { Link } from "@/i18n/navigation";
import { PageProps, TranslationType } from "@/types/next";
import React from 'react'
import { env } from "@/config/env/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getFeaturedServices } from "@/features/service-providers/api/server/get-featured-services";
import { BadgeCheck, Heart, Star } from "lucide-react";
import { useLocale } from "next-intl";
import { localeToHeader } from "@/config/locales";
import { LocaleTypes } from "@/types/common";
import { getLocalizedValue } from "@/features/shared/utils/localization";


const featuredServices = [
    {
      id: 1,
      image: '/unsplash_images/photo-1551190822-a9333d879b1f__w=800&h=600&fit=crop.jpg',
      title: 'Premium Hair Transplant Package',
      subtitle: 'All-inclusive 3-day medical tourism',
      provider: 'Istanbul Medical Center',
      location: 'Istanbul, Turkey',
      rating: 4.9,
      reviews: 2847,
      price: 2499,
      originalPrice: 3200,
      badges: [{name:'Verified'}, {name:'Top Rated'},{name: 'Best Value'}],
      discount: 22,
      features: [
        
        {name:'Airport Transfer'}, {name:'Hotel Included'}, {name:'1-Year Guarantee'}]
    }
    
    // ,
    // {
    //   id: 2,
    //   image: '/unsplash_images/photo-1588776814546-1ffcf47267a5__w=800&h=600&fit=crop.jpg',
    //   title: 'Hollywood Smile Veneers',
    //   subtitle: 'Premium porcelain veneers by experts',
    //   provider: 'Dubai Smile Clinic',
    //   location: 'Dubai, UAE',
    //   rating: 4.9,
    //   reviews: 1523,
    //   price: 3200,
    //   originalPrice: 4500,
    //   badges: ['Premium', 'Verified'],
    //   discount: 29,
    //   features: ['Free Consultation', 'Lifetime Warranty', '3D Imaging']
    // },
    // {
    //   id: 3,
    //   image: '/unsplash_images/photo-1540555700478-4be289fbecef__w=800&h=600&fit=crop.jpg',
    //   title: 'Luxury Wellness Retreat',
    //   subtitle: '7-day detox & rejuvenation program',
    //   provider: 'Bali Wellness Resort',
    //   location: 'Ubud, Bali',
    //   rating: 5.0,
    //   reviews: 892,
    //   price: 899,
    //   badges: ['New', 'Trending'],
    //   features: ['Daily Spa', 'Yoga Classes', 'Organic Meals']
    // },
  ];


const HomeFeaturedServicesSuspenseBoundary = async ({
  params,
  searchParams,
}: PageProps) => {
  const searchParamsData = await searchParams;
  const {  } =
    homeSearchParamsCache.parse(searchParamsData);

  const serviceProviders = await withBaseHeaders((locale, token) =>
    getFeaturedServices(
      { locale, token }
    )
  );

  return (
    <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
      {(t) => (
        <>
          <ServerFetchResult<IFeaturedServiceResponse>
            result={serviceProviders}
          >
            {(featuredServicesData) => (
              <>
                <HomeFeaturedServices
                  featuredServicesData={featuredServicesData}
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


const HomeFeaturedServices = ({
  featuredServicesData,
  t,
}: {
  featuredServicesData: IFeaturedServiceResponse;
  t: TranslationType;
}) => {
  if (!featuredServicesData?.services?.length) {
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
        featuredServicesData?.services?.map((service, serviceIndex) => (
          <FeaturedService
            key={`${service.displayName}-${serviceIndex}`}
            index={serviceIndex+1}
            service={service}
            t={t}
          />
        ))
  );
};

const FeaturedService = ({
  service,
  index,
  t,
}: {
  index:number,
  service:ServiceProviderService;
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
              href={`/n/app/mobile/treatment/${service.id}`}
              // onClick={() => navigate(`/n/app/mobile/treatment/${service.id}`)}
              className="flex-none w-80 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
              src={`${env.NEXT_PUBLIC_FILES_URL}/${service?.url}`}
                  alt={service.displayName}
                  className="w-full h-full object-cover"
                />
                
                {/* Discount Badge */}
                {service.discount && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {service.discount}% OFF
                  </div>
                )}
                
                {/* Favorite */}
                <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                  <Heart size={18} className="text-gray-700" />
                </button>
                
                {/* Badges */}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {(service.badges ?? featuredServices?.[0]?.badges)?.map(badge => (
                    <span 
                      key={badge.name}
                      className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-900 shadow-sm"
                    >
                      {badge.name}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                 {getLocalizedValue(service.displayName,localeHeader)}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                 {getLocalizedValue(service.description,localeHeader)}
                </p>
                
                {/* Provider Info */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <BadgeCheck size={16} className="text-[#083f30]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">{service.providerName ?? 'Bali Wellness Resort'}</div>
                    <div className="text-xs text-gray-500">{service.location ??  'Ubud, Bali'}</div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {(service.features ?? featuredServices?.[0]?.features)?.map(feature => (
                    <span 
                      key={ feature.name }
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium"
                    >
                      {feature.name}
                    </span>
                  ))}
                </div>
                
                {/* Rating & Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900">{service.rating ?? 2647}</span>
                    <span className="text-sm text-gray-500">({service.reviews?.toLocaleString() ?? 2415})</span>
                  </div>
                  
                  <div className="text-right">
                    {service.basePrice && (
                      <div className="text-xs text-gray-400 line-through">${service.basePrice.toLocaleString()}</div>
                    )}
                    <div className="font-bold text-lg text-[#083f30]">
                      ${service.basePrice?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>

           
          
    
  );
};



 const HomeFeaturedServicesSkeleton = () => {
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

export default HomeFeaturedServicesSuspenseBoundary;
