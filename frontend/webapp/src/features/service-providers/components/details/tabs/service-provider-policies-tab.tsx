"use client";

import { ServiceProviderPolicy } from "../../../types";
import ServiceProviderPolicyManager from "../managers/service-provider-policy-manager";

interface ServiceProviderPoliciesTabProps {
  serviceProviderId: string;
  currentPolicies: ServiceProviderPolicy[];
}

export default function ServiceProviderPoliciesTab({
  serviceProviderId,
  currentPolicies,
}: ServiceProviderPoliciesTabProps) {
  return (
    <ServiceProviderPolicyManager
      serviceProviderId={serviceProviderId}
      currentPolicies={currentPolicies}
    />
  );
}
