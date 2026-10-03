"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";
import MediaPickerModal from "@/features/media-picker-addon/components/MediaPickerModal";

import { setProductGalleryAction } from "../../actions/admin-catalog.actions";
import {
  isGalleryImageReference,
  MAX_PRODUCT_IMAGES,
} from "../../schemas/gallery";

export function ProductGalleryEditor({
  productId,
  initialUrls,
}: {
  productId: string;
  initialUrls: string[];
}) {
  const t = useTranslations("ShopMedia");
  const router = useRouter();
  const [urls, setUrls] = useState(() => [...new Set(initialUrls)]);
  const [url, setUrl] = useState("");
  const [picker, setPicker] = useState<number | "add" | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function change(next: string[]) {
    setUrls([...new Set(next)]);
    setSaved(false);
    setError(null);
    setDirty(true);
  }
  function addUrl() {
    const next = url.trim();
    if (!isGalleryImageReference(next) || next.length > 2048) {
      setError(t("invalidUrl"));
      return;
    }
    if (urls.length >= MAX_PRODUCT_IMAGES) {
      setError(t("limit"));
      return;
    }
    change([...urls, next]);
    setUrl("");
  }
  function move(index: number, to: number) {
    const next = [...urls];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    change(next);
  }
  function save() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await setProductGalleryAction({ productId, urls });
        setSaved(true);
        setDirty(false);
        router.refresh();
      } catch {
        setError(t("saveFailed"));
      }
    });
  }

  return (
    <div className="space-y-3" data-testid="product-gallery">
      <p className="text-sm text-gray-500">{t("hint")}</p>
      {urls.length === 0 && (
        <p className="rounded border border-dashed p-4 text-sm text-gray-500">
          {t("empty")}
        </p>
      )}
      <ol className="space-y-2">
        {urls.map((src, index) => (
          <li
            key={src}
            data-testid="gallery-image"
            className="flex flex-wrap items-center gap-2 rounded-xl border p-2"
          >
            <ImageWithFallback
              key={src}
              unoptimized
              width={80}
              height={80}
              src={
                /^(https?:)?\/\//i.test(src) || src.startsWith("/")
                  ? src
                  : `${env.NEXT_PUBLIC_FILES_URL.replace(/\/+$/, "")}/${src}`
              }
              alt={t("imageNumber", { number: index + 1 })}
              className="h-20 w-20 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs break-all text-gray-500" dir="ltr">
                {src}
              </p>
              {index === 0 && (
                <span className="text-xs font-semibold text-green-700">
                  {t("primary")}
                </span>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  disabled={pending || index === 0}
                  onClick={() => move(index, 0)}
                >
                  {t("makePrimary")}
                </button>
                <button
                  type="button"
                  disabled={pending || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  {t("moveUp")}
                </button>
                <button
                  type="button"
                  disabled={pending || index === urls.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  {t("moveDown")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setPicker(index)}
                >
                  {t("replace")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => change(urls.filter((_, i) => i !== index))}
                  className="text-red-600"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={pending || urls.length >= MAX_PRODUCT_IMAGES}
        onClick={() => setPicker("add")}
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
      >
        {t("addImages")}
      </button>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm">
          {t("imageUrl")}
          <input
            type="text"
            value={url}
            disabled={pending || urls.length >= MAX_PRODUCT_IMAGES}
            dir="ltr"
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </label>
        <button
          type="button"
          disabled={pending || !url.trim() || urls.length >= MAX_PRODUCT_IMAGES}
          onClick={addUrl}
          className="rounded border px-3 py-1.5 text-sm"
        >
          {t("addUrl")}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty || urls.length > MAX_PRODUCT_IMAGES}
        className="rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? t("saving") : t("save")}
      </button>
      {saved && (
        <p role="status" className="text-sm text-green-700">
          {t("saved")}
        </p>
      )}
      {picker !== null && (
        <MediaPickerModal
          open
          onClose={() => setPicker(null)}
          mode={picker === "add" ? "multiple" : "single"}
          mediaType="image"
          maxSelection={picker === "add" ? MAX_PRODUCT_IMAGES - urls.length : 1}
          allowDelete={false}
          onConfirm={(items) => {
            const selected = items
              .filter((item) => item.mediaType === "image")
              .map((item) => item.fileUrl);
            if (picker === "add")
              change([...urls, ...selected].slice(0, MAX_PRODUCT_IMAGES));
            else if (selected[0])
              change(
                urls.map((item, i) => (i === picker ? selected[0] : item))
              );
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}
