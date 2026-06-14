"use client";

import { ServiceProviderGalleryItem } from "../../../types";
import ServiceProviderGalleryManager from "../managers/service-provider-gallery-manager";

interface ServiceProviderGalleryTabProps {
  serviceProviderId: string;
  currentGalleryItems: ServiceProviderGalleryItem[];
}

export default function ServiceProviderGalleryTab({
  serviceProviderId,
  currentGalleryItems,
}: ServiceProviderGalleryTabProps) {
  return (
    <ServiceProviderGalleryManager
      serviceProviderId={serviceProviderId}
      currentGalleryItems={currentGalleryItems}
    />
  );
}
