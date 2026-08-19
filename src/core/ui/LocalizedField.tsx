"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PORTAL_LOCALES, localeFormName, normalizePortalLocale, type PortalLocaleHeader } from "@core/i18n/config";
import { Input, Textarea } from "@core/ui/Field";
import { RichTextEditor } from "@core/ui/RichTextEditor";

const DEFAULT_LOCALIZED_FIELD_LOCALES = PORTAL_LOCALES.map((item) => item.header) as readonly PortalLocaleHeader[];

export type LocalizedValue = Record<string, string>;

export function LocalizedField({
  name,
  label,
  value = {},
  mode = "input",
  requiredLocale = "fa-IR",
  help,
  locale,
  locales = DEFAULT_LOCALIZED_FIELD_LOCALES,
}: {
  name: string;
  label: string;
  value?: LocalizedValue | null;
  mode?: "input" | "textarea" | "richtext";
  requiredLocale?: PortalLocaleHeader | null;
  help?: string;
  locale?: string;
  locales?: readonly PortalLocaleHeader[];
}) {
  const normalized = useMemo(() => Object.fromEntries(locales.map((header) => {
    const locale = normalizePortalLocale(header).locale;
    return [header, String(value?.[header] ?? value?.[locale] ?? "")];
  })), [locales, value]);
  const [values, setValues] = useState<Record<string, string>>(normalized);
  const localeKey = locales.join("|");
  const [active, setActive] = useState<PortalLocaleHeader>(() => {
    const preferred = normalizePortalLocale(locale).header;
    if (locales.includes(preferred)) return preferred;
    return (locales.includes("fa-IR") ? "fa-IR" : locales[0]) as PortalLocaleHeader;
  });
  useEffect(() => {
    const current = normalizePortalLocale(locale || document.documentElement.lang).header;
    if (localeKey.split("|").includes(current)) setActive(current);
    // Depend on the locale values, not the array identity. This prevents a
    // language-tab click from being immediately reset on the next render.
  }, [locale, localeKey]);
  const activeConfig = normalizePortalLocale(active);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-sm font-semibold text-slate-800">{label}</div>{help ? <div className="mt-1 text-xs text-muted-foreground">{help}</div> : null}</div>
        <div className="flex max-w-full gap-1 overflow-x-auto pb-1">
          {locales.map((header) => {
            const config = normalizePortalLocale(header);
            return <button key={header} type="button" onClick={() => setActive(header)} className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-bold ${active === header ? "border-primary bg-primary text-white" : "border-border bg-white text-slate-700"}`}>{config.label}{values[header]?.trim() ? <CheckCircle2 size={12} /> : null}</button>;
          })}
        </div>
      </div>

      {locales.map((header) => <input key={header} type="hidden" name={localeFormName(name, header)} value={values[header] || ""} />)}
      <div dir={activeConfig.direction}>
        {mode === "richtext" ? <RichTextEditor value={values[active]} direction={activeConfig.direction} locale={locale} onChange={(next) => setValues((current) => ({ ...current, [active]: next }))} /> : mode === "textarea" ? <Textarea value={values[active] || ""} rows={5} required={requiredLocale === active} onChange={(event) => setValues((current) => ({ ...current, [active]: event.target.value }))} /> : <Input value={values[active] || ""} required={requiredLocale === active} onChange={(event) => setValues((current) => ({ ...current, [active]: event.target.value }))} />}
      </div>
    </div>
  );
}
