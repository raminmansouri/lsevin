"use client";

import { useEffect, useState } from "react";
import { Control, Controller } from "react-hook-form";
import { RelationOption } from "@/lib/admin/types";

type Props = {
  fieldName: string;
  endpoint: string;
  control: Control<any>;
  label: string;
};

export function ManyToManyField({ fieldName, endpoint, control, label }: Props) {
  const [options, setOptions] = useState<RelationOption[]>([]);

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((json) => setOptions(json.items ?? []))
      .catch(() => setOptions([]));
  }, [endpoint]);

  return (
    <Controller
      control={control}
      name={fieldName}
      render={({ field }) => {
        const value: string[] = Array.isArray(field.value) ? field.value : [];

        function toggle(item: string) {
          if (value.includes(item)) {
            field.onChange(value.filter((x) => x !== item));
          } else {
            field.onChange([...value, item]);
          }
        }

        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <div className="grid gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              {options.map((option) => (
                <label key={option.value} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={value.includes(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}
