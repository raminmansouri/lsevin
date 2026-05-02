"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { saveGenericAvailabilityRuleAction } from "@/features/booking-pro/admin/actions";
import { LazyAvailabilityLookupSelect } from "./lazy-availability-lookup-select";
import type {
  AvailabilityLookups,
  GenericAvailabilityRule,
  GenericAvailabilityTargetType,
  LookupOption,
} from "@/features/booking-pro/server/generic-availability-admin.repository";

type Props = {
  rule?: GenericAvailabilityRule | null;
  lookups?: AvailabilityLookups;
  locale: string;
  defaultTargetType?: string | null;
  defaultTargetId?: string | null;
  defaultProviderServiceId?: string | null;
};

const TARGET_TYPES: GenericAvailabilityTargetType[] = [
  "provider",
  "provider_service",
  "service_definition",
  "staff",
  "provider_staff",
  "bookable_resource",
];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function emptyRule(input?: Props): GenericAvailabilityRule {
  const targetType = (input?.defaultTargetType as GenericAvailabilityTargetType) || "provider_service";
  return {
    targetType,
    targetId: input?.defaultTargetId || "",
    serviceProviderId: null,
    providerServiceId: input?.defaultProviderServiceId || null,
    resourceId: null,
    dayOfWeek: null,
    dayOfWeeks: [1, 2, 3, 4, 5, 6, 7],
    specificDate: null,
    startsAt: "09:00",
    endsAt: "17:00",
    isAvailable: true,
    isActive: true,
    capacity: null,
    slotIntervalMinutes: 15,
    minBookingMinutes: null,
    maxBookingMinutes: null,
    priority: 100,
    timezoneId: "UTC",
    metadata: {},
  };
}

function needsProviderBeforeTarget(type: GenericAvailabilityTargetType) {
  return type === "provider_service" || type === "provider_staff" || type === "bookable_resource";
}

