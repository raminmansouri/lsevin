#!/usr/bin/env python3
"""Adds a 'several services' mode to the admin availability rule add form.
When target type is provider_service and the rule is new, the admin can tick
several services of the selected provider; on save one rule per service is created.
Usage: python3 apply-availability-multi-service.py <path to availability-rule-form.tsx>
"""
import sys

path = sys.argv[1]
src = open(path, encoding="utf-8").read()

def rep(old, new):
    global src
    if src.count(old) != 1:
        sys.exit(f"anchor not found exactly once: {old[:80]!r} (count={src.count(old)})")
    src = src.replace(old, new)

if "multiServiceMode" in src:
    sys.exit("already applied")

rep('import { useMemo, useState, useTransition } from "react";',
    'import { useEffect, useMemo, useState, useTransition } from "react";')

# --- state + loader ---------------------------------------------------------
rep('''  const { execute } = useAction(saveGenericAvailabilityRuleAction, {''',
'''  // Multi-service mode: only for new rules whose target is a provider service.
  const multiServiceAllowed = !rule?.id && form.targetType === "provider_service";
  const [multiServiceMode, setMultiServiceMode] = useState(false);
  const multiServiceActive = multiServiceAllowed && multiServiceMode;
  const [serviceOptions, setServiceOptions] = useState<LookupOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    setSelectedServiceIds([]);
    setServiceOptions([]);
    if (!multiServiceActive || !form.serviceProviderId) return;
    let cancelled = false;
    (async () => {
      setServicesLoading(true);
      try {
        const all: LookupOption[] = [];
        for (let page = 1; page <= 40; page++) {
          const url = new URL("/api/admin/availability/lookups", window.location.origin);
          url.searchParams.set("lookupType", "targets");
          url.searchParams.set("targetType", "provider_service");
          url.searchParams.set("serviceProviderId", form.serviceProviderId as string);
          url.searchParams.set("locale", locale);
          url.searchParams.set("page", String(page));
          url.searchParams.set("pageSize", "50");
          const response = await fetch(url.toString(), { cache: "no-store" });
          if (!response.ok) throw new Error("Failed to load services");
          const json = await response.json();
          all.push(...((json.items ?? []) as LookupOption[]));
          if (!json.hasMore) break;
        }
        if (!cancelled) setServiceOptions(all);
      } catch {
        if (!cancelled) toast.error(isPersian ? "بارگذاری خدمت‌های مرکز ناموفق بود." : "Could not load provider services.");
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [multiServiceActive, form.serviceProviderId, locale, isPersian]);

  const visibleServiceOptions = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return serviceOptions;
    return serviceOptions.filter((item) => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(q));
  }, [serviceOptions, serviceSearch]);

  function toggleService(id: string) {
    setSelectedServiceIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function saveForManyServices(base: GenericAvailabilityRule) {
    if (!selectedServiceIds.length) {
      toast.error(isPersian ? "حداقل یک خدمت را انتخاب کنید." : "Select at least one service.");
      return;
    }
    startTransition(async () => {
      const failed: string[] = [];
      let created = 0;
      for (const serviceId of selectedServiceIds) {
        const option = serviceOptions.find((item) => item.value === serviceId);
        try {
          const result = await saveGenericAvailabilityRuleAction({
            ...base,
            id: undefined,
            targetId: serviceId,
            targetLabel: option?.label ?? null,
            targetDescription: option?.description ?? null,
            providerServiceId: option?.providerServiceId || serviceId,
            providerServiceLabel: option?.label ?? null,
            providerServiceDescription: option?.description ?? null,
          } as any);
          if (!result || result.error || result.fieldErrors) failed.push(serviceId);
          else created++;
        } catch {
          failed.push(serviceId);
        }
      }
      if (!failed.length) {
        toast.success(isPersian ? `${created} قانون ساخته شد.` : `${created} rules created.`);
        router.push("/admin/availability");
        router.refresh();
        return;
      }
      const failedNames = failed.map((id) => serviceOptions.find((item) => item.value === id)?.label || id).join("، ");
      toast.error(
        isPersian
          ? `${created} قانون ساخته شد، ولی برای این خدمت‌ها ذخیره ناموفق بود: ${failedNames}`
          : `${created} rules created; failed for: ${failedNames}`
      );
      // Keep only the failed ones selected so the admin can retry.
      setSelectedServiceIds(failed);
    });
  }

  const { execute } = useAction(saveGenericAvailabilityRuleAction, {''')

