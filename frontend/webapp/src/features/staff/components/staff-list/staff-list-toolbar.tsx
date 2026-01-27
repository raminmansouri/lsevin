"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { STAFF_TRANSLATION_KEY } from "../../constants";

export const StaffListToolbar = () => {
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const router = useRouter();

  const handleAddStaff = () => {
    router.push("/admin/staff/add");
  };

  return <Button onClick={handleAddStaff}>{t("actions.addStaff")}</Button>;
};
