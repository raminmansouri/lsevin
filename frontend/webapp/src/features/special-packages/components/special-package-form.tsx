"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";

import { saveSpecialPackageAction } from "../server/actions";
import { SpecialPackageInputSchema, type SpecialPackageFormValues } from "../server/schema";
import type { SpecialPackageAdminRow } from "../server/repository";

type FormValues = SpecialPackageFormValues & { id?: string };

const emptyTranslations: Record<string, string> = {
  "ar-SA": "",
  "de-DE": "",
  "en-US": "",
  "es-ES": "",
  "fa-IR": "",
  "fr-FR": "",
  "ku-KU": "",
  "tr-TR": "",
};

function hasTranslationValue(value?: Record<string, string> | null) {
  return Object.values(value || {}).some((text) => typeof text === "string" && text.trim().length > 0);
}

function withTranslationDefaults(value?: Record<string, string> | null) {
  const source = hasTranslationValue(value) ? value : {};
  return { ...emptyTranslations, ...(source || {}) };
}

function localizedValue(value?: Record<string, string> | null) {
  return { translations: withTranslationDefaults(value) };
}

function localizedTranslations(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const maybeLocalized = value as { translations?: unknown };
  if (
    maybeLocalized.translations &&
    typeof maybeLocalized.translations === "object" &&
    !Array.isArray(maybeLocalized.translations)
  ) {
    return maybeLocalized.translations as Record<string, string>;
  }
  return value as Record<string, string>;
}

function toFormValues(row?: SpecialPackageAdminRow | null): FormValues {
  return {
    id: row?.id,
    titleTranslations: withTranslationDefaults(row?.titleTranslations),
    subtitleTranslations: withTranslationDefaults(row?.subtitleTranslations),
    descriptionTranslations: withTranslationDefaults(row?.descriptionTranslations),
    providerId: row?.providerId ?? null,
    priceAmount: row?.priceAmount ?? null,
    currencyCode: row?.currencyCode ?? "",
    originalPriceAmount: row?.originalPriceAmount ?? null,
    imageUrl: row?.imageUrl ?? "",
    isActive: row?.isActive ?? true,
    displayOrder: row?.displayOrder ?? 0,
    metadata: row?.metadata ?? {},
  };
}

function labelFromPath(path: string) {
  return path
    .replace(/Translations$/, " translations")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function collectFormErrorMessages(errors: Record<string, any>, prefix = ""): string[] {
  return Object.entries(errors || {}).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!value) return [];

    const current = typeof value.message === "string" ? [`${labelFromPath(path)}: ${value.message}`] : [];
    const children =
      typeof value === "object"
        ? collectFormErrorMessages(
            Object.fromEntries(
              Object.entries(value).filter(([childKey]) => !["message", "type", "ref", "types"].includes(childKey))
            ),
            path
          )
        : [];

    return [...current, ...children];
  });
}

function serverFieldErrorsToMessages(fieldErrors?: Record<string, string[]>) {
  return Object.entries(fieldErrors || {}).flatMap(([fieldName, messages]) => {
    if (!messages?.length) return [];
    return messages.map((message) => `${labelFromPath(fieldName)}: ${message}`);
  });
}

export function SpecialPackageForm({ pkg }: { pkg?: SpecialPackageAdminRow | null }) {
  const t = useTranslations("SpecialPackagesAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errorSummary, setErrorSummary] = useState<string[]>([]);
  const defaults = useMemo(() => toFormValues(pkg), [pkg]);

  const form = useForm<FormValues>({
    resolver: zodResolver(SpecialPackageInputSchema) as unknown as Resolver<FormValues>,
    defaultValues: defaults,
    mode: "onSubmit",
  });

  function setLocalizedField(
    name: keyof Pick<FormValues, "titleTranslations" | "subtitleTranslations" | "descriptionTranslations">
  ) {
    return (value: unknown) => {
      form.setValue(name as never, localizedTranslations(value) as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    };
  }

  function onSubmit(values: FormValues) {
    setServerMessage(null);
    setErrorSummary([]);
    startTransition(async () => {
      const result = await saveSpecialPackageAction(values);
      if (!result.ok) {
        setServerMessage(result.message || t("toastError"));
        setErrorSummary(serverFieldErrorsToMessages(result.fieldErrors));
        for (const [fieldName, messages] of Object.entries(result.fieldErrors || {})) {
          form.setError(fieldName as never, { message: messages?.[0] || "Invalid value" });
        }
        return;
      }
      router.push("/admin/special-packages");
      router.refresh();
    });
  }

  function onInvalid(errors: Record<string, any>) {
    setServerMessage(t("reviewFields"));
    const messages = collectFormErrorMessages(errors);
    setErrorSummary(messages.length ? messages : [t("reviewFields")]);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 gap-2">
            <Link href="/admin/special-packages">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t("backToList")}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {pkg ? t("updateTitle") : t("createTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("formDescription")}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("contentTitle")}</CardTitle>
              <CardDescription>{t("contentDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LocalizedInput
                label={t("fieldTitle")}
                value={localizedValue(form.watch("titleTranslations") as never) as never}
                onChange={setLocalizedField("titleTranslations")}
                required
                maxLength={180}
              />
              <LocalizedInput
                label={t("fieldSubtitle")}
                value={localizedValue(form.watch("subtitleTranslations") as never) as never}
                onChange={setLocalizedField("subtitleTranslations")}
                maxLength={260}
              />
              <LocalizedInput
                label={t("fieldDescription")}
                value={localizedValue(form.watch("descriptionTranslations") as never) as never}
                onChange={setLocalizedField("descriptionTranslations")}
                multiline
                rows={4}
                maxLength={1200}
              />
              <RHFSingleMediaPickerField
                control={form.control}
                name="imageUrl"
                label={t("fieldImage")}
                placeholder={t("fieldImagePlaceholder")}
                mediaType="image"
                helperText={t("fieldImageHelper")}
                modalTitle={t("fieldImage")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pricingTitle")}</CardTitle>
              <CardDescription>{t("pricingDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="priceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fieldPriceAmount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={isPending}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fieldCurrencyCode")}</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={isPending}
                        placeholder="IRR"
                      />
                    </FormControl>
                    <FormDescription>{t("fieldCurrencyCodeHelper")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originalPriceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fieldOriginalPriceAmount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={isPending}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormDescription>{t("fieldOriginalPriceAmountHelper")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("displayTitle")}</CardTitle>
              <CardDescription>{t("displayDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fieldDisplayOrder")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? 0)}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <FormControl>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("fieldIsActive")}</FormLabel>
                      <FormDescription>{t("fieldIsActiveHelper")}</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {(serverMessage || errorSummary.length > 0) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverMessage && <p className="font-medium">{serverMessage}</p>}
              {errorSummary.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 ps-5">
                  {errorSummary.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/special-packages">{t("cancel")}</Link>
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
