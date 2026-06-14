"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { deleteCategoryAction } from "../actions/delete-category";
import { useCategoriesBySearchCacheManagement } from "../api/client";
import { CATEGORY_TRANSLATION_KEY } from "../constants";
import { Category } from "../types/category";

interface CategoryActionConfig {
  category: Category;
  optimisticOperation?: (ids: string[]) => void;
}

interface UseCategoryActionsProps {
  startTransition: React.TransitionStartFunction;
}

export const useCategoryActions = ({
  startTransition,
}: UseCategoryActionsProps) => {
  const t = useTranslations(CATEGORY_TRANSLATION_KEY);
  const { invalidateAllCache } = useCategoriesBySearchCacheManagement();

  const { execute: executeDelete } = useAction(deleteCategoryAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.success"));
      invalidateAllCache();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.error"));
    },
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("actions.deleteCategory"),
    t("actions.deleteCategoryDescription"),
    "destructive"
  );

  const handleDelete = async ({
    category,
    optimisticOperation,
  }: CategoryActionConfig) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(() => {
      optimisticOperation?.([category.categoryId]);
    });
    await executeDelete({ categoryId: category.categoryId });
  };

  return {
    handleDelete,
    confirmDelete,
    DeleteConfirmDialog,
  };
};
