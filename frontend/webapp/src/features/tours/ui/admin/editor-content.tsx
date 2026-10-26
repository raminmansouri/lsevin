"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

import { formatInstant } from "../../domain/calendar";
import { directionOf, REQUIRED_TOUR_FIELDS, TOUR_TEXT_FIELDS } from "../../domain/content";
import { approveContentAction, saveContentAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { LangText, Section, StatusBadge, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Row = TourBundle["content"][number];

/**
 * Side-by-side source / translation editor (M-028..M-032): independent
 * field-level statuses, outdated flags, the live (approved) value next to the
 * draft, last editor, coverage counts and glossary hints.
 */
export function ContentTab({ bundle, targetLocale }: { bundle: TourBundle; targetLocale?: string }) {
  const t = useTranslations("TourAdmin.content");
  const ts = useTranslations("TourShared.contentStatus");
  const uiLocale = useLocale();
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const source = core.source_locale as string;
  const target = targetLocale && bundle.locales.includes(targetLocale) ? targetLocale : bundle.locales.find((l) => l !== source) ?? source;
  const rows = bundle.content.filter((c) => c.entity_type === "tour");
  const byKey = useMemo(() => {
    const m = new Map<string, Row>();
    for (const r of rows) m.set(`${r.field_key}|${r.locale}`, r);
    return m;
  }, [rows]);
  const initial = Object.fromEntries(TOUR_TEXT_FIELDS.map((f) => [f, byKey.get(`${f}|${target}`)?.draft_value ?? byKey.get(`${f}|${target}`)?.published_value ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [stateKey, setStateKey] = useState(target);
  if (stateKey !== target) {
    // Switching locale loads that locale's saved text (the switch links ask before dropping unsaved edits).
    setStateKey(target);
    setValues(initial);
  }
  const dirty = TOUR_TEXT_FIELDS.filter((f) => (values[f] ?? "") !== (initial[f] ?? ""));
  const sourceText = TOUR_TEXT_FIELDS.map((f) => byKey.get(`${f}|${source}`)?.draft_value ?? "").join("\n");
  const glossaryHints = bundle.glossary
    .filter((g) => g.locale === source && g.value && sourceText.includes(g.value))
    .map((g) => ({ key: g.term_key, source: g.value, target: bundle.glossary.find((x) => x.term_key === g.term_key && x.locale === target)?.value ?? null, note: g.note }));
  const cov = bundle.coverage.find((c) => c.locale === target);

  return (
    <div className="space-y-4">
      <Section id="coverage" title={t("coverage")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="coverage-table">
            <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("locale")}</th><th className="p-1.5 text-start">{t("required")}</th><th className="p-1.5 text-start">{t("missing")}</th><th className="p-1.5 text-start">{t("outdated")}</th></tr></thead>
            <tbody>
              {bundle.coverage.map((c) => (
                <tr key={c.locale} className="border-t" data-locale={c.locale}>
                  <td className="p-1.5">
                    <Link href={`${TOURS_PLATFORM_BASE}/tours/${core.id}?tab=content&locale=${c.locale}`} className="font-mono hover:underline" dir="ltr"
                      onClick={(e) => { if (dirty.length > 0 && !window.confirm(t("discardConfirm"))) e.preventDefault(); }}>{c.locale}</Link>
                    {c.locale === source ? <span className="text-muted-foreground"> · {t("source")}</span> : null}
                  </td>
                  <td className="p-1.5 tabular-nums">{c.present}/{c.total}</td>
                  <td className="p-1.5 text-xs">{c.missing.map((m) => t.has(`field.${m}`) ? t(`field.${m}`) : m).join("، ") || "—"}</td>
                  <td className="p-1.5 tabular-nums">{c.outdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="editor"
        title={t("editorTitle", { target })}
        description={t("editorDescription", { source })}
        actions={
          <>
            <Button type="button" size="sm" disabled={pending || dirty.length === 0} data-testid="save-content"
              onClick={() => run(() => saveContentAction(core.id, { locale: target, fields: Object.fromEntries(dirty.map((f) => [f, values[f] ?? ""])) }))}>
              {t("save", { count: dirty.length })}
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending || dirty.length > 0} data-testid="approve-locale"
              onClick={() => run(() => approveContentAction(core.id, target), { success: t("approved") })}>
              {t("approveAll")}
            </Button>
          </>
        }
      >
        {cov ? <p className="text-muted-foreground text-xs">{t("coverageLine", { present: cov.present, total: cov.total, outdated: cov.outdated })}</p> : null}
        {glossaryHints.length > 0 ? (
          <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:bg-sky-500/10" data-testid="glossary-hints">
            <p className="font-medium">{t("glossary")}</p>
            <ul className="mt-1 space-y-0.5">
              {glossaryHints.map((g) => (
                <li key={g.key}>
                  <LangText value={g.source} locale={source} /> → {g.target ? <LangText value={g.target} locale={target} /> : <span className="text-amber-700">{t("glossaryMissing")}</span>}
                  {g.note ? <span className="text-muted-foreground"> — {g.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="space-y-3">
          {TOUR_TEXT_FIELDS.map((f) => {
            const src = byKey.get(`${f}|${source}`);
            const row = target === source ? src : byKey.get(`${f}|${target}`);
            const status = row?.status ?? "missing";
            const required = (REQUIRED_TOUR_FIELDS as readonly string[]).includes(f);
            const id = `content-${f}`;
            const label = t.has(`field.${f}`) ? t(`field.${f}`) : f;
            return (
              <div key={f} className="grid gap-3 rounded-md border p-3 lg:grid-cols-2" data-field={f} data-status={status}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {label}{required ? <span className="text-destructive" aria-label={t("requiredField")}>*</span> : null}
                    <span className="text-muted-foreground text-xs" dir="ltr">({source})</span>
                    {src ? <StatusBadge status={src.status} label={ts(src.status)} /> : <StatusBadge status="missing" label={ts("missing")} />}
                  </div>
                  <div className="bg-muted/40 min-h-10 rounded p-2 text-sm"><LangText value={src?.draft_value ?? src?.published_value} locale={source} /></div>
                  {src && src.published_value && src.published_value !== src.draft_value ? (
                    <p className="text-xs text-sky-800 dark:text-sky-200">{t("liveValue")}: <LangText value={src.published_value} locale={source} /></p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor={id}>{t("translationLabel", { field: label, locale: target })}</Label>
                    <StatusBadge status={status} label={ts(status)} />
                    {status === "outdated" ? <span className="text-xs text-amber-700" data-testid={`outdated-${f}`}>{t("outdatedHint")}</span> : null}
                    {row?.machine_translated ? <span className="text-xs text-amber-700">{t("machine")}</span> : null}
                  </div>
                  <Textarea id={id} rows={f === "description" ? 5 : 2} lang={target} dir={directionOf(target)} value={values[f] ?? ""}
                    onChange={(e) => setValues({ ...values, [f]: e.target.value })} aria-invalid={required && !(values[f] ?? "").trim() ? true : undefined} />
                  {row && row.published_value && row.published_value !== (values[f] ?? "") ? (
                    <p className="text-xs text-sky-800 dark:text-sky-200" data-testid={`live-${f}`}>{t("liveValue")}: <LangText value={row.published_value} locale={target} /></p>
                  ) : null}
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    {row?.updated_at ? <span>{t("lastEdit", { at: formatInstant(row.updated_at, { locale: uiLocale, calendar: uiLocale === "fa" ? "persian" : "gregory", timeZone: "Asia/Tehran" }), by: row.updated_by?.slice(0, 8) ?? "—" })}</span> : null}
                    {row && ["draft", "submitted", "outdated"].includes(row.status) && (row.draft_value ?? "").trim() && !dirty.includes(f) ? (
                      <Button type="button" size="sm" variant="ghost" className="h-6 px-2" disabled={pending} data-testid={`approve-${f}`}
                        onClick={() => run(() => approveContentAction(core.id, target, [f]), { success: t("approved") })}>{t("approveField")}</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
