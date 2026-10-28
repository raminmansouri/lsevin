"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { instantToLocalIso } from "../../domain/calendar";
import { deleteDestinationAction, upsertDestinationAction } from "../../server/admin/actions";
import { COUNTRY_CODES } from "../customer/booking/draft";

import { isLexicalJson, MediaUrlInput, OptionSelect, pickLabel, TimezoneSelect, useAdminDates, type Option } from "./inputs";
import { CalendarDateField, Field, Section, StatusBadge, TranslationsInput, useAdminAction } from "./primitives";

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

/** Server cap per language for a description (catalog-admin.ts DESCRIPTION_MAX); longer text would be cut and corrupt the rich-text JSON. */
const DESCRIPTION_MAX = 40_000;

/** Visible text of a serialized Lexical node tree. */
function lexicalText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: unknown; children?: unknown[]; root?: unknown };
  if (typeof n.text === "string") return n.text;
  if (n.root) return lexicalText(n.root);
  return Array.isArray(n.children) ? n.children.map(lexicalText).join(" ") : "";
}

/** Drops languages whose rich-text editor holds no text (an opened but untouched tab). */
function dropEmptyRichText(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).filter(([, v]) => {
    if (!v?.trim()) return false;
    if (!isLexicalJson(v)) return true;
    try { return lexicalText(JSON.parse(v)).trim().length > 0; } catch { return true; }
  }));
}

/** ISO 3166-1 alpha-2 countries named in the admin's language, Iran first. */
function useCountryOptions(current: string): Option[] {
  const locale = useLocale();
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try { names = new Intl.DisplayNames([locale], { type: "region" }); } catch { names = null; }
    const name = (code: string) => { try { return names?.of(code) ?? code; } catch { return code; } };
    const codes = Array.from(new Set([...COUNTRY_CODES, ...(current && /^[A-Z]{2}$/.test(current) ? [current] : [])]));
    const collator = new Intl.Collator(locale);
    return codes
      .map((c) => ({ value: c, label: name(c), hint: c }))
      .sort((a, b) => (a.value === "IR" ? -1 : b.value === "IR" ? 1 : collator.compare(a.label, b.label)));
  }, [locale, current]);
}

