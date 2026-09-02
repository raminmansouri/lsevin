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

import { upsertCategoryAction } from "../../actions/admin-catalog.actions";
import { categoryFormSchema } from "../../schemas/admin-forms";
import { MediaUrlField } from "./MediaUrlField";

type CategoryRow = {
  id: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  banner_url: string | null;
  icon: string | null;
  gradient: string | null;
  name_translations: Record<string, string>;
  description_translations: Record<string, string>;
};

const NONE = "__none";

export function CategoryForm({
  category,
  categories,
}: {
  category?: CategoryRow;
  categories: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      id: category?.id,
      nameEn: category?.name_translations?.en ?? "",
      nameFa: category?.name_translations?.fa ?? "",
      nameAr: category?.name_translations?.ar ?? "",
      descEn: category?.description_translations?.en ?? "",
      descFa: category?.description_translations?.fa ?? "",
      descAr: category?.description_translations?.ar ?? "",
      slug: category?.slug ?? "",
      parentId: category?.parent_id ?? "",
      icon: category?.icon ?? "",
      gradient: category?.gradient ?? "",
      imageUrl: category?.image_url ?? "",
      bannerUrl: category?.banner_url ?? "",
      displayOrder: category?.display_order ?? 0,
      isActive: category?.is_active ?? true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const res = await upsertCategoryAction({
          id: values.id,
          slug: values.slug,
          nameTranslations: { en: values.nameEn, fa: values.nameFa, ar: values.nameAr },
          descriptionTranslations: { en: values.descEn, fa: values.descFa, ar: values.descAr },
          parentId: values.parentId || undefined,
          imageUrl: values.imageUrl || undefined,
          bannerUrl: values.bannerUrl || undefined,
          icon: values.icon || undefined,
          gradient: values.gradient || undefined,
          displayOrder: values.displayOrder,
          isActive: values.isActive,
        });
        toast.success(t("common.saved"));
        if (!values.id && res?.id) router.push(`/admin/shop/categories/${res.id}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  });

  const tf = (k: string) => t(`categoryForm.${k}` as never);

  const textField = (name: any, label: string, extra: Record<string, unknown> = {}) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...field} value={(field.value as string) ?? ""} disabled={isPending} {...extra} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {category ? category.name_translations?.en || category.slug : t("categoryNew.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {textField("nameEn", tf("nameEn"), { dir: "ltr" })}
              {textField("nameFa", tf("nameFa"), { dir: "rtl" })}
              {textField("nameAr", tf("nameAr"), { dir: "rtl" })}
              {textField("descEn", tf("descEn"), { dir: "ltr" })}
              {textField("descFa", tf("descFa"), { dir: "rtl" })}
              {textField("descAr", tf("descAr"), { dir: "rtl" })}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {textField("slug", tf("slug"), { dir: "ltr" })}
              <FormField control={form.control} name="parentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("parent")}</FormLabel>
                  <Select
                    value={field.value ? field.value : NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                    disabled={isPending}
                  >
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{tf("parentNone")}</SelectItem>
                      {categories.filter((c) => c.id !== category?.id).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {textField("displayOrder", tf("displayOrder"), { type: "number", min: 0 })}
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <FormLabel>{tf("active")}</FormLabel>
                  <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
                </FormItem>
              )} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {textField("icon", tf("iconEmoji"))}
              {textField("gradient", tf("gradient"), { dir: "ltr", placeholder: "from-emerald-500 to-teal-600" })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("image")}</FormLabel>
                  <FormControl><MediaUrlField defaultValue={(field.value as string) ?? ""} onValueChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="bannerUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("banner")}</FormLabel>
                  <FormControl><MediaUrlField defaultValue={(field.value as string) ?? ""} onValueChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>

            <Button type="submit" disabled={isPending}>{isPending ? `${tf("save")}…` : tf("save")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
