"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateProviderProfileAction } from "@/features/provider-portal/actions";
import { updateProviderProfileSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { PortalImage } from "./portal-image";
import { displayTranslation, joinCsv } from "../lib/normalizers";
import type { ProviderWorkspace } from "../types";

type FormValues = z.infer<typeof updateProviderProfileSchema>;

export function ProviderProfileForm({ workspace }: { workspace: ProviderWorkspace }) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal.profile");
  const [isPending, startTransition] = useTransition();
  const provider = workspace.provider;

  const form = useForm<FormValues>({
    resolver: zodResolver(updateProviderProfileSchema),
    defaultValues: {
      providerId: provider.id,
      nameEn: displayTranslation(provider.name, "en-US", ""),
      nameFa: displayTranslation(provider.name, "fa-IR", ""),
      descriptionEn: displayTranslation(provider.description, "en-US", ""),
      descriptionFa: displayTranslation(provider.description, "fa-IR", ""),
      detailEn: displayTranslation(provider.detail, "en-US", ""),
      detailFa: displayTranslation(provider.detail, "fa-IR", ""),
      streetEn: displayTranslation(provider.street, "en-US", ""),
      streetFa: displayTranslation(provider.street, "fa-IR", ""),
      email: provider.email,
      phoneNumberCountryCode: provider.phoneNumberCountryCode,
      phoneNumber: provider.phoneNumber,
      zipCode: provider.zipCode || "",
      imageUrl: provider.imageUrl || "",
      latitude: undefined,
      longitude: undefined,
      responseTime: provider.responseTime || "",
      establishedYear: provider.establishedYear || undefined,
      totalPatients: provider.totalPatients || "",
      successRate: provider.successRate || "",
      languagesCsv: joinCsv(provider.languages),
      specialtiesCsv: joinCsv(provider.specialties),
      timezoneId: provider.timezoneId || "UTC",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await updateProviderProfileAction(values);
      if (!response.ok) {
        toast.error(response.error || t("messages.saveFailed"));
        return;
      }
      toast.success(t("messages.saveSuccess"));
      router.refresh();
    });
  };

  if (!workspace.permissions.manageProfile) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-slate-500">{t("permissionDenied")}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" {...form.register("providerId")} />

          <Field label={t("fields.nameEn")} error={form.formState.errors.nameEn?.message}>
            <Input {...form.register("nameEn")} disabled={isPending} />
          </Field>
          <Field label={t("fields.nameFa")}>
            <Input {...form.register("nameFa")} disabled={isPending} />
          </Field>

          <Field label={t("fields.descriptionEn")} className="md:col-span-2">
            <Textarea {...form.register("descriptionEn")} rows={5} disabled={isPending} />
          </Field>
          <Field label={t("fields.descriptionFa")} className="md:col-span-2">
            <Textarea {...form.register("descriptionFa")} rows={5} disabled={isPending} />
          </Field>

          <Field label={t("fields.detailEn")}>
            <Textarea {...form.register("detailEn")} disabled={isPending} />
          </Field>
          <Field label={t("fields.detailFa")}>
            <Textarea {...form.register("detailFa")} disabled={isPending} />
          </Field>

          <Field label={t("fields.streetEn")}>
            <Input {...form.register("streetEn")} disabled={isPending} />
          </Field>
          <Field label={t("fields.streetFa")}>
            <Input {...form.register("streetFa")} disabled={isPending} />
          </Field>

          <Field label={t("fields.email")} error={form.formState.errors.email?.message}>
            <Input {...form.register("email")} type="email" disabled={isPending} />
          </Field>

          <div className="grid grid-cols-[90px_1fr] gap-3">
            <Field label={t("fields.code")} error={form.formState.errors.phoneNumberCountryCode?.message}>
              <Input {...form.register("phoneNumberCountryCode")} disabled={isPending} />
            </Field>
            <Field label={t("fields.phone")} error={form.formState.errors.phoneNumber?.message}>
              <Input {...form.register("phoneNumber")} disabled={isPending} />
            </Field>
          </div>

          <Field label={t("fields.zipCode")}>
            <Input {...form.register("zipCode")} disabled={isPending} />
          </Field>
          <Field label={t("fields.imageUrl")}>
            <Input {...form.register("imageUrl")} placeholder={t("placeholders.mediaIdOrUrl")} disabled={isPending} />
          </Field>

          <div className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 md:col-span-2">
            <PortalImage src={form.watch("imageUrl")} alt={provider.displayName} className="object-cover" />
          </div>

          <Field label={t("fields.responseTime")}>
            <Input {...form.register("responseTime")} placeholder={t("placeholders.responseTime")} disabled={isPending} />
          </Field>
          <Field label={t("fields.establishedYear")}>
            <Input {...form.register("establishedYear")} type="number" disabled={isPending} />
          </Field>

          <Field label={t("fields.totalPatients")}>
            <Input {...form.register("totalPatients")} placeholder={t("placeholders.totalPatients")} disabled={isPending} />
          </Field>
          <Field label={t("fields.successRate")}>
            <Input {...form.register("successRate")} placeholder={t("placeholders.successRate")} disabled={isPending} />
          </Field>

          <Field label={t("fields.languagesCsv")}>
            <Input {...form.register("languagesCsv")} placeholder={t("placeholders.languagesCsv")} disabled={isPending} />
          </Field>
          <Field label={t("fields.specialtiesCsv")}>
            <Input {...form.register("specialtiesCsv")} placeholder={t("placeholders.specialtiesCsv")} disabled={isPending} />
          </Field>

          <Field label={t("fields.timezone")}>
            <Input {...form.register("timezoneId")} placeholder={t("placeholders.timezone")} disabled={isPending} />
          </Field>

          <div className="flex justify-end border-t pt-5 md:col-span-2">
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? t("buttons.saving") : t("buttons.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`space-y-2 ${className || ""}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
