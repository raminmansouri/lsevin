"use client";

import { useMemo, useState } from "react";

import { DEFAULT_MEDIA_LOCALES, LocalizedText } from "../types";
import { createEmptyLocalizedContent, normalizeLocalizedFields } from "../localized";

type LocalizedBaseProps = {
  value?: LocalizedText | null;
  onChange: (value: LocalizedText) => void;
  label?: string;
  placeholder?: string;
  locales?: readonly string[];
  disabled?: boolean;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function LocalizedTextInput({
  value,
  onChange,
  label,
  placeholder,
  locales = DEFAULT_MEDIA_LOCALES,
  disabled,
  className,
}: LocalizedBaseProps) {
  const normalized = useMemo(
    () => normalizeLocalizedFields(value ?? createEmptyLocalizedContent(locales), locales),
    [locales, value]
  );

  const [activeLocale, setActiveLocale] = useState<string>(locales[0] ?? "fa");

  return (
    <div className={cx("space-y-2", className)}>
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
            className={cx(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              activeLocale === locale
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            )}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>

      <input
        value={normalized[activeLocale] ?? ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange({
            ...normalized,
            [activeLocale]: event.target.value,
          })
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400"
      />
    </div>
  );
}
