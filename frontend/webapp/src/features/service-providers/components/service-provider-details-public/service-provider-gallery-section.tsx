"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { env } from "@/config/env/client";
import { IGallery } from "@/features/shared/types/common";

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

        {/* Clickable Image Grid */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          {sortedGallery.slice(0, 8).map((image, index) => (
            <button
              key={image.id}
              onClick={() => open(index)}
              className="bg-muted group relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
            >
              <Image
                src={`${env.NEXT_PUBLIC_FILES_URL}/${image.url}`}
                alt={image.title || `${providerName} - ${index + 1}`}
                fill
                className="object-cover transition-opacity group-hover:opacity-90"
                sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 25vw"
              />
              {/* Overlay for last image if there are more */}
              {index === 7 && gallery.length > 8 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-lg font-bold text-white">
                    +{gallery.length - 8}
                  </span>
                </div>
              )}
            </button>
          ))}
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
