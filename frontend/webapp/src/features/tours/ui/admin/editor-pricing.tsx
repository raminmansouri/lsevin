"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { TRAVELER_CLASSES } from "../../domain/pricing";
import { saveAddonsAction, saveOptionsAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { Field, NativeSelect, Section, useAdminAction } from "./primitives";

type OptionDraft = {
  code: string; kind: "public" | "private"; pickupIncluded: boolean; guideLanguage: string; minGroup: string; maxGroup: string;
  privateGroupPrice: string; isActive: boolean; tiers: Record<string, string>; label: string;
};
type AddonDraft = { code: string; pricing: "per_person" | "per_booking"; amount: string; maxQty: string; isActive: boolean; label: string };

/** Options, per-traveler prices and add-ons (V-018, V-028). Amounts are in the tour currency and never translated. */
export function PricingTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.pricing");
  const tt = useTranslations("TourShared.traveler");
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const src = core.source_locale as string;
  const labelOf = (type: string, id: string) => {
    const r = bundle.content.find((c) => c.entity_type === type && c.entity_id === id && c.field_key === "label" && c.locale === src);
    return r?.draft_value ?? r?.published_value ?? "";
  };
  const [options, setOptions] = useState<OptionDraft[]>(() => bundle.options.filter((o) => o.is_active).map((o) => ({
    code: o.code, kind: o.kind, pickupIncluded: o.pickup_included, guideLanguage: o.guide_language ?? "", minGroup: String(o.min_group),
    maxGroup: o.max_group == null ? "" : String(o.max_group), privateGroupPrice: o.private_group_price == null ? "" : String(o.private_group_price),
    isActive: o.is_active, label: labelOf("option", o.id),
    tiers: Object.fromEntries((o.tiers as { travelerClass: string; amount: number }[]).map((x) => [x.travelerClass, String(x.amount)])),
  })));
  const [addons, setAddons] = useState<AddonDraft[]>(() => bundle.addons.filter((a) => a.is_active).map((a) => ({
    code: a.code, pricing: a.pricing, amount: String(a.amount), maxQty: String(a.max_qty), isActive: a.is_active, label: labelOf("addon", a.id),
  })));
  const up = (i: number, patch: Partial<OptionDraft>) => setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const upA = (i: number, patch: Partial<AddonDraft>) => setAddons(addons.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  return (
    <div className="space-y-4">
      <Section id="options" title={t("options", { currency: core.currency_code })} description={t("optionsHint")}
        actions={<Button type="button" size="sm" disabled={pending} data-testid="save-options" onClick={() => run(() => saveOptionsAction(core.id, src, options.map((o) => ({
          code: o.code.trim(), kind: o.kind, pickupIncluded: o.pickupIncluded, guideLanguage: o.guideLanguage || null, minGroup: Number(o.minGroup || 1),
          maxGroup: o.maxGroup ? Number(o.maxGroup) : null, privateGroupPrice: o.privateGroupPrice ? Number(o.privateGroupPrice) : null, isActive: o.isActive,
          label: o.label || undefined,
          tiers: Object.entries(o.tiers).filter(([, v]) => String(v ?? "").trim() !== "").map(([travelerClass, amount]) => ({ travelerClass, amount: Number(amount) })),
        }))))}>{t("save")}</Button>}>
        {options.map((o, i) => (
          <fieldset key={i} className="space-y-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">{o.code || t("newOption")}</legend>
            <div className="grid gap-2 md:grid-cols-4">
              <Field label={t("code")} htmlFor={`op-code-${i}`}><Input id={`op-code-${i}`} dir="ltr" value={o.code} onChange={(e) => up(i, { code: e.target.value })} /></Field>
              <Field label={t("kind")} htmlFor={`op-kind-${i}`}>
                <NativeSelect id={`op-kind-${i}`} value={o.kind} onChange={(e) => up(i, { kind: e.target.value as OptionDraft["kind"] })}>
                  <option value="public">{t("public")}</option><option value="private">{t("private")}</option>
                </NativeSelect>
              </Field>
              <Field label={`${t("label")} (${src})`} htmlFor={`op-label-${i}`}><Input id={`op-label-${i}`} value={o.label} onChange={(e) => up(i, { label: e.target.value })} /></Field>
              <Field label={t("guideLanguage")} htmlFor={`op-lang-${i}`}><Input id={`op-lang-${i}`} dir="ltr" value={o.guideLanguage} onChange={(e) => up(i, { guideLanguage: e.target.value })} /></Field>
              <Field label={t("minGroup")} htmlFor={`op-min-${i}`}><Input id={`op-min-${i}`} dir="ltr" value={o.minGroup} onChange={(e) => up(i, { minGroup: e.target.value })} /></Field>
              <Field label={t("maxGroup")} htmlFor={`op-max-${i}`}><Input id={`op-max-${i}`} dir="ltr" value={o.maxGroup} onChange={(e) => up(i, { maxGroup: e.target.value })} /></Field>
              {o.kind === "private" ? (
                <Field label={t("privatePrice")} htmlFor={`op-priv-${i}`}><Input id={`op-priv-${i}`} dir="ltr" value={o.privateGroupPrice} onChange={(e) => up(i, { privateGroupPrice: e.target.value })} /></Field>
              ) : null}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={o.pickupIncluded} onChange={(e) => up(i, { pickupIncluded: e.target.checked })} /> {t("pickup")}</label>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {TRAVELER_CLASSES.map((cls) => (
                <Field key={cls} label={`${tt(cls)} (${core.currency_code})`} htmlFor={`op-${i}-${cls}`}>
                  <Input id={`op-${i}-${cls}`} dir="ltr" inputMode="decimal" value={o.tiers[cls] ?? ""} onChange={(e) => up(i, { tiers: { ...o.tiers, [cls]: e.target.value } })} />
                </Field>
              ))}
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOptions(options.filter((_, j) => j !== i))}>{t("remove")}</Button>
          </fieldset>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setOptions([...options, { code: "", kind: "public", pickupIncluded: false, guideLanguage: "", minGroup: "1", maxGroup: "", privateGroupPrice: "", isActive: true, tiers: {}, label: "" }])}>{t("addOption")}</Button>
      </Section>

      <Section id="addons" title={t("addons")}
        actions={<Button type="button" size="sm" disabled={pending} onClick={() => run(() => saveAddonsAction(core.id, src, addons.map((a) => ({
          code: a.code.trim(), pricing: a.pricing, amount: Number(a.amount), maxQty: Number(a.maxQty || 1), isActive: a.isActive, label: a.label || undefined,
        }))))}>{t("save")}</Button>}>
        {addons.map((a, i) => (
          <div key={i} className="grid gap-2 rounded-md border p-3 md:grid-cols-6">
            <Field label={t("code")} htmlFor={`ad-code-${i}`}><Input id={`ad-code-${i}`} dir="ltr" value={a.code} onChange={(e) => upA(i, { code: e.target.value })} /></Field>
            <Field label={`${t("label")} (${src})`} htmlFor={`ad-label-${i}`}><Input id={`ad-label-${i}`} value={a.label} onChange={(e) => upA(i, { label: e.target.value })} /></Field>
            <Field label={t("pricing")} htmlFor={`ad-pricing-${i}`}>
              <NativeSelect id={`ad-pricing-${i}`} value={a.pricing} onChange={(e) => upA(i, { pricing: e.target.value as AddonDraft["pricing"] })}>
                <option value="per_person">{t("perPerson")}</option><option value="per_booking">{t("perBooking")}</option>
              </NativeSelect>
            </Field>
            <Field label={`${t("amount")} (${core.currency_code})`} htmlFor={`ad-amount-${i}`}><Input id={`ad-amount-${i}`} dir="ltr" value={a.amount} onChange={(e) => upA(i, { amount: e.target.value })} /></Field>
            <Field label={t("maxQty")} htmlFor={`ad-max-${i}`}><Input id={`ad-max-${i}`} dir="ltr" value={a.maxQty} onChange={(e) => upA(i, { maxQty: e.target.value })} /></Field>
            <div className="flex items-end"><Button type="button" size="sm" variant="ghost" onClick={() => setAddons(addons.filter((_, j) => j !== i))}>{t("remove")}</Button></div>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setAddons([...addons, { code: "", pricing: "per_booking", amount: "0", maxQty: "1", isActive: true, label: "" }])}>{t("addAddon")}</Button>
      </Section>
    </div>
  );
}
