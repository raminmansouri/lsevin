"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, Edit, Plus, Power, Search, Trash2, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { LazyAvailabilityLookupSelect } from "./lazy-availability-lookup-select";
import { LocalizedDisplay } from "@/features/shared/components/LocalizedDisplay";
import {
  deleteBookableResourceAction,
  deleteGenericAvailabilityRuleAction,
  toggleBookableResourceAction,
  toggleGenericAvailabilityRuleAction,
} from "@/features/booking-pro/admin/actions";
import type { AvailabilityAdminData, BookableResource, GenericAvailabilityRule } from "@/features/booking-pro/server/generic-availability-admin.repository";
import { availabilityText, readableGuideClass } from "./availability-admin-copy";

type Props = AvailabilityAdminData & {
  locale: string;
  search?: {
    q?: string | null;
    targetType?: string | null;
    serviceProviderId?: string | null;
    providerServiceId?: string | null;
  };
};

const DAYS: Record<number, string> = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 7: "sun" };


function localizedContent(translations?: Record<string, string> | null) {
  const cleaned = Object.fromEntries(Object.entries(translations || {}).filter(([, value]) => String(value || "").trim().length > 0));
  return {
    translations: cleaned as any,
    availableLocales: Object.keys(cleaned) as any,
  };
}

function ruleWindow(rule: GenericAvailabilityRule, t: any) {
  const dayValues = Array.isArray(rule.dayOfWeeks) && rule.dayOfWeeks.length ? rule.dayOfWeeks : rule.dayOfWeek ? [rule.dayOfWeek] : [];
  const datePart = rule.specificDate
    ? rule.specificDate.slice(0, 10)
    : dayValues.length === 7
      ? t("weekdayPresets.everyDay")
      : dayValues.length
        ? dayValues.map((day) => t(`daysShort.${DAYS[day]}`)).join(", ")
        : t("labels.anyDate");
  const timePart = rule.startsAt && rule.endsAt ? `${rule.startsAt.slice(0, 5)} – ${rule.endsAt.slice(0, 5)}` : t("labels.allDay");
  return `${datePart} · ${timePart}`;
}

function FilterForm({ locale, search }: { locale: string; search?: Props["search"] }) {
  const t = useTranslations("AvailabilityAdmin");
  const { tr } = availabilityText(locale, t as any);
  const [providerId, setProviderId] = useState(search?.serviceProviderId || "");
  const [providerServiceId, setProviderServiceId] = useState(search?.providerServiceId || "");

  return (
    <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_240px_280px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input name="q" defaultValue={search?.q || ""} placeholder={tr("placeholders.searchAdmin")} className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
      </div>

      <input type="hidden" name="serviceProviderId" value={providerId} />
      <input type="hidden" name="providerServiceId" value={providerServiceId} />

      <LazyAvailabilityLookupSelect
        value={providerId || null}
        locale={locale}
        lookupType="providers"
        placeholder={tr("filters.allProviders")}
        searchPlaceholder={tr("placeholders.searchProviders")}
        emptyText={tr("empty.noProviders")}
        onChange={(value) => {
          setProviderId(value || "");
          setProviderServiceId("");
        }}
      />

      <LazyAvailabilityLookupSelect
        value={providerServiceId || null}
        locale={locale}
        lookupType="providerServices"
        serviceProviderId={providerId || null}
        placeholder={tr("filters.allServices")}
        searchPlaceholder={tr("placeholders.searchServices")}
        emptyText={tr("empty.noServices")}
        requiredParentMessage={tr("placeholders.selectProviderFirst")}
        onChange={(value) => setProviderServiceId(value || "")}
      />

      <Button type="submit" variant="secondary">{tr("actions.filter")}</Button>
    </form>
  );
}

