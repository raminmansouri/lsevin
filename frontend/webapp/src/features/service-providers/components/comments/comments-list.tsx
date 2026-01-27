"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { InfiniteScroll } from "@/components/fetcher/infinite-scroll";

import { useCommentsByServiceProvider } from "../../api/client/get-comments-by-service-provider-client";
import { useCommentActions } from "../../hooks/use-comment-actions";
import { IServiceProviderComment } from "../../types";
import { SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY } from "../../types/constants";
import { CommentCard } from "./comment-card";

interface CommentsListProps {
  serviceProviderId: string;
}

export function CommentsList({ serviceProviderId }: CommentsListProps) {
  const [, startTransition] = useTransition();
  const t = useTranslations(SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY);
  const locale = useLocale();

  const {
    data: comments,
    error,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentsByServiceProvider(serviceProviderId, locale);

  const { handleDelete, DeleteConfirmDialog } = useCommentActions({
    startTransition,
  });

  if (error) {
    return (
      <div className="text-destructive text-center">
        {t("loadError")}: {error.detail}
      </div>
    );
  }

  if (isFetching && comments.length === 0) {
    return (
      <div className="text-muted-foreground text-center">{t("loading")}</div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-muted-foreground text-center">{t("noComments")}</div>
    );
  }

  const handleDeleteComment = (comment: IServiceProviderComment) => {
    handleDelete({
      comment,
    });
  };

  return (
    <>
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onDelete={handleDeleteComment}
          />
        ))}

        {hasNextPage && (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </div>
      <DeleteConfirmDialog />
    </>
  );
}
