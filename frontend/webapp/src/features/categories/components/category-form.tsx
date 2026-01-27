"use client";

import { useTransition } from "react";
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
    },
    resolver: zodResolver(CategoryFormSchema),
  });
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
    // Normalize localized content by removing empty translations
    const normalizedFields = normalizeLocalizedFields({
      name: values.name,
      description: values.description,
    });

    const payload = {
      ...values,
      ...normalizedFields,
      parentId: values.parentId || undefined,
    };
    startTransition(async () => {
      await execute(payload);
    });
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={CATEGORY_TRANSLATION_KEY}>
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
                  <Input {...field} type="hidden" disabled />
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
      </ZodErrorProvider>
    </CardContent>
  );
}

export function CategoryFormSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={CATEGORY_TRANSLATION_KEY}>
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
      </ZodErrorProvider>
    </CardContent>
  );
}
