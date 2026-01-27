import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const HomeServiceProviders = ({
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
    );
  }

  return (
    <section>
      {/* Group by provider types */}
      <div className="space-y-12">
        {serviceProvidersGroups.map((group, groupIndex) => (
          <ServiceProviderGroup
            key={`${group.providerTypeName}-${groupIndex}`}
            group={group}
            t={t}
          />
        ))}
      </div>
    </section>
  );
};

const ServiceProviderGroup = ({
  group,
  t,
}: {
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

  return (
    <div>
      {/* Group Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">{group.providerTypeName}</h3>
          <Badge variant="default">{group.totalCount}</Badge>
        </div>
        <Link href={`/type/${group.providerTypeId}`}>
          <Button variant="link">{t("serviceProviders.viewAll")}</Button>
        </Link>
      </div>

      {/* Mobile: Horizontal Carousel */}
      <div className="block md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {group.serviceProviders.map((provider) => (
              <CarouselItem
                key={provider.id}
                className="basis-[95%] rounded-md py-2 pl-2 md:pl-4"
              >
                <ServiceProviderCard provider={provider} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {group.serviceProviders.map((provider) => (
          <ServiceProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
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

export default HomeServiceProviders;
