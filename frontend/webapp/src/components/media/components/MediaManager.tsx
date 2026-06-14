"use client";

import {
  Check,
  CheckSquare,
  FileText,
  Film,
  Grid2x2,
  ImageIcon,
  Loader2,
  Pencil,
  Search,
  Square,
  Trash2,
  UploadCloud,
  X,
  List as ListIcon,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import { createEmptyLocalizedContent, getLocalizedValue } from "../localized";
import {
  bulkDeleteMediaRecords,
  fetchMediaList,
  updateMediaRecord,
} from "../client/api";
import { extractClientMediaMetadata, formatBytes, formatDuration, getExtensionFromName, getMediaTypeFromMime } from "../client/file-metadata";
import { defaultUploadHandler, persistUploadedMedia } from "../adapters/upload-handler";
import {
  DEFAULT_MEDIA_LOCALES,
  LocalizedText,
  MediaItem,
  MediaPickerValue,
  MediaSort,
  MediaType,
  MediaViewMode,
  UploadMediaHandler,
  defaultMediaLabels,
  toMediaPickerValue,
} from "../types";
import { LocalizedTextInput } from "./LocalizedTextInput";
import { LocalizedTextareaInput } from "./LocalizedTextareaInput";
import { ImageWithFallback } from "@/app/[locale]/n/app/components/figma/ImageWithFallback";
import { env } from "@/config/env/client";

type MetadataEditorProps = {
  item: MediaItem | null;
  open: boolean;
  locales: readonly string[];
  uploadHandler?: UploadMediaHandler;
  onClose: () => void;
  onSaved: (item: MediaItem) => void;
};

type MediaManagerProps = {
  mode?: "library" | "picker";
  multiple?: boolean;
  acceptedMediaTypes?: MediaType[];
  maxSelectionCount?: number;
  locales?: readonly string[];
  initialSelection?: MediaPickerValue[];
  onConfirmSelection?: (items: MediaPickerValue[]) => void;
  onCancel?: () => void;
  uploadHandler?: UploadMediaHandler;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function acceptToMimeHint(acceptedMediaTypes?: MediaType[]) {
  if (!acceptedMediaTypes || acceptedMediaTypes.length === 0) return "";
  if (acceptedMediaTypes.length === 1) {
    return acceptedMediaTypes[0];
  }
  return acceptedMediaTypes.join(", ");
}

function isAcceptedMediaType(
  mediaType: MediaType,
  acceptedMediaTypes?: MediaType[]
) {
  if (!acceptedMediaTypes || acceptedMediaTypes.length === 0) return true;
  return acceptedMediaTypes.includes(mediaType);
}

function mediaTypeIcon(mediaType: MediaType) {
  if (mediaType === "image") return <ImageIcon className="h-4 w-4" />;
  if (mediaType === "video") return <Film className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function sortLabel(sort: MediaSort) {
  switch (sort) {
    case "oldest":
      return defaultMediaLabels.sortOldest;
    case "title":
      return defaultMediaLabels.sortTitle;
    case "filename":
      return defaultMediaLabels.sortFilename;
    case "newest":
    default:
      return defaultMediaLabels.sortNewest;
  }
}

function mediaTypeLabel(type: MediaType | "all") {
  switch (type) {
    case "image":
      return defaultMediaLabels.images;
    case "video":
      return defaultMediaLabels.videos;
    case "file":
      return defaultMediaLabels.files;
    case "all":
    default:
      return defaultMediaLabels.allTypes;
  }
}

function MediaPreview({
  item,
  className,
}: {
  item: Pick<MediaItem, "mediaType" | "fileUrl" | "originalName">;
  className?: string;
}) {
  if (item.mediaType === "image") {
    return (
      <ImageWithFallback
        src={ `${env.NEXT_PUBLIC_FILES_URL}/${item.fileUrl}`}
        alt={item.originalName}
        className={cx("h-full w-full object-cover", className)}
      />
    );
  }

  if (item.mediaType === "video") {
    return (
      <video
        src={item.fileUrl}
        controls
        className={cx("h-full w-full bg-slate-950 object-contain", className)}
      />
    );
  }

  return (
    <div
      className={cx(
        "flex h-full w-full items-center justify-center bg-slate-100 text-slate-500",
        className
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <FileText className="h-10 w-10" />
        <div className="text-xs font-medium">{item.originalName}</div>
      </div>
    </div>
  );
}

function SelectionBadge({ selected }: { selected: boolean }) {
  return (
    <div
      className={cx(
        "absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm",
        selected
          ? "border-sky-600 bg-sky-600 text-white"
          : "border-slate-300 bg-white text-transparent"
      )}
    >
      <Check className="h-4 w-4" />
    </div>
  );
}

function MetadataEditor({
  item,
  open,
  locales,
  uploadHandler,
  onClose,
  onSaved,
}: MetadataEditorProps) {
  const [titleTranslations, setTitleTranslations] = useState<LocalizedText>(
    createEmptyLocalizedContent(locales)
  );
  const [descriptionTranslations, setDescriptionTranslations] =
    useState<LocalizedText>(createEmptyLocalizedContent(locales));
  const [altTranslations, setAltTranslations] = useState<LocalizedText>(
    createEmptyLocalizedContent(locales)
  );
  const [isPublic, setIsPublic] = useState(true);
  const [pending, setPending] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!item) return;
    setTitleTranslations(item.titleTranslations);
    setDescriptionTranslations(item.descriptionTranslations);
    setAltTranslations(item.altTranslations);
    setIsPublic(item.isPublic);
  }, [item]);

  if (!open || !item) return null;

  const save = async () => {
    try {
      setPending(true);
      const updated = await updateMediaRecord(item.id, {
        titleTranslations,
        descriptionTranslations,
        altTranslations,
        isPublic,
      });
      toast.success("Media metadata updated.");
      onSaved(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(false);
    }
  };

  const replaceFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    try {
      setPending(true);
      setReplaceProgress(uploadHandler ? 10 : 0);

      const handler = uploadHandler ?? defaultUploadHandler;
      const uploadResult = await handler({
        file: nextFile,
        titleTranslations,
        descriptionTranslations,
        altTranslations,
        onProgress: setReplaceProgress,
      });

      const extracted = await extractClientMediaMetadata(nextFile);
      const updated = await updateMediaRecord(item.id, {
        originalName: nextFile.name,
        storedName: uploadResult.storedName ?? nextFile.name,
        fileUrl: uploadResult.fileUrl,
        storagePath: uploadResult.storagePath ?? null,
        storageKey: uploadResult.storageKey ?? null,
        mimeType: nextFile.type || "application/octet-stream",
        extension: getExtensionFromName(nextFile.name),
        mediaType: getMediaTypeFromMime(nextFile.type || ""),
        fileSize: nextFile.size,
        width: extracted.width,
        height: extracted.height,
        durationSeconds: extracted.durationSeconds,
        titleTranslations,
        descriptionTranslations,
        altTranslations,
      });

      toast.success("File replaced successfully.");
      onSaved(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Replace failed.");
    } finally {
      setPending(false);
      setReplaceProgress(null);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-base font-semibold text-slate-950">
            {defaultMediaLabels.editMetadata}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1.05fr_1fr]">
          <div className="min-h-[320px] border-b border-slate-200 bg-slate-50 md:min-h-0 md:border-b-0 md:border-r">
            <MediaPreview item={item} className="aspect-square h-full min-h-[320px]" />
          </div>

          <div className="space-y-4 p-5">
            <LocalizedTextInput
              locales={locales}
              label={defaultMediaLabels.title}
              value={titleTranslations}
              onChange={setTitleTranslations}
            />

            <LocalizedTextareaInput
              locales={locales}
              label={defaultMediaLabels.description}
              value={descriptionTranslations}
              onChange={setDescriptionTranslations}
            />

            <LocalizedTextInput
              locales={locales}
              label={defaultMediaLabels.altText}
              value={altTranslations}
              onChange={setAltTranslations}
            />

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Publicly accessible file
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-medium text-slate-900">
                {defaultMediaLabels.replaceFile}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300">
                <UploadCloud className="h-4 w-4" />
                Upload replacement
                <input
                  type="file"
                  className="hidden"
                  onChange={replaceFile}
                />
              </label>

              {replaceProgress !== null ? (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-sky-600 transition-all"
                      style={{
                        width:
                          typeof replaceProgress === "number"
                            ? `${replaceProgress}%`
                            : "70%",
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
          >
            {defaultMediaLabels.cancel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {defaultMediaLabels.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaManager({
  mode = "library",
  multiple = false,
  acceptedMediaTypes,
  maxSelectionCount,
  locales = DEFAULT_MEDIA_LOCALES,
  initialSelection = [],
  onConfirmSelection,
  onCancel,
  uploadHandler,
}: MediaManagerProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [mediaType, setMediaType] = useState<MediaType | "all">(
    acceptedMediaTypes?.length === 1 ? acceptedMediaTypes[0] : "all"
  );
  const [sort, setSort] = useState<MediaSort>("newest");
  const [viewMode, setViewMode] = useState<MediaViewMode>("grid");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(24);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [editorItem, setEditorItem] = useState<MediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStates, setUploadStates] = useState<
    Array<{
      name: string;
      progress: number | null;
      status: "uploading" | "saving" | "done" | "error";
      error?: string;
    }>
  >([]);
  const [selectedMap, setSelectedMap] = useState<Map<string, MediaPickerValue>>(
    new Map(initialSelection.map((item) => [item.id, item]))
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search);
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchMediaList({
        page,
        pageSize,
        search: appliedSearch,
        mediaType,
        sort,
        locale,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load media.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, appliedSearch, mediaType, sort, locale]);

  const selectedIds = useMemo(() => Array.from(selectedMap.keys()), [selectedMap]);
  const selectedItems = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleItem = (item: MediaItem) => {
    setSelectedMap((current) => {
      const next = new Map(current);
      const pickerValue = toMediaPickerValue(item);

      if (multiple) {
        if (next.has(item.id)) {
          next.delete(item.id);
          return next;
        }

        if (maxSelectionCount && next.size >= maxSelectionCount) {
          toast.error(`You can only select up to ${maxSelectionCount} item(s).`);
          return current;
        }

        next.set(item.id, pickerValue);
        return next;
      }

      if (next.has(item.id)) {
        next.clear();
      } else {
        next.clear();
        next.set(item.id, pickerValue);
      }

      return next;
    });
  };

  const onUploadFiles = async (files: FileList | File[]) => {
    const uploadFiles = Array.from(files);

    if (uploadFiles.length === 0) return;
    setIsUploading(true);

    const handler = uploadHandler ?? defaultUploadHandler;
    const emptyTranslations = createEmptyLocalizedContent(locales);

    setUploadStates(
      uploadFiles.map((file) => ({
        name: file.name,
        progress: 0,
        status: "uploading",
      }))
    );

    for (const [index, file] of uploadFiles.entries()) {
      try {
        const mediaTypeFromFile = getMediaTypeFromMime(file.type || "");
        if (!isAcceptedMediaType(mediaTypeFromFile, acceptedMediaTypes)) {
          throw new Error(
            `File "${file.name}" is not accepted for this picker. Expected: ${acceptToMimeHint(
              acceptedMediaTypes
            )}.`
          );
        }

        const uploadResult = await handler({
          file,
          titleTranslations: emptyTranslations,
          descriptionTranslations: emptyTranslations,
          altTranslations: emptyTranslations,
          onProgress: (progress) => {
            setUploadStates((current) =>
              current.map((row, rowIndex) =>
                rowIndex === index
                  ? {
                      ...row,
                      progress,
                      status: "uploading",
                    }
                  : row
              )
            );
          },
        });

        setUploadStates((current) =>
          current.map((row, rowIndex) =>
            rowIndex === index
              ? {
                  ...row,
                  status: "saving",
                  progress: 100,
                }
              : row
          )
        );

        const created = await persistUploadedMedia(file, uploadResult, {
          titleTranslations: emptyTranslations,
          descriptionTranslations: emptyTranslations,
          altTranslations: emptyTranslations,
        });

        setUploadStates((current) =>
          current.map((row, rowIndex) =>
            rowIndex === index
              ? {
                  ...row,
                  status: "done",
                  progress: 100,
                }
              : row
          )
        );

        if (mode === "picker") {
          setSelectedMap((current) => {
            if (!multiple) {
              return new Map([[created.id, toMediaPickerValue(created)]]);
            }

            const next = new Map(current);
            if (!maxSelectionCount || next.size < maxSelectionCount) {
              next.set(created.id, toMediaPickerValue(created));
            }
            return next;
          });
        }
      } catch (error) {
        setUploadStates((current) =>
          current.map((row, rowIndex) =>
            rowIndex === index
              ? {
                  ...row,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed.",
                }
              : row
          )
        );
      }
    }

    setIsUploading(false);
    await loadItems();
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    await onUploadFiles(event.dataTransfer.files);
  };

  const onInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await onUploadFiles(event.target.files ?? []);
    event.target.value = "";
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      setPendingDelete(true);
      const result = await bulkDeleteMediaRecords(selectedIds);
      toast.success(`${result.deleted} media item(s) deleted.`);
      setSelectedMap(new Map());
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setPendingDelete(false);
    }
  };

  const updateEditorItem = (next: MediaItem) => {
    setItems((current) =>
      current.map((item) => (item.id === next.id ? next : item))
    );
    setSelectedMap((current) => {
      const nextMap = new Map(current);
      if (nextMap.has(next.id)) {
        nextMap.set(next.id, toMediaPickerValue(next));
      }
      return nextMap;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-950">
              {defaultMediaLabels.libraryTitle}
            </div>
            <div className="text-sm text-slate-500">
              Upload, organize, and reuse files across forms and admin screens.
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={defaultMediaLabels.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <select
              value={mediaType}
              onChange={(event) => {
                setMediaType(event.target.value as MediaType | "all");
                setPage(1);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {(["all", "image", "video", "file"] as const)
                .filter((item) =>
                  item === "all" ||
                  !acceptedMediaTypes ||
                  acceptedMediaTypes.includes(item)
                )
                .map((item) => (
                  <option key={item} value={item}>
                    {mediaTypeLabel(item)}
                  </option>
                ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as MediaSort)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {(["newest", "oldest", "title", "filename"] as const).map((item) => (
                <option key={item} value={item}>
                  {sortLabel(item)}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cx(
                  "rounded-xl p-2 transition",
                  viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500"
                )}
              >
                <Grid2x2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cx(
                  "rounded-xl p-2 transition",
                  viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500"
                )}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <UploadCloud className="h-4 w-4" />
              {defaultMediaLabels.upload}
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={onInputChange}
              className="hidden"
              accept={
                acceptedMediaTypes?.includes("image") && acceptedMediaTypes.length === 1
                  ? "image/*"
                  : acceptedMediaTypes?.includes("video") &&
                    acceptedMediaTypes.length === 1
                  ? "video/*"
                  : undefined
              }
            />
          </div>
        </div>

        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <UploadCloud className="h-6 w-6 text-slate-600" />
          </div>
          <div className="text-sm font-medium text-slate-900">
            {defaultMediaLabels.dragAndDrop}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {defaultMediaLabels.uploadHint}
            {acceptedMediaTypes?.length ? ` Allowed type: ${acceptToMimeHint(acceptedMediaTypes)}.` : ""}
          </div>
        </div>

        {uploadStates.length > 0 ? (
          <div className="mt-4 space-y-2">
            {uploadStates.map((row) => (
              <div
                key={row.name}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                    {row.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.status === "saving"
                      ? "Saving record"
                      : row.status === "done"
                      ? "Done"
                      : row.status === "error"
                      ? row.error || "Failed"
                      : defaultMediaLabels.uploading}
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cx(
                      "h-full rounded-full transition-all",
                      row.status === "error" ? "bg-rose-500" : "bg-sky-600"
                    )}
                    style={{
                      width:
                        row.progress === null
                          ? "70%"
                          : `${Math.max(6, Math.min(100, row.progress))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {mode === "picker" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm font-medium text-slate-700">
              {defaultMediaLabels.selectedCount(selectedIds.length)}
            </div>
            <div className="text-xs text-slate-500">
              {multiple
                ? "Select one or more media items."
                : "Select exactly one media item."}
            </div>
          </div>
        ) : selectedIds.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
              <CheckSquare className="h-4 w-4" />
              {defaultMediaLabels.selectedCount(selectedIds.length)}
            </div>

            <button
              type="button"
              disabled={pendingDelete}
              onClick={deleteSelected}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {pendingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {defaultMediaLabels.deleteSelected}
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <ImageIcon className="h-6 w-6 text-slate-500" />
            </div>
            <div className="text-base font-semibold text-slate-900">
              {defaultMediaLabels.noItemsTitle}
            </div>
            <div className="mt-1 max-w-md text-sm text-slate-500">
              {defaultMediaLabels.noItemsDescription}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => {
              const selected = selectedMap.has(item.id);
              const title = getLocalizedValue(item.titleTranslations, locale);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleItem(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleItem(item);
                    }
                  }}
                  className={cx(
                    "group relative overflow-hidden rounded-[24px] border bg-white text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-200",
                    selected
                      ? "border-sky-500 ring-2 ring-sky-100"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  )}
                >
                  <SelectionBadge selected={selected} />

                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <MediaPreview item={item} />
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {title || item.originalName}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {item.originalName}
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {mediaTypeIcon(item.mediaType)}
                        {item.mediaType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{formatBytes(item.fileSize)}</span>
                      <span>{item.durationSeconds ? formatDuration(item.durationSeconds) : item.width && item.height ? `${item.width}×${item.height}` : item.extension?.toUpperCase() || ""}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-400">
                        {new Date(item.createDate).toLocaleDateString()}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditorItem(item);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            {items.map((item, index) => {
              const selected = selectedMap.has(item.id);
              const title = getLocalizedValue(item.titleTranslations, locale);

              return (
                <div
                  key={item.id}
                  className={cx(
                    "grid grid-cols-[auto_72px_1fr_auto] items-center gap-4 px-4 py-3",
                    index !== items.length - 1 && "border-b border-slate-100",
                    selected && "bg-sky-50/60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="text-slate-600"
                  >
                    {selected ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  <div className="h-14 w-18 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <MediaPreview item={item} />
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="min-w-0 text-left"
                  >
                    <div className="truncate text-sm font-medium text-slate-900">
                      {title || item.originalName}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{item.originalName}</span>
                      <span>{item.mimeType}</span>
                      <span>{formatBytes(item.fileSize)}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditorItem(item)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300"
                  >
                    {defaultMediaLabels.editMetadata}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-5">
        <div className="text-sm text-slate-500">
          Page {page} of {totalPages} · {total} item(s)
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {mode === "picker" ? (
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] sm:px-5">
          <div className="text-sm font-medium text-slate-700">
            {defaultMediaLabels.selectedCount(selectedItems.length)}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              {defaultMediaLabels.cancel}
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0 || isUploading}
              onClick={() => onConfirmSelection?.(selectedItems)}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {defaultMediaLabels.confirmSelection}
            </button>
          </div>
        </div>
      ) : null}

      <MetadataEditor
        item={editorItem}
        open={Boolean(editorItem)}
        locales={locales}
        uploadHandler={uploadHandler}
        onClose={() => setEditorItem(null)}
        onSaved={(next) => {
          updateEditorItem(next);
          void loadItems();
        }}
      />
    </div>
  );
}
