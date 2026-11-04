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

import { upsertSellerAction } from "../../actions/admin-catalog.actions";
import { sellerFormSchema, type SellerFormInput } from "../../schemas/admin-forms";
import { MediaUrlField } from "./MediaUrlField";

type SellerRow = {
  id: string;
  slug: string;
  is_active: boolean;
  is_default: boolean;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  name_translations: Record<string, string>;
  warranty_translations: Record<string, string>;
  description_translations?: Record<string, string>;
};

export function SellerForm({ seller }: { seller?: SellerRow }) {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      id: seller?.id,
      nameEn: seller?.name_translations?.en ?? "",
      nameFa: seller?.name_translations?.fa ?? "",
      nameAr: seller?.name_translations?.ar ?? "",
      slug: seller?.slug ?? "",
      warrantyEn: seller?.warranty_translations?.en ?? "",
      warrantyFa: seller?.warranty_translations?.fa ?? "",
      warrantyAr: seller?.warranty_translations?.ar ?? "",
      descEn: seller?.description_translations?.en ?? "",
      descFa: seller?.description_translations?.fa ?? "",
      descAr: seller?.description_translations?.ar ?? "",
      logoUrl: seller?.logo_url ?? "",
      phone: seller?.phone ?? "",
      email: seller?.email ?? "",
      isActive: seller?.is_active ?? true,
    },
  });

  const onSubmit = (values: SellerFormInput) => {
    startTransition(async () => {
      try {
        await upsertSellerAction({
          id: values.id,
          slug: values.slug,
          nameTranslations: { en: values.nameEn, fa: values.nameFa, ar: values.nameAr },
          warrantyTranslations: { en: values.warrantyEn, fa: values.warrantyFa, ar: values.warrantyAr },
          descriptionTranslations: { en: values.descEn, fa: values.descFa, ar: values.descAr },
          logoUrl: values.logoUrl || undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
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

  const text = (name: keyof SellerFormInput, label: string, dir: "ltr" | "rtl", type = "text") => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...field} value={String(field.value ?? "")} type={type} dir={dir} disabled={isPending} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  const area = (name: keyof SellerFormInput, label: string, dir: "ltr" | "rtl") => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <textarea
            {...field}
            value={String(field.value ?? "")}
            dir={dir}
            rows={3}
            disabled={isPending}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {seller ? seller.name_translations?.fa || seller.name_translations?.en || seller.slug : t("sellers.add")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {text("nameEn", t("sellers.nameEn"), "ltr")}
              {text("nameFa", t("sellers.nameFa"), "rtl")}
              {text("nameAr", t("sellers.nameAr"), "rtl")}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {text("slug", t("sellers.slug"), "ltr")}
              {text("phone", t("sellers.phone"), "ltr", "tel")}
              {text("email", t("sellers.email"), "ltr", "email")}
            </div>

            <div className="space-y-1">
              <div className="grid gap-3 md:grid-cols-3">
                {text("warrantyEn", t("sellers.warrantyEn"), "ltr")}
                {text("warrantyFa", t("sellers.warrantyFa"), "rtl")}
                {text("warrantyAr", t("sellers.warrantyAr"), "rtl")}
              </div>
              <p className="text-xs text-gray-500">{t("sellers.warrantyHint")}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {area("descEn", t("sellers.descEn"), "ltr")}
              {area("descFa", t("sellers.descFa"), "rtl")}
              {area("descAr", t("sellers.descAr"), "rtl")}
            </div>

            <FormField control={form.control} name="logoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sellers.logo")}</FormLabel>
                <FormControl>
                  <MediaUrlField disabled={isPending} defaultValue={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <FormLabel>{t("common.active")}</FormLabel>
                  {seller?.is_default ? <p className="text-xs text-gray-500">{t("sellers.defaultHint")}</p> : null}
                </div>
                <FormControl>
                  <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending || seller?.is_default} />
                </FormControl>
              </FormItem>
            )} />

            <Button type="submit" disabled={isPending}>
              {isPending ? `${t("common.save")}…` : t("sellers.save")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}