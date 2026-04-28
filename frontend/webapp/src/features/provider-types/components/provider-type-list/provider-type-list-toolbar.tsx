
"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { PROVIDER_TYPE_TRANSLATION_KEY } from "../../constants";

export const ProviderTypeListToolbar = () => {
  const t = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => router.push("/admin/provider-types/add")}>
        {t("actions.addProviderType")}
      </Button>
      <Button variant="outline" onClick={() => router.push("/admin/service-definitions")}>
        Service definitions
      </Button>
    </div>
  );
};
