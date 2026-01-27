"use client";

import React, { useOptimistic, useTransition } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env/client";
import { IUserDocuments } from "@/features/shared/types/user";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";

import { deleteDocument } from "../actions/delete-document";
import { TRANSLATION_KEY } from "../actions/upload-document/types";

type Props = {
  documents: IUserDocuments[];
};

const UserDocumentsList = ({ documents }: Props) => {
  const commonT = useTranslations("Common");
  const t = useTranslations(TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, deleteOptimisticItem] = useOptimistic(
    documents,
    (state, id: string) => state.filter((item) => item.id !== id)
  );
  const [ConfirmDialog, confirm] = useConfirm(
    t("messages.deleteDocumentConfirmationTitle"),
    t("messages.deleteDocumentConfirmationMessage"),
    "destructive"
  );

  const { execute } = useAction(deleteDocument, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.deleteDocumentSuccess"));
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.deleteDocumentError"));
    },
  });

  const onDelete = async (data: IUserDocuments) => {
    const ok = await confirm();
    if (!ok) return;

    startTransition(async () => {
      deleteOptimisticItem(data.id);
      await execute({ documentId: data.id });
    });
  };

  return (
    <div>
      <ConfirmDialog />
      {documents && documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("form.existingDocuments")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {optimisticItems.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">
                    {commonT(`DocumentType.${doc.type}`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <a
                        href={`${env.NEXT_PUBLIC_FILES_URL}/${doc.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline"
                      >
                        {t("form.viewDocument")}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-8 p-0"
                      onClick={() => onDelete(doc)}
                      disabled={isPending}
                    >
                      <span className="sr-only">{t("buttons.delete")}</span>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDocumentsList;
