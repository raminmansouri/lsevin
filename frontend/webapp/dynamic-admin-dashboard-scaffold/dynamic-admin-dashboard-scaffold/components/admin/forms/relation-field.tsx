"use client";

import { useEffect, useState } from "react";
import { Control, Controller } from "react-hook-form";
import { Search } from "lucide-react";
import { RelationOption, ResolvedFieldDefinition } from "@/lib/admin/types";

type Props = {
  schema: string;
  table: string;
  field: ResolvedFieldDefinition;
  control: Control<any>;
  locale: string;
};

export function RelationField({ schema, table, field, control, locale }: Props) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<RelationOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      const url = new URL("/api/admin/relation-options", window.location.origin);
      url.searchParams.set("schema", schema);
      url.searchParams.set("table", table);
      url.searchParams.set("column", field.columnName);
      url.searchParams.set("locale", locale);
      if (search) url.searchParams.set("search", search);

      const response = await fetch(url.toString(), { signal: controller.signal });
      const json = await response.json();
      setOptions(json.items ?? []);
    }

    if (open) {
      run().catch(() => {});
    }

    return () => controller.abort();
  }, [open, schema, table, field.columnName, search, locale]);

  return (
    <Controller
      control={control}
      name={field.columnName}
      render={({ field: rhfField, fieldState }) => {
        const selected = options.find((x) => x.value === String(rhfField.value ?? ""));

        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <Search className="h-4 w-4 text-zinc-400" />
                <input
                  value={search}
                  onFocus={() => setOpen(true)}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${field.label.toLowerCase()}...`}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="max-h-64 space-y-1 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      rhfField.onChange(option.value);
                      setOpen(false);
                    }}
                    className={[
                      "block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900",
                      String(rhfField.value ?? "") === option.value ? "bg-zinc-100 dark:bg-zinc-900" : "",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selected ? (
                <p className="mt-3 text-xs text-zinc-500">Selected: {selected.label}</p>
              ) : null}
            </div>
            {fieldState.error ? (
              <p className="text-xs text-red-500">{fieldState.error.message}</p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
