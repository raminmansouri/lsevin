"use client";

import { ImagePlus, Paperclip, PlayCircle, Trash2 } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";

import { createEmptyLocalizedContent } from "../localized";
import {
  DEFAULT_MEDIA_LOCALES,
  GalleryPickerItem,
  MediaPickerValue,
  MediaType,
  UploadMediaHandler,
  defaultMediaLabels,
} from "../types";
import { GalleryEditor } from "./GalleryEditor";
import { MediaManager } from "./MediaManager";
import { MediaPickerDialog } from "./MediaPickerDialog";

type SharedProps = {
  label?: string;
  hint?: string;
  disabled?: boolean;
  locales?: readonly string[];
  acceptedMediaTypes?: MediaType[];
  maxSelectionCount?: number;
  uploadHandler?: UploadMediaHandler;
};

type BaseSingleProps = SharedProps & {
  value: MediaPickerValue | null;
  onChange: (value: MediaPickerValue | null) => void;
};

type BaseMultiProps = SharedProps & {
  value: MediaPickerValue[];
  onChange: (value: MediaPickerValue[]) => void;
};

type GalleryPickerFieldProps = SharedProps & {
  value: GalleryPickerItem[];
  onChange: (value: GalleryPickerItem[]) => void;
};

function fileIcon(mediaType: MediaType) {
  if (mediaType === "image") return <ImagePlus className="h-4 w-4" />;
  if (mediaType === "video") return <PlayCircle className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
}

function FieldShell({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {label ? (
        <div>
          <div className="text-sm font-medium text-slate-900">{label}</div>
          {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function SinglePreview({
  item,
  onRemove,
  disabled,
}: {
  item: MediaPickerValue | null;
  onRemove: () => void;
  disabled?: boolean;
}) {
  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No file selected yet.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {item.mediaType === "image" ? (
        <img
          src={item.fileUrl}
          alt={item.originalName}
          className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
          {fileIcon(item.mediaType)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900">
          {item.originalName}
        </div>
        <div className="truncate text-xs text-slate-500">{item.mimeType}</div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function MultiPreview({
  items,
  onRemove,
  disabled,
}: {
  items: MediaPickerValue[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No files selected yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          {item.mediaType === "image" ? (
            <img
              src={item.fileUrl}
              alt={item.originalName}
              className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              {fileIcon(item.mediaType)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-900">
              {item.originalName}
            </div>
            <div className="truncate text-xs text-slate-500">{item.mimeType}</div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(item.id)}
            className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function BaseSingleMediaPickerField({
  value,
  onChange,
  label,
  hint,
  disabled,
  locales = DEFAULT_MEDIA_LOCALES,
  acceptedMediaTypes,
  uploadHandler,
}: BaseSingleProps) {
  const [open, setOpen] = useState(false);

  return (
    <FieldShell label={label} hint={hint}>
      <SinglePreview
        item={value}
        disabled={disabled}
        onRemove={() => onChange(null)}
      />

      <div className="flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300"
        >
          {defaultMediaLabels.openLibrary}
        </button>
      </div>

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={label || defaultMediaLabels.chooseMedia}
      >
        <MediaManager
          mode="picker"
          multiple={false}
          locales={locales}
          uploadHandler={uploadHandler}
          acceptedMediaTypes={acceptedMediaTypes}
          initialSelection={value ? [value] : []}
          onConfirmSelection={(items) => {
            onChange(items[0] ?? null);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </MediaPickerDialog>
    </FieldShell>
  );
}

export function BaseMultiMediaPickerField({
  value,
  onChange,
  label,
  hint,
  disabled,
  locales = DEFAULT_MEDIA_LOCALES,
  acceptedMediaTypes,
  maxSelectionCount,
  uploadHandler,
}: BaseMultiProps) {
  const [open, setOpen] = useState(false);

  return (
    <FieldShell label={label} hint={hint}>
      <MultiPreview
        items={value}
        disabled={disabled}
        onRemove={(id) => onChange(value.filter((item) => item.id !== id))}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300"
      >
        {defaultMediaLabels.openLibrary}
      </button>

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={label || defaultMediaLabels.chooseMedia}
      >
        <MediaManager
          mode="picker"
          multiple
          locales={locales}
          uploadHandler={uploadHandler}
          acceptedMediaTypes={acceptedMediaTypes}
          maxSelectionCount={maxSelectionCount}
          initialSelection={value}
          onConfirmSelection={(items) => {
            onChange(items);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </MediaPickerDialog>
    </FieldShell>
  );
}

export function GalleryPickerField({
  value,
  onChange,
  label,
  hint,
  disabled,
  locales = DEFAULT_MEDIA_LOCALES,
  acceptedMediaTypes = ["image"],
  maxSelectionCount,
  uploadHandler,
}: GalleryPickerFieldProps) {
  const [open, setOpen] = useState(false);

  const mediaValue = useMemo(() => value.map((item) => item.media), [value]);

  return (
    <FieldShell label={label} hint={hint}>
      <GalleryEditor
        disabled={disabled}
        locales={locales}
        value={value}
        onChange={onChange}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300"
      >
        {defaultMediaLabels.openLibrary}
      </button>

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={label || defaultMediaLabels.gallery}
      >
        <MediaManager
          mode="picker"
          multiple
          locales={locales}
          uploadHandler={uploadHandler}
          acceptedMediaTypes={acceptedMediaTypes}
          maxSelectionCount={maxSelectionCount}
          initialSelection={mediaValue}
          onConfirmSelection={(items) => {
            const previousById = new Map(value.map((row) => [row.media.id, row]));
            const next = items.map((item, index) => {
              const existing = previousById.get(item.id);
              return {
                media: item,
                order: index,
                isPrimary:
                  existing?.isPrimary ??
                  (value.every((entry) => !entry.isPrimary) ? index === 0 : false),
                titleTranslations:
                  existing?.titleTranslations ?? createEmptyLocalizedContent(locales),
                descriptionTranslations:
                  existing?.descriptionTranslations ?? createEmptyLocalizedContent(locales),
              };
            });

            if (next.length > 0 && next.every((row) => !row.isPrimary)) {
              next[0].isPrimary = true;
            }

            onChange(next);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </MediaPickerDialog>
    </FieldShell>
  );
}

export function SingleImagePickerField(props: BaseSingleProps) {
  return (
    <BaseSingleMediaPickerField
      {...props}
      acceptedMediaTypes={["image"]}
    />
  );
}

export function SingleVideoPickerField(props: BaseSingleProps) {
  return (
    <BaseSingleMediaPickerField
      {...props}
      acceptedMediaTypes={["video"]}
    />
  );
}

export function SingleFilePickerField(props: BaseSingleProps) {
  return (
    <BaseSingleMediaPickerField
      {...props}
      acceptedMediaTypes={["file"]}
    />
  );
}

export function MultiFilePickerField(props: BaseMultiProps) {
  return <BaseMultiMediaPickerField {...props} />;
}
