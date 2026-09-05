"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";

import { upsertAttributeAction } from "../../actions/admin-catalog.actions";
import { attributeFormSchema } from "../../schemas/admin-forms";

const DISPLAY_TYPES = ["select", "swatch", "text", "boolean"] as const;

export function AttributeForm() {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      nameEn: "",
      nameFa: "",
      nameAr: "",
      slug: "",
      displayType: "select" as const,
      isVariantDefining: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await upsertAttributeAction({
          nameTranslations: { en: values.nameEn, fa: values.nameFa, ar: values.nameAr },
          slug: values.slug,
          displayType: values.displayType,
          isVariantDefining: values.isVariantDefining,
        });
        toast.success(t("common.saved"));
        form.reset();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  });

  const ta = (k: string) => t(`attributes.${k}` as never);
  const field = (name: any, label: string, extra: Record<string, unknown> = {}) => (
    <FormField control={form.control} name={name} render={({ field: f }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...f} value={(f.value as string) ?? ""} disabled={isPending} {...extra} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{ta("newAttribute")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {field("nameEn", ta("nameEn"), { dir: "ltr" })}
            <div className="grid gap-3 md:grid-cols-2">
              {field("nameFa", ta("nameFa"), { dir: "rtl" })}
              {field("nameAr", ta("nameAr"), { dir: "rtl" })}
            </div>
            {field("slug", ta("slugPlaceholder"), { dir: "ltr" })}
            <FormField control={form.control} name="displayType" render={({ field: f }) => (
              <FormItem>
                <FormLabel>{ta("displayType")}</FormLabel>
                <Select value={f.value} onValueChange={f.onChange} disabled={isPending}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{DISPLAY_TYPES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isVariantDefining" render={({ field: f }) => (
              <FormItem className="flex items-center justify-between rounded-xl border p-3">
                <FormLabel>{ta("isVariantDefining")}</FormLabel>
                <FormControl><Switch checked={Boolean(f.value)} onCheckedChange={f.onChange} disabled={isPending} /></FormControl>
              </FormItem>
            )} />
            <Button type="submit" disabled={isPending}>{isPending ? `${t("common.save")}…` : ta("createAttribute")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
