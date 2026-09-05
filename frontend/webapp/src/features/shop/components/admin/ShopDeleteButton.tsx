"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

/**
 * Confirm-then-delete for a Shop admin row, matching the finance panel's
 * `CurrencyDeleteButton` convention (AlertDialog + toast + router.refresh).
 * `action` returns `{ ok, message? }` or throws.
 */
export function ShopDeleteButton({
  action,
  title,
  description,
  label,
  disabled,
  variant = "outline",
}: {
  action: () => Promise<{ ok?: boolean; message?: string } | void>;
  title: string;
  description: string;
  label?: string;
  disabled?: boolean;
  variant?: "outline" | "ghost" | "destructive";
}) {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        const res = await action();
        if (res && res.ok === false) {
          toast.error(res.message || t("error.unknownError"));
          return;
        }
        toast.success(t("common.saved"));
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={variant} disabled={disabled || isPending} aria-label={label || t("common.delete")}>
          {label ? label : <Trash2 className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
