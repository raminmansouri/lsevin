"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { deleteFaqAction, type EditorialActionFailure } from "../../actions";

export function FaqDeleteButton({ id, question }: { id: string; question: string }) {
  const t = useTranslations("AdminEditorial");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      aria-label={`${t("delete")}: ${question}`}
      onClick={() => {
        if (!window.confirm(t("confirmDelete"))) return;
        startTransition(async () => {
          const result = await deleteFaqAction({ id });
          if (result.ok) {
            toast.success(t("deleted"));
            router.refresh();
          } else {
            toast.error((result as EditorialActionFailure).message);
          }
        });
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
