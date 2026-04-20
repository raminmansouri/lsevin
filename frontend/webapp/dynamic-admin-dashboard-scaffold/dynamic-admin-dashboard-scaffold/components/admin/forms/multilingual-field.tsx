"use client";

import { useState } from "react";
import { Control, Controller } from "react-hook-form";

type Props = {
  name: string;
  control: Control<any>;
  locales: string[];
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export function MultilingualField({
  name,
  control,
  locales,
  label,
  placeholder,
  multiline = false,
}: Props) {
  const [activeLocale, setActiveLocale] = useState(locales[0] ?? "en");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex flex-wrap items-center gap-2">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs uppercase tracking-wide",
                activeLocale === locale
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 dark:border-zinc-800",
              ].join(" ")}
            >
              {locale}
            </button>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = field.value ?? {};
          const currentValue = value?.[activeLocale] ?? "";

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
