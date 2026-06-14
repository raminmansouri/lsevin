"use client";

import { Control, Controller } from "react-hook-form";

type Props = {
  name: string;
  control: Control<any>;
  label: string;
};

export function JsonEditorField({ name, control, label }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <textarea
              rows={8}
              value={
                typeof field.value === "string"
                  ? field.value
                  : JSON.stringify(field.value ?? {}, null, 2)
              }
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
            />
            {fieldState.error ? (
              <p className="text-xs text-red-500">{fieldState.error.message}</p>
            ) : null}
          </>
        )}
      />
    </div>
  );
}
