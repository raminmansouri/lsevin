"use client";

import { ExternalLink, FileText, Maximize2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";

import type { BugReportAttachment } from "../types";

type Props = {
  attachments: BugReportAttachment[];
  imageClassName?: string;
};

function formatSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function openOriginal(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
}

export function BugReportAttachmentGrid({ attachments, imageClassName = "h-36" }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeAttachment = activeIndex === null ? null : attachments[activeIndex] ?? null;
  const activeUrl = useMemo(
    () => (activeAttachment ? resolveHomeMediaUrl(activeAttachment.fileUrl) : ""),
    [activeAttachment],
  );

  if (!attachments.length) return null;

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
        {attachments.map((attachment, index) => {
          const url = resolveHomeMediaUrl(attachment.fileUrl);
          const isPreviewable = attachment.mediaType === "image" || attachment.mediaType === "video";
          return (
            <div key={`${attachment.fileUrl}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => (isPreviewable ? setActiveIndex(index) : openOriginal(url))}
                className="group relative block w-full text-left"
                aria-label={isPreviewable ? `Preview ${attachment.fileName}` : `Open ${attachment.fileName}`}
              >
                {attachment.mediaType === "image" ? (
                  <ImageWithFallback
                    src={url}
                    alt={attachment.fileName}
                    width={640}
                    height={360}
                    className={`${imageClassName} w-full object-cover`}
                  />
                ) : attachment.mediaType === "video" ? (
                  <video src={url} className={`${imageClassName} w-full object-cover`} muted preload="metadata" />
                ) : (
                  <div className={`${imageClassName} flex w-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-600`}>
                    <FileText className="h-6 w-6" />
                    <span className="max-w-[180px] truncate text-xs">{attachment.fileName}</span>
                  </div>
                )}
                <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {isPreviewable ? <Maximize2 className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                </span>
              </button>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700">
                <span className="min-w-0 truncate">{attachment.fileName}</span>
                <button
                  type="button"
                  onClick={() => openOriginal(url)}
                  className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Open
                </button>
              </div>
              {formatSize(attachment.fileSize) ? (
                <div className="border-t border-slate-100 px-3 py-1 text-[11px] text-slate-400">{formatSize(attachment.fileSize)}</div>
              ) : null}
            </div>
          );
        })}
      </div>

      {activeAttachment ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={activeAttachment.fileName}
          onClick={() => setActiveIndex(null)}
        >
          <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{activeAttachment.fileName}</div>
                <div className="text-xs text-slate-500">{activeAttachment.mimeType || activeAttachment.mediaType}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openOriginal(activeUrl)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open original
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-950 p-3 md:p-6">
              {activeAttachment.mediaType === "image" ? (
                <ImageWithFallback
                  src={activeUrl}
                  alt={activeAttachment.fileName}
                  width={1600}
                  height={1000}
                  className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain"
                />
              ) : activeAttachment.mediaType === "video" ? (
                <video src={activeUrl} className="max-h-[78vh] w-auto max-w-full rounded-2xl" controls autoPlay />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
