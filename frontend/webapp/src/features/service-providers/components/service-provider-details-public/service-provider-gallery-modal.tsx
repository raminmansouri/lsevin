import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useCarouselNavigation } from "@/components/ui/use-carousel-navigation";
import { IGallery } from "@/features/shared/types/common";
import { cn } from "@/lib/utils";
import { isVideoMedia, resolveMediaUrl } from "../../lib/media-url";

import { useServiceProviderGalleryModal } from "../../hooks/use-service-provider-gallery-modal";
import { TRANSLATION_KEY } from "../../types/constants";

type Props = {
  gallery: IGallery[];
  providerName: string;
};

export const ServiceProviderGalleryModal = ({
  gallery,
  providerName,
}: Props) => {
  const t = useTranslations(TRANSLATION_KEY);
  const { isOpen, imageIndex, close } = useServiceProviderGalleryModal();

  const sortedGallery = [...gallery].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const { setApi, currentIndex, scrollToIndex, scrollPrev, scrollNext } =
    useCarouselNavigation({
      initialIndex: imageIndex,
    });

  if (!isOpen || !gallery.length) return null;

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={close}
      title={`${providerName} - ${t("images")}`}
      description={`${currentIndex + 1} / ${gallery.length}`}
    >
      <div className="pb-6">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent>
            {sortedGallery.map((image, index) => {
              const src = resolveMediaUrl(image.url);
              const isVideo = isVideoMedia(image.mediaType, image.url);

              return (
                <CarouselItem key={image.id}>
                  <div className="relative">
                    {/* Media Container */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg md:aspect-[16/10]">
                      {isVideo ? (
                        <video
                          src={src}
                          className="h-full w-full object-contain"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <Image
                          src={src}
                          alt={
                            image.title ||
                            `${providerName} - ${t("images")} ${index + 1}`
                          }
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 90vw"
                          priority={index === imageIndex}
                        />
                      )}
                    </div>

                    {/* Media Title */}
                    {image.title && (
                      <div className="mt-3">
                        <p className="text-center text-sm font-medium">
                          {image.title}
                        </p>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Navigation Arrows for Desktop */}
          <div className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full"
              onClick={scrollPrev}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Previous image</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full"
              onClick={scrollNext}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Next image</span>
            </Button>
          </div>
        </Carousel>

        {/* Progress Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex gap-1.5">
            {sortedGallery.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "size-2 rounded-full transition-all hover:scale-150",
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Image Counter Badge */}
        <div className="mt-4 flex justify-center">
          <Badge variant="secondary" className="text-sm">
            {currentIndex + 1} / {gallery.length}
          </Badge>
        </div>
      </div>
    </ResponsiveModal>
  );
};
