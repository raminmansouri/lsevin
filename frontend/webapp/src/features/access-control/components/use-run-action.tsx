"use client";

import { type ReactNode, useTransition } from "react";
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

import type { ActionResult } from "../server/actions";

/** Codes whose server message names the exact problem ("A role named X already exists"). */
const SPECIFIC = new Set(["validation", "conflict", "forbidden", "not_found"]);

/**
 * Runs a server action, shows the outcome as a toast and refreshes the page data.
 * A failure the user can fix shows the server's specific message; anything else (including
 * `server_error`) shows a fixed translated sentence — never a raw exception.
 */
export function useRunAction() {
  const t = useTranslations("AdminAccess");
  const router = useRouter();
  const [pending, start] = useTransition();

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    options: { success?: string; onSuccess?: (result: { ok: true; data: T }) => void; refresh?: boolean } = {}
  ) {
    start(async () => {
      let result: ActionResult<T>;
      try {
        result = await action();
      } catch {
        // The request itself failed (network drop, server restart, a 5xx page instead of a
        // result). Say so plainly; never leave the button spinning or show a raw exception.
        toast.error(t("errors.server_error"));
        return;
      }
      if (result.ok === true) {
        if (options.success) toast.success(options.success);
        options.onSuccess?.(result);
        if (options.refresh !== false) router.refresh();
        return;
      }
      toast.error(SPECIFIC.has(result.error.code) ? result.error.message : t(`errors.${result.error.code}`));
    });
  }

  return { run, pending };
}

export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  disabled,
  variant = "outline",
  size = "sm",
  testId,
  children,
}: {
  label: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: "outline" | "destructive" | "secondary" | "ghost";
  size?: "sm" | "default";
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size={size} disabled={disabled} data-testid={testId}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid={testId ? `${testId}-confirm` : undefined}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
