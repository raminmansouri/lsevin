<<<<<<< HEAD
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Link } from '@/i18n/navigation';
import type { HomeCategory } from '@/features/home/api/server/get-home-page';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { Grid2X2 } from 'lucide-react';
import { getCategoryOverlayClassName, getCategoryOverlayStyle } from '@/features/categories/utils/category-overlay';

export type HomeCategoryLabels = {
  emptyTitle: string;
  emptyDescription: string;
  serviceCount: string;
};

const defaultLabels: HomeCategoryLabels = {
  emptyTitle: 'No service categories found',
  emptyDescription: 'Add active categories, services, and providers to show them here.',
  serviceCount: '{count} services',
};

function formatLabel(template: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement)),
    template
  );
}

export function HomeServiceProvidersCategories({
  categories,
  locale = 'en-US',
  labels = defaultLabels,
}: {
  categories: HomeCategory[];
  locale?: string;
  labels?: HomeCategoryLabels;
}) {
  if (!categories.length) {
    return (
      <div className="col-span-2 rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center lg:col-span-4">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#083f30] shadow-sm">
          <Grid2X2 size={20} />
        </div>
        <p className="text-sm font-semibold text-gray-900">{labels.emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{labels.emptyDescription}</p>
      </div>
=======
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/config/env/client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceProviderCard from "@/features/service-providers/components/service-provider-card";
import {
  IServiceProvider,
  IServiceProvidersGroupedResponse,
} from "@/features/service-providers/types";
import { Link } from "@/i18n/navigation";
import { TranslationType } from "@/types/next";

 const categories = [
    { 
      id: 1,
      label: 'Medical', 
      path: '/n/app/mobile/medical/clinics', 
      image: '/unsplash_images/photo-1631217868264-e5b90bb7e133__w=400&h=300&fit=crop.jpg',
      gradient: 'from-red-500/90 to-red-600/90'
    },
    { 
      id: 2,
      label: 'Beauty & Spa', 
      path: '/n/app/mobile/beauty', 
      image: '/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg',
      gradient: 'from-pink-500/90 to-rose-600/90'
    },
    { 
      id: 3,
      label: 'Fitness', 
      path: '/n/n/app/mobile/mobile/fitness', 
      image: '/unsplash_images/photo-1534438327276-14e5300c3a48__w=400&h=300&fit=crop.jpg',
      gradient: 'from-purple-500/90 to-purple-600/90'
    },
    { 
      id: 4,
      label: 'Hotels', 
      path: '/n/app/mobile/hotels', 
      image: '/unsplash_images/photo-1566073771259-6a8506099945__w=400&h=300&fit=crop.jpg',
      gradient: 'from-blue-500/90 to-blue-600/90'
    },
    { 
      id: 5,
      label: 'Pharmacy', 
      path: '/n/app/mobile/pharmacy', 
      image: '/unsplash_images/photo-1576602976047-174e57a47881__w=400&h=300&fit=crop.jpg',
      gradient: 'from-teal-500/90 to-teal-600/90'
    },
    { 
      id: 6,
      label: 'Education', 
      path: '/n/app/mobile/education', 
      image: '/unsplash_images/photo-1523240795612-9a054b0db644__w=400&h=300&fit=crop.jpg',
      gradient: 'from-amber-500/90 to-orange-600/90'
    },
  ];

export const HomeServiceProvidersCategories = ({
  serviceProvidersGroups,
  t,
}: {
  serviceProvidersGroups: IServiceProvidersGroupedResponse;
  t: TranslationType;
}) => {
  if (!serviceProvidersGroups?.length) {
    return (
      <section>
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("serviceProviders.title")}
        </h2>
        <p className="text-muted-foreground text-center">
          {t("serviceProviders.noProviders")}
        </p>
      </section>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    );
  }

  return (
<<<<<<< HEAD
    <>
      {categories.map((category) => (
        <ServiceProviderCategoryCard key={category.id} category={category} locale={locale} labels={labels} />
      ))}
    </>
  );
}

function ServiceProviderCategoryCard({
  category,
  locale,
  labels,
}: {
  category: HomeCategory;
  locale: string;
  labels: HomeCategoryLabels;
}) {
  const mediaUrl = resolveHomeMediaUrl(category.imageUrl);
  const overlayClassName = getCategoryOverlayClassName(category.gradient);
  const overlayStyle = getCategoryOverlayStyle(category.gradient);

  return (
    <Link
      href={`/n/app/mobile/map-discovery?categoryId=${category.id}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all hover:shadow-xl active:scale-95"
    >
      {mediaUrl ? (
        <ImageWithFallback
          fill
          src={mediaUrl}
          alt={category.label}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#083f30] to-[#0f6b56]" />
      )}

      <div
        className={[
          "pointer-events-none absolute inset-0",
          overlayClassName ? `bg-gradient-to-t ${overlayClassName}` : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={overlayStyle}
        data-category-gradient={category.gradient || undefined}
        data-category-overlay={overlayStyle?.background ? "inline-style" : overlayClassName || "default"}
      />

      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white lg:text-base xl:text-lg">{category.label}</h3>
        {category.serviceCount > 0 ? (
          <p className="mt-1 text-xs font-semibold text-white/80">
            {formatLabel(labels.serviceCount, { count: category.serviceCount.toLocaleString(locale) })}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
=======
        serviceProvidersGroups.map((group, groupIndex) => (
          <ServiceProviderGroup
            key={`${group.providerTypeName}-${groupIndex}`}
            index={groupIndex+1}
            group={group}
            t={t}
          />
        ))
  );
};

const ServiceProviderGroup = ({
  group,
  index,
  t,
}: {
  index:number,
  group: {
    providerTypeId: string;
    providerTypeName: string;
    totalCount: number;
    serviceProviders: IServiceProvider[];
  };
  t: TranslationType;
}) => {
  if (!group.serviceProviders?.length) {
    return null;
  }
  let i=index < 7 ? index: 6;
  const provider=group.serviceProviders?.[0];

  return (

            <Link
            href={`/type/${group.providerTypeId}`}
              key={group.providerTypeId}
              data-index={i}
              // onClick={() => navigate(group.path)}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all active:scale-95"
            >
              <img 
              src={`${env.NEXT_PUBLIC_FILES_URL}/${provider?.thumbnailUrl}`}
                              // alt={provider?.name}
                alt={group.providerTypeName}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${categories.find(f=>f.id==i)?.gradient}`} />
              
              <div className="relative z-10 h-full flex items-end p-4">
                <h3 className="text-white font-bold text-lg">{group.providerTypeName}</h3>
              </div>
            </Link>
          
    
  );
};



export const HomeServiceProvidersSkeleton = () => {
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

export default HomeServiceProvidersCategories;
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
