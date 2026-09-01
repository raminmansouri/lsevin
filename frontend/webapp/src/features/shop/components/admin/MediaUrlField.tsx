"use client";

import { useState } from "react";

import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";

/**
 * Reuses the platform media pipeline (SHP-BASE-005) for a single image field
 * (category image/banner, brand logo). Renders inside a plain server-action
 * `<form>` — the hidden input carries the picked file's URL at submit time.
 */
export function MediaUrlField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label?: string;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <SingleMediaPickerInput
        name={`${name}_picker`}
        label={label}
        mediaType="image"
        valueField="fileUrl"
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}
