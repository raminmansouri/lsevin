"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { PROVIDER_TYPE_TRANSLATION_KEY } from "../../constants";

export const ProviderTypeListToolbar = () => {
  const t = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const router = useRouter();

  const handleAddProviderType = () => {
    router.push("/admin/provider-types/add");
  };

  return (
    <Button onClick={handleAddProviderType}>
      {t("actions.addProviderType")}
    </Button>
  );
};
