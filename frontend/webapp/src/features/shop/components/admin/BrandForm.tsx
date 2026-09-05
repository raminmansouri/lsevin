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
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";

import { upsertBrandAction } from "../../actions/admin-catalog.actions";
import { brandFormSchema, type BrandFormInput } from "../../schemas/admin-forms";
import { MediaUrlField } from "./MediaUrlField";

type BrandRow = {
  id: string;
  slug: string;
  is_active: boolean;
  logo_url: string | null;
  website_url: string | null;
  name_translations: Record<string, string>;
  description_translations: Record<string, string>;
};

export function BrandForm({ brand }: { brand?: BrandRow }) {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      id: brand?.id,
      nameEn: brand?.name_translations?.en ?? "",
      nameFa: brand?.name_translations?.fa ?? "",
      nameAr: brand?.name_translations?.ar ?? "",
      slug: brand?.slug ?? "",
      logoUrl: brand?.logo_url ?? "",
      websiteUrl: brand?.website_url ?? "",
      isActive: brand?.is_active ?? true,
    },
  });

  const onSubmit = (values: BrandFormInput) => {
    startTransition(async () => {
      try {
        await upsertBrandAction({
          id: values.id,
          slug: values.slug,
          nameTranslations: { en: values.nameEn, fa: values.nameFa, ar: values.nameAr },
          descriptionTranslations: {},
          logoUrl: values.logoUrl || undefined,
          websiteUrl: values.websiteUrl || undefined,
          isActive: values.isActive,
        });
        toast.success(t("common.saved"));
        if (!values.id) form.reset();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {brand ? brand.name_translations?.en || brand.slug : t("brands.add")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <FormField control={form.control} name="nameEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.nameEn")}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nameFa" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.nameFa")}</FormLabel>
                  <FormControl><Input {...field} dir="rtl" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nameAr" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.nameAr")}</FormLabel>
                  <FormControl><Input {...field} dir="rtl" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.slug")}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" disabled={isPending} placeholder="acme-health" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.website")}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" type="url" disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="logoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("brands.logo")}</FormLabel>
                <FormControl>
                  <MediaUrlField defaultValue={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border p-3">
                <FormLabel>{t("common.active")}</FormLabel>
                <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
              </FormItem>
            )} />

            <Button type="submit" disabled={isPending}>
              {isPending ? `${t("common.save")}…` : t("brands.save")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
