"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { changeServiceDefinitionActivationAction } from "../actions/change-activation";
import { deleteServiceDefinitionAction } from "../actions/delete-service-definition";
import { useServiceDefinitionsAllLocalesBySearchCacheManagement } from "../api/client/get-service-definitions-all-locales-by-search";
import { useServiceDefinitionsBySearchCacheManagement } from "../api/client/get-service-definitions-by-search";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../constants";
import { ServiceDefinition } from "../types/service-definition";

interface ServiceDefinitionActionConfig {
  serviceDefinition: ServiceDefinition;
  optimisticOperation?: (ids: string[]) => void;
  optimisticActivationOperation?: (id: string) => void;
}

interface UseServiceDefinitionActionsProps {
  startTransition: React.TransitionStartFunction;
}

export const useServiceDefinitionActions = ({
  startTransition,
}: UseServiceDefinitionActionsProps) => {
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const { invalidateAllCache } = useServiceDefinitionsBySearchCacheManagement();
  const { invalidateAllCache: invalidateAllLocalesCache } =
    useServiceDefinitionsAllLocalesBySearchCacheManagement();

  const { execute: executeDelete } = useAction(deleteServiceDefinitionAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.success"));
      invalidateAllCache();
      invalidateAllLocalesCache();
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.error"));
    },
  });

  const { execute: executeToggleActivation } = useAction(
    changeServiceDefinitionActivationAction,
    {
      startTransition,
      onSuccess: () => {
        toast.success(t("messages.success"));
        invalidateAllCache();
        invalidateAllLocalesCache();
      },
      onError: (error) => {
        toast.error(error.detail || t("messages.error"));
      },
    }
  );

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("actions.deleteServiceDefinition"),
    t("actions.deleteServiceDefinitionDescription"),
    "destructive"
  );

  const handleDelete = async ({
    serviceDefinition,
    optimisticOperation,
  }: ServiceDefinitionActionConfig) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(() => {
      optimisticOperation?.([serviceDefinition.id]);
    });
    await executeDelete({ serviceDefinitionId: serviceDefinition.id });
  };

  const handleToggleActivation = async ({
    serviceDefinition,
    optimisticActivationOperation,
  }: ServiceDefinitionActionConfig) => {
    startTransition(() => {
      optimisticActivationOperation?.(serviceDefinition.id);
    });
    await executeToggleActivation({
      serviceDefinitionId: serviceDefinition.id,
      isActive: !serviceDefinition.isActive,
    });
  };

  return {
    handleDelete,
    handleToggleActivation,
    confirmDelete,
    DeleteConfirmDialog,
  };
};
