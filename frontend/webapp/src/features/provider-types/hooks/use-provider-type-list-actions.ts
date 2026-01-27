"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { deleteProviderTypeAction } from "../actions/delete-provider-type";
import { useProviderTypeDetailsCacheManagement } from "../api/client/get-provider-type-details-query";
import { useProviderTypesBySearchCacheManagement } from "../api/client/get-provider-types-by-search";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "../constants";
import { ProviderTypeFiltered } from "../types/provider-type";

interface ProviderTypeActionConfig {
  providerType: ProviderTypeFiltered;
  optimisticOperation?: (ids: string[]) => void;
}

interface UseProviderTypeActionsProps {
  startTransition: React.TransitionStartFunction;
}

export const useProviderTypeActions = ({
  startTransition,
}: UseProviderTypeActionsProps) => {
  const t = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const { invalidateAllCache: invalidateProviderTypesBySearchCache } =
    useProviderTypesBySearchCacheManagement();
  const { invalidateAllCache: invalidateProviderTypeDetailsCache } =
    useProviderTypeDetailsCacheManagement();

  const { execute: executeDelete } = useAction(deleteProviderTypeAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.success"));
      invalidateProviderTypesBySearchCache();
      invalidateProviderTypeDetailsCache();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.error"));
    },
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("actions.deleteProviderType"),
    t("actions.deleteProviderTypeDescription"),
    "destructive"
  );

  const handleDelete = async ({
    providerType,
    optimisticOperation,
  }: ProviderTypeActionConfig) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(() => {
      optimisticOperation?.([providerType.id]);
    });
    await executeDelete({ providerTypeId: providerType.id });
  };

  return {
    handleDelete,
    confirmDelete,
    DeleteConfirmDialog,
  };
};