function RuleActions({ rule }: { rule: GenericAvailabilityRule }) {
  const t = useTranslations("AvailabilityAdmin");
  const locale = useLocale();
  const { tr } = availabilityText(locale, t as any);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { execute: toggleRule } = useAction(toggleGenericAvailabilityRuleAction, {
    startTransition,
    onSuccess: () => { toast.success(tr("toasts.ruleStatusUpdated")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || tr("toasts.ruleUpdateFailed")),
  });

  const { execute: deleteRule } = useAction(deleteGenericAvailabilityRuleAction, {
    startTransition,
    onSuccess: () => { toast.success(tr("toasts.ruleDeleted")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || tr("toasts.ruleDeleteFailed")),
  });

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild size="sm" variant="outline"><Link href={`/admin/availability/rules/${rule.id}/update`}><Edit className="mr-2 h-4 w-4" /> {tr("actions.edit")}</Link></Button>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => toggleRule({ id: rule.id!, isActive: !(rule.isActive ?? true) })}><Power className="mr-2 h-4 w-4" /> {(rule.isActive ?? true) ? tr("actions.disable") : tr("actions.enable")}</Button>
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => { if (window.confirm(tr("confirm.deleteRule"))) deleteRule({ id: rule.id! }); }}><Trash2 className="mr-2 h-4 w-4" /> {tr("actions.delete")}</Button>
    </div>
  );
}

function ResourceActions({ resource }: { resource: BookableResource }) {
  const t = useTranslations("AvailabilityAdmin");
  const locale = useLocale();
  const { tr } = availabilityText(locale, t as any);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { execute: toggleResource } = useAction(toggleBookableResourceAction, {
    startTransition,
    onSuccess: () => { toast.success(tr("toasts.resourceStatusUpdated")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || tr("toasts.resourceUpdateFailed")),
  });

  const { execute: deleteResource } = useAction(deleteBookableResourceAction, {
    startTransition,
    onSuccess: () => { toast.success(tr("toasts.resourceDeleted")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || tr("toasts.resourceDeleteFailed")),
  });

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild size="sm" variant="outline"><Link href={`/admin/availability/resources/${resource.id}/update`}><Edit className="mr-2 h-4 w-4" /> {tr("actions.edit")}</Link></Button>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => toggleResource({ id: resource.id!, isActive: !resource.isActive })}><Power className="mr-2 h-4 w-4" /> {resource.isActive ? tr("actions.disable") : tr("actions.enable")}</Button>
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => { if (window.confirm(tr("confirm.deleteResource"))) deleteResource({ id: resource.id! }); }}><Trash2 className="mr-2 h-4 w-4" /> {tr("actions.delete")}</Button>
    </div>
  );
}

