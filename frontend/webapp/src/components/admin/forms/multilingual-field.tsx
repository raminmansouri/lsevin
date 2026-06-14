"use client";

import { useMemo, useState } from "react";
import { Control, Controller } from "react-hook-form";

type Props = {
  name: string;
  control: Control<any>;
  locales: string[]; // must be full locale codes like en-US, fa-IR
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

function normalizeMultilingualValue(input: unknown): Record<string, string> {
  if (!input) return {};

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).filter(
            ([key, value]) =>
              !/^\d+$/.test(key) && (typeof value === "string" || value == null)
          )
        ) as Record<string, string>;
      }
      return {};
    } catch {
      return {};
    }
  }

  if (typeof input === "object" && !Array.isArray(input)) {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).filter(
        ([key, value]) =>
          !/^\d+$/.test(key) && (typeof value === "string" || value == null)
      )
    ) as Record<string, string>;
  }

  return {};
}

function getLocaleLabel(locale: string) {
  return locale;
}

export function MultilingualField({
  name,
  control,
  locales,
  label,
  placeholder,
  multiline = false,
}: Props) {
  const normalizedLocales = useMemo(
    () => (locales?.length ? locales : ["en-US"]),
    [locales]
  );

  const [activeLocale, setActiveLocale] = useState(normalizedLocales[0]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>

        <div className="flex flex-wrap items-center gap-2">
          {normalizedLocales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs tracking-wide",
                activeLocale === locale
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 dark:border-zinc-800",
              ].join(" ")}
            >
              {getLocaleLabel(locale)}
            </button>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = normalizeMultilingualValue(field.value);
          const currentValue = value[activeLocale] ?? "";

          const update = (nextValue: string) => {
            field.onChange({
              ...value,
              [activeLocale]: nextValue,
            });
          };

          if (multiline) {
            return (
              <textarea
                value={currentValue}
                onChange={(e) => update(e.target.value)}
                placeholder={placeholder}
                rows={5}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            );
          }

          return (
            <input
              value={currentValue}
              onChange={(e) => update(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
            />
          );
        }}
      />
    </div>
  );
}