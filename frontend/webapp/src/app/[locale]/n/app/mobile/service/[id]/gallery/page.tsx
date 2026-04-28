import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, PlayCircle } from "lucide-react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { LexicalDescription } from "@/features/service-providers/components/lexical-description";
import { env } from "@/config/env/server";
import { getServicePageByIdFromDb } from "@/features/service-providers/server/service-page.repository";

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

export default async function ServiceGalleryPage({ params }: ServiceGalleryPageProps) {
  const { locale, id } = await params;
  const data = await getServicePageByIdFromDb({ serviceId: id, locale });

  if (!data) {
    notFound();
  }

  const gallery = data.service.galleryItems || [];
  const backHref = `/${locale}/n/app/mobile/service/${id}`;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">Service gallery</h1>
            <p className="truncate text-sm text-gray-600">{data.service.name}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {gallery.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <ImageIcon size={36} className="mb-3 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">No gallery items yet</h2>
            <p className="mt-1 text-sm text-gray-600">This provider has not published images or videos for this service.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((item, index) => {
              const isVideo = item.mediaType?.toLowerCase().includes("video");
              const isLarge = index === 0 || index % 5 === 0;
              const mediaSrc = resolveServerMediaUrl(item.url);

              return (
                <figure key={item.id} className={`group relative overflow-hidden rounded-2xl bg-gray-100 ${isLarge ? "col-span-2 h-72" : "h-44"}`}>
                  {isVideo ? (
                    <video src={mediaSrc} className="h-full w-full object-cover" controls playsInline preload="metadata" />
                  ) : (
                    <ImageWithFallback
                      fill
                      src={mediaSrc}
                      alt={item.title || data.service.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                    <div className="flex items-center gap-2">
                      {isVideo && <PlayCircle size={16} className="flex-shrink-0" />}
                      <figcaption className="line-clamp-1 text-sm font-bold">{item.title || `${data.service.name} ${index + 1}`}</figcaption>
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
