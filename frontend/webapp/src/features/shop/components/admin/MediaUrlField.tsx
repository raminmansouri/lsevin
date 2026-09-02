"use client";

import { useEffect, useState } from "react";

import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";

/**
 * Reuses the platform media pipeline (SHP-BASE-005) for a single image field
 * (category image/banner, brand logo, promo card image).
 *
 * Two modes:
 *  - plain server-action `<form>`: pass `name`; a hidden input carries the URL.
 *  - react-hook-form: pass `onValueChange` (and `defaultValue`); the parent owns
 *    the value, so the hidden input is omitted.
 */
export function MediaUrlField({
  name,
  label,
  defaultValue,
  onValueChange,
}: {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  onValueChange?: (url: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  const handleChange = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  return (
    <div>
      {name && !onValueChange ? <input type="hidden" name={name} value={value} /> : null}
      <SingleMediaPickerInput
        name={`${name ?? "media"}_picker`}
        label={label}
        mediaType="image"
        valueField="fileUrl"
        value={value}
        onValueChange={handleChange}
      />
    </div>
  );
}
