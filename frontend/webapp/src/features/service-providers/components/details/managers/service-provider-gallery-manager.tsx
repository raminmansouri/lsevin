"use client";

import { useState, useTransition } from "react";
import { Edit, Film, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { toast } from "sonner";

import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/form/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { localeToHeader } from "@/config/locales";
import { useServiceProvidersByTypeCacheManagement } from "@/features/service-providers/api/client/get-service-providers-by-type";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  getLocalizedValue,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { LocaleTypes } from "@/types/common";

import { addGalleryItem } from "../../../actions/add-gallery-item";
import { removeGalleryItem } from "../../../actions/remove-gallery-item";
import { updateProviderGalleryItem } from "../../../actions/update-provider-gallery-item";
import { ServiceProviderGalleryItem } from "../../../types";
import { TRANSLATION_KEY } from "../../../types/constants";
import { isVideoMedia, resolveMediaUrl } from "../../../lib/media-url";

interface ServiceProviderGalleryManagerProps {
  serviceProviderId: string;
  currentGalleryItems?: ServiceProviderGalleryItem[];
  onUpdate?: () => void;
}

export default function ServiceProviderGalleryManager({
  serviceProviderId,
  currentGalleryItems = [],
  onUpdate,
}: ServiceProviderGalleryManagerProps) {
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);
  const [formData, setFormData] = useState({
    title: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
  });

  // Edit state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFiles, setEditFiles] = useState<File[] | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: createEmptyLocalizedContent(),
    description: createEmptyLocalizedContent(),
    displayOrder: 0,
  });
  const { invalidateAllCache: invalidateServiceProviderDetailsCache } =
    useServiceProvidersByTypeCacheManagement();

  const { execute: executeAdd } = useAction(addGalleryItem, {
    startTransition,
    onSuccess: () => {
      toast.success(t("gallery.messages.addSuccess"));
      setIsAdding(false);
      setFormData({
        title: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
      });
      setFiles(null);
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("gallery.messages.addError"));
    },
  });

  const { execute: executeRemove } = useAction(removeGalleryItem, {
    startTransition,
    onSuccess: () => {
      toast.success(t("gallery.messages.removeSuccess"));
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("gallery.messages.removeError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateProviderGalleryItem, {
    startTransition,
    onSuccess: () => {
      toast.success(t("gallery.messages.updateSuccess"));
      setEditingId(null);
      setEditFormData({
        title: createEmptyLocalizedContent(),
        description: createEmptyLocalizedContent(),
        displayOrder: 0,
      });
      setEditFiles(null);
      invalidateServiceProviderDetailsCache();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("gallery.messages.updateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("gallery.removeDialog.title"),
    t("gallery.removeDialog.description")
  );

  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024, // 200MB for provider videos
    multiple: false,
    accept: {
      "image/*": [],
      "video/*": [],
    },
  };

  const handleAdd = () => {
    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      title: formData.title,
      description: formData.description,
    });

    // Validate that both fields have at least one translation
    const hasTitle =
      Object.keys(normalizedFields.title.translations).length > 0;
    const hasDescription =
      Object.keys(normalizedFields.description.translations).length > 0;

    if (!hasTitle) {
      toast.error(t("gallery.messages.titleRequired"));
      return;
    }

    if (!hasDescription) {
      toast.error(t("gallery.messages.descriptionRequired"));
      return;
    }

    if (!files || files.length === 0) {
      toast.error(t("gallery.errors.fileRequired"));
      return;
    }

    executeAdd({
      serviceProviderId,
      title: normalizedFields.title,
      description: normalizedFields.description,
      file: files[0],
    });
  };

  const handleRemove = async (item: ServiceProviderGalleryItem) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        serviceProviderId,
        galleryItemId: item.id,
      });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({
      title: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
    });
    setFiles(null);
  };

  const handleEditClick = (item: ServiceProviderGalleryItem) => {
    setEditingId(item.id);
    setEditFormData({
      title: item.title,
      description: item.description,
      displayOrder: item.displayOrder,
    });
    setEditFiles(null); // Reset file selection when starting edit
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      title: createEmptyLocalizedContent(),
      description: createEmptyLocalizedContent(),
      displayOrder: 0,
    });
    setEditFiles(null);
  };

  const handleUpdateGalleryItem = (itemId: string) => {
    // Normalize localized content
    const normalizedFields = normalizeLocalizedFields({
      title: editFormData.title,
      description: editFormData.description,
    });

    // Validate that both fields have at least one translation
    const hasTitle =
      Object.keys(normalizedFields.title.translations).length > 0;
    const hasDescription =
      Object.keys(normalizedFields.description.translations).length > 0;

    if (!hasTitle) {
      toast.error(t("gallery.messages.titleRequired"));
      return;
    }

    if (!hasDescription) {
      toast.error(t("gallery.messages.descriptionRequired"));
      return;
    }

    executeUpdate({
      serviceProviderId,
      galleryItemId: itemId,
      title: normalizedFields.title,
      description: normalizedFields.description,
      displayOrder: editFormData.displayOrder,
      file: editFiles && editFiles.length > 0 ? editFiles[0] : undefined,
    });
  };

  // Sort gallery items by display order
  const sortedGalleryItems = [...currentGalleryItems].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const renderMediaPreview = (item: ServiceProviderGalleryItem) => {
    const src = resolveMediaUrl(item.url);
    const isVideo = isVideoMedia(item.mediaType, item.url);

    if (isVideo) {
      return (
        <>
          <video
            src={src}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            Video
          </span>
        </>
      );
    }

    return (
      <Image
        src={src}
        alt={getLocalizedValue(item.title, localeHeader)}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    );
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("gallery.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("gallery.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isPending || isAdding}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("gallery.actions.add")}
        </Button>
      </div>

      {/* Existing gallery items */}
      <div className="grid gap-3">
        {sortedGalleryItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                <p>{t("gallery.noItems")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedGalleryItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {editingId === item.id ? (
                  // Edit Mode
                  <CardContent className="space-y-4 p-4">
                    {/* Current media preview */}
                    <div className="relative aspect-video overflow-hidden rounded-md">
                      {renderMediaPreview(item)}
                    </div>

                    {/* Optional new image upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("gallery.form.newFile")}
                      </Label>
                      <FileUploader
                        value={editFiles}
                        onValueChange={setEditFiles}
                        dropzoneOptions={dropZoneConfig}
                        className="bg-background relative rounded-lg p-2"
                      >
                        <FileInput className="outline-1 outline-slate-500 outline-dashed">
                          <div className="flex w-full flex-col items-center justify-center p-4">
                            <Film className="mb-2 h-6 w-6 text-gray-500" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t("gallery.form.newFilePlaceholder")}
                            </p>
                          </div>
                        </FileInput>
                        <FileUploaderContent>
                          {editFiles &&
                            editFiles.length > 0 &&
                            editFiles.map((file, i) => (
                              <FileUploaderItem key={i} index={i}>
                                {file.type.startsWith("video/") ? (
                                  <Film className="h-4 w-4 text-current" />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-current" />
                                )}
                                <span className="text-xs">{file.name}</span>
                              </FileUploaderItem>
                            ))}
                        </FileUploaderContent>
                      </FileUploader>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("gallery.form.title")}
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <LocalizedInput
                        value={editFormData.title}
                        onChange={(value) =>
                          setEditFormData((prev) => ({ ...prev, title: value }))
                        }
                        label=""
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("gallery.form.description")}
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <LocalizedInput
                        multiline
                        value={editFormData.description}
                        onChange={(value) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        label=""
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        size="sm"
                      >
                        {t("gallery.actions.cancel")}
                      </Button>
                      <Button
                        onClick={() => handleUpdateGalleryItem(item.id)}
                        disabled={
                          isPending ||
                          Object.keys(editFormData.title.translations)
                            .length === 0 ||
                          Object.keys(editFormData.description.translations)
                            .length === 0
                        }
                        size="sm"
                      >
                        {t("gallery.actions.save")}
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  // Display Mode
                  <>
                    <div className="relative aspect-video">
                      {renderMediaPreview(item)}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                          disabled={isPending || editingId !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemove(item)}
                          disabled={isPending || editingId !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="mb-2 text-sm font-medium">
                        {getLocalizedValue(item.title, localeHeader)}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {getLocalizedValue(item.description, localeHeader)}
                      </p>
                      <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                        <span>{item.mediaType}</span>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add gallery item form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("gallery.add.title")}
            </CardTitle>
            <CardDescription>{t("gallery.add.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("gallery.form.file")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <FileUploader
                value={files}
                onValueChange={setFiles}
                dropzoneOptions={dropZoneConfig}
                className="bg-background relative rounded-lg p-2"
              >
                <FileInput className="outline-1 outline-slate-500 outline-dashed">
                  <div className="flex w-full flex-col items-center justify-center p-8">
                    <Film className="mb-2 h-8 w-8 text-gray-500" />
                    <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        {t("gallery.form.filePlaceholder")}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("gallery.form.fileHint")}
                    </p>
                  </div>
                </FileInput>
                <FileUploaderContent>
                  {files &&
                    files.length > 0 &&
                    files.map((file, i) => (
                      <FileUploaderItem key={i} index={i}>
                        {file.type.startsWith("video/") ? (
                          <Film className="h-4 w-4 text-current" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-current" />
                        )}
                        <span>{file.name}</span>
                      </FileUploaderItem>
                    ))}
                </FileUploaderContent>
              </FileUploader>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("gallery.form.title")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <LocalizedInput
                value={formData.title}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, title: value }))
                }
                label={t("gallery.form.titlePlaceholder")}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("gallery.form.description")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <LocalizedInput
                multiline
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
                label={t("gallery.form.descriptionPlaceholder")}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                {t("gallery.actions.cancel")}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  isPending ||
                  Object.keys(formData.title.translations).length === 0 ||
                  Object.keys(formData.description.translations).length === 0 ||
                  !files ||
                  files.length === 0
                }
              >
                {t("gallery.actions.add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  );
}
