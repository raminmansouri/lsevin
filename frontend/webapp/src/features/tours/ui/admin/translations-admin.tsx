"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import { deleteGlossaryAction, grantTranslatorAction, revokeTranslatorAction, searchUsersAction, upsertGlossaryAction } from "../../server/admin/actions";

import { localeName, OptionSelect, pickLabel, useAdminDates, type Option } from "./inputs";
import { EmptyState, Field, LangText, NativeSelect, Section, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Coverage = { locale: string; present: number; total: number; missing: string[]; outdated: number };
type Report = { locales: string[]; required: string[]; tours: { id: string; slug: string; status: string; source_locale: string; title: string | null; coverage: Coverage[] }[] };
type Assignment = { user_id: string; locale: string; service_provider_id: string | null; name: string | null; email: string | null; provider_name: string | null; created_at: string | null };
type Glossary = { term_key: string; locale: string; value: string; note: string | null };
type Provider = { id: string; name: string; names?: Record<string, string> | null };

/** Providers named in the admin's language. */
function useProviderOptions(providers: Provider[]): Option[] {
  const locale = useLocale();
  return useMemo(() => providers.map((p) => ({ value: p.id, label: pickLabel(p.names, locale, p.name) })), [providers, locale]);
}

/** Coverage report (M-007/M-029), translator assignments (M-030) and the terminology glossary (S-070). */
export function TranslationsAdmin({ report, assignments, glossary, providers }: { report: Report; assignments: Assignment[]; glossary: Glossary[]; providers: Provider[] }) {
  const t = useTranslations("TourAdmin.translations");
  const ts = useTranslations("TourShared.tourStatus");
  const tcommon = useTranslations("TourAdmin.common");
  const locale = useLocale();
  const lang = (tag: string) => (tag === "source" ? tcommon("sourceLanguage") : localeName(tag, locale));
  return (
    <div className="space-y-4">
      <Section id="coverage" title={t("coverage")} description={t("coverageHint", { required: report.required.map(lang).join(locale === "fa" ? "، " : ", ") })}>
        {report.tours.length === 0 ? <EmptyState>{t("noTours")}</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="coverage-report">
              <thead>
                <tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("tour")}</th>{report.locales.map((l) => <th key={l} className="p-1.5 text-start" title={l}>{lang(l)}</th>)}</tr>
              </thead>
              <tbody>
                {report.tours.map((tour) => (
                  <tr key={tour.id} className="border-t">
                    <td className="p-1.5"><Link href={`${TOURS_PLATFORM_BASE}/tours/${tour.id}?tab=content`} className="hover:underline">{tour.title ?? tour.slug}</Link> <span className="text-muted-foreground">({ts(tour.status)})</span></td>
                    {tour.coverage.map((c) => (
                      <td key={c.locale} className={`p-1.5 tabular-nums ${c.present === c.total ? "text-emerald-700" : c.present === 0 ? "text-muted-foreground" : "text-amber-700"}`}
                        title={c.missing.join(", ")} data-locale={c.locale}>
                        <Link href={`${TOURS_PLATFORM_BASE}/tours/${tour.id}?tab=content&locale=${c.locale}`}>{c.present}/{c.total}{c.outdated ? ` · ${t("outdatedShort", { n: c.outdated })}` : ""}</Link>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <TranslatorAssignments assignments={assignments} locales={report.locales} providers={providers} />
      <GlossaryEditor glossary={glossary} locales={report.locales} />
    </div>
  );
}

function TranslatorAssignments({ assignments, locales, providers }: { assignments: Assignment[]; locales: string[]; providers: Provider[] }) {
  const t = useTranslations("TourAdmin.translations");
  const uiLocale = useLocale();
  const dates = useAdminDates();
  const providerOptions = useProviderOptions(providers);
  const providerName = (a: Assignment) => (a.service_provider_id ? providerOptions.find((p) => p.value === a.service_provider_id)?.label ?? a.provider_name : null);
  const { run, pending } = useAdminAction();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; email: string | null; phone: string | null }[]>([]);
  const [userId, setUserId] = useState("");
  const [locale, setLocale] = useState(locales.find((l) => !l.startsWith("fa")) ?? locales[0] ?? "en-US");
  const [providerId, setProviderId] = useState("");
  const search = async () => {
    const r = await run(() => searchUsersAction(q), { refresh: false, success: t("searched") });
    setResults(r ?? []);
  };
  return (
    <Section id="translators" title={t("translators")} description={t("translatorsHint")}>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t("findUser")} htmlFor="tr-q" className="min-w-64"><Input id="tr-q" dir="ltr" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} /></Field>
        <Button type="button" size="sm" variant="outline" disabled={pending || q.trim().length < 3} onClick={search}>{t("search")}</Button>
      </div>
      {results.length > 0 ? (
        <ul className="space-y-1 text-sm" role="listbox" aria-label={t("results")}>
          {results.map((u) => (
            <li key={u.id}>
              <label className="flex items-center gap-2">
                <input type="radio" name="tr-user" value={u.id} checked={userId === u.id} onChange={() => setUserId(u.id)} />
                {u.name || "—"} <span className="text-muted-foreground" dir="ltr">{u.email ?? ""} {u.phone ?? ""}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t("locale")} htmlFor="tr-locale">
          <NativeSelect id="tr-locale" value={locale} onChange={(e) => setLocale(e.target.value)}>{locales.map((l) => <option key={l} value={l}>{localeName(l, uiLocale)}</option>)}</NativeSelect>
        </Field>
        <Field label={t("providerScope")} htmlFor="tr-provider" className="min-w-64">
          <OptionSelect id="tr-provider" testId="tr-provider" value={providerId} onChange={setProviderId} options={providerOptions} placeholder={t("allProviders")} />
        </Field>
        <Button type="button" size="sm" disabled={pending || !userId} data-testid="grant-translator"
          onClick={() => run(() => grantTranslatorAction({ userId, locale, serviceProviderId: providerId || null }), { success: t("granted") })}>{t("grant")}</Button>
      </div>
      {assignments.length === 0 ? <EmptyState>{t("noAssignments")}</EmptyState> : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="assignments">
          <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("user")}</th><th className="p-1.5 text-start">{t("locale")}</th><th className="p-1.5 text-start">{t("providerScope")}</th><th className="p-1.5 text-start">{t("assignedAt")}</th><th /></tr></thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={`${a.user_id}-${a.locale}`} className="border-t" data-user={a.user_id} data-locale={a.locale}>
                <td className="p-1.5">{a.name || "—"} <span className="text-muted-foreground" dir="ltr">{a.email}</span></td>
                <td className="p-1.5" title={a.locale}>{localeName(a.locale, uiLocale)}</td>
                <td className="p-1.5">{providerName(a) ?? t("allProviders")}</td>
                <td className="p-1.5 text-xs">{dates.instant(a.created_at)}</td>
                <td className="p-1.5 text-end"><Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run(() => revokeTranslatorAction({ userId: a.user_id, locale: a.locale }), { success: t("revoked") })}>{t("revoke")}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Section>
  );
}

function GlossaryEditor({ glossary, locales }: { glossary: Glossary[]; locales: string[] }) {
  const t = useTranslations("TourAdmin.translations");
  const uiLocale = useLocale();
  const { run, pending } = useAdminAction();
  const [g, setG] = useState({ termKey: "", locale: locales[0] ?? "fa-IR", value: "", note: "" });
  const keys = Array.from(new Set(glossary.map((x) => x.term_key)));
  return (
    <Section id="glossary" title={t("glossary")} description={t("glossaryHint")}>
      <form className="grid gap-2 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); run(() => upsertGlossaryAction(g), { onSuccess: () => setG({ ...g, value: "", note: "" }) }); }}>
        <Field label={t("termKey")} htmlFor="gl-key"><Input id="gl-key" dir="ltr" required value={g.termKey} onChange={(e) => setG({ ...g, termKey: e.target.value })} /></Field>
        <Field label={t("locale")} htmlFor="gl-locale"><NativeSelect id="gl-locale" value={g.locale} onChange={(e) => setG({ ...g, locale: e.target.value })}>{locales.map((l) => <option key={l} value={l}>{localeName(l, uiLocale)}</option>)}</NativeSelect></Field>
        <Field label={t("value")} htmlFor="gl-value"><Input id="gl-value" required value={g.value} onChange={(e) => setG({ ...g, value: e.target.value })} /></Field>
        <Field label={t("note")} htmlFor="gl-note"><Input id="gl-note" value={g.note} onChange={(e) => setG({ ...g, note: e.target.value })} /></Field>
        <div className="flex items-end"><Button type="submit" size="sm" disabled={pending}>{t("saveTerm")}</Button></div>
      </form>
      {keys.length === 0 ? <EmptyState>{t("noGlossary")}</EmptyState> : (
        <ul className="space-y-2 text-sm">
          {keys.map((k) => (
            <li key={k} className="rounded border p-2">
              <span className="font-mono" dir="ltr">{k}</span>
              <ul className="mt-1 flex flex-wrap gap-3">
                {glossary.filter((x) => x.term_key === k).map((x) => (
                  <li key={x.locale} className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs" title={x.locale}>{localeName(x.locale, uiLocale)}</span> <LangText value={x.value} locale={x.locale} />
                    <Button type="button" size="sm" variant="ghost" className="h-6 px-1" aria-label={t("deleteTerm")} disabled={pending} onClick={() => run(() => deleteGlossaryAction({ termKey: k, locale: x.locale }))}>×</Button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
