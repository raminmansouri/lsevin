"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface GalleryItemDto {
  id: string;
  url: string;
  displayOrder: number;
  isPrimary: boolean;
}

interface ImageGalleryManagerProps {
  title: string;
  description?: string;
  listUrl: string;
  uploadUrl: string;
  deleteUrl: (imageId: string) => string;
  disabled?: boolean;
  accept?: string;
  maxFilesPerUpload?: number;
  onUpdate?: () => void;
}

export default function ImageGalleryManager({
  title,
  description,
  listUrl,
  uploadUrl,
  deleteUrl,
  disabled = false,
  accept = "image/*",
  maxFilesPerUpload = 10,
  onUpdate,
}: ImageGalleryManagerProps) {
  const [items, setItems] = useState<GalleryItemDto[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch(listUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load gallery");
      }

      const data = (await response.json()) as GalleryItemDto[];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load gallery images.");
    } finally {
      setIsLoading(false);
    }
  }, [listUrl]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);

    const deduped = new Map<string, File>();
    [...selectedFiles, ...nextFiles].forEach((file) => {
      deduped.set(`${file.name}-${file.size}-${file.lastModified}`, file);
    });

    const merged = Array.from(deduped.values()).slice(0, maxFilesPerUpload);
    setSelectedFiles(merged);

    // reset input so same file can be re-selected later
    event.target.value = "";
  };

  const handleRemovePending = (key: string) => {
    setSelectedFiles((prev) =>
      prev.filter(
        (file) => `${file.name}-${file.size}-${file.lastModified}` !== key
      )
    );
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();

        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Upload failed");
        }

        setSelectedFiles([]);
        await loadItems();
        onUpdate?.();
        toast.success("Images uploaded successfully.");
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload images."
        );
      }
    });
  };

  const handleDelete = (imageId: string) => {
    const confirmed = window.confirm("Remove this image?");
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const response = await fetch(deleteUrl(imageId), {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Delete failed");
        }

        setItems((prev) => prev.filter((item) => item.id !== imageId));
        onUpdate?.();
        toast.success("Image removed successfully.");
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Failed to remove image."
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`gallery-upload-${title}`}>Upload images</Label>
          <Input
            id={`gallery-upload-${title}`}
            type="file"
            accept={accept}
            multiple
            disabled={disabled || isPending}
            onChange={handleSelectFiles}
          />
        </div>

        {previews.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected files</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {previews.map((preview) => (
                <div
                  key={preview.key}
                  className="border-border bg-background relative overflow-hidden rounded-lg border"
                >
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="h-32 w-full object-cover"
                  />
                  <button
                    type="button"
                    className="bg-background/90 absolute top-2 right-2 rounded-full p-1 shadow"
                    onClick={() => handleRemovePending(preview.key)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="truncate p-2 text-xs">{preview.file.name}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleUpload}
                disabled={disabled || isPending || selectedFiles.length === 0}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium">Current images</div>

          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading gallery...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-4 text-sm">
              <ImagePlus className="h-4 w-4" />
              No images uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border-border bg-background relative overflow-hidden rounded-lg border"
                >
                  <img
                    src={item.url}
                    alt="Gallery item"
                    className="h-32 w-full object-cover"
                  />

                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.isPrimary && (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-[10px] font-medium">
                        Primary
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={cn(
                      "bg-background/90 absolute top-2 right-2 rounded-full p-1 shadow",
                      disabled && "pointer-events-none opacity-50"
                    )}
                    onClick={() => handleDelete(item.id)}
                    disabled={disabled || isPending}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </button>

                  <div className="text-muted-foreground p-2 text-xs">
                    Order: {item.displayOrder}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}