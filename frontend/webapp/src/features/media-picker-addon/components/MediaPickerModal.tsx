"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  File,
  FileImage,
  Film,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";

import { getMediaByIds, listMedia, uploadViaStorageRoute } from "../api";
import { formatBytes, isImage, isVideo, truncateMiddle } from "../utils";
import type {
  MediaItem,
  MediaPickerModalProps,
  MediaType,
  UploadWithProgress,
} from "../types";
import { env } from "@/config/env/client";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { persistUploadedMedia } from "@/components/media/adapters/upload-handler";
import { createEmptyLocalizedContent, DEFAULT_MEDIA_LOCALES } from "@/components/media";

type FilterType = "all" | MediaType;

function MediaThumb({ item }: { item: MediaItem }) {
  if (isImage(item)) {
    return (
      <ImageWithFallback
        fill
        src={`${env.NEXT_PUBLIC_FILES_URL}/${item.fileUrl}`}
        alt={item.originalName}
        className="h-full w-full object-cover"
      />
    );
  }

  if (isVideo(item)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100">
        <Film className="h-8 w-8 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <File className="h-8 w-8 text-slate-500" />
    </div>
  );
}

function ChipButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MediaCard({
  item,
  selected,
  onClick,
}: {
  item: MediaItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group overflow-hidden rounded-2xl border text-left transition",
        selected
          ? "border-slate-900 ring-2 ring-slate-900/10"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <MediaThumb item={item} />
        <div className="absolute left-2 top-2">
          <div
            className={[
              "rounded-full border p-1.5 shadow-sm",
              selected
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-500",
            ].join(" ")}
          >
            <Check className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="space-y-1 p-3">
        <div className="line-clamp-1 text-sm font-medium text-slate-900">
          {truncateMiddle(item.originalName, 10)}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{item.mediaType}</span>
          <span>•</span>
          <span>{formatBytes(item.fileSize)}</span>
        </div>
      </div>
    </button>
  );
}

export default function MediaPickerModal({
  open,
  onClose,
  mode,
  mediaType = "all",
  maxSelection,
  selectedIds = [],
  onConfirm,
  uploadWith,
  title,
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, MediaItem>>({});
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>(mediaType === "all" ? "all" : mediaType);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [total, setTotal] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);


  const currentUploadHandler: UploadWithProgress = uploadWith ?? uploadViaStorageRoute;

  const selectedItems = useMemo(
    () => Object.values(selectedMap),
    [selectedMap]
  );
const init = async () => {
      setLoading(true);
      try {
        const listResponse = await listMedia({
          page,
          pageSize,
          search: query,
          mediaType: filterType,
        });

        setItems(listResponse.items);
        setTotal(listResponse.total);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    if (!open) return;

    

    init();
  }, [open, page, pageSize, query, filterType]);

  useEffect(() => {
    if (!open) return;

    const run = async () => {
      const initialItems = await getMediaByIds(selectedIds);
      const nextMap: Record<string, MediaItem> = {};
      initialItems.forEach((item) => {
        nextMap[item.id] = item;
      });
      setSelectedMap(nextMap);
    };

    run();
  }, [open, selectedIds.join(",")]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPage(1);
      setUploadProgress(null);
      setSelectedMap({});
    }
  }, [open]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function commitSingle(item: MediaItem) {
    onConfirm([item]);
    onClose();
  }

  function toggleMultiple(item: MediaItem) {
    setSelectedMap((current) => {
      const next = { ...current };

      if (next[item.id]) {
        delete next[item.id];
        return next;
      }

      const count = Object.keys(next).length;
      if (maxSelection && count >= maxSelection) {
        return next;
      }

      next[item.id] = item;
      return next;
    });
  }

  function handlePick(item: MediaItem) {
    if (mode === "single") {
      commitSingle(item);
      return;
    }

    toggleMultiple(item);
  }

  const emptyTranslations = createEmptyLocalizedContent(DEFAULT_MEDIA_LOCALES);

  async function handleUpload(file: File) {
    try {
      setUploadProgress(0);
      const uploaded = await currentUploadHandler({
        file,
        onProgress: setUploadProgress,
      });



      const created = await persistUploadedMedia(file, uploaded, {
        titleTranslations: emptyTranslations,
        descriptionTranslations: emptyTranslations,
        altTranslations: emptyTranslations,
      });

      const normalized: MediaItem = {
        id: uploaded.id ?? crypto.randomUUID(),
        titleTranslations: {},
        descriptionTranslations: {},
        altTranslations: {},
        originalName: uploaded.originalName,
        fileUrl: uploaded.fileUrl,
        mimeType: uploaded.mimeType,
        mediaType: uploaded.mediaType,
        fileSize: uploaded.fileSize,
        width: uploaded.width,
        height: uploaded.height,
        durationSeconds: uploaded.durationSeconds,
      };


      await init();
      // setItems((current) => [normalized, ...current]);

      if (mode === "single") {
        onConfirm([normalized]);
        //onClose();
        return;
      }

      setSelectedMap((current) => ({
        ...current,
        [normalized.id]: normalized,
      }));

      
    } finally {
      setTimeout(() => setUploadProgress(null), 400);
    }
  }

  async function onFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
    event.target.value = "";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} />

      <div className="absolute inset-x-4 top-4 bottom-4 mx-auto flex max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {title ?? (mode === "single" ? "Pick media" : "Pick media files")}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "single"
                ? "Select one file and the dialog will close automatically."
                : "Select one or more files, then confirm selection."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => {
                    setPage(1);
                    setQuery(event.target.value);
                  }}
                  placeholder="Search filename, title or description"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <ChipButton
                  active={filterType === "all"}
                  onClick={() => {
                    setPage(1);
                    setFilterType("all");
                  }}
                >
                  All
                </ChipButton>
                <ChipButton
                  active={filterType === "image"}
                  onClick={() => {
                    setPage(1);
                    setFilterType("image");
                  }}
                >
                  Images
                </ChipButton>
                <ChipButton
                  active={filterType === "video"}
                  onClick={() => {
                    setPage(1);
                    setFilterType("video");
                  }}
                >
                  Videos
                </ChipButton>
                <ChipButton
                  active={filterType === "file"}
                  onClick={() => {
                    setPage(1);
                    setFilterType("file");
                  }}
                >
                  Files
                </ChipButton>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={onFileInputChange}
                accept={
                  mediaType === "image"
                    ? "image/*"
                    : mediaType === "video"
                      ? "video/*"
                      : undefined
                }
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>

          {uploadProgress !== null && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Uploading</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex h-full items-center justify-center py-24 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading media...
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
              <FileImage className="mb-3 h-10 w-10 text-slate-400" />
              <div className="text-base font-medium text-slate-900">No media found</div>
              <div className="mt-1 text-sm text-slate-500">
                Upload a new file or change your search/filter.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {items.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  selected={Boolean(selectedMap[item.id])}
                  onClick={() => handlePick(item)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              Page {page} of {totalPages}
              {mode === "multiple" && (
                <span className="ml-3">
                  Selected: <span className="font-medium text-slate-900">{selectedItems.length}</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {mode === "multiple" && (
                <button
                  type="button"
                  onClick={() => {
                    onConfirm(selectedItems);
                    onClose();
                  }}
                  className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Use selected files
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
