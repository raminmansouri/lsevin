"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Images } from "lucide-react";

import { getMediaByIds } from "../api";
import MediaPickerModal from "./MediaPickerModal";
import MediaPreviewList from "./MediaPreviewList";
import type { BaseMediaPickerInputProps, MediaItem } from "../types";
import { parseCommaSeparatedIds, toCommaSeparatedIds } from "../utils";

export interface MultiMediaPickerInputProps extends BaseMediaPickerInputProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onItemsChange?: (items: MediaItem[]) => void;
  maxSelection?: number;
}

export default function MultiMediaPickerInput({
  name,
  label,
  placeholder = "Pick files",
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
  maxSelection,
}: MultiMediaPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);

  const currentValue = value ?? internalValue;
  const selectedIds = useMemo(() => parseCommaSeparatedIds(currentValue), [currentValue]);

  useEffect(() => {
    const run = async () => {
      const items = await getMediaByIds(selectedIds);
      setSelectedItems(items);
    };
    run();
  }, [currentValue, selectedIds]);

  function update(nextItems: MediaItem[]) {
    const capped = maxSelection ? nextItems.slice(0, maxSelection) : nextItems;
    const nextValue = toCommaSeparatedIds(capped);
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    onItemsChange?.(capped);
    setSelectedItems(capped);
  }

  function removeById(id: string) {
    const nextItems = selectedItems.filter((item) => item.id !== id);
    update(nextItems);
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
          <Images className="h-4 w-4" />
          {selectedItems.length ? "Change selection" : placeholder}
        </button>

        <MediaPreviewList
          items={selectedItems}
          onRemove={selectedItems.length ? removeById : undefined}
        />

       

        {helperText && <div className="text-xs text-slate-500">{helperText}</div>}
      </div>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        mode="multiple"
        mediaType={mediaType}
        maxSelection={maxSelection}
        selectedIds={selectedIds}
        onConfirm={update}
        uploadWith={uploadWith}
        title={modalTitle}
      />
    </div>
  );
}
