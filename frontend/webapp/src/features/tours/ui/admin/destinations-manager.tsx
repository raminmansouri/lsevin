"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { formatInstant, instantToLocalIso, type CalendarId } from "../../domain/calendar";
import { deleteDestinationAction, upsertDestinationAction } from "../../server/admin/actions";

import { CalendarDateField, CalendarSelect, Field, Section, StatusBadge, TranslationsInput, useAdminAction } from "./primitives";

type Dest = {
  id: string; slug: string; name_translations: Record<string, string>; description_translations: Record<string, string>; region_translations: Record<string, string>;
  country_code: string | null; latitude: number | null; longitude: number | null; timezone: string | null; cover_url: string | null;
  cover_alt_translations: Record<string, string>; is_published: boolean; is_featured: boolean; sort_order: number;
  publish_from: string | null; publish_until: string | null; tours: number; published_tours: number;
};

type Draft = {
  id?: string; slug: string; names: Record<string, string>; regions: Record<string, string>; descriptions: Record<string, string>;
  countryCode: string; latitude: string; longitude: string; timezone: string; coverUrl: string; coverAlts: Record<string, string>;
  isPublished: boolean; isFeatured: boolean; sortOrder: string; publishFrom: string; publishUntil: string;
};
const EMPTY: Draft = { slug: "", names: {}, regions: {}, descriptions: {}, countryCode: "IR", latitude: "", longitude: "", timezone: "Asia/Tehran", coverUrl: "", coverAlts: {}, isPublished: false, isFeatured: false, sortOrder: "0", publishFrom: "", publishUntil: "" };

