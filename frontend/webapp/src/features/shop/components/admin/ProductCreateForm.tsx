"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

import { createProductAction } from "../../actions/admin-catalog.actions";
import { productCreateFormSchema } from "../../schemas/admin-forms";

const TYPES = ["simple", "variant", "digital"] as const;

export function ProductCreateForm({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(productCreateFormSchema),
    defaultValues: {
      nameEn: "",
      nameFa: "",
      nameAr: "",
      descEn: "",
      descFa: "",
      descAr: "",
      slug: "",
      productType: "simple" as const,
      basePrice: 0,
      baseCurrency: "USD",
      primaryCategoryId: "",
      categoryIds: [] as string[],
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const res = await createProductAction({
          slug: values.slug,
          productType: values.productType,
          basePrice: values.basePrice,
          baseCurrency: values.baseCurrency,
          nameTranslations: { en: values.nameEn, fa: values.nameFa, ar: values.nameAr },
          shortDescriptionTranslations: { en: values.descEn, fa: values.descFa, ar: values.descAr },
          primaryCategoryId: values.primaryCategoryId || undefined,
          categoryIds: values.categoryIds,
        });
        toast.success(t("common.saved"));
        router.push(`/admin/shop/products/${res.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  });

  const tp = (k: string) => t(`productNew.${k}` as never);
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
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">{tp("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {field("nameEn", tp("nameEn"), { dir: "ltr" })}
              {field("nameFa", tp("nameFa"), { dir: "rtl" })}
              {field("nameAr", tp("nameAr"), { dir: "rtl" })}
              {field("descEn", tp("shortDescEn"), { dir: "ltr" })}
              {field("descFa", tp("shortDescFa"), { dir: "rtl" })}
              {field("descAr", tp("shortDescAr"), { dir: "rtl" })}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {field("slug", tp("slug"), { dir: "ltr" })}
              <FormField control={form.control} name="productType" render={({ field: f }) => (
                <FormItem>
                  <FormLabel>{tp("type")}</FormLabel>
                  <Select value={f.value} onValueChange={f.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{TYPES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {field("basePrice", tp("sourcePrice"), { type: "number", step: "0.01", min: 0 })}
              {field("baseCurrency", tp("sourceCurrency"), { dir: "ltr" })}
            </div>

            <FormField control={form.control} name="categoryIds" render={() => (
              <FormItem>
                <FormLabel>{tp("categoriesHint")}</FormLabel>
                <div className="flex flex-wrap gap-3">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                      <input
                        type="radio"
                        name="primary"
                        checked={form.watch("primaryCategoryId") === c.id}
                        onChange={() => form.setValue("primaryCategoryId", c.id)}
                        disabled={isPending}
                      />
                      <Checkbox
                        checked={form.watch("categoryIds").includes(c.id)}
                        onCheckedChange={(v) => {
                          const cur = form.getValues("categoryIds");
                          form.setValue("categoryIds", v ? [...cur, c.id] : cur.filter((x) => x !== c.id));
                        }}
                        disabled={isPending}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={isPending}>{isPending ? `${tp("createDraft")}…` : tp("createDraft")}</Button>
            <p className="text-xs text-muted-foreground">{tp("draftNote")}</p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
