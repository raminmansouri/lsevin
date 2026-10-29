"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { instantToLocalIso } from "../../domain/calendar";
import { deleteModuleAction, upsertModuleAction } from "../../server/admin/actions";

import { MediaUrlInput, OptionMultiSelect, OptionSelect, pickLabel, useAdminDates, type Option } from "./inputs";
import { CalendarDateField, Field, NativeSelect, Section, StatusBadge, TranslationsInput, useAdminAction } from "./primitives";

type Module = {
  id: string; kind: string; code: string; title_translations: Record<string, string>; subtitle_translations: Record<string, string>;
  cta_translations: Record<string, string>; image_url: string | null; rules: Record<string, unknown>; tour_ids: string[]; destination_ids: string[];
  is_sponsored: boolean; experiment: { key: string; variants: string[] } | null; sort_order: number; status: string;
  publish_from: string | null; publish_until: string | null;
};
/** Something the admin can pick: its id, its name per language and a fallback (slug/code). */
type Pickable = { id: string; labels: Record<string, string>; fallback: string; status?: string };

type Draft = {
  id?: string; kind: string; code: string; titles: Record<string, string>; subtitles: Record<string, string>; ctas: Record<string, string>;
  imageUrl: string; category: string; sort: string; maxItems: string; family: boolean; accessible: boolean; tourIds: string[]; destinationIds: string[];
  isSponsored: boolean; expKey: string; expVariants: string; sortOrder: string; status: "draft" | "published"; publishFrom: string; publishUntil: string;
};
const EMPTY: Draft = { kind: "collection", code: "", titles: {}, subtitles: {}, ctas: {}, imageUrl: "", category: "", sort: "", maxItems: "10", family: false, accessible: false, tourIds: [], destinationIds: [], isSponsored: false, expKey: "", expVariants: "", sortOrder: "0", status: "draft", publishFrom: "", publishUntil: "" };
const KINDS = ["hero", "onboarding", "collection", "offers", "popular_destinations"] as const;
const SORTS = ["popularity", "rating", "price_asc", "start_date"] as const;

