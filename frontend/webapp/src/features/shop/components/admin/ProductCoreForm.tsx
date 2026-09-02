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
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";

import { updateProductCoreAction } from "../../actions/admin.actions";
import { productCoreFormSchema } from "../../schemas/admin-forms";

type ProductForEdit = {
  id: string;
  slug: string;
  status: "draft" | "active" | "archived";
  base_price: number;
  base_currency: string;
  primary_category_id: string | null;
  categoryIds: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_preorder?: boolean;
  preorder_release_at?: string | null;
  preorder_limit?: number | null;
  preorder_payment_policy?: "full" | "deposit" | "proforma" | null;
  preorder_deposit_percent?: number | null;
  name_translations: Record<string, string>;
  short_description_translations: Record<string, string>;
};

const STATUS = ["draft", "active", "archived"] as const;
const PREORDER_POLICIES = ["full", "deposit", "proforma"] as const;

/** datetime-local wants "YYYY-MM-DDTHH:mm"; the API sends an ISO string. */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ProductCoreForm({
  product,
  categories,
}: {
  product: ProductForEdit;
  categories: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(productCoreFormSchema),
    defaultValues: {
      productId: product.id,
      nameEn: product.name_translations?.en ?? "",
      nameFa: product.name_translations?.fa ?? "",
      nameAr: product.name_translations?.ar ?? "",
      descEn: product.short_description_translations?.en ?? "",
      descFa: product.short_description_translations?.fa ?? "",
      descAr: product.short_description_translations?.ar ?? "",
      slug: product.slug,
      status: product.status,
      basePrice: product.base_price,
      baseCurrency: product.base_currency,
      primaryCategoryId: product.primary_category_id ?? "",
      categoryIds: product.categoryIds ?? [],
      isFeatured: product.is_featured,
      isBestSeller: product.is_best_seller,
      isNewArrival: product.is_new_arrival,
      isPreorder: product.is_preorder ?? false,
      preorderReleaseAt: toLocalInput(product.preorder_release_at),
      preorderLimit: product.preorder_limit == null ? "" : String(product.preorder_limit),
      preorderPaymentPolicy: (product.preorder_payment_policy as "full" | "deposit" | "proforma") ?? "full",
      preorderDepositPercent: product.preorder_deposit_percent == null ? "" : String(product.preorder_deposit_percent),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateProductCoreAction({
          productId: values.productId,
          status: values.status,
          slug: values.slug,
          basePrice: values.basePrice,
          baseCurrency: values.baseCurrency,
          nameTranslations: { en: values.nameEn, fa: values.nameFa, ar: values.nameAr },
          shortDescriptionTranslations: { en: values.descEn, fa: values.descFa, ar: values.descAr },
          primaryCategoryId: values.primaryCategoryId || undefined,
          categoryIds: values.categoryIds,
          isFeatured: values.isFeatured,
          isBestSeller: values.isBestSeller,
          isNewArrival: values.isNewArrival,
          isPreorder: values.isPreorder,
          preorderReleaseAt: values.preorderReleaseAt ? new Date(values.preorderReleaseAt).toISOString() : null,
          preorderLimit: values.preorderLimit === "" ? null : Number(values.preorderLimit),
          preorderPaymentPolicy: values.preorderPaymentPolicy,
          preorderDepositPercent: values.preorderDepositPercent === "" ? null : Number(values.preorderDepositPercent),
        });
        toast.success(t("common.saved"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  });

  const e = (k: string) => t(`productEdit.${k}` as never);
  const field = (name: any, label: string, extra: Record<string, unknown> = {}) => (
    <FormField control={form.control} name={name} render={({ field: f }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...f} value={(f.value as string) ?? ""} disabled={isPending} {...extra} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
  const toggle = (name: any, label: string) => (
    <FormField control={form.control} name={name} render={({ field: f }) => (
      <FormItem className="flex items-center gap-2 rounded-xl border p-3">
        <FormControl><Switch checked={Boolean(f.value)} onCheckedChange={f.onChange} disabled={isPending} /></FormControl>
        <FormLabel className="!mt-0">{label}</FormLabel>
      </FormItem>
    )} />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{e("coreTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {field("nameEn", e("nameEn"), { dir: "ltr" })}
              {field("nameFa", e("nameFa"), { dir: "rtl" })}
              {field("nameAr", e("nameAr"), { dir: "rtl" })}
              {field("descEn", e("shortDescEn"), { dir: "ltr" })}
              {field("descFa", e("shortDescFa"), { dir: "rtl" })}
              {field("descAr", e("shortDescAr"), { dir: "rtl" })}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {field("slug", e("slug"), { dir: "ltr" })}
              {field("basePrice", e("sourcePrice"), { type: "number", step: "0.01", min: 0 })}
              {field("baseCurrency", e("sourceCurrency"), { dir: "ltr" })}
              <FormField control={form.control} name="status" render={({ field: f }) => (
                <FormItem>
                  <FormLabel>{e("status")}</FormLabel>
                  <Select value={f.value} onValueChange={f.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUS.map((x) => <SelectItem key={x} value={x}>{t(`enum.productStatus.${x}` as never)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="categoryIds" render={() => (
              <FormItem>
                <FormLabel>{e("categories")}</FormLabel>
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
              </FormItem>
            )} />

            <div className="flex flex-wrap gap-3">
              {toggle("isFeatured", e("featured"))}
              {toggle("isBestSeller", e("bestSeller"))}
              {toggle("isNewArrival", e("newArrival"))}
              {toggle("isPreorder", e("preorder"))}
            </div>

            {form.watch("isPreorder") ? (
              <div className="grid gap-3 rounded-xl border p-3 md:grid-cols-4">
                {field("preorderReleaseAt", e("preorderReleaseAt"), { type: "datetime-local" })}
                {field("preorderLimit", e("preorderLimit"), { type: "number", min: 0 })}
                <FormField control={form.control} name="preorderPaymentPolicy" render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>{e("preorderPolicy")}</FormLabel>
                    <Select value={f.value} onValueChange={f.onChange} disabled={isPending}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PREORDER_POLICIES.map((x) => <SelectItem key={x} value={x}>{e(`preorderPolicy_${x}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {form.watch("preorderPaymentPolicy") === "deposit"
                  ? field("preorderDepositPercent", e("preorderDepositPercent"), { type: "number", min: 0, max: 100 })
                  : null}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>{isPending ? `${e("saveCore")}…` : e("saveCore")}</Button>
            <p className="text-xs text-muted-foreground">{t("products.footnote")}</p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
