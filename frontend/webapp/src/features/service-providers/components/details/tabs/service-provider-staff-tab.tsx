"use client";

import { ServiceProviderStaff } from "../../../types";
import ServiceProviderStaffManager from "../managers/service-provider-staff-manager";

interface ServiceProviderStaffTabProps {
  serviceProviderId: string;
  currentStaff: ServiceProviderStaff[];
}

export default function ServiceProviderStaffTab({
  serviceProviderId,
  currentStaff,
}: ServiceProviderStaffTabProps) {
  return (
    <ServiceProviderStaffManager
      serviceProviderId={serviceProviderId}
      currentStaff={currentStaff}
    />
  );
}