/** Landing hero, onboarding, collections, offers and popular destinations (M-004, M-009, M-012). */
export function EditorialManager({ modules, tours, destinations, categories, locales }: {
  modules: Module[]; tours: Pickable[]; destinations: Pickable[]; categories: Pickable[]; locales: string[];
}) {
  const t = useTranslations("TourAdmin.editorial");
  const ts = useTranslations("TourShared.tourStatus");
  const locale = useLocale();
  const dates = useAdminDates();
  const { run, pending } = useAdminAction();
  const [d, setD] = useState<Draft>(EMPTY);
  // Landing windows are days in Tehran time.
  const tz = "Asia/Tehran";
  const day = (iso: string | null) => (iso ? dates.date(instantToLocalIso(new Date(iso), tz)) : "—");
  const tourOptions: Option[] = useMemo(() => tours.map((x) => ({ value: x.id, label: pickLabel(x.labels, locale, x.fallback), hint: x.status ? ts.has(x.status) ? ts(x.status) : x.status : undefined })), [tours, locale, ts]);
  const destinationOptions: Option[] = useMemo(() => destinations.map((x) => ({ value: x.id, label: pickLabel(x.labels, locale, x.fallback), hint: x.fallback })), [destinations, locale]);
  const categoryOptions: Option[] = useMemo(() => {
    const opts = categories.map((x) => ({ value: x.fallback, label: pickLabel(x.labels, locale, x.fallback), hint: x.fallback }));
    // A module can point at a category that was deactivated since; keep it visible.
    if (d.category && !opts.some((o) => o.value === d.category)) opts.push({ value: d.category, label: d.category, hint: d.category });
    return opts;
  }, [categories, locale, d.category]);
  const edit = (m: Module) => {
    setD({
      id: m.id, kind: m.kind, code: m.code, titles: m.title_translations, subtitles: m.subtitle_translations, ctas: m.cta_translations,
      imageUrl: m.image_url ?? "", category: String(m.rules?.category ?? ""), sort: String(m.rules?.sort ?? ""), maxItems: String(m.rules?.maxItems ?? "10"),
      family: Boolean(m.rules?.family), accessible: Boolean(m.rules?.accessible), tourIds: m.tour_ids, destinationIds: m.destination_ids,
      isSponsored: m.is_sponsored, expKey: m.experiment?.key ?? "", expVariants: m.experiment?.variants.join(", ") ?? "", sortOrder: String(m.sort_order),
      status: m.status === "published" ? "published" : "draft",
      // Kept as ISO days so re-saving never moves the window.
      publishFrom: m.publish_from ? instantToLocalIso(new Date(m.publish_from), tz) : "", publishUntil: m.publish_until ? instantToLocalIso(new Date(m.publish_until), tz) : "",
    });
  };
  return (
    <div className="space-y-4">
      <Section id="modules" title={t("list")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="modules-table">
            <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("code")}</th><th className="p-1.5 text-start">{t("kind")}</th><th className="p-1.5 text-start">{t("status")}</th><th className="p-1.5 text-start">{t("window")}</th><th className="p-1.5 text-start">{t("order")}</th><th /></tr></thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id} className="border-t" data-code={m.code}>
                  <td className="p-1.5"><span className="font-mono" dir="ltr">{m.code}</span><div className="text-xs">{pickLabel(m.title_translations, locale)}</div></td>
                  <td className="p-1.5">{t(`kinds.${m.kind}`)}{m.is_sponsored ? <> · <StatusBadge status="pending" label={t("sponsored")} /></> : null}{m.experiment ? <> · {t("experiment")}</> : null}</td>
                  <td className="p-1.5"><StatusBadge status={m.status} label={t(`state.${m.status}`)} /></td>
                  <td className="p-1.5 text-xs">{day(m.publish_from)} → {day(m.publish_until)}</td>
                  <td className="p-1.5 tabular-nums">{m.sort_order}</td>
                  <td className="p-1.5 text-end">
                    <Button type="button" size="sm" variant="ghost" onClick={() => edit(m)}>{t("edit")}</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm(t("deleteConfirm"))) run(() => deleteModuleAction(m.id)); }}>{t("delete")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section id="module-form" title={d.id ? t("editTitle", { code: d.code }) : t("newTitle")}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          const variants = d.expVariants.split(",").map((v) => v.trim()).filter(Boolean);
          run(() => upsertModuleAction({
            id: d.id ?? null, kind: d.kind, code: d.code, titles: d.titles, subtitles: d.subtitles, ctas: d.ctas, imageUrl: d.imageUrl || null,
            rules: { category: d.category, sort: d.sort, maxItems: d.category || d.sort || d.family || d.accessible ? d.maxItems : "", family: d.family, accessible: d.accessible },
            tourIds: d.tourIds, destinationIds: d.destinationIds, isSponsored: d.isSponsored,
            experiment: d.expKey ? { key: d.expKey, variants } : null, sortOrder: Number(d.sortOrder || 0), status: d.status,
            // Picked on a Jalali calendar, stored as ISO (Gregorian) days.
            publishFrom: d.publishFrom || null, publishUntil: d.publishUntil || null, calendar: "gregory", timezone: tz,
          }), { onSuccess: () => setD(EMPTY) });
        }}>
          <Field label={t("kind")} htmlFor="em-kind">
            <NativeSelect id="em-kind" value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k} value={k}>{t(`kinds.${k}`)}</option>)}
            </NativeSelect>
          </Field>
          <Field label={t("code")} htmlFor="em-code"><Input id="em-code" dir="ltr" required value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} /></Field>
          <Field label={t("image")} htmlFor="em-image" className="md:col-span-2">
            <MediaUrlInput id="em-image" value={d.imageUrl} onChange={(imageUrl) => setD({ ...d, imageUrl })} />
          </Field>
          <Field label={t("order")} htmlFor="em-order"><Input id="em-order" dir="ltr" inputMode="numeric" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} /></Field>
          <div className="md:col-span-4"><TranslationsInput idPrefix="em-title" label={t("titleField")} locales={locales} value={d.titles} onChange={(titles) => setD({ ...d, titles })} /></div>
          <div className="md:col-span-4"><TranslationsInput idPrefix="em-sub" label={t("subtitle")} locales={locales} value={d.subtitles} onChange={(subtitles) => setD({ ...d, subtitles })} /></div>
          <div className="md:col-span-4"><TranslationsInput idPrefix="em-cta" label={t("cta")} locales={locales} value={d.ctas} onChange={(ctas) => setD({ ...d, ctas })} /></div>
          <fieldset className="space-y-2 rounded-md border p-3 md:col-span-4">
            <legend className="px-1 text-sm font-medium">{t("rules")}</legend>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label={t("category")} htmlFor="em-cat">
                <OptionSelect id="em-cat" testId="em-cat" value={d.category} onChange={(category) => setD({ ...d, category })} options={categoryOptions} />
              </Field>
              <Field label={t("sort")} htmlFor="em-sort">
                <NativeSelect id="em-sort" value={d.sort} onChange={(e) => setD({ ...d, sort: e.target.value })}>
                  <option value="">—</option>{SORTS.map((s) => <option key={s} value={s}>{t(`sorts.${s}`)}</option>)}
                </NativeSelect>
              </Field>
              <Field label={t("maxItems")} htmlFor="em-max"><Input id="em-max" dir="ltr" inputMode="numeric" value={d.maxItems} onChange={(e) => setD({ ...d, maxItems: e.target.value })} /></Field>
              <div className="flex flex-col justify-end gap-1 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={d.family} onChange={(e) => setD({ ...d, family: e.target.checked })} /> {t("family")}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={d.accessible} onChange={(e) => setD({ ...d, accessible: e.target.checked })} /> {t("accessible")}</label>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">{t("rulesHint")}</p>
          </fieldset>
          <Field label={t("explicitTours")} htmlFor="em-tours" className="md:col-span-2">
            <OptionMultiSelect id="em-tours" testId="em-tours" values={d.tourIds} onChange={(tourIds) => setD({ ...d, tourIds })} options={tourOptions} />
          </Field>
          <Field label={t("explicitDestinations")} htmlFor="em-destinations" className="md:col-span-2">
            <OptionMultiSelect id="em-destinations" testId="em-destinations" values={d.destinationIds} onChange={(destinationIds) => setD({ ...d, destinationIds })} options={destinationOptions} />
          </Field>
          <CalendarDateField id="em-from" label={t("publishFrom")} value={d.publishFrom} onChange={(v) => setD({ ...d, publishFrom: v })} />
          <CalendarDateField id="em-until" label={t("publishUntil")} value={d.publishUntil} onChange={(v) => setD({ ...d, publishUntil: v })} hint={d.isSponsored ? t("sponsoredHint") : undefined} />
          <Field label={t("status")} htmlFor="em-status">
            <NativeSelect id="em-status" value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as Draft["status"] })}>
              <option value="draft">{t("state.draft")}</option><option value="published">{t("state.published")}</option>
            </NativeSelect>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.isSponsored} onChange={(e) => setD({ ...d, isSponsored: e.target.checked })} /> {t("sponsored")}</label>
          <Field label={t("expKey")} htmlFor="em-exp"><Input id="em-exp" dir="ltr" value={d.expKey} onChange={(e) => setD({ ...d, expKey: e.target.value })} /></Field>
          <Field label={t("expVariants")} htmlFor="em-var" hint={t("expHint")} className="md:col-span-2"><Input id="em-var" dir="ltr" value={d.expVariants} onChange={(e) => setD({ ...d, expVariants: e.target.value })} /></Field>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={pending}>{t("save")}</Button>
            {d.id ? <Button type="button" variant="ghost" onClick={() => setD(EMPTY)}>{t("cancel")}</Button> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}