/** Destinations (M-003): names/regions/descriptions per locale, coordinates, timezone, cover + alt text, publish window, featured, order. */
export function DestinationsManager({ rows, locales }: { rows: Dest[]; locales: string[] }) {
  const t = useTranslations("TourAdmin.destinations");
  const locale = useLocale();
  const dates = useAdminDates();
  const { run, pending } = useAdminAction();
  const [d, setD] = useState<Draft>(EMPTY);
  const countries = useCountryOptions(d.countryCode);
  const countryName = (code: string | null) => (code ? countries.find((c) => c.value === code)?.label ?? code : "—");
  const name = (x: Dest) => pickLabel(x.name_translations, locale, x.slug);
  // The publish window is a range of days in the destination's timezone: show those days (Jalali).
  const day = (iso: string | null, tz: string | null) => (iso ? dates.date(instantToLocalIso(new Date(iso), tz ?? "Asia/Tehran")) : "—");
  const descriptions = dropEmptyRichText(d.descriptions);
  const descriptionTooLong = Object.values(descriptions).some((v) => v.length > DESCRIPTION_MAX);
  return (
    <div className="space-y-4">
      <Section id="destinations" title={t("list")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="destinations-table">
            <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("name")}</th><th className="p-1.5 text-start">{t("state")}</th><th className="p-1.5 text-start">{t("window")}</th><th className="p-1.5 text-start">{t("tours")}</th><th className="p-1.5 text-start">{t("order")}</th><th /></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id} className="border-t" data-slug={x.slug}>
                  <td className="p-1.5">{name(x)}<div className="text-muted-foreground text-xs"><span className="font-mono" dir="ltr">{x.slug}</span> · {countryName(x.country_code)}</div></td>
                  <td className="p-1.5 space-x-1">
                    <StatusBadge status={x.is_published ? "published" : "draft"} label={x.is_published ? t("published") : t("hidden")} />
                    {x.is_featured ? <StatusBadge status="approved" label={t("featured")} /> : null}
                  </td>
                  <td className="p-1.5 text-xs">{day(x.publish_from, x.timezone)} → {day(x.publish_until, x.timezone)}</td>
                  <td className="p-1.5 tabular-nums">{x.published_tours}/{x.tours}</td>
                  <td className="p-1.5 tabular-nums">{x.sort_order}</td>
                  <td className="p-1.5 text-end">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setD({
                      id: x.id, slug: x.slug, names: x.name_translations, regions: x.region_translations, descriptions: x.description_translations,
                      countryCode: x.country_code ?? "", latitude: x.latitude == null ? "" : String(x.latitude), longitude: x.longitude == null ? "" : String(x.longitude),
                      timezone: x.timezone ?? "Asia/Tehran", coverUrl: x.cover_url ?? "", coverAlts: x.cover_alt_translations, isPublished: x.is_published,
                      isFeatured: x.is_featured, sortOrder: String(x.sort_order),
                      // The saved window is kept as ISO days in the destination's timezone so re-saving never moves it.
                      publishFrom: x.publish_from ? instantToLocalIso(new Date(x.publish_from), x.timezone ?? "Asia/Tehran") : "",
                      publishUntil: x.publish_until ? instantToLocalIso(new Date(x.publish_until), x.timezone ?? "Asia/Tehran") : "",
                    })}>{t("edit")}</Button>
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
          if (descriptionTooLong) return;
          run(() => upsertDestinationAction({
            id: d.id ?? null, slug: d.slug, names: d.names, regions: d.regions, descriptions, countryCode: d.countryCode || null,
            latitude: d.latitude, longitude: d.longitude, timezone: d.timezone, coverUrl: d.coverUrl || null, coverAlts: d.coverAlts,
            isPublished: d.isPublished, isFeatured: d.isFeatured, sortOrder: Number(d.sortOrder || 0),
            // Picked on a Jalali calendar, stored as ISO (Gregorian) days.
            publishFrom: d.publishFrom || null, publishUntil: d.publishUntil || null, calendar: "gregory",
          }), { onSuccess: () => setD(EMPTY) });
        }}>
          <Field label={t("slug")} htmlFor="dst-slug"><Input id="dst-slug" dir="ltr" required value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} /></Field>
          <Field label={t("country")} htmlFor="dst-country">
            <OptionSelect id="dst-country" testId="dst-country" value={d.countryCode} onChange={(countryCode) => setD({ ...d, countryCode })} options={countries} />
          </Field>
          <Field label={t("lat")} htmlFor="dst-lat"><Input id="dst-lat" dir="ltr" inputMode="decimal" value={d.latitude} onChange={(e) => setD({ ...d, latitude: e.target.value })} /></Field>
          <Field label={t("lng")} htmlFor="dst-lng"><Input id="dst-lng" dir="ltr" inputMode="decimal" value={d.longitude} onChange={(e) => setD({ ...d, longitude: e.target.value })} /></Field>
          <Field label={t("timezone")} htmlFor="dst-tz">
            <TimezoneSelect id="dst-tz" testId="dst-tz" value={d.timezone} onChange={(timezone) => setD({ ...d, timezone })} />
          </Field>
          <Field label={t("cover")} htmlFor="dst-cover" className="md:col-span-2">
            <MediaUrlInput id="dst-cover" value={d.coverUrl} onChange={(coverUrl) => setD({ ...d, coverUrl })} />
          </Field>
          <Field label={t("order")} htmlFor="dst-order"><Input id="dst-order" dir="ltr" inputMode="numeric" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} /></Field>
          <div className="md:col-span-4"><TranslationsInput idPrefix="dst-name" label={t("name")} locales={locales} value={d.names} onChange={(names) => setD({ ...d, names })} /></div>
          <div className="md:col-span-4"><TranslationsInput idPrefix="dst-region" label={t("region")} locales={locales} value={d.regions} onChange={(regions) => setD({ ...d, regions })} /></div>
          <div className="md:col-span-4" data-testid="dst-description">
            <TranslationsInput idPrefix="dst-desc" label={t("descriptionField")} locales={locales} value={d.descriptions} onChange={(next) => setD({ ...d, descriptions: next })} richText />
            {descriptionTooLong ? <p className="text-destructive mt-1 text-sm" role="alert">{t("descriptionTooLong")}</p> : null}
          </div>
          <div className="md:col-span-4" data-testid="dst-cover-alt"><TranslationsInput idPrefix="dst-alt" label={t("coverAlt")} locales={locales} value={d.coverAlts} onChange={(coverAlts) => setD({ ...d, coverAlts })} /></div>
          <CalendarDateField id="dst-from" label={t("publishFrom")} value={d.publishFrom} onChange={(v) => setD({ ...d, publishFrom: v })} />
          <CalendarDateField id="dst-until" label={t("publishUntil")} value={d.publishUntil} onChange={(v) => setD({ ...d, publishUntil: v })} />
          <div className="flex flex-col justify-end gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.isPublished} onChange={(e) => setD({ ...d, isPublished: e.target.checked })} /> {t("published")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.isFeatured} onChange={(e) => setD({ ...d, isFeatured: e.target.checked })} /> {t("featured")}</label>
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={pending || descriptionTooLong}>{t("save")}</Button>
            {d.id ? <Button type="button" variant="ghost" onClick={() => setD(EMPTY)}>{t("cancel")}</Button> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}
