"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";
import MediaPickerModal from "@/features/media-picker-addon/components/MediaPickerModal";

/** URL fields keep their saved image even when it is not in the media library. */
export function MediaUrlField({
  name,
  label,
  defaultValue,
  onValueChange,
  disabled = false,
}: {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  onValueChange?: (url: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("ShopMedia");
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);
  function change(next: string) {
    setValue(next);
    onValueChange?.(next);
  }
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      {name && !onValueChange && (
        <input type="hidden" name={name} value={value} />
      )}
      {value && (
        <ImageWithFallback
          key={value}
          unoptimized
          width={96}
          height={96}
          src={
            /^(https?:)?\/\//i.test(value) || value.startsWith("/")
              ? value
              : `${env.NEXT_PUBLIC_FILES_URL.replace(/\/+$/, "")}/${value}`
          }
          alt={label || t("image")}
          className="h-24 w-24 rounded object-cover"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="rounded border px-3 py-2 text-sm"
        >
          {t(value ? "replace" : "addImages")}
        </button>
        {value && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => change("")}
            className="text-sm text-red-600"
          >
            {t("remove")}
          </button>
        )}
      </div>
      {open && (
        <MediaPickerModal
          open
          mode="single"
          mediaType="image"
          allowDelete={false}
          onClose={() => setOpen(false)}
          onConfirm={(items) => {
            if (items[0]?.mediaType === "image") change(items[0].fileUrl);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
