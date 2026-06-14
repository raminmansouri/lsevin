"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { IServiceProviderRequest } from "../../types";
import { REQUESTS_TRANSLATION_KEY } from "../../types/constants";
import { ServiceProviderRequestsModal } from "./service-provider-requests-modal";

const ServiceProviderRequestsModalWrapper = ({
  serviceProviderId,
  myRequests,
}: {
  serviceProviderId: string;
  myRequests: IServiceProviderRequest[];
}) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations(REQUESTS_TRANSLATION_KEY);
  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-2">
      <button
        type="button"
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 shadow"
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">{t("openRequests")}</span>+
      </button>
      <ServiceProviderRequestsModal
        open={open}
        onOpenChange={setOpen}
        serviceProviderId={serviceProviderId}
        myRequests={myRequests}
      />
    </div>
  );
};

export default ServiceProviderRequestsModalWrapper;
