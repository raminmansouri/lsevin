"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { deleteTermAction, upsertTermAction } from "../../server/admin/actions";

import { pickLabel } from "./inputs";
import { EmptyState, Field, NativeSelect, Section, StatusBadge, TranslationsInput, useAdminAction } from "./primitives";

const KINDS = ["category", "tag", "transport_mode", "difficulty", "amenity", "inclusion", "badge", "suitability", "age_rule"] as const;

type Term = { id: string; kind: string; code: string; label_translations: Record<string, string>; icon: string | null; sort_order: number; is_active: boolean; usage: number };
type Draft = { id?: string; kind: string; code: string; labels: Record<string, string>; icon: string; sortOrder: string; isActive: boolean };

const EMPTY: Draft = { kind: "category", code: "", labels: {}, icon: "", sortOrder: "0", isActive: true };

/**
 * Taxonomy CRUD (M-002): the fixed lists tours are described with (categories, tags,
 * transport modes, …). Codes are stable identifiers, labels are per language.
 */
export function TaxonomyManager({ terms, locales }: { terms: Term[]; locales: string[] }) {
  const t = useTranslations("TourAdmin.taxonomy");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const [kind, setKind] = useState<string>("category");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const shown = terms.filter((x) => x.kind === kind);
  const label = (x: Term) => pickLabel(x.label_translations, locale, x.code);
  const selectKind = (k: string) => {
    setKind(k);
    // A new term is created in the list being looked at; an edit in progress keeps its own kind.
    setDraft((prev) => (prev.id ? prev : { ...prev, kind: k }));
  };
  const setActive = (x: Term, isActive: boolean) => run(() => upsertTermAction({
    id: x.id, kind: x.kind, code: x.code, labels: x.label_translations, icon: x.icon, sortOrder: x.sort_order, isActive,
  }));
  return (
    <div className="space-y-4">
      <div className="bg-muted/40 space-y-2 rounded-lg border p-4 text-sm" data-testid="taxonomy-intro">
        <p>{t("intro")}</p>
        <ul className="text-muted-foreground grid gap-1 md:grid-cols-2">
          {KINDS.map((k) => <li key={k}><span className="text-foreground font-medium">{t(`kind.${k}`)}</span>: {t(`kindHelp.${k}`)}</li>)}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label={t("kinds")}>
        {KINDS.map((k) => (
          <Button key={k} type="button" role="tab" aria-selected={kind === k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => selectKind(k)} data-kind={k}>
            {t(`kind.${k}`)} ({terms.filter((x) => x.kind === k).length})
          </Button>
        ))}
      </div>
      <Section id="terms" title={t(`kind.${kind}`)} description={t(`kindHelp.${kind}`)}>
        {shown.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="terms-table">
              <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("label")}</th><th className="p-1.5 text-start">{t("code")}</th><th className="p-1.5 text-start">{t("translations")}</th><th className="p-1.5 text-start">{t("order")}</th><th className="p-1.5 text-start">{t("usage")}</th><th className="p-1.5" /></tr></thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.id} className="border-t" data-code={x.code} data-active={x.is_active}>
                    <td className="p-1.5">{label(x)} {!x.is_active ? <StatusBadge status="paused" label={t("inactive")} /> : null}</td>
                    <td className="p-1.5 font-mono text-xs" dir="ltr">{x.code}</td>
                    <td className="p-1.5 text-xs">{locales.filter((l) => x.label_translations[l]).length}/{locales.length}</td>
                    <td className="p-1.5 tabular-nums">{x.sort_order}</td>
                    <td className="p-1.5 tabular-nums">{x.usage}</td>
                    <td className="p-1.5 text-end whitespace-nowrap">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ id: x.id, kind: x.kind, code: x.code, labels: x.label_translations, icon: x.icon ?? "", sortOrder: String(x.sort_order), isActive: x.is_active })}>{t("edit")}</Button>
                      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setActive(x, !x.is_active)}>{x.is_active ? t("deactivate") : t("activate")}</Button>
                      <Button type="button" size="sm" variant="ghost" disabled={pending || x.usage > 0} title={x.usage > 0 ? t("inUse") : undefined}
                        onClick={() => { if (window.confirm(t("deleteConfirm"))) run(() => deleteTermAction(x.id)); }}>{t("delete")}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section id="term-form" title={draft.id ? t("editTitle", { code: draft.code }) : t("newTitle")}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          run(() => upsertTermAction({ id: draft.id ?? null, kind: draft.kind, code: draft.code, labels: draft.labels, icon: draft.icon || null, sortOrder: Number(draft.sortOrder || 0), isActive: draft.isActive }),
            { onSuccess: () => setDraft({ ...EMPTY, kind }) });
        }}>
          <Field label={t("kindLabel")} htmlFor="term-kind">
            <NativeSelect id="term-kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k} value={k}>{t(`kind.${k}`)}</option>)}
            </NativeSelect>
          </Field>
          <Field label={t("code")} htmlFor="term-code" hint={t("codeHint")}><Input id="term-code" dir="ltr" required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></Field>
          <Field label={t("icon")} htmlFor="term-icon"><Input id="term-icon" dir="ltr" value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} /></Field>
          <Field label={t("order")} htmlFor="term-order"><Input id="term-order" dir="ltr" inputMode="numeric" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></Field>
          <div className="md:col-span-4"><TranslationsInput idPrefix="term-label" label={t("label")} locales={locales} value={draft.labels} onChange={(labels) => setDraft({ ...draft, labels })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> {t("active")}</label>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{t("save")}</Button>
            {draft.id ? <Button type="button" variant="ghost" onClick={() => setDraft({ ...EMPTY, kind })}>{t("cancel")}</Button> : null}
          </div>
        </form>
      </Section>
    </div>
  );
}
