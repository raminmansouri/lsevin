"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { IGallery } from "@/features/shared/types/common";
import { isVideoMedia, resolveMediaUrl } from "../../lib/media-url";

import { useServiceProviderGalleryModal } from "../../hooks/use-service-provider-gallery-modal";
import { TRANSLATION_KEY } from "../../types/constants";
import { ServiceProviderGalleryModal } from "./service-provider-gallery-modal";

type ServiceProviderGallerySectionProps = {
  gallery: IGallery[];
  providerName: string;
};
const ServiceProviderGallerySection = ({
  gallery,
  providerName,
}: ServiceProviderGallerySectionProps) => {
  const t = useTranslations(TRANSLATION_KEY);
  const { open } = useServiceProviderGalleryModal();

  const sortedGallery = [...gallery].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
            <h2 className="text-lg font-semibold">{t("images")}</h2>
          </div>
          <Badge variant="secondary">
            {t("imagesCount", { count: gallery.length })}
          </Badge>
        </div>

        {/* Clickable Media Grid */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          {sortedGallery.slice(0, 8).map((image, index) => {
            const src = resolveMediaUrl(image.url);
            const isVideo = isVideoMedia(image.mediaType, image.url);

            return (
              <button
                key={image.id}
                onClick={() => open(index)}
                className="bg-muted group relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
              >
                {isVideo ? (
                  <>
                    <video
                      src={src}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                      Video
                    </span>
                  </>
                ) : (
                  <Image
                    src={src}
                    alt={image.title || `${providerName} - ${index + 1}`}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-90"
                    sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 25vw"
                  />
                )}
                {/* Overlay for last item if there are more */}
                {index === 7 && gallery.length > 8 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-lg font-bold text-white">
                      +{gallery.length - 8}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Modal */}
      <ServiceProviderGalleryModal
        gallery={gallery}
        providerName={providerName}
      />
    </>
  );
};

export default ServiceProviderGallerySection;
