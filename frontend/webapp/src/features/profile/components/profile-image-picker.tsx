"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Camera,
  Eye,
  ImagePlus,
  Loader2,
  Lock,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { env } from "@/config/env/client";
import { setProfileImageAction, removeProfileImageAction } from "../actions/profile-image.actions";

// adjust these imports to your actual media manager paths
import { persistUploadedMedia } from "@/components/media/adapters/upload-handler";
import { uploadViaStorageRoute } from "@/features/media-picker-addon";

type Props = {
  imageUrl: string | null;
  mediaId: string | null;
  fullName: string;
  isLocked: boolean;
  bottomBarHeight?: number;
};

type PersistedMediaLike = {
  id?: string;
  fileUrl?: string;
  url?: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function createEmptyTranslations() {
  return {
    "en-US": "",
  };
}

export function resolveMediaUrl(fileUrl: string | null) {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/$/, "");
  const cleanPath = fileUrl.replace(/^\//, "");

  return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
}

export default function ProfileImagePicker({
  imageUrl,
  mediaId,
  fullName,
  isLocked,
  bottomBarHeight = 76,
}: Props) {
  const t = useTranslations("User.Profile.profileImage");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(imageUrl);
  const [, setCurrentMediaId] = useState<string | null>(mediaId);

  const resolvedImageUrl = useMemo(
    () => resolveMediaUrl(currentImageUrl),
    [currentImageUrl]
  );

  const initials = useMemo(() => {
    const value = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    return value || "U";
  }, [fullName]);

  const openFilePicker = () => {
    if (isLocked || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (isLocked) return;

    startRemoveTransition(async () => {
      const result = await removeProfileImageAction();

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setCurrentImageUrl(null);
      setCurrentMediaId(null);
      setIsSheetOpen(false);
      toast.success(result.message);
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("errors.chooseImageFile"));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("errors.imageTooLarge"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadViaStorageRoute({
        file,
        onProgress: setUploadProgress,
      });

      const emptyTranslations = createEmptyTranslations();

      const created = (await persistUploadedMedia(file, uploaded, {
        titleTranslations: emptyTranslations,
        descriptionTranslations: emptyTranslations,
        altTranslations: emptyTranslations,
      })) as PersistedMediaLike;

      const createdMediaId = created?.id;
      const createdFileUrl =
        created?.fileUrl ?? created?.url ?? (uploaded as { fileUrl?: string; url?: string })?.fileUrl ?? (uploaded as { url?: string })?.url;

      if (!createdFileUrl) {
        throw new Error(t("errors.mediaMissing"));
      }

      const result = await setProfileImageAction({
        mediaId: createdMediaId ?? null,
        imageUrl: createdFileUrl,
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      setCurrentImageUrl(result.imageUrl);
      setCurrentMediaId(result.mediaId);
      setIsSheetOpen(false);
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.uploadFailed")
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="relative"
        >
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-white shadow-md">
            {resolvedImageUrl ? (
              <Image
                src={resolvedImageUrl}
                alt={fullName}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-2xl font-bold text-gray-700">
                {initials}
              </div>
            )}
          </div>

          <div
            className={`absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full shadow-lg ${
              isLocked ? "bg-gray-300" : "bg-[#083f30]"
            }`}
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : isLocked ? (
              <Lock size={16} className="text-white" />
            ) : (
              <Camera size={16} className="text-white" />
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className={`mt-3 text-sm font-semibold ${
            isLocked ? "text-gray-400" : "text-[#083f30]"
          }`}
        >
          {fullName}
        </button>

        {isUploading ? (
          <div className="mt-3 w-40">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#083f30] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-gray-500">
              {t("uploading", { progress: uploadProgress })}
            </p>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLocked || isUploading}
      />

      {isSheetOpen ? (
  <div className="fixed inset-0 z-[120]">
    <button
      type="button"
      className="absolute inset-0 bg-black/40"
      onClick={() => setIsSheetOpen(false)}
      aria-label={t("close")}
    />

    <div
      className="absolute left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl"
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomBarHeight}px)`
      }}
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
        <button
          type="button"
          onClick={() => setIsSheetOpen(false)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <X size={18} className="text-gray-700" />
        </button>
      </div>

      <div className="space-y-2">
        {resolvedImageUrl ? (
          <button
            type="button"
            onClick={() => {
              setIsViewerOpen(true);
              setIsSheetOpen(false);
            }}
            className="flex h-14 w-full items-center gap-3 rounded-2xl px-4 text-left hover:bg-gray-50"
          >
            <Eye size={20} className="text-gray-700" />
            <span className="font-medium text-gray-900">{t("viewPhoto")}</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={openFilePicker}
          disabled={isLocked || isUploading}
          className="flex h-14 w-full items-center gap-3 rounded-2xl px-4 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus size={20} className="text-gray-700" />
          <span className="font-medium text-gray-900">
            {resolvedImageUrl ? t("uploadNewPhoto") : t("uploadPhoto")}
          </span>
        </button>

        {resolvedImageUrl ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLocked || isRemoving}
            className="flex h-14 w-full items-center gap-3 rounded-2xl px-4 text-left hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={20} className="text-red-600" />
            <span className="font-medium text-red-600">
              {isRemoving ? t("removing") : t("removeCurrentPhoto")}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  </div>
) : null}

      {isViewerOpen && resolvedImageUrl ? (
        <div className="fixed inset-0 z-[60] bg-black/90">
          <button
            type="button"
            onClick={() => setIsViewerOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 hover:bg-white/20"
          >
            <X size={20} className="text-white" />
          </button>

          <div className="relative h-full w-full">
            <Image
              src={resolvedImageUrl}
              alt={fullName}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}