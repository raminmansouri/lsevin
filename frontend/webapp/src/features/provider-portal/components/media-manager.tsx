"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, ImagePlus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteGalleryItemAction,
  saveGalleryItemAction,
} from "@/features/provider-portal/actions";
import { saveGalleryItemSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { LocalizedRichPreview } from "./localized-rich-preview";
import { PortalImage } from "./portal-image";
import { displayTranslation } from "../lib/normalizers";
import { tCommon, tLabel } from "../lib/i18n";
import type { GalleryRow, ProviderWorkspace } from "../types";

type FormValues = z.infer<typeof saveGalleryItemSchema>;

export function MediaManager({
  workspace,
  gallery,
}: {
  workspace: ProviderWorkspace;
  gallery: GalleryRow[];
}) {
  const t = useTranslations("ProviderPortal");
  const [editing, setEditing] = useState<GalleryRow | null>(null);

  return (
    <div className="space-y-6">
      {workspace.permissions.manageMedia ? (
        <GalleryForm
          providerId={workspace.provider.id}
          editing={editing}
          onDone={() => setEditing(null)}
        />
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{tCommon(t, "providerMedia", "Provider media")}</CardTitle>
          <CardDescription>
            {tCommon(
              t,
              "providerMediaDescription",
              "Gallery items shown on the provider page. URL field can contain a media id or direct URL.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gallery.length ? (
            gallery.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200"
              >
                <div className="relative h-44 w-full">
                  <PortalImage
                    src={item.url}
                    alt={
                      item.displayTitle ||
                      tCommon(t, "providerMedia", "Provider media")
                    }
                  />
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="font-semibold">
                    {item.displayTitle || item.url}
                  </h3>
                  <div className="line-clamp-2 text-sm text-slate-500">
                    <LocalizedRichPreview translations={item.description} />
                  </div>
                  {workspace.permissions.manageMedia ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(item)}
                      >
                        <Edit className="mr-2 h-4 w-4" />{" "}
                        {tCommon(t, "edit", "Edit")}
                      </Button>
                      <DeleteGalleryButton
                        providerId={workspace.provider.id}
                        galleryItemId={item.id}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              {tCommon(t, "noGalleryItemsYet", "No gallery items yet.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GalleryForm({
  providerId,
  editing,
  onDone,
}: {
  providerId: string;
  editing: GalleryRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(
    () => ({
      providerId,
      galleryItemId: editing?.id || undefined,
      titleEn: editing ? displayTranslation(editing.title, "en-US", "") : "",
      titleFa: editing ? displayTranslation(editing.title, "fa-IR", "") : "",
      descriptionEn: editing
        ? displayTranslation(editing.description, "en-US", "")
        : "",
      descriptionFa: editing
        ? displayTranslation(editing.description, "fa-IR", "")
        : "",
      url: editing?.url || "",
      mediaType: (editing?.mediaType as any) || "image",
      displayOrder: editing?.displayOrder || 0,
    }),
    [providerId, editing],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(saveGalleryItemSchema),
    values: defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveGalleryItemAction(values);
      if (!response.ok) {
        toast.error(
          response.error ||
            tCommon(
              t,
              "galleryItemCouldNotBeSaved",
              "Gallery item could not be saved.",
            ),
        );
        return;
      }
      toast.success(
        editing
          ? tCommon(t, "galleryItemUpdated", "Gallery item updated.")
          : tCommon(t, "galleryItemAdded", "Gallery item added."),
      );
      onDone();
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4" />
          {editing
            ? tCommon(t, "editMedia", "Edit media")
            : tCommon(t, "addMedia", "Add media")}
        </CardTitle>
        <CardDescription>
          {tCommon(
            t,
            "mediaPickerDescription",
            "Use your central media picker to copy the file URL/media id into the URL field.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" {...form.register("providerId")} />
          <input type="hidden" {...form.register("galleryItemId")} />

          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Title English")}
            </span>
            <Input {...form.register("titleEn")} disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Title Persian")}
            </span>
            <Input {...form.register("titleFa")} disabled={isPending} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Description English")}
            </span>
            <Textarea
              {...form.register("descriptionEn")}
              disabled={isPending}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Description Persian")}
            </span>
            <Textarea
              {...form.register("descriptionFa")}
              disabled={isPending}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Media URL / media id")}
            </span>
            <Input {...form.register("url")} disabled={isPending} />
            {form.formState.errors.url ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.url.message}
              </p>
            ) : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Media type")}
            </span>
            <select
              {...form.register("mediaType")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="image">
                {tCommon(t, "mediaTypes.image", "Image")}
              </option>
              <option value="video">
                {tCommon(t, "mediaTypes.video", "Video")}
              </option>
              <option value="gif">{tCommon(t, "mediaTypes.gif", "GIF")}</option>
              <option value="file">
                {tCommon(t, "mediaTypes.file", "File")}
              </option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">
              {tLabel(t, "Display order")}
            </span>
            <Input
              type="number"
              {...form.register("displayOrder")}
              disabled={isPending}
            />
          </label>

          <div className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 md:col-span-2">
            <PortalImage
              src={form.watch("url")}
              alt={tCommon(t, "mediaPreview", "Media preview")}
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
            {editing ? (
              <Button type="button" variant="outline" onClick={onDone}>
                {tCommon(t, "cancelEdit", "Cancel edit")}
              </Button>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending
                ? tCommon(t, "saving", "Saving...")
                : tCommon(t, "saveMedia", "Save media")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteGalleryButton({
  providerId,
  galleryItemId,
}: {
  providerId: string;
  galleryItemId: string;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            tCommon(t, "deleteThisGalleryItem", "Delete this gallery item?"),
          )
        )
          return;
        startTransition(async () => {
          const response = await deleteGalleryItemAction({
            providerId,
            galleryItemId,
          });
          if (!response.ok) {
            toast.error(
              response.error ||
                tCommon(
                  t,
                  "galleryItemCouldNotBeDeleted",
                  "Gallery item could not be deleted.",
                ),
            );
            return;
          }
          toast.success(
            tCommon(t, "galleryItemDeleted", "Gallery item deleted."),
          );
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" /> {tCommon(t, "delete", "Delete")}
    </Button>
  );
}
