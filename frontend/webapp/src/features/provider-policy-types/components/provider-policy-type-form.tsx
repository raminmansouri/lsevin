"use client";

import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createProviderPolicyTypeAction } from "../actions/create-provider-policy-type";
import { updateProviderPolicyTypeAction } from "../actions/update-provider-policy-type";
import { ProviderPolicyTypeFormInput, ProviderPolicyTypeSchema } from "../schemas";
import type { ProviderPolicyType } from "../types";

const LOCALES = ["ar-SA", "de-DE", "en-US", "es-ES", "fa-IR", "fr-FR", "ku-KU", "tr-TR"] as const;
function emptyLocalized() { return Object.fromEntries(LOCALES.map((locale) => [locale, ""])) as Record<string, string>; }
function normalizeLocalized(value: unknown) {
  const result = emptyLocalized();
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) result[key] = typeof item === "string" ? item : item == null ? "" : String(item);
  return result;
}

export function ProviderPolicyTypeForm({ item }: { item?: ProviderPolicyType }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!item;
  const defaultValues = useMemo<ProviderPolicyTypeFormInput>(() => ({
    id: item?.id,
    code: item?.code || "",
    nameTranslations: normalizeLocalized(item?.nameTranslations),
    descriptionTranslations: normalizeLocalized(item?.descriptionTranslations),
    displayOrder: item?.displayOrder ?? 0,
    isActive: item?.isActive ?? true,
  }), [item]);

  const form = useForm<ProviderPolicyTypeFormInput>({
    defaultValues,
    resolver: zodResolver(ProviderPolicyTypeSchema),
    mode: "onSubmit",
  });

  const action = isEdit ? updateProviderPolicyTypeAction : createProviderPolicyTypeAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(isEdit ? "Provider policy type updated." : "Provider policy type created.");
      router.push("/admin/provider-policy-types");
    },
    onError: (error) => toast.error(error?.detail || "Provider policy type save failed."),
  });

  const onSubmit = async (values: ProviderPolicyTypeFormInput) => {
    await execute(values as any);
  };

  return (
    <CardContent className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          {isEdit && <input type="hidden" {...form.register("id")} />}
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl><Input {...field} placeholder="cancellation" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="displayOrder" render={({ field }) => (
            <FormItem>
              <FormLabel>Display order</FormLabel>
              <FormControl><Input type="number" min={0} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="nameTranslations" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <LocalizedInput label="Name" value={field.value} onChange={field.onChange} required maxLength={200} />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="descriptionTranslations" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <LocalizedInput label="Description" value={field.value} onChange={field.onChange} rows={4} />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border bg-gray-50 p-4 md:col-span-2">
              <div><FormLabel>Active</FormLabel><p className="text-sm text-muted-foreground">Inactive types stay in the database but are hidden from active selection flows.</p></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/provider-policy-types")} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-[#083f30] hover:bg-[#083f30]/90"><Save className="mr-2 h-4 w-4" />{isPending ? "Saving..." : isEdit ? "Update type" : "Create type"}</Button>
          </div>
        </form>
      </Form>
    </CardContent>
  );
}

export function ProviderPolicyTypeFormSkeleton() {
  return <CardContent className="grid gap-4 p-6 md:grid-cols-2">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />)}</CardContent>;
}
