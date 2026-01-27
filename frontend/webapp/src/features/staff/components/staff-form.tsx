"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createStaffAction } from "../actions/create-staff";
import { updateStaffAction } from "../actions/update-staff";
import { useStaffBySearchCacheManagement } from "../api/client/get-staff-by-search";
import { STAFF_TRANSLATION_KEY } from "../constants";
import { StaffFormInput, StaffFormSchema } from "../schemas";
import { StaffDetails } from "../types";

interface StaffFormProps {
  staff?: StaffDetails;
}

export function StaffForm({ staff }: StaffFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const componentT = useTranslations(STAFF_TRANSLATION_KEY);
  const { invalidateAllCache } = useStaffBySearchCacheManagement();

  const isEdit = !!staff;

  const form = useForm<StaffFormInput>({
    defaultValues: {
      staffId: staff?.id,
      name: staff?.name || createEmptyLocalizedContent(),
      biography: staff?.biography || createEmptyLocalizedContent(),
      title: staff?.title || createEmptyLocalizedContent(),
      profileImageUrl: staff?.profileImageUrl ?? "",
      isActive: staff?.isActive ?? true,
    },
    resolver: zodResolver(StaffFormSchema),
  });

  const action = isEdit ? updateStaffAction : createStaffAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(componentT("messages.success"));
      invalidateAllCache();
      router.push("/admin/staff");
    },
    onError: (error) => {
      toast.error(error.detail || componentT("messages.error"));
    },
  });

  const onSubmit = async (values: StaffFormInput) => {
    // Normalize localized fields
    const normalized = normalizeLocalizedFields({
      name: values.name,
      biography: values.biography,
      title: values.title,
    });

    const payload = {
      ...values,
      ...normalized,
      profileImageUrl: values.profileImageUrl?.trim() || undefined,
    };

    startTransition(async () => {
      await execute(payload);
    });
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={STAFF_TRANSLATION_KEY}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="form-container space-y-6"
          >
            {isEdit && (
              <FormField
                control={form.control}
                name="staffId"
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
                  <LocalizedInput
                    label={componentT("form.name.label")}
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.name?.message}
                    required
                    maxLength={100}
                  />
                </FormItem>
              )}
            />

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput
                    label={componentT("form.title.label")}
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.title?.message}
                    required
                    maxLength={100}
                  />
                </FormItem>
              )}
            />

            {/* Biography Field */}
            <FormField
              control={form.control}
              name="biography"
              render={({ field }) => (
                <FormItem>
                  <LocalizedInput
                    label={componentT("form.biography.label")}
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.biography?.message}
                    richText
                    rows={4}
                    maxLength={500}
                  />
                </FormItem>
              )}
            />

            {/* Profile Image URL Field */}
            {/* <FormField
              control={form.control}
              name="profileImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{componentT("form.profileImageUrl")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder={componentT(
                        "form.profileImageUrlPlaceholder"
                      )}
                      disabled={isPending}
                    />
                  </FormControl>

                </FormItem>
              )}
            /> */}

            {/* Active Status Field */}
            {/* <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {componentT("form.isActive")}
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {componentT("form.isActiveDescription")}
                    </div>
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
                onClick={() => router.push("/admin/staff")}
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

export function StaffFormSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={STAFF_TRANSLATION_KEY}>
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Biography Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>

          {/* Profile Image URL Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Active Status Field */}
          {/* <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div> */}

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
