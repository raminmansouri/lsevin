"use client";

import type { ElementType } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getSafeLexicalPlainText, SafeLexicalRenderer } from "@/features/service-definitions/components/safe-lexical-renderer";
import { cn } from "@/lib/utils";

import { languageName } from "./format";

export type LocalizedValue = { value: string; locale: string; isFallback: boolean; dir: "rtl" | "ltr" } | null | undefined;

/** True when a stored text is serialized Lexical state (rich text from the admin editor). */
export function isRichText(value: string | null | undefined): boolean {
  if (!value || value.trimStart()[0] !== "{") return false;
  try {
    const parsed = JSON.parse(value) as { root?: unknown } | null;
    return typeof parsed === "object" && parsed !== null && "root" in parsed;
  } catch {
    return false;
  }
}

/** The readable text of a stored value: Lexical rich text flattened, plain text unchanged. */
export function plainText(value: string | null | undefined): string {
  if (!value) return "";
  return isRichText(value) ? getSafeLexicalPlainText(value) : value;
}

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
  if (isRichText(text.value)) {
    // Rich text (descriptions edited with the admin's Lexical editor) renders as blocks,
    // so it needs a <div> even where plain text uses <p>.
    return (
      <>
        <div lang={text.locale} dir={text.dir} data-latin-digits="" data-rich-text="" className={cn(clamp && "line-clamp-3", className)}>
          <SafeLexicalRenderer content={text.value} fallback="" />
        </div>
        {badge && text.isFallback ? <FallbackBadge locale={text.locale} className={cn("mt-1", badgeClassName)} /> : null}
      </>
    );
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
