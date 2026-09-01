"use client";

import { useState, useTransition } from "react";

import MultiMediaPickerInput from "@/features/media-picker-addon/components/MultiMediaPickerInput";
import { setProductGalleryAction } from "../../actions/admin-catalog.actions";

/**
 * Product image gallery (SHP-ADM-005, SHP-CAT-007). Reuses the platform media
 * pipeline; the first picked image is the primary image (deterministic display
 * order, per SHP-CAT-007).
 */
export function ProductGalleryEditor({ productId, initialUrls }: { productId: string; initialUrls: string[] }) {
  const [value, setValue] = useState(initialUrls.join(","));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const urls = value.split(",").map((s) => s.trim()).filter(Boolean);
      await setProductGalleryAction({ productId, urls });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-2">
      <MultiMediaPickerInput
        name="gallery"
        label="Product images (first = primary)"
        mediaType="image"
        value={value}
        onValueChange={setValue}
        maxSelection={10}
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save gallery"}
      </button>
      {saved ? <span className="ms-2 text-xs text-green-600">Saved</span> : null}
    </div>
  );
}
