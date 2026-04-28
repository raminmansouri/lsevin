"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  File,
  FileImage,
  Film,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { deleteMediaById, getMediaByReferences, listMedia, uploadViaStorageRoute } from "../api";
import { formatBytes, isImage, isVideo, truncateMiddle } from "../utils";
import type {
  MediaItem,
  MediaPickerModalProps,
  MediaType,
  UploadMediaResult,
  UploadWithProgress,
} from "../types";
import { env } from "@/config/env/client";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { persistUploadedMedia } from "@/components/media/adapters/upload-handler";
import { createEmptyLocalizedContent, DEFAULT_MEDIA_LOCALES } from "@/components/media";

type FilterType = "all" | MediaType;

function mediaSrc(fileUrl: string) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  return `${env.NEXT_PUBLIC_FILES_URL}/${fileUrl}`;
}

function MediaThumb({ item }: { item: MediaItem }) {
  if (isImage(item)) {
    return (
      <ImageWithFallback
        fill
        src={mediaSrc(item.fileUrl)}
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
  deleting,
  onClick,
  onDelete,
}: {
  item: MediaItem;
  selected: boolean;
  deleting?: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border text-left transition",
        selected
          ? "border-slate-900 ring-2 ring-slate-900/10"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <button type="button" onClick={onClick} className="block w-full text-left">
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

        <div className="space-y-1 p-3 pr-10">
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

      <button
        type="button"
        disabled={deleting}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
        className="absolute bottom-2 right-2 rounded-xl bg-white/95 p-2 text-slate-500 opacity-100 shadow-sm ring-1 ring-slate-200 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 md:opacity-0 md:group-hover:opacity-100"
        aria-label={`Delete ${item.originalName}`}
        title="Delete from media library"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function normalizeCreatedMedia(
  created: Partial<MediaItem> | null | undefined,
  uploaded: UploadMediaResult,
  file: File
): MediaItem {
  const id = created?.id ?? uploaded.id;

  if (!id) {
    throw new Error("Media record was uploaded, but no database id was returned.");
  }

  return {
    id,
    titleTranslations: created?.titleTranslations ?? {},
    descriptionTranslations: created?.descriptionTranslations ?? {},
    altTranslations: created?.altTranslations ?? {},
    originalName: created?.originalName ?? uploaded.originalName ?? file.name,
    storedName: created?.storedName ?? uploaded.storedName ?? file.name,
    fileUrl: created?.fileUrl ?? uploaded.fileUrl,
    storagePath: created?.storagePath ?? null,
    mimeType: created?.mimeType ?? uploaded.mimeType ?? file.type ?? "application/octet-stream",
    mediaType: created?.mediaType ?? uploaded.mediaType,
    fileSize: created?.fileSize ?? uploaded.fileSize ?? file.size,
    width: created?.width ?? uploaded.width ?? null,
    height: created?.height ?? uploaded.height ?? null,
    durationSeconds: created?.durationSeconds ?? uploaded.durationSeconds ?? null,
    createDate: created?.createDate ?? null,
    lastModifiedDate: created?.lastModifiedDate ?? null,
    isPublic: created?.isPublic ?? true,
  };
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentUploadHandler: UploadWithProgress = uploadWith ?? uploadViaStorageRoute;

  const selectedItems = useMemo(() => Object.values(selectedMap), [selectedMap]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const listResponse = await listMedia({
        page,
        pageSize,
        search: query,
        mediaType: filterType,
      });

      setItems(listResponse.items);
      setTotal(listResponse.total);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, [filterType, page, pageSize, query]);

  useEffect(() => {
    if (!open) return;
    void loadItems();
  }, [open, loadItems]);

  useEffect(() => {
    if (!open) return;

    const run = async () => {
      const initialItems = await getMediaByReferences(selectedIds);
      const nextMap: Record<string, MediaItem> = {};
      initialItems.forEach((item) => {
        nextMap[item.id] = item;
      });
      setSelectedMap(nextMap);
    };

    void run();
  }, [open, selectedIds.join(",")]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPage(1);
      setUploadProgress(null);
      setSelectedMap({});
      setErrorMessage(null);
      setDeletingIds({});
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
      setErrorMessage(null);
      setUploadProgress(0);
      const uploaded = await currentUploadHandler({
        file,
        onProgress: setUploadProgress,
      });

      const created = (await persistUploadedMedia(file, uploaded, {
        titleTranslations: emptyTranslations,
        descriptionTranslations: emptyTranslations,
        altTranslations: emptyTranslations,
      })) as Partial<MediaItem> | null | undefined;

      const existingAfterUpload = created?.id ? null : (await getMediaByReferences([uploaded.fileUrl]))[0];

      const normalized = existingAfterUpload ?? normalizeCreatedMedia(created, uploaded, file);

      setItems((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)]);
      setTotal((current) => current + (items.some((item) => item.id === normalized.id) ? 0 : 1));

      if (mode === "single") {
        commitSingle(normalized);
        return;
      }

      setSelectedMap((current) => ({
        ...current,
        [normalized.id]: normalized,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setTimeout(() => setUploadProgress(null), 400);
    }
  }

  async function handleDelete(item: MediaItem) {
    const confirmed = window.confirm(`Delete “${item.originalName}” from the media library?`);
    if (!confirmed) return;

    setDeletingIds((current) => ({ ...current, [item.id]: true }));
    setErrorMessage(null);

    try {
      await deleteMediaById(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setTotal((current) => Math.max(0, current - 1));
      setSelectedMap((current) => {
        if (!current[item.id]) return current;
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete media.");
    } finally {
      setDeletingIds((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
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

      <div className="absolute inset-x-4 bottom-4 top-4 mx-auto flex max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
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
                  mediaType === "image" ? "image/*" : mediaType === "video" ? "video/*" : undefined
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

          {errorMessage && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
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
                  deleting={Boolean(deletingIds[item.id])}
                  onClick={() => handlePick(item)}
                  onDelete={() => void handleDelete(item)}
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
