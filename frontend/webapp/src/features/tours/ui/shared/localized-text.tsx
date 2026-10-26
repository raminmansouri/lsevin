"use client";

import type { ElementType } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { languageName } from "./format";

export type LocalizedValue = { value: string; locale: string; isFallback: boolean; dir: "rtl" | "ltr" } | null | undefined;

/**
 * Discreet indicator that a provider-authored text is shown in another language
 * because no translation exists yet (C-046, C-117, AT-33, AT-39).
 */
export function FallbackBadge({ locale, className }: { locale: string; className?: string }) {
  const t = useTranslations("TourShared.common");
  const ui = useLocale();
  return (
    <span
      data-testid="fallback-badge"
      data-content-locale={locale}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200",
        className,
      )}
    >
      <Languages className="size-3" aria-hidden="true" />
      {t("translatedFrom", { language: languageName(locale, ui) })}
    </span>
  );
}

/**
 * Renders provider-authored content with its real language and direction
 * metadata, plus the fallback badge whenever the text is not in the UI language.
 * Multi-line values keep their line breaks.
 */
export function LocalizedText({
  text,
  as,
  className,
  badge = true,
  badgeClassName,
  clamp,
  placeholder,
}: {
  text: LocalizedValue;
  as?: ElementType;
  className?: string;
  badge?: boolean;
  badgeClassName?: string;
  clamp?: boolean;
  placeholder?: string;
}) {
  const Tag = (as ?? "span") as ElementType;
  if (!text) {
    return placeholder ? <Tag className={cn("text-muted-foreground", className)}>{placeholder}</Tag> : null;
  }
  return (
    <>
      <Tag lang={text.locale} dir={text.dir} data-latin-digits="" className={cn("whitespace-pre-line", clamp && "line-clamp-3", className)}>
        {text.value}
      </Tag>
      {badge && text.isFallback ? <FallbackBadge locale={text.locale} className={cn("mt-1", badgeClassName)} /> : null}
    </>
  );
}
