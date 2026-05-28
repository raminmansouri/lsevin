"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createCategoryAction } from "../actions/create-category";
import { updateCategoryAction } from "../actions/update-category";

import { useCategoriesBySearchCacheManagement } from "../api/client";
import { CATEGORY_TRANSLATION_KEY } from "../constants";
import { CategoryFormInput, CategoryFormSchema } from "../schemas";
import { CategoryDetails } from "../types/category";
import { initialUpdateCategoryImageActionState } from "../actions/upload-category-image/types";
import { updateCategoryImageAction } from "../actions/upload-category-image";
import { env } from "@/config/env/client";
import {
  DEFAULT_CATEGORY_OVERLAY_COLOR,
  DEFAULT_CATEGORY_OVERLAY_OPACITY,
  buildCategoryOverlayGradient,
  buildCategoryOverlayValue,
  extractCategoryOverlayConfig,
} from "../utils/category-overlay";

interface CategoryFormProps {
  category?: CategoryDetails;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const componentT = useTranslations(CATEGORY_TRANSLATION_KEY);
  const { invalidateAllCache } = useCategoriesBySearchCacheManagement();

  const isEdit = !!category;
  const parentId =
    searchParams.get("parentId") || category?.parentId || undefined;
  const overlayDefaults = extractCategoryOverlayConfig(category?.gradient);

  const form = useForm<CategoryFormInput>({
    defaultValues: {
      categoryId: category?.categoryId,
      name: category?.name
        ? { translations: category.name.translations }
        : createEmptyLocalizedContent(),
      description: category?.description
        ? { translations: category.description.translations }
        : createEmptyLocalizedContent(),
      parentId: parentId,
      gradient: category?.gradient ?? "",
      overlayColor: overlayDefaults.color,
      overlayOpacity: overlayDefaults.opacity,
    },
    resolver: zodResolver(CategoryFormSchema),
  });

  const overlayColor = form.watch("overlayColor") || DEFAULT_CATEGORY_OVERLAY_COLOR;
  const overlayOpacity =
    form.watch("overlayOpacity") ?? DEFAULT_CATEGORY_OVERLAY_OPACITY;
  const overlayGradient = buildCategoryOverlayGradient(
    overlayColor,
    overlayOpacity
  );

  const action = isEdit ? updateCategoryAction : createCategoryAction;

  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(componentT("messages.success"));
      invalidateAllCache();
      router.push("/admin/categories");
    },
    onError: (error) => {
      toast.error(error.detail || componentT("messages.error"));
    },
  });

  const onSubmit = async (values: CategoryFormInput) => {
    const normalizedFields = normalizeLocalizedFields({
      name: values.name,
      description: values.description,
    });
    const { overlayColor, overlayOpacity, ...categoryValues } = values;

    const payload = {
      ...categoryValues,
      ...normalizedFields,
      gradient: buildCategoryOverlayValue(
        overlayColor || DEFAULT_CATEGORY_OVERLAY_COLOR,
        overlayOpacity ?? DEFAULT_CATEGORY_OVERLAY_OPACITY
      ),
      parentId: values.parentId || undefined,
    };

    startTransition(async () => {
      await execute(payload);
    });
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={CATEGORY_TRANSLATION_KEY}>
        <div
          className={
            isEdit
              ? "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
              : ""
          }
        >
          <div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="form-container space-y-6"
              >
                {isEdit && (
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <Input {...field} type="hidden" />
                    )}
                  />
                )}

                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocalizedInput
                          label={componentT("form.name.label")}
                          value={field.value}
                          onChange={field.onChange}
                          required
                          maxLength={100}
                          error={form.formState.errors.name?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocalizedInput
                          label={componentT("form.description.label")}
                          value={field.value}
                          onChange={field.onChange}
                          richText
                          rows={3}
                          maxLength={2000}
                          error={form.formState.errors.description?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Category card overlay</h3>
                    <p className="text-xs text-muted-foreground">
                      This controls the colored layer shown over category images on the home page and categories page.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="overlayColor"
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-medium">Overlay color</label>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="color"
                                value={field.value || DEFAULT_CATEGORY_OVERLAY_COLOR}
                                onChange={field.onChange}
                                className="h-10 w-16 cursor-pointer p-1"
                              />
                              <Input
                                value={field.value || DEFAULT_CATEGORY_OVERLAY_COLOR}
                                onChange={field.onChange}
                                placeholder="#083f30"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overlayOpacity"
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-medium">Overlay opacity</label>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={field.value ?? DEFAULT_CATEGORY_OVERLAY_OPACITY}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                              <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.05"
                                value={field.value ?? DEFAULT_CATEGORY_OVERLAY_OPACITY}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                                className="w-24"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="relative h-32 overflow-hidden rounded-xl bg-slate-200">
                    {category?.imageUrl ? (
                      <img
                        src={category.imageUrl.startsWith("http") ? category.imageUrl : `${env.NEXT_PUBLIC_FILES_URL}/${category.imageUrl.replace(/^\//, "")}`}
                        alt="Category overlay preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    )}
                    <div className="absolute inset-0" style={{ background: overlayGradient }} />
                    <div className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white drop-shadow">
                      {componentT("form.name.label")} preview
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isPending}>
                    {isPending
                      ? isEdit
                        ? componentT("form.updating")
                        : componentT("form.creating")
                      : isEdit
                        ? componentT("form.update")
                        : componentT("form.create")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/categories")}
                    disabled={isPending}
                  >
                    {componentT("form.cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {isEdit && category?.categoryId ? (
            <CategoryImageUploadForm category={category} />
          ) : null}
        </div>
      </ZodErrorProvider>
    </CardContent>
  );
}

function CategoryImageUploadForm({ category }: { category: CategoryDetails }) {
  const router = useRouter();
  const { invalidateAllCache } = useCategoriesBySearchCacheManagement();

  const [state, formAction, isPending] = useActionState(
    updateCategoryImageAction,
    initialUpdateCategoryImageActionState
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    category.imageUrl ?? null
  );

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(category.imageUrl ?? null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, category.imageUrl]);

  useEffect(() => {
    if (!state.timestamp) return;

    if (state.ok) {
      toast.success(state.message || "Category image updated successfully.");
      invalidateAllCache();
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
      return;
    }

    if (state.error?.detail) {
      toast.error(state.error.detail);
    }
  }, [state, invalidateAllCache, router]);

  return (
    <div className="rounded-lg border p-4 h-fit space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Category image</h3>
        <p className="text-sm text-muted-foreground">
          Upload or replace the category image separately.
        </p>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border">
          <img
            src={previewUrl}
            alt="Category image preview"
            className="h-48 w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No image selected
        </div>
      )}




      <form action={formAction} className="space-y-4">
        <input type="hidden" name="categoryId" value={category.categoryId} />

        <Input
          ref={fileInputRef}
          name="file"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setSelectedFile(file);
          }}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !selectedFile}>
            {isPending ? "Uploading..." : "Upload image"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(category.imageUrl ?? null);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CategoryFormSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={CATEGORY_TRANSLATION_KEY}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Parent Category Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </ZodErrorProvider>
    </CardContent>
  );
}