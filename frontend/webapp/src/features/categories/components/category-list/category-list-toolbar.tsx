"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { CATEGORY_TRANSLATION_KEY } from "../../constants";

export const CategoryListToolbar = () => {
  const t = useTranslations(CATEGORY_TRANSLATION_KEY);
  const router = useRouter();

  const handleAddCategory = () => {
    router.push("/admin/categories/add");
  };

  return (
    <Button onClick={handleAddCategory}>{t("actions.addCategory")}</Button>
  );
};
