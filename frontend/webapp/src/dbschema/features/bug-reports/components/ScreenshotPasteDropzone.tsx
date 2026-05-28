"use client";

import { Clipboard, FileImage, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  label: string;
  hint: string;
};

const MAX_FILES = 8;

function dedupeFiles(files: File[]) {
  const seen = new Set<string>();
  const result: File[] = [];
  for (const file of files) {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(file);
  }
  return result.slice(0, MAX_FILES);
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

export function ScreenshotPasteDropzone({ files, onFilesChange, label, hint }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: isImage(file) ? URL.createObjectURL(file) : null })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [previews]);

  const addFiles = (incoming: File[]) => {
    onFilesChange(dedupeFiles([...files, ...incoming]));
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Choose files
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onPaste={(event) => {
          const pastedFiles = Array.from(event.clipboardData.files ?? []);
          if (pastedFiles.length > 0) {
            event.preventDefault();
            addFiles(pastedFiles);
          }
        }}
        className={`rounded-[28px] border-2 border-dashed p-5 text-center transition ${
          isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,.pdf,.txt,.json,.zip"
          multiple
          hidden
          onChange={onInputChange}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <UploadCloud className="h-5 w-5 text-emerald-700" />
        </div>
        <p className="text-sm font-medium text-slate-800">{hint}</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
          <Clipboard className="h-3.5 w-3.5" /> Ctrl/⌘ + V works after clicking this box. Max 8 files, 15MB each.
        </p>
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm">
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.file.name} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 w-full flex-col items-center justify-center gap-2 bg-slate-100 text-xs text-slate-600">
                  <FileImage className="h-5 w-5" />
                  <span className="max-w-[120px] truncate">{item.file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
                }}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow-sm hover:bg-red-50 hover:text-red-600"
                aria-label="Remove file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="truncate px-3 py-2 text-xs text-slate-600">{item.file.name}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
