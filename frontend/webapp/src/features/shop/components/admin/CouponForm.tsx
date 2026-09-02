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

import { upsertCouponAction } from "../../actions/admin-catalog.actions";
import { couponFormSchema } from "../../schemas/admin-forms";

const COUPON_TYPES = ["percentage", "fixed", "free_shipping"] as const;
const SCOPES = ["cart", "shipping", "product", "category", "brand"] as const;

/** New-coupon form (SHP-V02-004). Existing coupons are listed read-only. */
export function CouponForm() {
  const t = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      couponType: "percentage" as const,
      value: 0,
      currency: "",
      scope: "cart" as const,
      minSubtotal: 0,
      maxDiscountAmount: "",
      usageLimit: "",
      usagePerCustomer: "",
      startsAt: "",
      expiresAt: "",
      stackable: false,
      isActive: true,
      titleEn: "",
      titleFa: "",
      titleAr: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const n = (s: string) => (s.trim() === "" ? undefined : Number(s));
        await upsertCouponAction({
          code: values.code,
          couponType: values.couponType,
          value: values.value,
          currency: values.currency || undefined,
          scope: values.scope,
          minSubtotal: values.minSubtotal,
          maxDiscountAmount: n(values.maxDiscountAmount),
          usageLimit: n(values.usageLimit),
          usagePerCustomer: n(values.usagePerCustomer),
          startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
          expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
          stackable: values.stackable,
          isActive: values.isActive,
          titleTranslations: { en: values.titleEn, fa: values.titleFa, ar: values.titleAr },
        });
        toast.success(t("common.saved"));
        form.reset();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error.unknownError"));
      }
    });
  });

  const tc = (k: string) => t(`coupons.${k}` as never);

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
        <CardTitle className="text-base">{tc("new")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {textField("code", tc("code"), { dir: "ltr" })}
              <FormField control={form.control} name="couponType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tc("type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{COUPON_TYPES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {textField("value", tc("value"), { type: "number", step: "0.01", min: 0 })}
              {textField("currency", tc("currencyFixedOnly"), { dir: "ltr", placeholder: "USD" })}
              {textField("minSubtotal", tc("minSubtotal"), { type: "number", step: "0.01", min: 0 })}
              {textField("maxDiscountAmount", tc("maxDiscount"), { type: "number", step: "0.01", min: 0 })}
              {textField("usageLimit", tc("usageLimit"), { type: "number", min: 1 })}
              {textField("usagePerCustomer", tc("perCustomer"), { type: "number", min: 1 })}
              <FormField control={form.control} name="scope" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tc("scope")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{SCOPES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {textField("startsAt", tc("startsAt"), { type: "datetime-local" })}
              {textField("expiresAt", tc("expiresAt"), { type: "datetime-local" })}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {textField("titleEn", tc("titleEn"), { dir: "ltr" })}
              {textField("titleFa", tc("titleFa"), { dir: "rtl" })}
              {textField("titleAr", tc("titleAr"), { dir: "rtl" })}
            </div>

            <div className="flex flex-wrap gap-3">
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-xl border p-3">
                  <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
                  <FormLabel className="!mt-0">{tc("active")}</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="stackable" render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-xl border p-3">
                  <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
                  <FormLabel className="!mt-0">{tc("stackable")}</FormLabel>
                </FormItem>
              )} />
            </div>

            <Button type="submit" disabled={isPending}>{isPending ? `${tc("save")}…` : tc("save")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
