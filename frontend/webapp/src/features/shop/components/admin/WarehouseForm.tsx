"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";

import { updateWarehouseAction } from "../../actions/admin-catalog.actions";
import { warehouseFormSchema } from "../../schemas/admin-forms";

type WarehouseRow = { id: string; priority: number; is_active: boolean; is_default: boolean };

/** Inline per-row allocation-policy editor (SHP-V03-001). */
export function WarehouseForm({ warehouse }: { warehouse: WarehouseRow }) {
  const t = useTranslations("ShopAdmin.warehouses");
  const tc = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      id: warehouse.id,
      priority: warehouse.priority,
      isActive: warehouse.is_active,
      isDefault: warehouse.is_default,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateWarehouseAction({
          id: values.id,
          priority: values.priority,
          isActive: values.isActive,
          isDefault: values.isDefault,
        });
        toast.success(tc("common.saved"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tc("error.unknownError"));
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
        <FormField control={form.control} name="priority" render={({ field }) => (
          <FormItem className="space-y-0">
            <FormLabel className="text-xs text-muted-foreground">{t("priority")}</FormLabel>
            <FormControl>
              <Input {...field} value={(field.value as number) ?? 100} type="number" min={0} className="h-8 w-20" disabled={isPending} />
            </FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }) => (
          <FormItem className="flex items-center gap-1.5 space-y-0">
            <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
            <FormLabel className="!mt-0 text-xs">{t("active")}</FormLabel>
          </FormItem>
        )} />
        <FormField control={form.control} name="isDefault" render={({ field }) => (
          <FormItem className="flex items-center gap-1.5 space-y-0">
            <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
            <FormLabel className="!mt-0 text-xs">{t("isDefault")}</FormLabel>
          </FormItem>
        )} />
        <Button type="submit" size="sm" className="h-8" disabled={isPending}>{t("save")}</Button>
      </form>
    </Form>
  );
}
