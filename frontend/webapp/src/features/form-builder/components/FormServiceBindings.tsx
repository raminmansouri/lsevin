"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";

import { LazySearchableSelect } from "./LazySearchableSelect";

type UsageScope = "main_booking" | "child_addon_booking";

type Binding = {
  id: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string | null;
  usageScope: string;
  isActive: boolean;
};

/**
 * Wire a form to the services that should show it.
 *
 * The designer's own "scope" dropdown only labels the form; the booking runtime
 * looks the form up by (service definition, usage scope) in
 * form_builder.service_definition_forms. Until this panel existed there was no
 * way to write that row from the admin panel, so an add-on form could be built
 * and published and still never appear on a booking.
 */
export function FormServiceBindings({ formId, locale }: { formId: string; locale: string }) {
  const t = useTranslations("FormBuilder.bindings");
  const [items, setItems] = useState<Binding[]>([]);
  const [serviceDefinitionId, setServiceDefinitionId] = useState<string | null>(null);
  const [usageScope, setUsageScope] = useState<UsageScope>("child_addon_booking");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/form-builder/mappings?formId=${encodeURIComponent(formId)}&locale=${encodeURIComponent(locale)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(t("loadFailed"));
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [formId, locale, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function addBinding() {
    if (!serviceDefinitionId) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/form-builder/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, serviceDefinitionId, usageScope }),
      });
      if (!res.ok) throw new Error(t("saveFailed"));
      setServiceDefinitionId(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeBinding(id: string) {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/form-builder/mappings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("deleteFailed"));
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{t("title")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("description")}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">{t("service")}</label>
          <LazySearchableSelect
            resource="service_definitions"
            locale={locale}
            value={serviceDefinitionId}
            onValueChange={(next) => setServiceDefinitionId(typeof next === "string" ? next : null)}
            placeholder={t("servicePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">{t("usageScope")}</label>
          <select
            value={usageScope}
            onChange={(event) => setUsageScope(event.target.value as UsageScope)}
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75] md:w-56"
          >
            <option value="child_addon_booking">{t("scopeAddon")}</option>
            <option value="main_booking">{t("scopeMain")}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={addBinding}
          disabled={!serviceDefinitionId || isSaving}
          className="h-12 rounded-2xl bg-[#083f30] px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? t("saving") : t("add")}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{t("empty")}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {item.serviceDefinitionName || item.serviceDefinitionId}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.usageScope === "child_addon_booking" ? t("scopeAddon") : t("scopeMain")}
                  {item.isActive ? "" : ` · ${t("inactive")}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeBinding(item.id)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("remove")}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
