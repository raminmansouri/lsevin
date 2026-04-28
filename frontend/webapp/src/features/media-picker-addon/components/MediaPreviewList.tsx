"use client";

import React from "react";
import { File, Film, ImageIcon, Trash2 } from "lucide-react";

import type { MediaItem } from "../types";
import { formatBytes, isImage, isVideo, truncateMiddle } from "../utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

function mediaSrc(fileUrl: string) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  return `${env.NEXT_PUBLIC_FILES_URL}/${fileUrl}`;
}

function MediaIcon({ item }: { item: MediaItem }) {
  if (isImage(item)) return <ImageIcon className="h-4 w-4" />;
  if (isVideo(item)) return <Film className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

export default function MediaPreviewList({
  items,
  onRemove,
  compact = false,
}: {
  items: MediaItem[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        No file selected.
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {isImage(item) ? (
                <ImageWithFallback
                  width={50}
                  height={50}
                  src={mediaSrc(item.fileUrl)}
                  alt={item.originalName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <MediaIcon item={item} />
              )}
            </div>

            <div className="min-w-0">
              <div className="line-clamp-1 text-sm font-medium text-slate-900">
                {truncateMiddle(item.originalName, 14)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {item.mediaType} • {formatBytes(item.fileSize)}
              </div>
            </div>
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