export function AvailabilityAdminDashboard({ rules, resources, stats, search, locale }: Props) {
  const t = useTranslations("AvailabilityAdmin");
  const { tr, targetTypeLabel, resourceTypeLabel } = availabilityText(locale, t as any);
  const [tab, setTab] = useState<"rules" | "resources">("rules");
  const visibleRules = useMemo(() => rules, [rules]);
  const visibleResources = useMemo(() => resources, [resources]);
  const isPersian = locale.toLowerCase().startsWith("fa");
  const clerkGuide = isPersian
    ? [
        "برای زمان‌دهی عادی، ابتدا قانون قابل رزرو بسازید: مرکز، خدمت، روزهای هفته، ساعت شروع و پایان، فاصله نوبت و ظرفیت را مشخص کنید.",
        "برای تعطیلی، مرخصی، زمان ناهار یا توقف موقت، قانون مسدود بسازید و همان بازه را انتخاب کنید.",
        "اگر خدمت ظرفیت واقعی مثل اتاق، تخت، صندلی، خودرو یا دستگاه دارد، قبل از قانون زمان‌دهی یک منبع قابل رزرو تعریف کنید.",
      ]
    : [
        "For normal scheduling, create an available rule: choose provider, service, weekdays, start/end time, slot interval, and capacity.",
        "For holidays, leave, lunch breaks, or temporary closures, create a blocked rule for the same time window.",
        "If a service has a real capacity unit such as a room, bed, seat, vehicle, or device, define a bookable resource before creating the rule.",
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground"><CalendarClock className="h-4 w-4" /> {tr("dashboard.eyebrow")}</div>
          <h1 className="text-2xl font-bold tracking-tight">{tr("dashboard.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{tr("dashboard.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/admin/availability/rules/add"><Plus className="mr-2 h-4 w-4" /> {tr("actions.addRule")}</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/availability/resources/add"><Warehouse className="mr-2 h-4 w-4" /> {tr("actions.addResource")}</Link></Button>
        </div>
      </div>

      <div dir={isPersian ? "rtl" : "ltr"} className={readableGuideClass}>
        <div className="mb-2 font-semibold text-slate-950 dark:text-amber-50">{isPersian ? "راهنمای کارمند پذیرش برای تعریف زمان‌ها" : "Clerk guide for defining booking times"}</div>
        <ul className="list-inside list-disc space-y-1">
          {clerkGuide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>{tr("stats.activeRules")}</CardDescription><CardTitle className="text-3xl">{stats.activeRules}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{tr("stats.blockRules")}</CardDescription><CardTitle className="text-3xl">{stats.blockRules}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{tr("stats.resources")}</CardDescription><CardTitle className="text-3xl">{stats.resources}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{tr("stats.inactiveResources")}</CardDescription><CardTitle className="text-3xl">{stats.inactiveResources}</CardTitle></CardHeader></Card>
      </div>

      <FilterForm locale={locale} search={search} />

      <div className="flex gap-2">
        <Button type="button" variant={tab === "rules" ? "default" : "outline"} onClick={() => setTab("rules")}>{tr("tabs.rules")}</Button>
        <Button type="button" variant={tab === "resources" ? "default" : "outline"} onClick={() => setTab("resources")}>{tr("tabs.resources")}</Button>
      </div>

      {tab === "rules" ? (
        <div className="space-y-3">
          {visibleRules.length === 0 ? <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">{tr("empty.noRules")}</div> : null}
          {visibleRules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={rule.isAvailable ? "default" : "destructive"}>{rule.isAvailable ? tr("ruleTypes.available") : tr("ruleTypes.blocked")}</Badge>
                    <Badge variant={(rule.isActive ?? true) ? "secondary" : "outline"}>{(rule.isActive ?? true) ? tr("status.active") : tr("status.disabled")}</Badge>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{targetTypeLabel(rule.targetType)}</span>
                  </div>
                  <h3 className="truncate font-semibold">{rule.targetLabel || rule.targetId}</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{ruleWindow(rule, tr)}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-200">{tr("labels.capacity")}: {rule.capacity ?? tr("placeholders.auto")} · {tr("labels.priority")}: {rule.priority ?? 100}</p>
                </div>
                <RuleActions rule={rule} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleResources.length === 0 ? <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">{tr("empty.noResourcesAdmin")}</div> : null}
          {visibleResources.map((resource) => (
            <div key={resource.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{resourceTypeLabel(resource.resourceType)}</Badge>
                    <Badge variant={resource.isActive ? "default" : "outline"}>{resource.isActive ? tr("status.active") : tr("status.disabled")}</Badge>
                  </div>
                  <h3 className="truncate font-semibold"><LocalizedDisplay content={localizedContent(resource.nameTranslations)} className="inline" />{(!resource.nameTranslations || Object.keys(resource.nameTranslations).length === 0) ? (resource.code || resource.id) : null}</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{resource.serviceProviderLabel}{resource.providerServiceLabel ? ` · ${resource.providerServiceLabel}` : ""}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-200">{tr("labels.capacity")}: {resource.totalCapacity} · {tr("labels.rules")}: {resource.rulesCount ?? 0}</p>
                </div>
                <ResourceActions resource={resource} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
