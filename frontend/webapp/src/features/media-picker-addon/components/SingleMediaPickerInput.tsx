"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";

import { getMediaByIds } from "../api";
import MediaPickerModal from "./MediaPickerModal";
import MediaPreviewList from "./MediaPreviewList";
import type { BaseMediaPickerInputProps, MediaItem } from "../types";
import { parseCommaSeparatedIds, toCommaSeparatedIds } from "../utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

export interface SingleMediaPickerInputProps extends BaseMediaPickerInputProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onItemsChange?: (items: MediaItem[]) => void;
}

export default function SingleMediaPickerInput({
  name,
  label,
  placeholder = "Pick file",
  disabled,
  required,
  mediaType = "all",
  uploadWith,
  className,
  helperText,
  modalTitle,
  defaultValue,
  value,
  onValueChange,
  onItemsChange,
}: SingleMediaPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const currentValue = value ?? internalValue;
  const selectedIds = useMemo(() => parseCommaSeparatedIds(currentValue).slice(0, 1), [currentValue]);

  useEffect(() => {
    const run = async () => {
      if (!selectedIds.length) {
        setSelectedItem(null);
        return;
      }
      const items = await getMediaByIds(selectedIds);
      setSelectedItem(items[0] ?? null);
    };
    run();
  }, [currentValue, selectedIds]);

  function update(nextItems: MediaItem[]) {
    const nextValue = toCommaSeparatedIds(nextItems.slice(0, 1));
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    onItemsChange?.(nextItems.slice(0, 1));
    setSelectedItem(nextItems[0] ?? null);
  }

  function removeCurrent() {
    if (value === undefined) {
      setInternalValue("");
    }
    onValueChange?.("");
    onItemsChange?.([]);
    setSelectedItem(null);
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-900">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}

      <input type="hidden" name={name} value={currentValue} />

      <div className="space-y-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" />
          {selectedItem ? "Change selection" : placeholder}
        </button>

        <MediaPreviewList
          items={selectedItem ? [selectedItem] : []}
          onRemove={selectedItem ? () => removeCurrent() : undefined}
        />


        {helperText && <div className="text-xs text-slate-500">{helperText}</div>}
      </div>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        mode="single"
        mediaType={mediaType}
        selectedIds={selectedIds}
        onConfirm={update}
        uploadWith={uploadWith}
        title={modalTitle}
      />
    </div>
  );
}
