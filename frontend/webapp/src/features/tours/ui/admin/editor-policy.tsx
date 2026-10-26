"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { formatInstant } from "../../domain/calendar";
import { directionOf } from "../../domain/content";
import { createPolicyVersionAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { Field, LangText, NativeSelect, Section, StatusBadge, useAdminAction } from "./primitives";

type Texts = Record<string, { cancellation?: string; rules?: string; outdated?: boolean }>;

/**
 * Policy versions are never edited in place (C-090, AT-13): every change is a
 * new version and bookings keep the version they accepted. Only locales the
 * admin actually edited are sent, so carried-over translations of a changed
 * source text stay flagged "needs review" instead of being silently re-approved (AT-37).
 */
export function PolicyTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.policy");
  const tsc = useTranslations("TourShared.contentStatus");
  const uiLocale = useLocale();
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const src = core.source_locale as string;
  const latest = bundle.policies[0];
  const latestTexts = (latest?.texts ?? {}) as Texts;
  const [rules, setRules] = useState<{ hoursBefore: string; refundPercent: string }[]>(
    (latest?.cancellation_rules ?? [{ hoursBefore: 72, refundPercent: 100 }]).map((r: { hoursBefore: number; refundPercent: number }) => ({ hoursBefore: String(r.hoursBefore), refundPercent: String(r.refundPercent) })),
  );
  const [noShow, setNoShow] = useState(String(latest?.no_show_refund_percent ?? 0));
  const [late, setLate] = useState(latest?.late_arrival_minutes == null ? "" : String(latest.late_arrival_minutes));
  const [weather, setWeather] = useState<string>(latest?.weather_policy ?? "reschedule_or_refund");
  const [texts, setTexts] = useState<Texts>(latestTexts);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const locales = Array.from(new Set([src, ...bundle.locales]));
  const edit = (loc: string, key: "cancellation" | "rules", value: string) => {
    setTexts({ ...texts, [loc]: { ...texts[loc], [key]: value } });
    setDirty(new Set(dirty).add(loc));
  };
  const submit = () => {
    const sent: Record<string, { cancellation?: string; rules?: string }> = {};
    // The source text is always part of a version; other locales only when edited.
    for (const loc of new Set([src, ...dirty])) {
      const v = texts[loc] ?? {};
      if ((v.cancellation ?? "").trim() || (v.rules ?? "").trim()) sent[loc] = { cancellation: v.cancellation?.trim() || undefined, rules: v.rules?.trim() || undefined };
    }
    return run(() => createPolicyVersionAction(core.id, {
      cancellationRules: rules.map((r) => ({ hoursBefore: Number(r.hoursBefore), refundPercent: Number(r.refundPercent) })),
      noShowRefundPercent: Number(noShow || 0), lateArrivalMinutes: late ? Number(late) : null,
      weatherPolicy: weather as never, texts: sent,
    }), { success: t("created"), onSuccess: () => setDirty(new Set()) });
  };
  return (
    <div className="space-y-4">
      <Section id="policy-new" title={t("newTitle")} description={t("newHint")}
        actions={<Button type="button" size="sm" disabled={pending} data-testid="create-policy" onClick={submit}>{t("create")}</Button>}>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("rules")}</p>
          {rules.map((r, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <Field label={t("hoursBefore")} htmlFor={`pr-h-${i}`}><Input id={`pr-h-${i}`} dir="ltr" className="w-28" value={r.hoursBefore} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, hoursBefore: e.target.value } : x)))} /></Field>
              <Field label={t("refundPercent")} htmlFor={`pr-p-${i}`}><Input id={`pr-p-${i}`} dir="ltr" className="w-28" value={r.refundPercent} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, refundPercent: e.target.value } : x)))} /></Field>
              <Button type="button" size="sm" variant="ghost" onClick={() => setRules(rules.filter((_, j) => j !== i))}>{t("remove")}</Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => setRules([...rules, { hoursBefore: "24", refundPercent: "50" }])}>{t("addRule")}</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("noShow")} htmlFor="pol-noshow"><Input id="pol-noshow" dir="ltr" value={noShow} onChange={(e) => setNoShow(e.target.value)} /></Field>
          <Field label={t("late")} htmlFor="pol-late"><Input id="pol-late" dir="ltr" value={late} onChange={(e) => setLate(e.target.value)} /></Field>
          <Field label={t("weather")} htmlFor="pol-weather">
            <NativeSelect id="pol-weather" value={weather} onChange={(e) => setWeather(e.target.value)}>
              {["reschedule_or_refund", "full_refund", "operator_decides", "no_refund"].map((w) => <option key={w} value={w}>{t(`weatherPolicy.${w}`)}</option>)}
            </NativeSelect>
          </Field>
        </div>
        <div className="space-y-3">
          {locales.map((loc) => (
            <fieldset key={loc} className="grid gap-2 rounded-md border p-3 md:grid-cols-2" data-locale={loc}>
              <legend className="flex items-center gap-2 px-1 text-sm font-medium">
                <span dir="ltr">{loc}</span>{loc === src ? <span className="text-muted-foreground">({t("source")})</span> : null}
                {latestTexts[loc]?.outdated ? <StatusBadge status="outdated" label={tsc("outdated")} /> : null}
                {dirty.has(loc) ? <span className="text-xs text-sky-700">{t("edited")}</span> : null}
              </legend>
              <div className="space-y-1">
                <Label htmlFor={`pol-c-${loc}`}>{t("cancellationText")}</Label>
                <Textarea id={`pol-c-${loc}`} rows={2} lang={loc} dir={directionOf(loc)} value={texts[loc]?.cancellation ?? ""} onChange={(e) => edit(loc, "cancellation", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`pol-r-${loc}`}>{t("rulesText")}</Label>
                <Textarea id={`pol-r-${loc}`} rows={2} lang={loc} dir={directionOf(loc)} value={texts[loc]?.rules ?? ""} onChange={(e) => edit(loc, "rules", e.target.value)} />
              </div>
            </fieldset>
          ))}
        </div>
      </Section>

      <Section id="policy-versions" title={t("versions")}>
        <ol className="space-y-2">
          {bundle.policies.map((p) => (
            <li key={p.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap gap-2 font-medium">
                {t("version", { v: p.version })}{p.version === core.current_policy_version ? <StatusBadge status="published" label={t("current")} /> : null}
                <span className="text-muted-foreground font-normal">{p.created_at ? formatInstant(p.created_at, { locale: uiLocale, calendar: uiLocale === "fa" ? "persian" : "gregory", timeZone: core.timezone }) : ""}</span>
              </div>
              <p className="text-muted-foreground" dir="ltr">{(p.cancellation_rules as { hoursBefore: number; refundPercent: number }[]).map((r) => `≥${r.hoursBefore}h → ${r.refundPercent}%`).join(" · ")}</p>
              <p><LangText value={(p.texts as Texts)?.[src]?.cancellation} locale={src} /></p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
