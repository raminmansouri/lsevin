"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { removeComment } from "../actions/remove-comment";
import { useCommentsCacheManagement } from "../api/client/get-comments-by-service-provider-client";
import { IServiceProviderComment } from "../types";
import { SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY } from "../types/constants";

interface CommentActionConfig {
  comment: IServiceProviderComment;
}

interface UseCommentActionsProps {
  startTransition: React.TransitionStartFunction;
}

export const useCommentActions = ({
  startTransition,
}: UseCommentActionsProps) => {
  const t = useTranslations(SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY);
  const { invalidateProviderCache } = useCommentsCacheManagement();

  const { execute: executeDelete } = useAction(removeComment, {
    startTransition,
    onSuccess: (data) => {
      toast.success(t("deleteSuccess"));
      if (data) {
        invalidateProviderCache(data);
      }
    },
    onError: (error) => {
      toast.error(error.detail || error.title || t("deleteFailed"));
    },
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm(
    t("deleteConfirmTitle"),
    t("deleteConfirm"),
    "destructive"
  );

  const handleDelete = async ({ comment }: CommentActionConfig) => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    await executeDelete({
      serviceProviderId: comment.serviceProviderId,
      commentId: comment.id,
    });
  };

  return {
    handleDelete,
    DeleteConfirmDialog,
  };
};
