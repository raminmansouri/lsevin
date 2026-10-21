"use client";

import { AlertTriangle, RotateCcw, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToursActionError = { kind: string; code: string; details?: Record<string, unknown> };

/**
 * Maps a structured tours error to a localized message: the specific code when a
 * message exists (`TourShared.errors.<code>`), otherwise the generic message of
 * its kind. Raw codes are never shown, and infrastructure failures keep their
 * own wording instead of being presented as invalid input (CLAUDE.md §4).
 */
export function useToursErrorMessage() {
  const t = useTranslations("TourShared");
  return (error: ToursActionError | null | undefined): string => {
    if (!error) return "";
    const codeKey = `errors.${error.code}`;
    if (error.kind !== "infrastructure" && error.kind !== "unexpected" && t.has(codeKey)) return t(codeKey);
    const kindKey = `errorKind.${error.kind}`;
    return t.has(kindKey) ? t(kindKey) : t("errorKind.unexpected");
  };
}

export function ToursErrorAlert({
  error,
  message,
  onRetry,
  className,
  testId = "tours-error",
}: {
  error?: ToursActionError | null;
  message?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
}) {
  const t = useTranslations("TourShared.common");
  const toMessage = useToursErrorMessage();
  const text = message ?? toMessage(error);
  if (!text) return null;
  const infra = error?.kind === "infrastructure";
  const Icon = infra ? WifiOff : AlertTriangle;
  return (
    <div
      role="alert"
      data-testid={testId}
      data-error-code={error?.code}
      data-error-kind={error?.kind}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        infra ? "border-slate-300 bg-slate-50 text-slate-800" : "border-red-200 bg-red-50 text-red-800",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-6">{text}</p>
      {onRetry ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry} className="min-h-11 shrink-0">
          <RotateCcw className="size-4" aria-hidden="true" />
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
