"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../../constants";

export const ServiceDefinitionListToolbar = () => {
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const router = useRouter();

  const handleAddServiceDefinition = () => {
    router.push("/admin/service-definitions/add");
  };

  return (
    <Button onClick={handleAddServiceDefinition}>
      {t("actions.addServiceDefinition")}
    </Button>
  );
};