export function AvailabilityRuleForm(props: Props) {
  const { rule, locale } = props;
  const t = useTranslations("AvailabilityAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<GenericAvailabilityRule>(() => {
    const initial = rule || emptyRule(props);
    return {
      ...initial,
      dayOfWeeks: initial.specificDate ? [] : initial.dayOfWeeks?.length ? initial.dayOfWeeks : initial.dayOfWeek ? [initial.dayOfWeek] : [],
    };
  });

  const selectedWeekdays = form.specificDate ? [] : Array.from(new Set(form.dayOfWeeks || [])).sort((a, b) => a - b);

  const targetHelper = t(`targetTypeHelp.${form.targetType}`);
  const targetDisabled = needsProviderBeforeTarget(form.targetType) && !form.serviceProviderId;

  const { execute } = useAction(saveGenericAvailabilityRuleAction, {
    startTransition,
    onSuccess: () => {
      toast.success(rule?.id ? t("toasts.ruleUpdated") : t("toasts.ruleCreated"));
      router.push("/admin/availability");
      router.refresh();
    },
    onError: (error) => toast.error(error?.detail || error?.title || t("toasts.ruleSaveFailed")),
  });

  function applyProvider(value: string | null) {
    setForm((current) => ({
      ...current,
      serviceProviderId: value,
      providerServiceId: null,
      resourceId: null,
      targetId: needsProviderBeforeTarget(current.targetType) ? "" : current.targetId,
    }));
  }

  function applyTarget(value: string | null, selected: LookupOption | null) {
    setForm((current) => ({
      ...current,
      targetId: value || "",
      serviceProviderId: selected?.serviceProviderId || (current.targetType === "provider" ? value : current.serviceProviderId) || null,
      providerServiceId: selected?.providerServiceId || (current.targetType === "provider_service" ? value : current.providerServiceId) || null,
      resourceId: current.targetType === "bookable_resource" ? value : selected?.targetType === "bookable_resource" ? value : current.resourceId || null,
    }));
  }

  function applyProviderService(value: string | null, selected: LookupOption | null) {
    setForm((current) => ({
      ...current,
      providerServiceId: value,
      serviceProviderId: selected?.serviceProviderId || current.serviceProviderId || null,
      resourceId: null,
    }));
  }

  function setWeekdays(days: number[]) {
    const cleaned = Array.from(new Set(days)).filter((day) => day >= 1 && day <= 7).sort((a, b) => a - b);
    setForm((current) => ({
      ...current,
      dayOfWeeks: cleaned,
      dayOfWeek: cleaned[0] || null,
      specificDate: null,
    }));
  }

  function toggleWeekday(day: number) {
    const next = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((currentDay) => currentDay !== day)
      : [...selectedWeekdays, day];
    setWeekdays(next);
  }

  function clearSpecificDate() {
    setForm((current) => ({ ...current, specificDate: null, dayOfWeeks: current.dayOfWeeks?.length ? current.dayOfWeeks : [1, 2, 3, 4, 5, 6, 7], dayOfWeek: current.dayOfWeek || 1 }));
  }

  const targetPlaceholder = useMemo(() => {
    if (targetDisabled) return t("placeholders.selectProviderFirst");
    return t("placeholders.selectTarget");
  }, [targetDisabled, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{rule?.id ? t("ruleForm.editTitle") : t("ruleForm.addTitle")}</CardTitle>
        <CardDescription>{t("ruleForm.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            const dayOfWeeks = form.specificDate ? [] : selectedWeekdays;
            execute({ ...form, id: form.id || undefined, dayOfWeeks, dayOfWeek: dayOfWeeks[0] || null } as any);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              {t("fields.targetType")}
              <select
                value={form.targetType}
                onChange={(event) => {
                  const nextType = event.target.value as GenericAvailabilityTargetType;
                  setForm((current) => ({
                    ...current,
                    targetType: nextType,
                    targetId: "",
                    resourceId: null,
                    providerServiceId: nextType === "provider_service" ? null : current.providerServiceId,
                  }));
                }}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {TARGET_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`targetTypes.${type}`)}</option>
                ))}
              </select>
              {targetHelper ? <span className="mt-1 block text-xs text-muted-foreground">{targetHelper}</span> : null}
            </label>

            <LazyAvailabilityLookupSelect
              label={t("fields.provider")}
              value={form.serviceProviderId || null}
              locale={locale}
              lookupType="providers"
              placeholder={t("placeholders.optionalProviderContext")}
              searchPlaceholder={t("placeholders.searchProviders")}
              emptyText={t("empty.noProviders")}
              disabled={isPending}
              onChange={applyProvider}
            />

            <LazyAvailabilityLookupSelect
              label={t("fields.target")}
              value={form.targetId || null}
              locale={locale}
              lookupType="targets"
              targetType={form.targetType}
              serviceProviderId={form.serviceProviderId || null}
              providerServiceId={form.providerServiceId || null}
              placeholder={targetPlaceholder}
              searchPlaceholder={t("placeholders.searchTargets")}
              emptyText={t("empty.noTargets")}
              disabled={isPending || targetDisabled}
              onChange={applyTarget}
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
              disabled={isPending}
              onChange={applyProviderService}
            />

            <LazyAvailabilityLookupSelect
              label={t("fields.resourceContext")}
              value={form.resourceId || null}
              locale={locale}
              lookupType="resources"
              serviceProviderId={form.serviceProviderId || null}
              providerServiceId={form.providerServiceId || null}
              placeholder={t("placeholders.optionalResource")}
              searchPlaceholder={t("placeholders.searchResources")}
              emptyText={t("empty.noResources")}
              disabled={isPending}
              onChange={(value) => setForm((current) => ({ ...current, resourceId: value }))}
            />

            <label className="block text-sm font-medium">
              {t("fields.ruleType")}
              <select
                value={form.isAvailable ? "available" : "blocked"}
                onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.value === "available" }))}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="available">{t("ruleTypes.available")}</option>
                <option value="blocked">{t("ruleTypes.blocked")}</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="mb-4 flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{t("sections.schedule")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("help.weekdayBulk")}</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-sm font-medium">{t("fields.recurringWeekdays")}</div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekdays([1, 2, 3, 4, 5, 6, 7])}>{t("quickDays.everyDay")}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekdays([1, 2, 3, 4, 5])}>{t("quickDays.weekdays")}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekdays([6, 7])}>{t("quickDays.weekend")}</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setWeekdays([])}>{t("quickDays.clear")}</Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${selectedWeekdays.includes(day) ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                    >
                      {t(`days.${day}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  {t("fields.specificDate")}
                  <input
                    type="date"
                    value={form.specificDate || ""}
                    onChange={(event) => {
                      if (event.target.value) {
                        setForm((current) => ({ ...current, specificDate: event.target.value, dayOfWeek: null, dayOfWeeks: [] }));
                      } else {
                        clearSpecificDate();
                      }
                    }}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">{t("help.specificDateOverridesWeekdays")}</span>
                </label>

                <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {form.specificDate
                    ? t("labels.specificDateMode")
                    : selectedWeekdays.length
                      ? t("labels.weeklyMode", { count: selectedWeekdays.length })
                      : t("labels.noWeekdaysSelected")}
                </div>

                <label className="block text-sm font-medium">
                  {t("fields.startsAt")}
                  <input
                    type="time"
                    value={form.startsAt || ""}
                    onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value || null }))}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium">
                  {t("fields.endsAt")}
                  <input
                    type="time"
                    value={form.endsAt || ""}
                    onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value || null }))}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium">
              {t("fields.capacity")}
              <input type="number" min={1} value={form.capacity ?? ""} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : null }))} placeholder={t("placeholders.auto")} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-sm font-medium">
              {t("fields.slotInterval")}
              <input type="number" min={1} value={form.slotIntervalMinutes ?? ""} onChange={(event) => setForm((current) => ({ ...current, slotIntervalMinutes: event.target.value ? Number(event.target.value) : null }))} placeholder="15" className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-sm font-medium">
              {t("fields.priority")}
              <input type="number" value={form.priority ?? 100} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value || 100) }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-sm font-medium">
              {t("fields.minBookingMinutes")}
              <input type="number" min={1} value={form.minBookingMinutes ?? ""} onChange={(event) => setForm((current) => ({ ...current, minBookingMinutes: event.target.value ? Number(event.target.value) : null }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-sm font-medium">
              {t("fields.maxBookingMinutes")}
              <input type="number" min={1} value={form.maxBookingMinutes ?? ""} onChange={(event) => setForm((current) => ({ ...current, maxBookingMinutes: event.target.value ? Number(event.target.value) : null }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block text-sm font-medium">
              {t("fields.timezone")}
              <input value={form.timezoneId || "UTC"} onChange={(event) => setForm((current) => ({ ...current, timezoneId: event.target.value || "UTC" }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-medium">
            <input type="checkbox" checked={form.isActive ?? true} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4" />
            {t("fields.activeRule")}
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("actions.saveRule")}
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
