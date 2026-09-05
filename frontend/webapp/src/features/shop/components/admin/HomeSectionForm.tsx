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

import { upsertHomeSectionAction } from "../../actions/admin-catalog.actions";
import { homeSectionFormSchema } from "../../schemas/admin-forms";

const SECTION_TYPES = ["shortcut_rail", "promo_cards", "product_rail", "category_rail", "service_related_rail"] as const;
const QUERY_SOURCES = ["manual", "featured", "best_seller", "new_arrival", "discounted", "category", "service_related"] as const;

type SectionRow = {
  id: string;
  key: string;
  section_type: string;
  query_source: string;
  query_config?: { slug?: string } | null;
  display_order: number;
  is_active: boolean;
  title_translations?: Record<string, string> | null;
};

export function HomeSectionForm({ section }: { section?: SectionRow }) {
  const t = useTranslations("ShopAdmin.merchandising");
  const tc = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(homeSectionFormSchema),
    defaultValues: {
      id: section?.id,
      key: section?.key ?? "",
      sectionType: (section?.section_type as (typeof SECTION_TYPES)[number]) ?? "product_rail",
      querySource: (section?.query_source as (typeof QUERY_SOURCES)[number]) ?? "manual",
      categorySlug: section?.query_config?.slug ?? "",
      displayOrder: section?.display_order ?? 0,
      isActive: section?.is_active ?? true,
      titleEn: section?.title_translations?.en ?? "",
      titleFa: section?.title_translations?.fa ?? "",
      titleAr: section?.title_translations?.ar ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await upsertHomeSectionAction({
          id: values.id,
          key: values.key,
          sectionType: values.sectionType,
          titleTranslations: { en: values.titleEn, fa: values.titleFa, ar: values.titleAr },
          subtitleTranslations: {},
          querySource: values.querySource,
          queryConfig: values.categorySlug ? { slug: values.categorySlug } : {},
          displayOrder: values.displayOrder,
          isActive: values.isActive,
        });
        toast.success(tc("common.saved"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tc("error.unknownError"));
      }
    });
  });

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
        <CardTitle className="text-base">{t("newEditSection")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {field("key", t("key"), { dir: "ltr" })}
              {field("displayOrder", t("displayOrder"), { type: "number", min: 0 })}
              <FormField control={form.control} name="sectionType" render={({ field: f }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <Select value={f.value} onValueChange={f.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{SECTION_TYPES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="querySource" render={({ field: f }) => (
                <FormItem>
                  <FormLabel>{t("querySource")}</FormLabel>
                  <Select value={f.value} onValueChange={f.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{QUERY_SOURCES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {field("categorySlug", t("categorySlug"), { dir: "ltr" })}
              <FormField control={form.control} name="isActive" render={({ field: f }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <FormLabel>{t("active")}</FormLabel>
                  <FormControl><Switch checked={Boolean(f.value)} onCheckedChange={f.onChange} disabled={isPending} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {field("titleEn", t("titleEn"), { dir: "ltr" })}
              {field("titleFa", t("titleFa"), { dir: "rtl" })}
              {field("titleAr", t("titleAr"), { dir: "rtl" })}
            </div>
            <Button type="submit" disabled={isPending}>{isPending ? `${t("saveSection")}…` : t("saveSection")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
