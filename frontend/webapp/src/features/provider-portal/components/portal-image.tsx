"use client";

import { useTranslations } from "next-intl";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";

import { tCommon } from "../lib/i18n";

function toFileUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `${env.NEXT_PUBLIC_FILES_URL}/${value}`;
}

export function PortalImage({
  src,
  alt,
  className = "object-cover",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const t = useTranslations("ProviderPortal");
  const url = toFileUrl(src);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-100 text-xs font-medium text-slate-400">
        {tCommon(t, "noImage", "No image")}
      </div>
    );
  }

  return <ImageWithFallback fill src={url} alt={alt} className={className} />;
}
