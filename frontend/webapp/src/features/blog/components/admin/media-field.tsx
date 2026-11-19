"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Film, ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { env } from "@/config/env/client";
import { MediaPickerModal, type MediaItem } from "@/features/media-picker-addon";
import { cn } from "@/lib/utils";

/** What the editor needs to show a picked file. Alt text is per language, as in the media library. */
export interface MediaInfo {
  id: string;
  url: string;
  mimeType: string;
  name: string;
  alt: Record<string, string>;
}

export function mediaSrc(fileUrl: string) {
  const src = String(fileUrl || "").trim();
  if (!src) return "";
  if (/^(https?:)?\/\//iu.test(src) || src.startsWith("/") || src.startsWith("blob:")) return src;
  return `${String(env.NEXT_PUBLIC_FILES_URL || "").replace(/\/+$/u, "")}/${src.replace(/^\/+/u, "")}`;
}

export const toMediaInfo = (item: MediaItem): MediaInfo => ({
  id: item.id,
  url: mediaSrc(item.fileUrl),
  mimeType: item.mimeType,
  name: item.originalName,
  alt: (item.altTranslations ?? {}) as Record<string, string>,
});

type MediaCacheValue = { get: (id: string | null | undefined) => MediaInfo | undefined; remember: (items: MediaItem[]) => MediaInfo[] };
const MediaCache = createContext<MediaCacheValue>({ get: () => undefined, remember: () => [] });
export const MediaCacheProvider = ({ value, children }: { value: MediaCacheValue; children: ReactNode }) => <MediaCache.Provider value={value}>{children}</MediaCache.Provider>;
export const useMediaCache = () => useContext(MediaCache);

/** A self-contained cache for forms outside the post editor (authors, categories). */
export function useStandaloneMediaCache(initial: Record<string, MediaInfo> = {}): MediaCacheValue {
  const [map, setMap] = useState(initial);
  return {
    get: (id) => (id ? map[id] : undefined),
    remember: (items) => {
      const infos = items.map(toMediaInfo);
      setMap((previous) => ({ ...previous, ...Object.fromEntries(infos.map((info) => [info.id, info])) }));
      return infos;
    },
  };
}

/** One file from the media library: thumbnail, choose/change, remove. Stores the library id. */
export function MediaPicker({
  value,
  onChange,
  kind,
  label,
  testId,
  disabled,
}: {
  value: string | null | undefined;
  onChange: (id: string | null, info: MediaInfo | null) => void;
  kind: "image" | "video";
  label: string;
  testId?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("AdminBlog");
  const cache = useMediaCache();
  const [open, setOpen] = useState(false);
  const info = cache.get(value);
  const hasValue = Boolean(value);

  return (
    <div className="space-y-1.5" data-testid={testId}>
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border bg-background p-2">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {kind === "image" && info?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.url} alt="" className="size-full object-cover" />
          ) : kind === "video" && hasValue ? (
            <Film className="size-5 text-muted-foreground" aria-hidden />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">
          {hasValue ? <span className="line-clamp-2 break-all">{info?.name ?? value}</span> : t("media.none")}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className="h-8 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-50"
            data-testid={testId ? `${testId}-choose` : undefined}
          >
            {hasValue ? t("media.change") : t("media.choose")}
          </button>
          {hasValue ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null, null)}
              aria-label={t("media.remove")}
              title={t("media.remove")}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        mode="single"
        mediaType={kind}
        selectedIds={value ? [value] : []}
        onConfirm={(items) => {
          const [first] = cache.remember(items);
          if (first) onChange(first.id, first);
          setOpen(false);
        }}
      />
    </div>
  );
}

/** Several files at once (gallery). Calls back with every newly chosen file. */
export function MultiMediaButton({ onPick, label, testId }: { onPick: (items: MediaInfo[]) => void; label: string; testId?: string }) {
  const cache = useMediaCache();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted")} data-testid={testId}>
        <ImagePlus className="size-4" aria-hidden />
        {label}
      </button>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        mode="multiple"
        mediaType="image"
        maxSelection={24}
        onConfirm={(items) => {
          onPick(cache.remember(items));
          setOpen(false);
        }}
      />
    </>
  );
}
