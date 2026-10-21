"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { CALENDAR_IDS, type CalendarId } from "../../domain/calendar";

/**
 * Display-calendar selector (Jalali / Gregorian / lunar Hijri), independent of
 * the interface language (C-112, C-118, Q-012). Native radios: arrow keys move
 * between options, labels name each calendar explicitly (S-055).
 */
export function CalendarSwitcher({
  value,
  onChange,
  className,
  compact,
}: {
  value: CalendarId;
  onChange: (calendar: CalendarId) => void;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations("TourShared.calendar");
  const name = useId();
  return (
    <fieldset className={cn("min-w-0", className)} data-testid="calendar-switcher">
      <legend className={cn("mb-1.5 text-xs font-medium text-slate-600", compact && "sr-only")}>{t("label")}</legend>
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
        {CALENDAR_IDS.map((id) => (
          <label
            key={id}
            className={cn(
              "relative flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600",
              value === id ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <input
              type="radio"
              name={name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="sr-only"
              data-testid={`calendar-option-${id}`}
            />
            {t(id)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
