"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { changeServiceProviderActivationAction } from "../actions/change-activation";
import { deleteServiceProviderAction } from "../actions/delete-service-provider";
import { useServiceProvidersByTypeCacheManagement } from "../api/client/get-service-providers-by-type";
import { ServiceProvider } from "../types";
import { TRANSLATION_KEY } from "../types/constants";

interface ServiceProviderActionConfig {
  serviceProvider: ServiceProvider;
  optimisticOperation?: (ids: string[]) => void;
}

interface ServiceProviderToggleConfig {
  serviceProvider: ServiceProvider;
  isActive: boolean;
}

interface UseServiceProvidersActionsProps {
  startTransition: React.TransitionStartFunction;
}

export const useServiceProvidersListActions = ({
  startTransition,
}: UseServiceProvidersActionsProps) => {
  const t = useTranslations(TRANSLATION_KEY);
  const { invalidateAllCache: invalidateServiceProviderDetailsCache } =
    useServiceProvidersByTypeCacheManagement();

  const { execute: executeDelete } = useAction(deleteServiceProviderAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.deleteSuccess"));
      invalidateServiceProviderDetailsCache();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.deleteError"));
    },
  });

  const { execute: executeChangeActivation } = useAction(
    changeServiceProviderActivationAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.statusChanged"));
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.statusChangeError"));
      },
    }
  );

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("actions.deleteServiceProvider"),
    t("actions.deleteServiceProviderDescription"),
    "destructive"
  );

  const handleDelete = async ({
    serviceProvider,
    optimisticOperation,
  }: ServiceProviderActionConfig) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(() => {
      optimisticOperation?.([serviceProvider.id]);
    });
    await executeDelete({ serviceProviderId: serviceProvider.id });
  };

  const handleToggleActivation = async ({
    serviceProvider,
    isActive,
  }: ServiceProviderToggleConfig) => {
    await executeChangeActivation({
      serviceProviderId: serviceProvider.id,
      isActive,
    });
  };

  return {
    handleDelete,
    handleToggleActivation,
    confirmDelete,
    DeleteConfirmDialog,
  };
};
