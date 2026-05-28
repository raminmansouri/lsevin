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
import {
  availabilityText,
  readableGuideClass,
  readableHelpClass,
  resourceTypeExplanationsFa,
} from "./availability-admin-copy";

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
  const { tr, isPersian } = availabilityText(locale, t as any);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<BookableResource>(resource || emptyResource());

  const hasProvider = useMemo(() => Boolean(form.serviceProviderId), [form.serviceProviderId]);
  const selectedResourceTypeExplanation = isPersian ? resourceTypeExplanationsFa[form.resourceType] : "Choose the type that matches the real capacity unit this booking consumes.";
  const resourceGuide = isPersian
    ? {
        title: "راهنمای منبع قابل رزرو",
        body: "منبع یعنی چیزی که ظرفیت رزرو را محدود می‌کند؛ مثل اتاق هتل، تخت کلینیک، صندلی کلاس، خودرو، دستگاه یا هر ظرفیت واقعی دیگر.",
        tips: [
          "اگر خدمت فقط توسط یک پزشک انجام می‌شود و منبع جداگانه ندارد، معمولاً لازم نیست منبع بسازید.",
          "اگر برای یک خدمت چند اتاق یا چند ظرفیت دارید، برای هر نوع منبع یک رکورد بسازید و ظرفیت کل را وارد کنید.",
          "اتصال منبع به Provider Service باعث می‌شود فقط همان خدمت از ظرفیت این منبع استفاده کند.",
        ],
      }
    : {
        title: "Bookable resource guide",
        body: "A resource is anything that limits booking capacity, such as a hotel room, clinic bed, class seat, vehicle, device, or physical unit.",
        tips: [
          "If a service is only controlled by one doctor or staff member, you usually do not need a separate resource.",
          "If a service has rooms, beds, or shared equipment, create a resource and enter its total capacity.",
          "Connecting a resource to a provider service makes only that service consume this capacity.",
        ],
      };

  const { execute } = useAction(saveBookableResourceAction, {
    startTransition,
    onSuccess: () => {
      toast.success(resource?.id ? tr("toasts.resourceUpdated") : tr("toasts.resourceCreated"));
      router.push("/admin/availability");
      router.refresh();
    },
    onError: (error) => toast.error(error?.detail || error?.title || tr("toasts.resourceSaveFailed")),
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
        <CardTitle>{resource?.id ? tr("resourceForm.editTitle") : tr("resourceForm.addTitle")}</CardTitle>
        <CardDescription>{tr("resourceForm.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            execute({ ...form, id: form.id || undefined } as any);
          }}
        >
          <div dir={isPersian ? "rtl" : "ltr"} className={readableGuideClass}>
            <div className="mb-1 flex items-center gap-2 font-semibold text-slate-950 dark:text-amber-50">
              <HelpCircle className="h-4 w-4" />
              {resourceGuide.title}
            </div>
            <p>{resourceGuide.body}</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-xs leading-6">
              {resourceGuide.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LazyAvailabilityLookupSelect
              label={tr("fields.provider")}
              value={form.serviceProviderId || null}
              locale={locale}
              lookupType="providers"
              placeholder={tr("placeholders.selectProvider")}
              searchPlaceholder={tr("placeholders.searchProviders")}
              emptyText={tr("empty.noProviders")}
              disabled={isPending}
              onChange={onProviderChange}
            />

            <LazyAvailabilityLookupSelect
              label={tr("fields.providerService")}
              value={form.providerServiceId || null}
              locale={locale}
              lookupType="providerServices"
              serviceProviderId={form.serviceProviderId || null}
              placeholder={tr("placeholders.optionalServiceContext")}
              searchPlaceholder={tr("placeholders.searchServices")}
              emptyText={tr("empty.noServices")}
              requiredParentMessage={tr("placeholders.selectProviderFirst")}
              disabled={isPending || !hasProvider}
              onChange={onProviderServiceChange}
            />

            <label className="block text-sm font-medium">
              {tr("fields.resourceType")}
              <select
                value={form.resourceType}
                onChange={(event) => setForm((current) => ({ ...current, resourceType: event.target.value as BookableResource["resourceType"] }))}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{tr(`resourceTypes.${type}`)}</option>
                ))}
              </select>
              <span className={readableHelpClass}>{selectedResourceTypeExplanation}</span>
            </label>

            <label className="block text-sm font-medium">
              {tr("fields.resourceCode")}
              <input
                value={form.code || ""}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder={tr("placeholders.resourceCode")}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <span className={readableHelpClass}>{isPersian ? "کد داخلی برای تشخیص سریع؛ مثل ROOM-101 یا LASER-01. مشتری معمولاً این کد را نمی‌بیند." : "Internal code for quick identification, such as ROOM-101 or LASER-01. Customers usually do not see it."}</span>
            </label>

            <label className="block text-sm font-medium">
              {tr("fields.totalCapacity")}
              <input
                type="number"
                min={1}
                value={form.totalCapacity || 1}
                onChange={(event) => setForm((current) => ({ ...current, totalCapacity: Number(event.target.value || 1) }))}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <span className={readableHelpClass}>{isPersian ? "تعداد همزمان قابل رزرو از این منبع؛ برای یک اتاق عدد 1، برای کلاس با 12 صندلی عدد 12." : "How many bookings can use this resource at the same time; 1 for one room, 12 for a 12-seat class."}</span>
            </label>
          </div>

          <LocalizedInput
            label={tr("fields.resourceName")}
            value={toLocalizedContent(form.nameTranslations)}
            onChange={(value) => setForm((current) => ({ ...current, nameTranslations: fromLocalizedContent(value) }))}
            description={tr("help.resourceName")}
            required
            maxLength={200}
          />

          <LocalizedInput
            label={tr("fields.resourceDescription")}
            value={toLocalizedContent(form.descriptionTranslations)}
            onChange={(value) => setForm((current) => ({ ...current, descriptionTranslations: fromLocalizedContent(value) }))}
            description={tr("help.resourceDescription")}
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
            {tr("fields.activeResource")}
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {tr("actions.saveResource")}
            </Button>
            <Button type="button" asChild variant="outline">
              <Link href="/admin/availability">{tr("actions.cancel")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
