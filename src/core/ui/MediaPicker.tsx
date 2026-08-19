"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, File, ImagePlus, Loader2, Search, Upload, X } from "lucide-react";
import { translatePortalText } from "@core/i18n/translate";
import type { CoreMediaItem } from "@core/media/types";

export type MediaPickerCopy = {
  media: string; change: string; choose: string; remove: string; providerShared: string; providerOwned: string; personal: string; public: string;
  libraryTitle: string; staffScopeHelp: string; userScopeHelp: string; providerScopeHelp: string; searchPlaceholder: string; uploading: string; upload: string;
  loadFailed: string; uploadFailed: string; providerShare: string; providerMedia: string; publicMedia: string;
};

function imageSrc(value: string) { return value || ""; }
function formatBytes(value: number) { if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }

export function MediaPicker({ name, providerId, value = "", mediaType = "image", label, required, valueField = "fileUrl", locale }: { name: string; providerId: string; value?: string; mediaType?: "all" | "image" | "video" | "file"; label?: string; required?: boolean; valueField?: "id" | "fileUrl"; locale?: string }) {
  const currentLocale = locale || (typeof document !== "undefined" ? document.documentElement.lang : "fa");
  const copy = useCallback((source: string) => translatePortalText(currentLocale, source), [currentLocale]);
  const [current, setCurrent] = useState(value);
  const [selected, setSelected] = useState<CoreMediaItem | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CoreMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const references = useMemo(() => current ? [current] : [], [current]);

  useEffect(() => {
    if (!current) { setSelected(null); return; }
    fetch("/api/core/media/by-references", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId, references }) })
      .then((response) => response.ok ? response.json() : { items: [] })
      .then((payload) => setSelected(payload.items?.[0] || null)).catch(() => setSelected(null));
  }, [current, providerId, references]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ providerId, q: query });
        if (mediaType !== "all") params.set("mediaType", mediaType);
        const response = await fetch(`/api/core/media?${params}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Could not load media.");
        const payload = await response.json() as { items: CoreMediaItem[] };
        setItems(payload.items || []);
      } catch (cause) { if ((cause as Error).name !== "AbortError") setError(copy("Could not load the media library.")); }
      finally { setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [copy, mediaType, open, providerId, query]);

  const choose = (item: CoreMediaItem) => { setSelected(item); setCurrent(valueField === "id" ? item.id : item.fileUrl); setOpen(false); };
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true); setError("");
    const body = new FormData(); body.append("providerId", providerId); body.append("file", file);
    try {
      const response = await fetch("/api/core/media/upload", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Upload failed.");
      choose(payload as CoreMediaItem);
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy("File upload failed.")); }
    finally { setUploading(false); }
  };

  return <div className="space-y-2">
    <div className="text-sm font-semibold text-slate-800">{label || copy("Media")}</div>
    <input type="text" name={name} value={current} required={required} onChange={() => undefined} tabIndex={-1} aria-hidden="true" className="sr-only" data-media-reference />
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-bold hover:bg-muted"><ImagePlus size={16} />{copy(selected ? "Change media" : "Select from library")}</button>
      {selected ? <button type="button" onClick={() => { setCurrent(""); setSelected(null); }} className="text-xs font-bold text-red-700">{copy("Remove selection")}</button> : null}
    </div>
    {selected ? <div className="flex items-center gap-3 rounded-lg border border-border p-2">{selected.mediaType === "image" ? <img src={imageSrc(selected.fileUrl)} alt={selected.originalName} className="h-16 w-20 rounded object-cover" /> : <div className="flex h-16 w-20 items-center justify-center rounded bg-muted"><File /></div>}<div className="min-w-0"><div className="truncate text-sm font-bold">{selected.originalName}</div><div className="text-xs text-muted-foreground">{formatBytes(selected.fileSize)} · {copy(selected.ownedByProvider ? "Owned by provider" : "Public LSevin media")}</div></div></div> : null}
    {open ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-border p-4"><div><div className="font-black">{copy("LSevin media library")}</div><div className="text-xs text-muted-foreground">{copy("Only public media or media owned by this provider can be selected.")}</div></div><button type="button" onClick={() => setOpen(false)} aria-label={copy("Close")}><X /></button></div><div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute right-3 top-2.5 text-muted-foreground" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy("Search filename or title")} className="w-full rounded-md border border-border py-2 pl-3 pr-9 text-sm" /></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-bold"><Upload size={16} />{copy(uploading ? "Uploading" : "Upload file")}<input type="file" className="hidden" disabled={uploading} accept={mediaType === "image" ? "image/*" : mediaType === "video" ? "video/*" : undefined} onChange={(event) => void upload(event.target.files?.[0])} /></label></div>{error ? <div className="mx-4 mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}<div className="max-h-[62vh] overflow-y-auto p-4">{loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div> : <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{items.map((item) => <button key={item.id} type="button" onClick={() => choose(item)} className="overflow-hidden rounded-xl border border-border text-right hover:border-primary">{item.mediaType === "image" ? <img src={imageSrc(item.fileUrl)} alt={item.originalName} className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center bg-muted"><File /></div>}<div className="p-3"><div className="flex items-center gap-2"><Check size={14} className={current === item.id || current === item.fileUrl ? "text-primary" : "opacity-0"} /><span className="truncate text-sm font-bold">{item.originalName}</span></div><div className="mt-1 text-xs text-muted-foreground">{copy(item.ownedByProvider ? "Provider media" : "Public media")}</div></div></button>)}</div>}</div></div></div> : null}
  </div>;
}
