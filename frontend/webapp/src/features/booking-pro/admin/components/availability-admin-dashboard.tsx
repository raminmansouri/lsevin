"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const [providerId, setProviderId] = useState(search?.serviceProviderId || "");
  const [providerServiceId, setProviderServiceId] = useState(search?.providerServiceId || "");

  return (
    <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_240px_280px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input name="q" defaultValue={search?.q || ""} placeholder={t("placeholders.searchAdmin")} className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
      </div>

      <input type="hidden" name="serviceProviderId" value={providerId} />
      <input type="hidden" name="providerServiceId" value={providerServiceId} />

      <LazyAvailabilityLookupSelect
        value={providerId || null}
        locale={locale}
        lookupType="providers"
        placeholder={t("filters.allProviders")}
        searchPlaceholder={t("placeholders.searchProviders")}
        emptyText={t("empty.noProviders")}
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
        placeholder={t("filters.allServices")}
        searchPlaceholder={t("placeholders.searchServices")}
        emptyText={t("empty.noServices")}
        requiredParentMessage={t("placeholders.selectProviderFirst")}
        onChange={(value) => setProviderServiceId(value || "")}
      />

      <Button type="submit" variant="secondary">{t("actions.filter")}</Button>
    </form>
  );
}

function RuleActions({ rule }: { rule: GenericAvailabilityRule }) {
  const t = useTranslations("AvailabilityAdmin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { execute: toggleRule } = useAction(toggleGenericAvailabilityRuleAction, {
    startTransition,
    onSuccess: () => { toast.success(t("toasts.ruleStatusUpdated")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || t("toasts.ruleUpdateFailed")),
  });

  const { execute: deleteRule } = useAction(deleteGenericAvailabilityRuleAction, {
    startTransition,
    onSuccess: () => { toast.success(t("toasts.ruleDeleted")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || t("toasts.ruleDeleteFailed")),
  });

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild size="sm" variant="outline"><Link href={`/admin/availability/rules/${rule.id}/update`}><Edit className="mr-2 h-4 w-4" /> {t("actions.edit")}</Link></Button>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => toggleRule({ id: rule.id!, isActive: !(rule.isActive ?? true) })}><Power className="mr-2 h-4 w-4" /> {(rule.isActive ?? true) ? t("actions.disable") : t("actions.enable")}</Button>
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => { if (window.confirm(t("confirm.deleteRule"))) deleteRule({ id: rule.id! }); }}><Trash2 className="mr-2 h-4 w-4" /> {t("actions.delete")}</Button>
    </div>
  );
}

function ResourceActions({ resource }: { resource: BookableResource }) {
  const t = useTranslations("AvailabilityAdmin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { execute: toggleResource } = useAction(toggleBookableResourceAction, {
    startTransition,
    onSuccess: () => { toast.success(t("toasts.resourceStatusUpdated")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || t("toasts.resourceUpdateFailed")),
  });

  const { execute: deleteResource } = useAction(deleteBookableResourceAction, {
    startTransition,
    onSuccess: () => { toast.success(t("toasts.resourceDeleted")); router.refresh(); },
    onError: (error) => toast.error(error?.detail || error?.title || t("toasts.resourceDeleteFailed")),
  });

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild size="sm" variant="outline"><Link href={`/admin/availability/resources/${resource.id}/update`}><Edit className="mr-2 h-4 w-4" /> {t("actions.edit")}</Link></Button>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => toggleResource({ id: resource.id!, isActive: !resource.isActive })}><Power className="mr-2 h-4 w-4" /> {resource.isActive ? t("actions.disable") : t("actions.enable")}</Button>
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => { if (window.confirm(t("confirm.deleteResource"))) deleteResource({ id: resource.id! }); }}><Trash2 className="mr-2 h-4 w-4" /> {t("actions.delete")}</Button>
    </div>
  );
}

export function AvailabilityAdminDashboard({ rules, resources, stats, search, locale }: Props) {
  const t = useTranslations("AvailabilityAdmin");
  const [tab, setTab] = useState<"rules" | "resources">("rules");
  const visibleRules = useMemo(() => rules, [rules]);
  const visibleResources = useMemo(() => resources, [resources]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground"><CalendarClock className="h-4 w-4" /> {t("dashboard.eyebrow")}</div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{t("dashboard.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/admin/availability/rules/add"><Plus className="mr-2 h-4 w-4" /> {t("actions.addRule")}</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/availability/resources/add"><Warehouse className="mr-2 h-4 w-4" /> {t("actions.addResource")}</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>{t("stats.activeRules")}</CardDescription><CardTitle className="text-3xl">{stats.activeRules}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t("stats.blockRules")}</CardDescription><CardTitle className="text-3xl">{stats.blockRules}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t("stats.resources")}</CardDescription><CardTitle className="text-3xl">{stats.resources}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t("stats.inactiveResources")}</CardDescription><CardTitle className="text-3xl">{stats.inactiveResources}</CardTitle></CardHeader></Card>
      </div>

      <FilterForm locale={locale} search={search} />

      <div className="flex gap-2">
        <Button type="button" variant={tab === "rules" ? "default" : "outline"} onClick={() => setTab("rules")}>{t("tabs.rules")}</Button>
        <Button type="button" variant={tab === "resources" ? "default" : "outline"} onClick={() => setTab("resources")}>{t("tabs.resources")}</Button>
      </div>

      {tab === "rules" ? (
        <div className="space-y-3">
          {visibleRules.length === 0 ? <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">{t("empty.noRules")}</div> : null}
          {visibleRules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={rule.isAvailable ? "default" : "destructive"}>{rule.isAvailable ? t("ruleTypes.available") : t("ruleTypes.blocked")}</Badge>
                    <Badge variant={(rule.isActive ?? true) ? "secondary" : "outline"}>{(rule.isActive ?? true) ? t("status.active") : t("status.disabled")}</Badge>
                    <span className="text-xs text-muted-foreground">{rule.targetType}</span>
                  </div>
                  <h3 className="truncate font-semibold">{rule.targetLabel || rule.targetId}</h3>
                  <p className="text-sm text-muted-foreground">{ruleWindow(rule, t)}</p>
                  <p className="text-xs text-muted-foreground">{t("labels.capacity")}: {rule.capacity ?? t("placeholders.auto")} · {t("labels.priority")}: {rule.priority ?? 100}</p>
                </div>
                <RuleActions rule={rule} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleResources.length === 0 ? <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">{t("empty.noResourcesAdmin")}</div> : null}
          {visibleResources.map((resource) => (
            <div key={resource.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{resource.resourceType}</Badge>
                    <Badge variant={resource.isActive ? "default" : "outline"}>{resource.isActive ? t("status.active") : t("status.disabled")}</Badge>
                  </div>
                  <h3 className="truncate font-semibold"><LocalizedDisplay content={localizedContent(resource.nameTranslations)} className="inline" />{(!resource.nameTranslations || Object.keys(resource.nameTranslations).length === 0) ? (resource.code || resource.id) : null}</h3>
                  <p className="text-sm text-muted-foreground">{resource.serviceProviderLabel}{resource.providerServiceLabel ? ` · ${resource.providerServiceLabel}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{t("labels.capacity")}: {resource.totalCapacity} · {t("labels.rules")}: {resource.rulesCount ?? 0}</p>
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