/** Destinations (M-003): names/regions/descriptions per locale, coordinates, timezone, cover + alt text, publish window, featured, order. */
export function DestinationsManager({ rows, locales }: { rows: Dest[]; locales: string[] }) {
  const t = useTranslations("TourAdmin.destinations");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const [calendar, setCalendar] = useState<CalendarId>(locale === "fa" ? "persian" : "gregory");
  const [d, setD] = useState<Draft>(EMPTY);
  const name = (x: Dest) => x.name_translations[locale] ?? Object.entries(x.name_translations).find(([k]) => k.startsWith(locale))?.[1] ?? x.name_translations["en-US"] ?? x.slug;
  const when = (iso: string | null, tz: string | null) => (iso ? formatInstant(iso, { locale, calendar, timeZone: tz ?? "Asia/Tehran" }) : "—");
  return (
    <div className="space-y-4">
      <Section id="destinations" title={t("list")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="destinations-table">
            <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("name")}</th><th className="p-1.5 text-start">{t("state")}</th><th className="p-1.5 text-start">{t("window")}</th><th className="p-1.5 text-start">{t("tours")}</th><th className="p-1.5 text-start">{t("order")}</th><th /></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id} className="border-t" data-slug={x.slug}>
                  <td className="p-1.5">{name(x)}<div className="text-muted-foreground font-mono text-xs" dir="ltr">{x.slug} · {x.country_code}</div></td>
                  <td className="p-1.5 space-x-1">
                    <StatusBadge status={x.is_published ? "published" : "draft"} label={x.is_published ? t("published") : t("hidden")} />
                    {x.is_featured ? <StatusBadge status="approved" label={t("featured")} /> : null}
                  </td>
                  <td className="p-1.5 text-xs">{when(x.publish_from, x.timezone)} → {when(x.publish_until, x.timezone)}</td>
                  <td className="p-1.5 tabular-nums">{x.published_tours}/{x.tours}</td>
                  <td className="p-1.5 tabular-nums">{x.sort_order}</td>
                  <td className="p-1.5 text-end">
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setCalendar("gregory"); setD({
                      id: x.id, slug: x.slug, names: x.name_translations, regions: x.region_translations, descriptions: x.description_translations,
                      countryCode: x.country_code ?? "", latitude: x.latitude == null ? "" : String(x.latitude), longitude: x.longitude == null ? "" : String(x.longitude),
                      timezone: x.timezone ?? "Asia/Tehran", coverUrl: x.cover_url ?? "", coverAlts: x.cover_alt_translations, isPublished: x.is_published,
                      isFeatured: x.is_featured, sortOrder: String(x.sort_order),
                      // The saved window is shown as Gregorian ISO days so re-saving never moves it.
                      publishFrom: x.publish_from ? instantToLocalIso(new Date(x.publish_from), x.timezone ?? "Asia/Tehran") : "",
                      publishUntil: x.publish_until ? instantToLocalIso(new Date(x.publish_until), x.timezone ?? "Asia/Tehran") : "",
                    }); }}>{t("edit")}</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={pending || x.tours > 0} onClick={() => { if (window.confirm(t("deleteConfirm"))) run(() => deleteDestinationAction(x.id)); }}>{t("delete")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section id="destination-form" title={d.id ? t("editTitle", { slug: d.slug }) : t("newTitle")}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          run(() => upsertDestinationAction({
            id: d.id ?? null, slug: d.slug, names: d.names, regions: d.regions, descriptions: d.descriptions, countryCode: d.countryCode || null,
            latitude: d.latitude, longitude: d.longitude, timezone: d.timezone, coverUrl: d.coverUrl || null, coverAlts: d.coverAlts,
            isPublished: d.isPublished, isFeatured: d.isFeatured, sortOrder: Number(d.sortOrder || 0),
            publishFrom: d.publishFrom || null, publishUntil: d.publishUntil || null, calendar,
          }), { onSuccess: () => setD(EMPTY) });
        }}>
          <Field label={t("slug")} htmlFor="dst-slug"><Input id="dst-slug" dir="ltr" required value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} /></Field>
          <Field label={t("country")} htmlFor="dst-country"><Input id="dst-country" dir="ltr" maxLength={2} value={d.countryCode} onChange={(e) => setD({ ...d, countryCode: e.target.value })} /></Field>
          <Field label={t("lat")} htmlFor="dst-lat"><Input id="dst-lat" dir="ltr" value={d.latitude} onChange={(e) => setD({ ...d, latitude: e.target.value })} /></Field>
          <Field label={t("lng")} htmlFor="dst-lng"><Input id="dst-lng" dir="ltr" value={d.longitude} onChange={(e) => setD({ ...d, longitude: e.target.value })} /></Field>
          <Field label={t("timezone")} htmlFor="dst-tz"><Input id="dst-tz" dir="ltr" value={d.timezone} onChange={(e) => setD({ ...d, timezone: e.target.value })} /></Field>
          <Field label={t("cover")} htmlFor="dst-cover" className="md:col-span-2"><Input id="dst-cover" dir="ltr" value={d.coverUrl} onChange={(e) => setD({ ...d, coverUrl: e.target.value })} /></Field>
          <Field label={t("order")} htmlFor="dst-order"><Input id="dst-order" dir="ltr" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} /></Field>
          <div className="md:col-span-4"><TranslationsInput idPrefix="dst-name" label={t("name")} locales={locales} value={d.names} onChange={(names) => setD({ ...d, names })} /></div>
          <div className="md:col-span-4"><TranslationsInput idPrefix="dst-region" label={t("region")} locales={locales} value={d.regions} onChange={(regions) => setD({ ...d, regions })} /></div>
          <div className="md:col-span-4"><TranslationsInput idPrefix="dst-desc" label={t("descriptionField")} locales={locales} value={d.descriptions} onChange={(descriptions) => setD({ ...d, descriptions })} multiline /></div>
          <div className="md:col-span-4"><TranslationsInput idPrefix="dst-alt" label={t("coverAlt")} locales={locales} value={d.coverAlts} onChange={(coverAlts) => setD({ ...d, coverAlts })} /></div>
          <CalendarSelect id="dst-cal" value={calendar} onChange={setCalendar} />
          <CalendarDateField id="dst-from" label={t("publishFrom")} value={d.publishFrom} onChange={(v) => setD({ ...d, publishFrom: v })} calendar={calendar} />
          <CalendarDateField id="dst-until" label={t("publishUntil")} value={d.publishUntil} onChange={(v) => setD({ ...d, publishUntil: v })} calendar={calendar} />
          <div className="flex flex-col justify-end gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.isPublished} onChange={(e) => setD({ ...d, isPublished: e.target.checked })} /> {t("published")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.isFeatured} onChange={(e) => setD({ ...d, isFeatured: e.target.checked })} /> {t("featured")}</label>
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={pending}>{t("save")}</Button>
            {d.id ? <Button type="button" variant="ghost" onClick={() => setD(EMPTY)}>{t("cancel")}</Button> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}
