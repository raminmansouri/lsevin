"use client";

import { useMemo, useState } from "react";

import { DEFAULT_MEDIA_LOCALES, LocalizedText } from "../types";
import { createEmptyLocalizedContent, normalizeLocalizedFields } from "../localized";

type LocalizedTextareaInputProps = {
  value?: LocalizedText | null;
  onChange: (value: LocalizedText) => void;
  label?: string;
  placeholder?: string;
  locales?: readonly string[];
  disabled?: boolean;
  rows?: number;
  className?: string;
};

/**
 * Plain textarea-based localized field with a compatible API shape:
 *
 * <LocalizedTextareaInput
 *   value={value}
 *   onChange={setValue}
 *   label="Description"
 * />
 */
export function LocalizedTextareaInput({
  value,
  onChange,
  label,
  placeholder,
  locales = DEFAULT_MEDIA_LOCALES,
  disabled,
  rows = 4,
  className,
}: LocalizedTextareaInputProps) {
  const normalized = useMemo(
    () => normalizeLocalizedFields(value ?? createEmptyLocalizedContent(locales), locales),
    [locales, value]
  );

  const [activeLocale, setActiveLocale] = useState<string>(locales[0] ?? "fa");

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="block text-sm font-medium text-slate-900">{label}</label>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            disabled={disabled}
            onClick={() => setActiveLocale(locale)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              activeLocale === locale
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            ].join(" ")}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>

      <textarea
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        value={normalized[activeLocale] ?? ""}
        onChange={(event) =>
          onChange({
            ...normalized,
            [activeLocale]: event.target.value,
          })
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
      />
    </div>
  );
}
