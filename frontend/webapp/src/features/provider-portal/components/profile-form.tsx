"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
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

import { displayTranslation, joinCsv } from "../lib/normalizers";
import type { ProviderWorkspace } from "../types";

type FormValues = z.infer<typeof updateProviderProfileSchema>;

export function ProviderProfileForm({ workspace }: { workspace: ProviderWorkspace }) {
  const router = useRouter();
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
        toast.error(response.error || "Profile could not be saved.");
        return;
      }
      toast.success("Provider profile saved.");
      router.refresh();
    });
  };

  if (!workspace.permissions.manageProfile) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-slate-500">You do not have permission to edit this profile.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Provider profile</CardTitle>
        <CardDescription>
          Providers can update user-facing content. Provider type, country/city, sponsorship and verification stay admin-controlled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" {...form.register("providerId")} />

          <Field label="Name English" error={form.formState.errors.nameEn?.message}>
            <Input {...form.register("nameEn")} disabled={isPending} />
          </Field>
          <Field label="Name Persian">
            <Input {...form.register("nameFa")} disabled={isPending} />
          </Field>

          <Field label="Description English" className="md:col-span-2">
            <Textarea {...form.register("descriptionEn")} rows={5} disabled={isPending} />
          </Field>
          <Field label="Description Persian" className="md:col-span-2">
            <Textarea {...form.register("descriptionFa")} rows={5} disabled={isPending} />
          </Field>

          <Field label="Detail English">
            <Textarea {...form.register("detailEn")} disabled={isPending} />
          </Field>
          <Field label="Detail Persian">
            <Textarea {...form.register("detailFa")} disabled={isPending} />
          </Field>

          <Field label="Street English">
            <Input {...form.register("streetEn")} disabled={isPending} />
          </Field>
          <Field label="Street Persian">
            <Input {...form.register("streetFa")} disabled={isPending} />
          </Field>

          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input {...form.register("email")} type="email" disabled={isPending} />
          </Field>

          <div className="grid grid-cols-[90px_1fr] gap-3">
            <Field label="Code" error={form.formState.errors.phoneNumberCountryCode?.message}>
              <Input {...form.register("phoneNumberCountryCode")} disabled={isPending} />
            </Field>
            <Field label="Phone" error={form.formState.errors.phoneNumber?.message}>
              <Input {...form.register("phoneNumber")} disabled={isPending} />
            </Field>
          </div>

          <Field label="Zip code">
            <Input {...form.register("zipCode")} disabled={isPending} />
          </Field>
          <Field label="Image URL / media id">
            <Input {...form.register("imageUrl")} placeholder="media id or URL" disabled={isPending} />
          </Field>

          <Field label="Response time">
            <Input {...form.register("responseTime")} placeholder="Usually responds in 1 hour" disabled={isPending} />
          </Field>
          <Field label="Established year">
            <Input {...form.register("establishedYear")} type="number" disabled={isPending} />
          </Field>

          <Field label="Total patients">
            <Input {...form.register("totalPatients")} placeholder="10k+" disabled={isPending} />
          </Field>
          <Field label="Success rate">
            <Input {...form.register("successRate")} placeholder="98%" disabled={isPending} />
          </Field>

          <Field label="Languages CSV">
            <Input {...form.register("languagesCsv")} placeholder="English, Persian, Arabic" disabled={isPending} />
          </Field>
          <Field label="Specialties CSV">
            <Input {...form.register("specialtiesCsv")} placeholder="Hair transplant, Dental..." disabled={isPending} />
          </Field>

          <Field label="Timezone">
            <Input {...form.register("timezoneId")} placeholder="Asia/Tehran" disabled={isPending} />
          </Field>

          <div className="flex justify-end border-t pt-5 md:col-span-2">
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Save profile"}
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
