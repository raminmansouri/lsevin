"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";

import { isIsoDate } from "../../domain/calendar";
import { createTourAction } from "../../server/admin/actions";
import type { TourListRow } from "../../server/admin/queries";

import { currencyLabel, OptionSelect, pickLabel, TimezoneSelect, useAdminDates, useLocaleOptions, type Option } from "./inputs";
import { CalendarDateField, EmptyState, Field, NativeSelect, StatusBadge, useAdminAction, useErrorText } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Lookups = {
  providers: { id: string; name: string; names?: Record<string, string> | null }[];
  destinations: { id: string; slug: string; name: string; country_code: string | null; names?: Record<string, string> | null }[];
  categories: { code: string; label: string; label_translations: Record<string, string> }[];
  currencies?: string[];
  enabledLocales?: string[];
};

function regionName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function ToursCatalog({ filters, result, error, lookups }: {
  filters: Record<string, string>;
  result: { rows: TourListRow[]; total: number; page: number; pageSize: number; range: { from: string | null; to: string | null } } | null;
  error: { kind: string; code: string } | null;
  lookups: Lookups;
}) {
  const t = useTranslations("TourAdmin.tours");
  const ts = useTranslations("TourShared");
  const locale = useLocale();
  const dates = useAdminDates();
  const errorText = useErrorText();
  // Dates are picked on a Jalali calendar but travel as ISO (Gregorian) dates. Links made
  // before that carried calendar=persian with Jalali digits; those are not reused as ISO.
  const legacyCalendar = Boolean(filters.calendar) && filters.calendar !== "gregory";
  const [from, setFrom] = useState(!legacyCalendar && isIsoDate(filters.from ?? "") ? filters.from : "");
  const [to, setTo] = useState(!legacyCalendar && isIsoDate(filters.to ?? "") ? filters.to : "");
  const [provider, setProvider] = useState(filters.provider ?? "");
  const [destination, setDestination] = useState(filters.destination ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [country, setCountry] = useState((filters.country ?? "").toUpperCase());
  const providerOptions = useMemo<Option[]>(() => lookups.providers.map((p) => ({ value: p.id, label: pickLabel(p.names, locale, p.name) })), [lookups.providers, locale]);
  const destinationOptions = useMemo<Option[]>(() => lookups.destinations.map((d) => ({ value: d.id, label: pickLabel(d.names, locale, d.name), hint: d.country_code ? regionName(d.country_code, locale) : undefined })), [lookups.destinations, locale]);
  const categoryOptions = useMemo<Option[]>(() => lookups.categories.map((c) => ({ value: c.code, label: pickLabel(c.label_translations, locale, c.label), hint: c.code })), [lookups.categories, locale]);
  const countryOptions = useMemo<Option[]>(() => {
    const codes = new Set(lookups.destinations.map((d) => (d.country_code ?? "").toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)));
    if (/^[A-Z]{2}$/.test(country)) codes.add(country);
    return Array.from(codes).sort().map((c) => ({ value: c, label: regionName(c, locale), hint: c }));
  }, [lookups.destinations, locale, country]);
  const label = (code: string) => {
    const cat = lookups.categories.find((c) => c.code === code);
    return cat ? pickLabel(cat.label_translations, locale, cat.label) : code;
  };
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams(Object.entries({ ...filters, ...patch }).filter(([, v]) => v));
    return `${TOURS_PLATFORM_BASE}/tours?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <form method="get" className="grid gap-3 rounded-lg border p-4 md:grid-cols-3 xl:grid-cols-4" aria-label={t("filters")}>
        {filters.queue ? <input type="hidden" name="queue" value="1" /> : null}
        <Field label={t("search")} htmlFor="f-q"><Input id="f-q" name="q" defaultValue={filters.q ?? ""} /></Field>
        <Field label={t("provider")} htmlFor="f-provider">
          <OptionSelect id="f-provider" value={provider} onChange={setProvider} options={providerOptions} placeholder={t("all")} testId="f-provider" />
          <input type="hidden" name="provider" value={provider} />
        </Field>
        <Field label={t("countryLabel")} htmlFor="f-country">
          <OptionSelect id="f-country" value={country} onChange={setCountry} options={countryOptions} placeholder={t("all")} testId="f-country" />
          <input type="hidden" name="country" value={country} />
        </Field>
        <Field label={t("destination")} htmlFor="f-destination">
          <OptionSelect id="f-destination" value={destination} onChange={setDestination} options={destinationOptions} placeholder={t("all")} testId="f-destination" />
          <input type="hidden" name="destination" value={destination} />
        </Field>
        <Field label={t("category")} htmlFor="f-category">
          <OptionSelect id="f-category" value={category} onChange={setCategory} options={categoryOptions} placeholder={t("all")} testId="f-category" />
          <input type="hidden" name="category" value={category} />
        </Field>
        <Field label={t("status")} htmlFor="f-status">
          <NativeSelect id="f-status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">{t("all")}</option>
            {["draft", "submitted", "approved", "published", "paused", "rejected", "retired"].map((s) => <option key={s} value={s}>{ts(`tourStatus.${s}`)}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("verification")} htmlFor="f-verification">
          <NativeSelect id="f-verification" name="verification" defaultValue={filters.verification ?? ""}>
            <option value="">{t("all")}</option>
            <option value="verified">{t("verified")}</option>
            <option value="unverified">{t("unverified")}</option>
            <option value="attributes_unverified">{t("attributesUnverified")}</option>
          </NativeSelect>
        </Field>
        {/* The pickers are Jalali; the values they produce are ISO (Gregorian) dates. */}
        <input type="hidden" name="calendar" value="gregory" />
        <CalendarDateField id="f-from" label={t("publishedFrom")} value={from} onChange={setFrom} />
        <input type="hidden" name="from" value={from} />
        <CalendarDateField id="f-to" label={t("publishedTo")} value={to} onChange={setTo} />
        <input type="hidden" name="to" value={to} />
        <div className="flex items-end gap-2">
          <Button type="submit">{t("apply")}</Button>
          <Button type="button" variant="ghost" asChild><Link href={filters.queue ? `${TOURS_PLATFORM_BASE}/tours?queue=1` : `${TOURS_PLATFORM_BASE}/tours`}>{t("reset")}</Link></Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`${TOURS_PLATFORM_BASE}/tours?queue=1`} className="underline">{t("queueTitle")}</Link>
        <Link href={`${TOURS_PLATFORM_BASE}/tours`} className="underline">{t("allTours")}</Link>
      </div>

      {error ? <p role="alert" className="text-destructive text-sm">{errorText(error)}</p> : null}
      {result && (result.range.from || result.range.to) ? <p className="text-muted-foreground text-xs">{t("publishedRange", { from: result.range.from ? dates.date(result.range.from) : "…", to: result.range.to ? dates.date(result.range.to) : "…" })}</p> : null}

      {result && result.rows.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : null}
      {result && result.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="tours-table">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-start">{t("tour")}</th>
                <th className="p-2 text-start">{t("provider")}</th>
                <th className="p-2 text-start">{t("destination")}</th>
                <th className="p-2 text-start">{t("status")}</th>
                <th className="p-2 text-start">{t("requirements")}</th>
                <th className="p-2 text-start">{t("submitted")}</th>
                <th className="p-2 text-start">{t("published")}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.id} className="border-t align-top" data-tour-slug={r.slug}>
                  <td className="p-2">
                    <Link href={`${TOURS_PLATFORM_BASE}/tours/${r.id}`} className="font-medium hover:underline">{r.title ?? r.slug}</Link>
                    <div className="text-muted-foreground font-mono text-xs" dir="ltr">{r.slug}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.categories.map((c) => <span key={c} className="bg-muted rounded px-1.5 text-xs">{label(c)}</span>)}
                      {r.isFeatured ? <StatusBadge status="approved" label={t("featured")} /> : null}
                      {r.isSponsored ? <StatusBadge status="pending" label={t("sponsored")} /> : null}
                    </div>
                  </td>
                  <td className="p-2">{pickLabel(r.providerNames, locale, r.providerName ?? "—")}{r.providerVerified ? "" : <span className="text-amber-700"> · {t("unverified")}</span>}</td>
                  <td className="p-2">{pickLabel(r.destinationNames, locale, r.destination ?? "—")}{r.country ? ` (${regionName(r.country, locale)})` : ""}</td>
                  <td className="p-2">
                    <StatusBadge status={r.status} label={ts(`tourStatus.${r.status}`)} />
                    {r.pendingChanges ? <div className="mt-1 text-xs text-sky-700">{t("pendingChanges")}</div> : null}
                  </td>
                  <td className="p-2 tabular-nums">{r.requirementErrors === 0 ? t("ready") : t("errors", { count: r.requirementErrors })}</td>
                  <td className="p-2 text-xs">{dates.instant(r.submittedAt)}</td>
                  <td className="p-2 text-xs">{dates.instant(r.publishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {result && result.total > result.pageSize ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? <Link href={qs({ page: String(result.page - 1) })} className="underline">{t("prev")}</Link> : null}
          <span>{t("page", { page: result.page, pages: Math.ceil(result.total / result.pageSize) })}</span>
          {result.page * result.pageSize < result.total ? <Link href={qs({ page: String(result.page + 1) })} className="underline">{t("next")}</Link> : null}
        </div>
      ) : null}

      <CreateTourForm providerOptions={providerOptions} destinationOptions={destinationOptions} currencies={lookups.currencies} enabledLocales={lookups.enabledLocales} />
    </div>
  );
}

const DEFAULT_LOCALES = ["fa-IR", "en-US"];

function CreateTourForm({ providerOptions, destinationOptions, currencies, enabledLocales }: {
  providerOptions: Option[]; destinationOptions: Option[]; currencies?: string[]; enabledLocales?: string[];
}) {
  const t = useTranslations("TourAdmin.tours");
  const tCore = useTranslations("TourAdmin.core");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [v, setV] = useState({ serviceProviderId: "", slug: "", sourceLocale: "fa-IR", currency: "IRR", title: "", destinationId: "", timezone: "Asia/Tehran" });
  const localeOptions = useLocaleOptions(enabledLocales?.length ? enabledLocales : DEFAULT_LOCALES);
  // Active currencies from finance.currencies; rial/toman when the list is unavailable.
  const currencyOptions = useMemo<Option[]>(() => Array.from(new Set(currencies?.length ? currencies : ["IRR", "IRT"]))
    .map((code) => ({ value: code, label: currencyLabel(code, locale), hint: code })), [currencies, locale]);
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer font-medium">{t("createTitle")}</summary>
      <form
        className="mt-3 grid gap-3 md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!v.serviceProviderId) return;
          const created = await run(() => createTourAction({ ...v, destinationId: v.destinationId || null }), { refresh: false });
          if (created) router.push(`${TOURS_PLATFORM_BASE}/tours/${created.id}`);
        }}
      >
        <Field label={`${t("provider")} *`} htmlFor="c-provider">
          <OptionSelect id="c-provider" value={v.serviceProviderId} onChange={(serviceProviderId) => setV({ ...v, serviceProviderId })} options={providerOptions} allowEmpty={false} testId="c-provider" />
        </Field>
        <Field label={t("slug")} htmlFor="c-slug"><Input id="c-slug" required dir="ltr" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} /></Field>
        <Field label={t("titleSource")} htmlFor="c-title"><Input id="c-title" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
        <Field label={t("sourceLocale")} htmlFor="c-locale">
          <OptionSelect id="c-locale" value={v.sourceLocale} onChange={(sourceLocale) => setV({ ...v, sourceLocale })} options={localeOptions} allowEmpty={false} testId="c-locale" />
        </Field>
        <Field label={t("currency")} htmlFor="c-currency">
          <OptionSelect id="c-currency" value={v.currency} onChange={(currency) => setV({ ...v, currency })} options={currencyOptions} allowEmpty={false} testId="c-currency" />
        </Field>
        <Field label={t("destination")} htmlFor="c-destination">
          <OptionSelect id="c-destination" value={v.destinationId} onChange={(destinationId) => setV({ ...v, destinationId })} options={destinationOptions} testId="c-destination" />
        </Field>
        <Field label={tCore("timezone")} htmlFor="c-timezone">
          <TimezoneSelect id="c-timezone" value={v.timezone} onChange={(timezone) => setV({ ...v, timezone })} testId="c-timezone" />
        </Field>
        <div><Button type="submit" disabled={pending || !v.serviceProviderId}>{t("create")}</Button></div>
      </form>
    </details>
  );
}
