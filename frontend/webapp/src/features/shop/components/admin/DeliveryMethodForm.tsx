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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { updateDeliveryMethodAction } from "../../actions/admin-catalog.actions";
import { deliveryMethodFormSchema } from "../../schemas/admin-forms";

const EXAMPLE = `{
  "geo": {
    "includeCountries": ["IR", "TR"],
    "surcharges": [{ "countries": ["AE", "GB"], "amount": 8 }],
    "etaOverrides": [{ "countries": ["GB"], "minDays": 7, "maxDays": 14 }]
  }
}`;

type MethodRow = {
  id: string;
  code: string;
  name: string;
  base_fee: number;
  is_active: boolean;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  rules: unknown;
};

export function DeliveryMethodForm({ method }: { method: MethodRow }) {
  const t = useTranslations("ShopAdmin.delivery");
  const tc = useTranslations("ShopAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(deliveryMethodFormSchema),
    defaultValues: {
      id: method.id,
      baseFee: method.base_fee,
      estimatedDaysMin: method.estimated_days_min == null ? "" : String(method.estimated_days_min),
      estimatedDaysMax: method.estimated_days_max == null ? "" : String(method.estimated_days_max),
      isActive: method.is_active,
      rules: JSON.stringify(method.rules ?? {}, null, 2),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateDeliveryMethodAction({
          id: values.id,
          baseFee: values.baseFee,
          isActive: values.isActive,
          estimatedDaysMin: values.estimatedDaysMin === "" ? null : Number(values.estimatedDaysMin),
          estimatedDaysMax: values.estimatedDaysMax === "" ? null : Number(values.estimatedDaysMax),
          rules: JSON.parse(values.rules || "{}"),
        });
        toast.success(tc("common.saved"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tc("error.unknownError"));
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {method.name} <span className="font-mono text-xs text-muted-foreground">{method.code}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <FormField control={form.control} name="baseFee" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("baseFee")}</FormLabel>
                  <FormControl><Input {...field} value={(field.value as number) ?? 0} type="number" step="0.01" min={0} disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="estimatedDaysMin" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("etaMin")}</FormLabel>
                  <FormControl><Input {...field} value={(field.value as string) ?? ""} type="number" min={0} disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="estimatedDaysMax" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("etaMax")}</FormLabel>
                  <FormControl><Input {...field} value={(field.value as string) ?? ""} type="number" min={0} disabled={isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <FormLabel>{t("active")}</FormLabel>
                  <FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="rules" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("rulesJson")}</FormLabel>
                <FormControl>
                  <Textarea {...field} value={(field.value as string) ?? ""} rows={8} dir="ltr" className="font-mono text-xs" placeholder={EXAMPLE} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={isPending}>{isPending ? `${t("save")}…` : t("save")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
