"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { IconSelector } from "@/components/selectors/icon-selector";
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

import { createProviderTypeAction } from "../actions/create-provider-type";
import { updateProviderTypeAction } from "../actions/update-provider-type";
import { useProviderTypeDetailsCacheManagement } from "../api/client/get-provider-type-details-query";
import { useProviderTypesBySearchCacheManagement } from "../api/client/get-provider-types-by-search";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "../constants";
import { ProviderTypeFormInput, ProviderTypeFormSchema } from "../schemas";
import { ProviderType } from "../types/provider-type";

interface ProviderTypeFormProps {
  providerType?: ProviderType;
}

export function ProviderTypeForm({ providerType }: ProviderTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const componentT = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const { invalidateAllCache: invalidateProviderTypesBySearchCache } =
    useProviderTypesBySearchCacheManagement();
  const { invalidateAllCache: invalidateProviderTypeDetailsCache } =
    useProviderTypeDetailsCacheManagement();

  const isEdit = !!providerType;

  const form = useForm<ProviderTypeFormInput>({
    defaultValues: {
      providerTypeId: providerType?.id,
      name: providerType?.name
        ? { translations: providerType.name.translations }
        : createEmptyLocalizedContent(),
      description: providerType?.description
        ? { translations: providerType.description.translations }
        : createEmptyLocalizedContent(),
      isActive: providerType?.isActive ?? true,
      iconUrl: providerType?.iconUrl,
    },
    resolver: zodResolver(ProviderTypeFormSchema),
  });

  const action = isEdit ? updateProviderTypeAction : createProviderTypeAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(componentT("messages.success"));
      invalidateProviderTypesBySearchCache();
      invalidateProviderTypeDetailsCache();
      router.push("/admin/provider-types");
    },
    onError: (error) => {
      toast.error(error.detail || componentT("messages.error"));
    },
  });

  const onSubmit = async (values: ProviderTypeFormInput) => {
    // Normalize localized content by removing empty translations
    const normalizedFields = normalizeLocalizedFields({
      name: values.name,
      description: values.description,
    });

    const payload = {
      ...values,
      ...normalizedFields,
    };

    startTransition(async () => {
      await execute(payload);
    });
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={PROVIDER_TYPE_TRANSLATION_KEY}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="form-container space-y-6"
          >
            {isEdit && (
              <FormField
                control={form.control}
                name="providerTypeId"
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

            {/* Icon Field */}
            <FormField
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {componentT("form.iconUrl.label")}
                      </label>
                      <IconSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={componentT("form.iconUrl.placeholder")}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Active Field
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {componentT("form.isActive")}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}
            {/* {isEdit && providerType?.attributeDefinitions && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {componentT("form.attributes")}
                </h3>
                <div className="rounded border p-4">
                  <p className="text-muted-foreground text-sm">
                    {componentT("form.attributesPlaceholder", {
                      count: providerType.attributeDefinitions.length,
                    })}
                  </p>
                </div>
              </div>
            )} */}
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
                onClick={() => router.push("/admin/provider-types")}
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

export function ProviderTypeFormSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={PROVIDER_TYPE_TRANSLATION_KEY}>
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

          {/* Active Field */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-11 rounded-full" />
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
