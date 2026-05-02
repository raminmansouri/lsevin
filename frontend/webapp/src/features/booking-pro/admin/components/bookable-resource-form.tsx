"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { HelpCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { saveBookableResourceAction } from "@/features/booking-pro/admin/actions";
import { LazyAvailabilityLookupSelect } from "./lazy-availability-lookup-select";
import type { BookableResource, LookupOption } from "@/features/booking-pro/server/generic-availability-admin.repository";
import type { LocalizedContent } from "@/features/shared/types/localization";

const RESOURCE_TYPES = ["generic", "room", "bed", "seat", "table", "vehicle", "equipment", "unit"] as const;

type Props = {
  resource?: BookableResource | null;
  locale: string;
};

function toLocalizedContent(value?: Record<string, string> | null): LocalizedContent {
  return { translations: { ...(value || {}) } as LocalizedContent["translations"] };
}

function fromLocalizedContent(value: LocalizedContent): Record<string, string> {
  return Object.fromEntries(Object.entries(value.translations || {}).filter(([, text]) => String(text || "").trim().length > 0)) as Record<string, string>;
}

function emptyResource(providerId?: string, providerServiceId?: string): BookableResource {
  return {
    serviceProviderId: providerId || "",
    providerServiceId: providerServiceId || null,
    resourceType: "room",
    code: "",
    nameTranslations: {},
    descriptionTranslations: {},
    totalCapacity: 1,
    isActive: true,
    metadata: {},
  };
}

export function BookableResourceForm({ resource, locale }: Props) {
  const t = useTranslations("AvailabilityAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<BookableResource>(resource || emptyResource());

  const hasProvider = useMemo(() => Boolean(form.serviceProviderId), [form.serviceProviderId]);

  const { execute } = useAction(saveBookableResourceAction, {
    startTransition,
    onSuccess: () => {
      toast.success(resource?.id ? t("toasts.resourceUpdated") : t("toasts.resourceCreated"));
      router.push("/admin/availability");
      router.refresh();
    },
    onError: (error) => toast.error(error?.detail || error?.title || t("toasts.resourceSaveFailed")),
  });

  function onProviderChange(value: string | null) {
    setForm((current) => ({
      ...current,
      serviceProviderId: value || "",
      providerServiceId: null,
    }));
  }

  function onProviderServiceChange(value: string | null, selected: LookupOption | null) {
    setForm((current) => ({
      ...current,
      providerServiceId: value,
      serviceProviderId: selected?.serviceProviderId || current.serviceProviderId,
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{resource?.id ? t("resourceForm.editTitle") : t("resourceForm.addTitle")}</CardTitle>
        <CardDescription>{t("resourceForm.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            execute({ ...form, id: form.id || undefined } as any);
          }}
        >
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <HelpCircle className="h-4 w-4" />
              {t("resourceHelp.title")}
            </div>
            <p>{t("resourceHelp.body")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LazyAvailabilityLookupSelect
              label={t("fields.provider")}
              value={form.serviceProviderId || null}
              locale={locale}
              lookupType="providers"
              placeholder={t("placeholders.selectProvider")}
              searchPlaceholder={t("placeholders.searchProviders")}
              emptyText={t("empty.noProviders")}
              disabled={isPending}
              onChange={onProviderChange}
            />

            <LazyAvailabilityLookupSelect
              label={t("fields.providerService")}
              value={form.providerServiceId || null}
              locale={locale}
              lookupType="providerServices"
              serviceProviderId={form.serviceProviderId || null}
              placeholder={t("placeholders.optionalServiceContext")}
              searchPlaceholder={t("placeholders.searchServices")}
              emptyText={t("empty.noServices")}
              requiredParentMessage={t("placeholders.selectProviderFirst")}
              disabled={isPending || !hasProvider}
              onChange={onProviderServiceChange}
            />

            <label className="block text-sm font-medium">
              {t("fields.resourceType")}
              <select
                value={form.resourceType}
                onChange={(event) => setForm((current) => ({ ...current, resourceType: event.target.value as BookableResource["resourceType"] }))}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`resourceTypes.${type}`)}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              {t("fields.resourceCode")}
              <input
                value={form.code || ""}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder={t("placeholders.resourceCode")}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block text-sm font-medium">
              {t("fields.totalCapacity")}
              <input
                type="number"
                min={1}
                value={form.totalCapacity || 1}
                onChange={(event) => setForm((current) => ({ ...current, totalCapacity: Number(event.target.value || 1) }))}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <LocalizedInput
            label={t("fields.resourceName")}
            value={toLocalizedContent(form.nameTranslations)}
            onChange={(value) => setForm((current) => ({ ...current, nameTranslations: fromLocalizedContent(value) }))}
            description={t("help.resourceName")}
            required
            maxLength={200}
          />

          <LocalizedInput
            label={t("fields.resourceDescription")}
            value={toLocalizedContent(form.descriptionTranslations)}
            onChange={(value) => setForm((current) => ({ ...current, descriptionTranslations: fromLocalizedContent(value) }))}
            description={t("help.resourceDescription")}
            multiline
            rows={3}
            maxLength={800}
          />

          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-4 w-4"
            />
            {t("fields.activeResource")}
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("actions.saveResource")}
            </Button>
            <Button type="button" asChild variant="outline">
              <Link href="/admin/availability">{t("actions.cancel")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
