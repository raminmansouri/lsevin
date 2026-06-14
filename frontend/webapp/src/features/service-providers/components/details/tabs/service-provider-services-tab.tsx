"use client";

import { ServiceProviderService } from "../../../types";
import ServiceProviderServiceManager from "../managers/service-provider-service-manager";

interface ServiceProviderServicesTabProps {
  serviceProviderId: string;
  currentServices: ServiceProviderService[];
}

export default function ServiceProviderServicesTab({
  serviceProviderId,
  currentServices,
}: ServiceProviderServicesTabProps) {
  return (
    <ServiceProviderServiceManager
      serviceProviderId={serviceProviderId}
      currentServices={currentServices}
    />
  );
}
