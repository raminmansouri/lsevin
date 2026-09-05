"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, FileIcon, Film, ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import MediaPickerModal from "@/features/media-picker-addon/components/MediaPickerModal";
import type { MediaItem } from "@/features/media-picker-addon/types";
import useAction from "@/hooks/use-action";

import {
  addProviderGalleryItemsAction,
  deleteProviderGalleryItemAction,
  reorderProviderGalleryItemsAction,
} from "../../actions/admin";
import type { AdminProviderGalleryItem } from "../../db/admin-service-providers.queries";
import { isVideoMedia, resolveMediaUrl } from "../../lib/media-url";

function actionErrorToast(error: any) {
  toast.error(error?.detail || error?.title || "Action failed.");
}

/**
 * Opens the shared media picker in multi-select mode and appends every selected
 * item to category.provider_gallery_items in one round trip. Rendered on its own
 * where an item list already exists (the details Media tab), and as part of
 * ProviderImageGallery on the provider edit form.
 */
export function ProviderGalleryPickerButton({
  serviceProviderId,
  mediaType = "image",
  label,
  variant = "outline",
  onAdded,
}: {
  serviceProviderId: string;
  mediaType?: "all" | "image" | "video" | "file";
  label?: string;
  variant?: "default" | "outline" | "secondary";
  onAdded?: () => void;
}) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [isPickerOpen, setPickerOpen] = useState(false);

  const add = useAction(addProviderGalleryItemsAction, {
    startTransition,
    onSuccess: (data) => {
      const added = data?.added ?? 0;
      if (added > 0) {
        toast.success(`${added} ${added === 1 ? "image" : "images"} added to the gallery.`);
        onAdded?.();
      } else {
        toast.info("Those media items are already in the gallery.");
      }
    },
    onError: actionErrorToast,
  });

  function onConfirm(items: MediaItem[]) {
    setPickerOpen(false);

    const urls = items.map((item) => item.fileUrl).filter(Boolean);
    if (!urls.length) return;

    add.execute({ serviceProviderId, urls, mediaType });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        disabled={isPending}
        onClick={() => setPickerOpen(true)}
      >
        <ImagePlus className="me-2 h-4 w-4" />
        {label ?? `${tAdmin("add")} ${tAdmin("image")}`}
      </Button>

      <MediaPickerModal
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        mode="multiple"
        mediaType={mediaType}
        onConfirm={onConfirm}
        title={tAdmin("pickGalleryMedia")}
      />
    </>
  );
}

/**
 * Gallery grid for a single provider: pick many images at once, drop one, or
 * change the order they are shown in. Every mutation writes straight to
 * category.provider_gallery_items, so it is independent of the profile form's
 * own submit.
 */
export function ProviderImageGallery({
  serviceProviderId,
  items,
}: {
  serviceProviderId: string;
  items: AdminProviderGalleryItem[];
}) {
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();
  const [orderedItems, setOrderedItems] = useState(items);

  // The server actions revalidate the provider tag, so the incoming prop is the
  // source of truth; local order only survives until that refresh lands.
  useEffect(() => setOrderedItems(items), [items]);

  const remove = useAction(deleteProviderGalleryItemAction, {
    startTransition,
    onSuccess: () => toast.success(tAdmin("mediaItemDeleted")),
    onError: actionErrorToast,
  });

  const reorder = useAction(reorderProviderGalleryItemsAction, {
    startTransition,
    onError: actionErrorToast,
  });

  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= orderedItems.length) return;

    const next = [...orderedItems];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedItems(next);
    reorder.execute({ serviceProviderId, ids: next.map((item) => item.id) });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{tAdmin("mediaGallery")}</div>
          <p className="text-sm text-muted-foreground">
            Pick several images at once. They are stored in
            category.provider_gallery_items and shown on the provider page.
          </p>
        </div>
        <ProviderGalleryPickerButton serviceProviderId={serviceProviderId} />
      </div>

      {orderedItems.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {orderedItems.map((item, index) => (
            <figure
              key={item.id}
              className="group relative overflow-hidden rounded-xl border bg-muted/30"
            >
              <div className="relative flex aspect-square items-center justify-center">
                {isVideoMedia(item.mediaType, item.url) ? (
                  <Film className="h-8 w-8 text-muted-foreground" />
                ) : item.mediaType === "file" ? (
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <ImageWithFallback
                    src={resolveMediaUrl(item.url)}
                    alt={item.url}
                    width={320}
                    height={320}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/90 px-2 py-1.5 text-xs backdrop-blur">
                <span className="text-muted-foreground">
                  {tAdmin("order")} {index + 1}
                </span>
                <span className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Move earlier"
                    disabled={isPending || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Move later"
                    disabled={isPending || index === orderedItems.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    title={tAdmin("delete")}
                    disabled={isPending}
                    onClick={() =>
                      remove.execute({ serviceProviderId, id: item.id })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {tAdmin("noGalleryItemsYet")}
        </div>
      )}
    </div>
  );
}
