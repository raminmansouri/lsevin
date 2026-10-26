"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";

import { CALENDAR_IDS, formatInstant, type CalendarId } from "../../domain/calendar";
import { createTourAction } from "../../server/admin/actions";
import type { TourListRow } from "../../server/admin/queries";

import { CalendarDateField, EmptyState, Field, NativeSelect, StatusBadge, useAdminAction, useErrorText } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Lookups = {
  providers: { id: string; name: string }[];
  destinations: { id: string; slug: string; name: string; country_code: string | null }[];
  categories: { code: string; label: string; label_translations: Record<string, string> }[];
};

export function ToursCatalog({ filters, result, error, lookups }: {
  filters: Record<string, string>;
  result: { rows: TourListRow[]; total: number; page: number; pageSize: number; range: { from: string | null; to: string | null } } | null;
  error: { kind: string; code: string } | null;
  lookups: Lookups;
}) {
  const t = useTranslations("TourAdmin.tours");
  const ts = useTranslations("TourShared");
  const tc = useTranslations("TourShared.calendar");
  const locale = useLocale();
  const errorText = useErrorText();
  const [calendar, setCalendar] = useState<CalendarId>((CALENDAR_IDS as readonly string[]).includes(filters.calendar) ? (filters.calendar as CalendarId) : locale === "fa" ? "persian" : "gregory");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const label = (code: string) => lookups.categories.find((c) => c.code === code)?.label ?? code;
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
          <NativeSelect id="f-provider" name="provider" defaultValue={filters.provider ?? ""}>
            <option value="">{t("all")}</option>
            {lookups.providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("country")} htmlFor="f-country"><Input id="f-country" name="country" maxLength={2} defaultValue={filters.country ?? ""} dir="ltr" /></Field>
        <Field label={t("destination")} htmlFor="f-destination">
          <NativeSelect id="f-destination" name="destination" defaultValue={filters.destination ?? ""}>
            <option value="">{t("all")}</option>
            {lookups.destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("category")} htmlFor="f-category">
          <NativeSelect id="f-category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">{t("all")}</option>
            {lookups.categories.map((c) => <option key={c.code} value={c.code}>{c.label_translations?.[locale] ?? c.label}</option>)}
          </NativeSelect>
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
        <Field label={tc("label")} htmlFor="f-calendar">
          <NativeSelect id="f-calendar" name="calendar" value={calendar} onChange={(e) => setCalendar(e.target.value as CalendarId)}>
            {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
          </NativeSelect>
        </Field>
        <CalendarDateField id="f-from" label={t("publishedFrom")} value={from} onChange={setFrom} calendar={calendar} />
        <input type="hidden" name="from" value={from} />
        <CalendarDateField id="f-to" label={t("publishedTo")} value={to} onChange={setTo} calendar={calendar} />
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
      {result && result.range.from ? <p className="text-muted-foreground text-xs">{t("canonicalRange", { from: result.range.from, to: result.range.to ?? "…" })}</p> : null}

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
                  <td className="p-2">{r.providerName}{r.providerVerified ? "" : <span className="text-amber-700"> · {t("unverified")}</span>}</td>
                  <td className="p-2">{r.destination ?? "—"}{r.country ? ` (${r.country})` : ""}</td>
                  <td className="p-2">
                    <StatusBadge status={r.status} label={ts(`tourStatus.${r.status}`)} />
                    {r.pendingChanges ? <div className="mt-1 text-xs text-sky-700">{t("pendingChanges")}</div> : null}
                  </td>
                  <td className="p-2 tabular-nums">{r.requirementErrors === 0 ? t("ready") : t("errors", { count: r.requirementErrors })}</td>
                  <td className="p-2 text-xs">{r.submittedAt ? formatInstant(r.submittedAt, { locale, calendar, timeZone: "Asia/Tehran" }) : "—"}</td>
                  <td className="p-2 text-xs">{r.publishedAt ? formatInstant(r.publishedAt, { locale, calendar, timeZone: "Asia/Tehran" }) : "—"}</td>
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

      <CreateTourForm providers={lookups.providers} destinations={lookups.destinations} />
    </div>
  );
}

function CreateTourForm({ providers, destinations }: { providers: Lookups["providers"]; destinations: Lookups["destinations"] }) {
  const t = useTranslations("TourAdmin.tours");
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [v, setV] = useState({ serviceProviderId: "", slug: "", sourceLocale: "fa-IR", currency: "IRR", title: "", destinationId: "", timezone: "Asia/Tehran" });
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer font-medium">{t("createTitle")}</summary>
      <form
        className="mt-3 grid gap-3 md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const created = await run(() => createTourAction({ ...v, destinationId: v.destinationId || null }), { refresh: false });
          if (created) router.push(`${TOURS_PLATFORM_BASE}/tours/${created.id}`);
        }}
      >
        <Field label={t("provider")} htmlFor="c-provider">
          <NativeSelect id="c-provider" required value={v.serviceProviderId} onChange={(e) => setV({ ...v, serviceProviderId: e.target.value })}>
            <option value="" />
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("slug")} htmlFor="c-slug"><Input id="c-slug" required dir="ltr" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} /></Field>
        <Field label={t("titleSource")} htmlFor="c-title"><Input id="c-title" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
        <Field label={t("sourceLocale")} htmlFor="c-locale"><Input id="c-locale" required dir="ltr" value={v.sourceLocale} onChange={(e) => setV({ ...v, sourceLocale: e.target.value })} /></Field>
        <Field label={t("currency")} htmlFor="c-currency"><Input id="c-currency" required dir="ltr" value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value.toUpperCase() })} /></Field>
        <Field label={t("destination")} htmlFor="c-destination">
          <NativeSelect id="c-destination" value={v.destinationId} onChange={(e) => setV({ ...v, destinationId: e.target.value })}>
            <option value="" />
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </NativeSelect>
        </Field>
        <div><Button type="submit" disabled={pending}>{t("create")}</Button></div>
      </form>
    </details>
  );
}
