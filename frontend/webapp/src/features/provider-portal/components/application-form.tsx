"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createProviderApplicationAction } from "@/features/provider-portal/actions";
import { createProviderApplicationSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import type { ProviderTypeOption } from "../types";

type FormValues = z.infer<typeof createProviderApplicationSchema>;

export function ProviderApplicationForm({ providerTypes }: { providerTypes: ProviderTypeOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(createProviderApplicationSchema),
    defaultValues: {
      providerTypeId: providerTypes[0]?.id || "",
      legalName: "",
      displayNameEn: "",
      displayNameFa: "",
      email: "",
      phoneNumberCountryCode: "+98",
      phoneNumber: "",
      country: "",
      city: "",
      addressText: "",
      websiteUrl: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await createProviderApplicationAction(values);
      if (!response.ok) {
        toast.error(response.error || "Application could not be submitted.");
        return;
      }
      toast.success("Provider application submitted.");
      router.push("/provider-portal/applications");
      router.refresh();
    });
  };

  return (
    <Card className="mx-auto max-w-4xl rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Building2 className="h-5 w-5" />
          Submit provider application
        </CardTitle>
        <CardDescription>
          Admin approval will create the provider workspace and assign you as owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Provider type</span>
            <select {...form.register("providerTypeId")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              {providerTypes.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            {form.formState.errors.providerTypeId ? <p className="text-xs text-red-600">{form.formState.errors.providerTypeId.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Legal business name</span>
            <Input {...form.register("legalName")} placeholder="Official company / clinic name" disabled={isPending} />
            {form.formState.errors.legalName ? <p className="text-xs text-red-600">{form.formState.errors.legalName.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Display name English</span>
            <Input {...form.register("displayNameEn")} placeholder="Name shown to users" disabled={isPending} />
            {form.formState.errors.displayNameEn ? <p className="text-xs text-red-600">{form.formState.errors.displayNameEn.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Display name Persian</span>
            <Input {...form.register("displayNameFa")} placeholder="نام فارسی" disabled={isPending} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input {...form.register("email")} type="email" placeholder="provider@example.com" disabled={isPending} />
            {form.formState.errors.email ? <p className="text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
          </label>

          <div className="grid grid-cols-[100px_1fr] gap-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">Code</span>
              <Input {...form.register("phoneNumberCountryCode")} placeholder="+98" disabled={isPending} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Phone</span>
              <Input {...form.register("phoneNumber")} placeholder="912..." disabled={isPending} />
              {form.formState.errors.phoneNumber ? <p className="text-xs text-red-600">{form.formState.errors.phoneNumber.message}</p> : null}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium">Country code/name</span>
            <Input {...form.register("country")} placeholder="IR, TR, UAE..." maxLength={15} disabled={isPending} />
            {form.formState.errors.country ? <p className="text-xs text-red-600">{form.formState.errors.country.message}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">City code/name</span>
            <Input {...form.register("city")} placeholder="Tehran, Istanbul..." maxLength={15} disabled={isPending} />
            {form.formState.errors.city ? <p className="text-xs text-red-600">{form.formState.errors.city.message}</p> : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Address</span>
            <Textarea {...form.register("addressText")} placeholder="Provider address for admin review" disabled={isPending} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Website</span>
            <Input {...form.register("websiteUrl")} placeholder="https://..." disabled={isPending} />
          </label>

          <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/provider-portal")} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit application"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
