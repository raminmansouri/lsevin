"use client";

import { ServiceProviderAttribute } from "../../../types";
import ServiceProviderAttributeManager from "../managers/service-provider-attribute-manager";

interface ServiceProviderAttributesTabProps {
  serviceProviderId: string;
  providerTypeId: string;
  currentAttributes: ServiceProviderAttribute[];
}

export default function ServiceProviderAttributesTab({
  serviceProviderId,
  providerTypeId,
  currentAttributes,
}: ServiceProviderAttributesTabProps) {
  return (
    <ServiceProviderAttributeManager
      serviceProviderId={serviceProviderId}
      providerTypeId={providerTypeId}
      currentAttributes={currentAttributes}
    />
  );
}
