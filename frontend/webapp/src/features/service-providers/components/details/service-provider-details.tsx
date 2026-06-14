"use client";

import { useTranslations } from "next-intl";

import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ServiceProviderDetails as ServiceProviderDetailsType } from "../../types";
import { TRANSLATION_KEY } from "../../types/constants";
import ServiceProviderAttributesTab from "./tabs/service-provider-attributes-tab";
import ServiceProviderGalleryTab from "./tabs/service-provider-gallery-tab";
import ServiceProviderInfoTab from "./tabs/service-provider-info-tab";
import ServiceProviderPoliciesTab from "./tabs/service-provider-policies-tab";
import ServiceProviderServicesTab from "./tabs/service-provider-services-tab";
import ServiceProviderStaffTab from "./tabs/service-provider-staff-tab";

interface ServiceProviderDetailsProps {
  serviceProvider: ServiceProviderDetailsType;
}

export function ServiceProviderDetails({
  serviceProvider,
}: ServiceProviderDetailsProps) {
  const t = useTranslations(TRANSLATION_KEY);

  return (
    <CardContent>
      <Tabs defaultValue="info" className="w-full">
        <div className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="flex w-max min-w-full justify-start">
            <TabsTrigger value="info" className="flex-shrink-0">
              {t("details.tabs.info")}
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex-shrink-0">
              {t("details.tabs.staff")}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex-shrink-0">
              {t("details.tabs.services")}
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex-shrink-0">
              {t("details.tabs.policies")}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex-shrink-0">
              {t("details.tabs.gallery")}
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex-shrink-0">
              {t("details.tabs.attributes")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info">
          <ServiceProviderInfoTab serviceProvider={serviceProvider} />
        </TabsContent>

        <TabsContent value="staff">
          <ServiceProviderStaffTab
            serviceProviderId={serviceProvider.id}
            currentStaff={serviceProvider.staff}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServiceProviderServicesTab
            serviceProviderId={serviceProvider.id}
            currentServices={serviceProvider.services}
          />
        </TabsContent>

        <TabsContent value="policies">
          <ServiceProviderPoliciesTab
            serviceProviderId={serviceProvider.id}
            currentPolicies={serviceProvider.policies}
          />
        </TabsContent>

        <TabsContent value="gallery">
          <ServiceProviderGalleryTab
            serviceProviderId={serviceProvider.id}
            currentGalleryItems={serviceProvider.galleryItems}
          />
        </TabsContent>

        <TabsContent value="attributes">
          <ServiceProviderAttributesTab
            serviceProviderId={serviceProvider.id}
            providerTypeId={serviceProvider.providerTypeId}
            currentAttributes={serviceProvider.attributes}
          />
        </TabsContent>
      </Tabs>
    </CardContent>
  );
}

export function ServiceProviderDetailsSkeleton() {
  return (
    <CardContent>
      <div className="space-y-4">
        {/* Tab skeleton */}
        <div className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-muted flex w-max min-w-full space-x-1 rounded-md p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 flex-shrink-0" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="space-y-4 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </CardContent>
  );
}
