"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { TRANSLATION_KEY } from "../../types/constants";
import { ProviderTypeFacetedFilter } from "./provider-type-faceted-filter";

export const ServiceProvidersListToolbar = () => {
  const t = useTranslations(TRANSLATION_KEY);
  const router = useRouter();

  const handleAddServiceProvider = () => {
    router.push("/admin/service-providers/add");
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <ProviderTypeFacetedFilter title={t("table.filters.providerType")} />
      <Button onClick={handleAddServiceProvider}>
        {t("actions.addServiceProvider")}
      </Button>
    </div>
  );
};
