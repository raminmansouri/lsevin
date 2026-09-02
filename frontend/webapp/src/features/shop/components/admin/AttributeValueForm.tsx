"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

import { addAttributeValueAction } from "../../actions/admin-catalog.actions";
import { attributeValueFormSchema } from "../../schemas/admin-forms";

export function AttributeValueForm({ attributeId }: { attributeId: string }) {
  const t = useTranslations("ShopAdmin.attributes");
  const tc = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(attributeValueFormSchema),
    defaultValues: { attributeId, value: "", labelEn: "", labelFa: "", colorHex: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await addAttributeValueAction({
          attributeId: values.attributeId,
          value: values.value,
          displayNameTranslations: { en: values.labelEn, fa: values.labelFa, ar: "" },
          colorHex: values.colorHex || null,
        });
        toast.success(tc("common.saved"));
        form.reset({ attributeId, value: "", labelEn: "", labelFa: "", colorHex: "" });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tc("error.unknownError"));
      }
    });
  });

  const cell = (name: any, ph: string, cls: string, extra: Record<string, unknown> = {}) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-0">
        <FormControl>
          <Input {...field} value={(field.value as string) ?? ""} placeholder={ph} disabled={isPending} className={cls} {...extra} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-1.5">
        {cell("value", t("valuePlaceholder"), "h-8 w-32 text-xs", { dir: "ltr" })}
        {cell("labelEn", t("labelEn"), "h-8 w-28 text-xs", { dir: "ltr" })}
        {cell("labelFa", t("labelFa"), "h-8 w-24 text-xs", { dir: "rtl" })}
        {cell("colorHex", t("hexPlaceholder"), "h-8 w-20 text-xs", { dir: "ltr" })}
        <Button type="submit" size="sm" disabled={isPending} className="h-8">
          {t("addValue")}
        </Button>
      </form>
    </Form>
  );
}
