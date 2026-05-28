"use client";

import { GripVertical, ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { getLocalizedValue } from "../localized";
import {
  DEFAULT_MEDIA_LOCALES,
  GalleryPickerItem,
  LocalizedText,
  defaultMediaLabels,
} from "../types";
import { LocalizedTextInput } from "./LocalizedTextInput";
import { LocalizedTextareaInput } from "./LocalizedTextareaInput";

type GalleryEditorProps = {
  value: GalleryPickerItem[];
  onChange: (value: GalleryPickerItem[]) => void;
  locale?: string;
  locales?: readonly string[];
  disabled?: boolean;
};

function reorder<T>(items: T[], fromIndex: number, toIndex: number) {
  const output = [...items];
  const [moved] = output.splice(fromIndex, 1);
  output.splice(toIndex, 0, moved);
  return output;
}

export function GalleryEditor({
  value,
  onChange,
  locale = "en",
  locales = DEFAULT_MEDIA_LOCALES,
  disabled,
}: GalleryEditorProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(value[0]?.media.id ?? null);

  const updateItem = (
    mediaId: string,
    patch: Partial<GalleryPickerItem>
  ) => {
    onChange(
      value.map((item, index) =>
        item.media.id === mediaId
          ? {
              ...item,
              ...patch,
              order: index,
            }
          : {
              ...item,
              order: index,
            }
      )
    );
  };

  const setPrimary = (mediaId: string) => {
    onChange(
      value.map((item, index) => ({
        ...item,
        isPrimary: item.media.id === mediaId,
        order: index,
      }))
    );
  };

  const removeItem = (mediaId: string) => {
    onChange(
      value
        .filter((item) => item.media.id !== mediaId)
        .map((item, index) => ({
          ...item,
          order: index,
        }))
    );
  };

  if (value.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <ImagePlus className="h-5 w-5" />
        </div>
        No gallery items selected yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value.map((item, index) => {
        const isExpanded = expandedId === item.media.id;
        const title = getLocalizedValue(
          item.titleTranslations || item.media.titleTranslations,
          locale
        );

        return (
          <div
            key={item.media.id}
            draggable={!disabled}
            onDragStart={() => {
              dragIndexRef.current = index;
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={() => {
              if (
                disabled ||
                dragIndexRef.current === null ||
                dragIndexRef.current === index
              ) {
                return;
              }

              const reordered = reorder(value, dragIndexRef.current, index).map(
                (row, rowIndex) => ({
                  ...row,
                  order: rowIndex,
                })
              );

              dragIndexRef.current = null;
              onChange(reordered);
            }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button
                type="button"
                disabled={disabled}
                className="cursor-grab rounded-lg border border-slate-200 p-2 text-slate-500 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <img
                src={item.media.fileUrl}
                alt={title || item.media.originalName}
                className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">
                  {title || item.media.originalName}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {item.media.mimeType}
                </div>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => setPrimary(item.media.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
                  item.isPrimary
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                ].join(" ")}
              >
                <Star className="h-3.5 w-3.5" />
                {defaultMediaLabels.primary}
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  setExpandedId((current) =>
                    current === item.media.id ? null : item.media.id
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300"
              >
                {isExpanded ? "Hide details" : "Edit details"}
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(item.media.id)}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <span className="inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </span>
              </button>
            </div>

            {isExpanded ? (
              <div className="space-y-4 p-4">
                <LocalizedTextInput
                  locales={locales}
                  label={defaultMediaLabels.title}
                  value={item.titleTranslations as LocalizedText}
                  onChange={(next) =>
                    updateItem(item.media.id, { titleTranslations: next })
                  }
                />

                <LocalizedTextareaInput
                  locales={locales}
                  label={defaultMediaLabels.description}
                  value={item.descriptionTranslations as LocalizedText}
                  onChange={(next) =>
                    updateItem(item.media.id, { descriptionTranslations: next })
                  }
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
