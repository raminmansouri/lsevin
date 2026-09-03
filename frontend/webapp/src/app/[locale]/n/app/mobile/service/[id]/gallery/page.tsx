import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, Image as ImageIcon, PlayCircle } from "lucide-react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { LexicalDescription } from "@/features/service-providers/components/lexical-description";
import { env } from "@/config/env/server";
import {
  getServicePageByIdFromDb,
  listActiveServicePageIds,
} from "@/features/service-providers/server/service-page.repository";

// Static / ISR — a service's photo gallery has no visitor-specific content.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const ids = await listActiveServicePageIds(400);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

type ServiceGalleryRouteParams = {
  locale: string;
  id: string;
};

type ServiceGalleryPageProps = {
  params: Promise<ServiceGalleryRouteParams> | ServiceGalleryRouteParams;
};

function isAbsoluteUrl(value: string) {
  return /^(https?:)?\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value);
}

function resolveServerMediaUrl(value?: string | null) {
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;

  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "") ?? "";
  const path = value.replace(/^\/+/, "");

  return base ? `${base}/${path}` : `/${path}`;
}

function isRtlLocale(locale: string) {
  return /^(fa|ar|ku|ur)(-|_|$)/i.test(locale);
}

export async function generateMetadata({ params }: Pick<ServiceGalleryPageProps, "params">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServiceGalleryPage" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function ServiceGalleryPage({ params }: ServiceGalleryPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "ServiceGalleryPage" });
  const data = await getServicePageByIdFromDb({ serviceId: id, locale });

  if (!data) {
    notFound();
  }

  const gallery = data.service.galleryItems || [];
  const backHref = `/n/app/mobile/service/${id}`;
  const BackIcon = isRtlLocale(locale) ? ArrowRight : ArrowLeft;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            aria-label={t("actions.backToService")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900"
          >
            <BackIcon size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">{t("header.title")}</h1>
            <p className="truncate text-sm text-gray-600">{data.service.name}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 lg:px-8">
        {gallery.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <ImageIcon size={36} className="mb-3 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">{t("empty.title")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("empty.description")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {gallery.map((item, index) => {
              const mediaType = item.mediaType?.toLowerCase() || "";
              const isVideo = mediaType.includes("video");
              const isGif = mediaType.includes("gif") || item.url.split("?")[0]?.toLowerCase().endsWith(".gif");
              const isLarge = index === 0 || index % 5 === 0;
              const mediaSrc = resolveServerMediaUrl(item.url);

              return (
                <figure key={item.id} className={`group relative overflow-hidden rounded-2xl bg-gray-100 lg:rounded-3xl ${isLarge ? "col-span-2 h-72 lg:h-[360px]" : "h-44 lg:h-64"}`}>
                  {isVideo ? (
                    <video src={mediaSrc} className="h-full w-full object-cover" controls playsInline preload="metadata" />
                  ) : isGif ? (
                    <img src={mediaSrc} alt={item.title || data.service.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <ImageWithFallback
                      fill
                      src={mediaSrc}
                      alt={item.title || data.service.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                    />
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                    <div className="flex items-center gap-2">
                      {isVideo && <PlayCircle size={16} className="flex-shrink-0" />}
                      <figcaption className="line-clamp-1 text-sm font-bold">
                        {item.title || t("gallery.fallbackCaption", { name: data.service.name, number: index + 1 })}
                      </figcaption>
                    </div>
                    {item.description && <LexicalDescription content={item.description} className="mt-1 line-clamp-2 text-xs text-white/80" />}
                  </div>
                </figure>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
