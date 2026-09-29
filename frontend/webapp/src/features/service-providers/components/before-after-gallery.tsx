"use client";

import { Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

export type BeforeAfterItem = {
  id: string;
  before: string | null;
  after: string | null;
  procedure?: string | null;
  months?: number | null;
  /** Used on the provider page: which service this result belongs to. */
  serviceName?: string | null;
};

function mediaUrl(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "") ?? "";
  return `${base}/${trimmed.replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

function Photo({
  src,
  alt,
  label,
  tone,
}: {
  src: string | null;
  alt: string;
  label: string;
  tone: "before" | "after";
}) {
  const resolved = mediaUrl(src);

  return (
    <div className="relative aspect-[4/3] bg-gray-100">
      {resolved ? (
        <ImageWithFallback
          fill
          src={resolved}
          alt={alt}
          sizes="(min-width: 1024px) 480px, 50vw"
          className="object-cover"
          fallbackClassName="h-full w-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-300">
          <ImageIcon size={28} />
        </div>
      )}
      <span
        className={`absolute start-2 top-2 rounded-lg px-2 py-1 text-xs font-bold text-white ${
          tone === "before" ? "bg-red-500" : "bg-green-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function BeforeAfterGallery({ items }: { items: BeforeAfterItem[] }) {
  // Reuses SpecialistPage's existing gallery.* strings so no new translation keys
  // are needed in any locale file.
  const t = useTranslations("SpecialistPage");

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const procedure = item.procedure || t("gallery.procedureFallback");

        return (
          <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="grid grid-cols-2 gap-px bg-gray-200">
              <Photo src={item.before} alt={t("gallery.beforeAlt", { procedure })} label={t("gallery.before")} tone="before" />
              <Photo src={item.after} alt={t("gallery.afterAlt", { procedure })} label={t("gallery.after")} tone="after" />
            </div>
            <div className="p-3">
              <p className="font-semibold text-gray-900">{item.procedure || t("gallery.resultFallback")}</p>
              {item.serviceName ? <p className="text-xs text-gray-500">{item.serviceName}</p> : null}
              {item.months ? (
                <p className="text-sm text-gray-500">{t("gallery.afterMonths", { months: item.months })}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}