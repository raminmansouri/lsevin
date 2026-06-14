"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { deleteStaffAction } from "../actions/delete-staff";
import { useStaffBySearchCacheManagement } from "../api/client/get-staff-by-search";
import { STAFF_TRANSLATION_KEY } from "../constants";
import { Staff } from "../types";

interface StaffActionConfig {
  staff: Staff;
  optimisticOperation?: (ids: string[]) => void;
}

interface UseStaffActionsProps {
  startTransition: React.TransitionStartFunction;
}

export const useStaffActions = ({ startTransition }: UseStaffActionsProps) => {
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const { invalidateAllCache } = useStaffBySearchCacheManagement();

  const { execute: executeDelete } = useAction(deleteStaffAction, {
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
    t("actions.deleteStaff"),
    t("actions.deleteStaffDescription"),
    "destructive"
  );

  const handleDelete = async ({
    staff,
    optimisticOperation,
  }: StaffActionConfig) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    startTransition(() => {
      optimisticOperation?.([staff.id]);
    });
    await executeDelete({ staffId: staff.id });
  };

  return {
    handleDelete,
    confirmDelete,
    DeleteConfirmDialog,
  };
};