# --- submit -----------------------------------------------------------------
rep('''            const dayOfWeeks = form.specificDate ? [] : selectedWeekdays;
            execute({ ...form, id: form.id || undefined, dayOfWeeks, dayOfWeek: dayOfWeeks[0] || null } as any);''',
'''            const dayOfWeeks = form.specificDate ? [] : selectedWeekdays;
            if (multiServiceActive) {
              saveForManyServices({ ...form, dayOfWeeks, dayOfWeek: dayOfWeeks[0] || null });
              return;
            }
            execute({ ...form, id: form.id || undefined, dayOfWeeks, dayOfWeek: dayOfWeeks[0] || null } as any);''')

# --- target field: single select OR checklist --------------------------------
rep('''            <LazyAvailabilityLookupSelect
              label={tr("fields.target")}
              value={form.targetId || null}''',
'''            {multiServiceAllowed ? (
              <div className="md:col-span-2">
                <div className="text-sm font-medium">{isPersian ? "تعداد خدمت‌های این قانون" : "Services for this rule"}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setMultiServiceMode(false)}
                    className={`h-10 rounded-xl border text-sm ${!multiServiceMode ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-background"}`}
                  >
                    {isPersian ? "فقط یک خدمت" : "One service"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setMultiServiceMode(true)}
                    className={`h-10 rounded-xl border text-sm ${multiServiceMode ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-background"}`}
                  >
                    {isPersian ? "چند خدمت" : "Several services"}
                  </button>
                </div>
              </div>
            ) : null}

            {multiServiceActive ? (
              <div className="md:col-span-2">
                <div className="text-sm font-medium">{isPersian ? "خدمت‌های مرکز" : "Provider services"}</div>
                {!form.serviceProviderId ? (
                  <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">{tr("placeholders.selectProviderFirst")}</div>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-xl border-2 border-primary/60">
                    <div className="flex flex-wrap items-center gap-3 border-b p-3">
                      <input
                        value={serviceSearch}
                        onChange={(event) => setServiceSearch(event.target.value)}
                        placeholder={tr("placeholders.searchServices")}
                        className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        disabled={isPending || !visibleServiceOptions.length}
                        onClick={() => setSelectedServiceIds((current) => Array.from(new Set([...current, ...visibleServiceOptions.map((item) => item.value)])))}
                        className="text-sm font-medium text-primary"
                      >
                        {isPersian ? `انتخاب همه (${visibleServiceOptions.length})` : `Select all (${visibleServiceOptions.length})`}
                      </button>
                      <button type="button" disabled={isPending} onClick={() => setSelectedServiceIds([])} className="text-sm text-muted-foreground">
                        {isPersian ? "پاک کردن" : "Clear"}
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {servicesLoading ? (
                        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isPersian ? "در حال بارگذاری…" : "Loading…"}
                        </div>
                      ) : visibleServiceOptions.length ? (
                        visibleServiceOptions.map((item) => (
                          <label key={item.value} className="flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 text-sm last:border-b-0 hover:bg-muted/40">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              disabled={isPending}
                              checked={selectedServiceIds.includes(item.value)}
                              onChange={() => toggleService(item.value)}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.description ? <span className="max-w-[45%] truncate text-xs text-muted-foreground">{item.description}</span> : null}
                          </label>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">{tr("empty.noServices")}</div>
                      )}
                    </div>
                  </div>
                )}
                <div className={readableHelpClass}>
                  {isPersian
                    ? `${selectedServiceIds.length} خدمت انتخاب شد. با ذخیره، برای هر خدمت یک قانون جدا با همین تنظیمات ساخته می‌شود.`
                    : `${selectedServiceIds.length} selected. Saving creates one separate rule per service with these settings.`}
                </div>
              </div>
            ) : (
            <LazyAvailabilityLookupSelect
              label={tr("fields.target")}
              value={form.targetId || null}''')

rep('''              disabled={isPending || targetDisabled}
              onChange={applyTarget}
            />
''',
'''              disabled={isPending || targetDisabled}
              onChange={applyTarget}
            />
            )}
''')

# hide the single "provider service" context picker in multi mode
rep('''            <div>
              <LazyAvailabilityLookupSelect
                label={tr("fields.providerService")}''',
'''            <div className={multiServiceActive ? "hidden" : undefined}>
              <LazyAvailabilityLookupSelect
                label={tr("fields.providerService")}''')

# --- submit button label ----------------------------------------------------
rep('''              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {tr("actions.saveRule")}''',
'''              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {multiServiceActive
                ? isPersian
                  ? `ذخیره قانون برای ${selectedServiceIds.length} خدمت`
                  : `Save rule for ${selectedServiceIds.length} services`
                : tr("actions.saveRule")}''')

open(path, "w", encoding="utf-8").write(src)
print("patched", path)
