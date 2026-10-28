"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import {
  clearProviderFlagAction,
  createAgreementAction,
  decideDisputeAction,
  escalateIncidentAction,
  moderateReplyAction,
  moderateReviewAction,
  resolveIncidentAction,
  searchUsersAction,
  setAdminRoleAction,
  setProviderFlagAction,
} from "../../server/admin/actions";

import { localeName, OptionSelect, pickLabel, useAdminDates, type Option } from "./inputs";
import { CalendarDateField, EmptyState, Field, formatAmount, LangText, NativeSelect, ReasonAction, Section, StatusBadge, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

/** Admins read every timestamp on the Jalali calendar, in Tehran time. */
const useWhen = () => {
  const dates = useAdminDates();
  return (iso: string | null | undefined) => dates.instant(iso);
};

type Provider = { id: string; name: string; names?: Record<string, string> | null };

/** Providers named in the admin's language, for searchable selects. */
function useProviderOptions(providers: Provider[]): Option[] {
  const locale = useLocale();
  return useMemo(() => providers.map((p) => ({ value: p.id, label: pickLabel(p.names, locale, p.name) })), [providers, locale]);
}

// ----------------------------------------------------------------------------
// Disputes (M-018)
// ----------------------------------------------------------------------------

type Dispute = {
  id: string; booking_id: string; kind: string; reason_code: string; status: string; amount: number | null; currency_code: string | null;
  approval_level: string; required_level: string | null; notes: string | null; decision_note: string | null; created_at: string; voucher_code: string; slug: string;
  decisions: { level: string; decision: string; note: string; at: string }[];
};

export function DisputesPanel({ disputes, myLevel, status }: { disputes: Dispute[]; myLevel: string; status: string }) {
  const t = useTranslations("TourAdmin.disputes");
  const tb = useTranslations("TourAdmin.booking");
  const locale = useLocale();
  const when = useWhen();
  const { run, pending } = useAdminAction();
  const [notes, setNotes] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4">
      <p className="text-sm" data-testid="my-level">{t("myLevel", { level: t(`levels.${myLevel}`) })}</p>
      <div className="flex flex-wrap gap-2 text-sm">
        {["active", "approved", "rejected"].map((s) => (
          <Link key={s} href={`${TOURS_PLATFORM_BASE}/disputes?status=${s}`} aria-current={status === s ? "page" : undefined} className={status === s ? "font-semibold underline" : "underline"}>{t(`filter.${s}`)}</Link>
        ))}
      </div>
      {disputes.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : null}
      {disputes.map((d) => {
        const levels = ["agent", "manager", "finance"];
        const canAct = ["open", "pending_approval"].includes(d.status) && levels.indexOf(myLevel) >= levels.indexOf(d.approval_level);
        return (
          <div key={d.id} className="space-y-2 rounded-lg border p-3" data-dispute-id={d.id} data-status={d.status} data-level={d.approval_level}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`${TOURS_PLATFORM_BASE}/bookings/${d.booking_id}`} className="font-mono hover:underline" dir="ltr">{d.voucher_code}</Link>
              <span>{tb(`disputeKind.${d.kind}`)}</span>
              <span>· {tb(`reasonCodes.${d.reason_code}`)}</span>
              <StatusBadge status={d.status} label={tb(`disputeStatus.${d.status}`)} />
              <span>· {d.amount != null && d.currency_code ? formatAmount(d.amount, d.currency_code, locale) : "—"}</span>
              <span className="text-muted-foreground">· {t("awaiting", { level: t(`levels.${d.approval_level}`), required: t(`levels.${d.required_level ?? "agent"}`) })}</span>
              <span className="text-muted-foreground">· {when(d.created_at)}</span>
            </div>
            {d.notes ? <p className="text-sm">{d.notes}</p> : null}
            {d.decisions.length > 0 ? (
              <ol className="text-muted-foreground space-y-0.5 text-xs">
                {d.decisions.map((x, i) => <li key={i}>{when(x.at)} · {t(`levels.${x.level}`)} · {t(`decision.${x.decision}`)} · {x.note}</li>)}
              </ol>
            ) : null}
            {canAct ? (
              <div className="flex flex-wrap items-end gap-2">
                <Field label={t("note")} htmlFor={`dn-${d.id}`} className="min-w-64 flex-1">
                  <Input id={`dn-${d.id}`} value={notes[d.id] ?? ""} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} />
                </Field>
                <Button type="button" size="sm" disabled={pending || (notes[d.id] ?? "").trim().length < 5} data-testid="approve-dispute"
                  onClick={() => run(() => decideDisputeAction({ disputeId: d.id, decision: "approve", note: notes[d.id] ?? "" }))}>{t("approve")}</Button>
                <Button type="button" size="sm" variant="destructive" disabled={pending || (notes[d.id] ?? "").trim().length < 5}
                  onClick={() => run(() => decideDisputeAction({ disputeId: d.id, decision: "reject", note: notes[d.id] ?? "" }))}>{t("reject")}</Button>
              </div>
            ) : ["open", "pending_approval"].includes(d.status) ? <p className="text-xs text-amber-700">{t("needsHigher")}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function AdminRolesPanel({ roles }: { roles: { user_id: string; role: string; name: string | null }[] }) {
  const t = useTranslations("TourAdmin.disputes");
  const { run, pending } = useAdminAction();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string; email: string | null }[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("manager");
  return (
    <Section id="roles" title={t("roles")} description={t("rolesHint")}>
      <ul className="space-y-1 text-sm">{roles.map((r) => <li key={r.user_id}>{r.name ?? r.user_id.slice(0, 8)} · {t(`levels.${r.role}`)}</li>)}</ul>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t("findUser")} htmlFor="ar-q"><Input id="ar-q" dir="ltr" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Button type="button" size="sm" variant="outline" disabled={pending || q.trim().length < 3} onClick={async () => setUsers((await run(() => searchUsersAction(q), { refresh: false, success: t("searched") })) ?? [])}>{t("search")}</Button>
        <Field label={t("user")} htmlFor="ar-user" className="w-64">
          <OptionSelect id="ar-user" testId="ar-user" value={userId} onChange={setUserId} options={users.map((u) => ({ value: u.id, label: u.name || "—", hint: u.email ?? undefined }))} />
        </Field>
        <NativeSelect aria-label={t("role")} className="w-40" value={role} onChange={(e) => setRole(e.target.value)}>
          {["agent", "manager", "finance"].map((r) => <option key={r} value={r}>{t(`levels.${r}`)}</option>)}
        </NativeSelect>
        <Button type="button" size="sm" disabled={pending || !userId} onClick={() => run(() => setAdminRoleAction({ userId, role }))}>{t("grant")}</Button>
      </div>
    </Section>
  );
}

// ----------------------------------------------------------------------------
// Commissions (M-017)
// ----------------------------------------------------------------------------

type Agreement = { id: string; service_provider_id: string | null; provider_name: string | null; commission_percent: number; effective_from: string; effective_to: string | null; current: boolean; bookings: number };

export function CommissionsPanel({ agreements, providers, platformDefault }: { agreements: Agreement[]; providers: Provider[]; platformDefault: number }) {
  const t = useTranslations("TourAdmin.commissions");
  const locale = useLocale();
  const dates = useAdminDates();
  const providerOptions = useProviderOptions(providers);
  const { run, pending } = useAdminAction();
  const [v, setV] = useState({ serviceProviderId: "", percent: "", effectiveFrom: "", effectiveTo: "" });
  return (
    <div className="space-y-4">
      <p className="text-sm">{t("settingDefault", { percent: platformDefault })}</p>
      <Section id="agreements" title={t("list")} description={t("immutableHint")}>
        {agreements.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : (
          <table className="w-full text-sm" data-testid="agreements">
            <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("scope")}</th><th className="p-1.5 text-start">{t("percent")}</th><th className="p-1.5 text-start">{t("from")}</th><th className="p-1.5 text-start">{t("to")}</th><th className="p-1.5 text-start">{t("bookings")}</th></tr></thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-1.5">{a.service_provider_id ? providerOptions.find((p) => p.value === a.service_provider_id)?.label ?? a.provider_name : t("platform")} {a.current ? <StatusBadge status="published" label={t("current")} /> : null}</td>
                  <td className="p-1.5 tabular-nums">{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale, { style: "percent", maximumFractionDigits: 2 }).format(Number(a.commission_percent) / 100)}</td>
                  <td className="p-1.5" data-iso={a.effective_from}>{dates.date(a.effective_from)}</td>
                  <td className="p-1.5" data-iso={a.effective_to ?? ""}>{a.effective_to ? dates.date(a.effective_to) : "∞"}</td>
                  <td className="p-1.5 tabular-nums">{a.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
      <Section id="new-agreement" title={t("newTitle")} description={t("newHint")}>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run(() => createAgreementAction({ ...v, serviceProviderId: v.serviceProviderId || null, effectiveTo: v.effectiveTo || null, calendar: "gregory" }), { onSuccess: () => setV({ serviceProviderId: "", percent: "", effectiveFrom: "", effectiveTo: "" }) }); }}>
          <Field label={t("scope")} htmlFor="ca-provider">
            <OptionSelect id="ca-provider" testId="ca-provider" value={v.serviceProviderId} onChange={(serviceProviderId) => setV({ ...v, serviceProviderId })}
              options={providerOptions} placeholder={t("platform")} />
          </Field>
          <Field label={t("percent")} htmlFor="ca-percent"><Input id="ca-percent" dir="ltr" inputMode="decimal" required value={v.percent} onChange={(e) => setV({ ...v, percent: e.target.value })} /></Field>
          <CalendarDateField id="ca-from" label={t("from")} value={v.effectiveFrom} onChange={(x) => setV({ ...v, effectiveFrom: x })} required />
          <CalendarDateField id="ca-to" label={t("to")} value={v.effectiveTo} onChange={(x) => setV({ ...v, effectiveTo: x })} />
          <div className="flex items-end"><Button type="submit" disabled={pending || !v.effectiveFrom}>{t("create")}</Button></div>
        </form>
      </Section>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Incidents (M-019)
// ----------------------------------------------------------------------------

type Incident = { id: string; departureId?: string | null; departure_id?: string | null; severity: string; kind: string; description: string; status: string; createdAt?: string; created_at?: string; resolution?: string | null };

export function IncidentsPanel({ incidents }: { incidents: Incident[] }) {
  const t = useTranslations("TourAdmin.incidents");
  const when = useWhen();
  const { run, pending } = useAdminAction();
  if (incidents.length === 0) return <EmptyState>{t("empty")}</EmptyState>;
  return (
    <div className="space-y-2">
      {incidents.map((i) => (
        <div key={i.id} className="space-y-2 rounded-lg border p-3" data-incident-id={i.id} data-status={i.status}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={i.severity === "critical" ? "critical" : i.status} label={t(`severity.${i.severity}`)} />
            <StatusBadge status={i.status} label={t(`status.${i.status}`)} />
            <span className="font-medium">{i.kind}</span>
            <span className="text-muted-foreground">· {when(i.createdAt ?? i.created_at)}</span>
            {(i.departureId ?? i.departure_id) ? <Link href={`${TOURS_PLATFORM_BASE}/bookings?departure=${i.departureId ?? i.departure_id}`} className="underline">{t("affected")}</Link> : null}
          </div>
          <p className="text-sm whitespace-pre-wrap">{i.description}</p>
          {i.resolution ? <p className="text-muted-foreground text-sm">{t("resolution")}: {i.resolution}</p> : null}
          <div className="flex flex-wrap gap-2">
            {i.status === "open" ? <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => escalateIncidentAction(i.id))}>{t("escalate")}</Button> : null}
            {i.status !== "resolved" ? <ReasonAction label={t("resolve")} reasonLabel={t("resolution")} minLength={3} onConfirm={(text) => run(() => resolveIncidentAction(i.id, text))} /> : null}
            {(i.departureId ?? i.departure_id) ? <Link href={`${TOURS_PLATFORM_BASE}/departures`} className="inline-flex h-8 items-center text-sm underline">{t("massNotice")}</Link> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reviews (M-034)
// ----------------------------------------------------------------------------

type Review = {
  id: string; slug: string; rating: number; body: string; locale: string; status: string; moderation_note: string | null; provider_reply: string | null; reply_status: string | null;
  created_at: string; translations: { locale: string; body: string; isMachine: boolean }[]; reports: { reason: string; status: string }[];
};

export function ReviewsPanel({ reviews, status }: { reviews: Review[]; status: string }) {
  const t = useTranslations("TourAdmin.reviews");
  const locale = useLocale();
  const when = useWhen();
  const { run, pending } = useAdminAction();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        {["pending", "reported", "reply_pending", "published", "hidden", "rejected"].map((s) => (
          <Link key={s} href={`${TOURS_PLATFORM_BASE}/reviews?status=${s}`} aria-current={status === s ? "page" : undefined} className={status === s ? "font-semibold underline" : "underline"}>{t(`filter.${s}`)}</Link>
        ))}
      </div>
      {reviews.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : null}
      {reviews.map((r) => (
        <div key={r.id} className="space-y-2 rounded-lg border p-3" data-review-id={r.id}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono" dir="ltr">{r.slug}</span><span>· {"★".repeat(r.rating)}</span>
            <StatusBadge status={r.status} label={t(`status.${r.status}`)} /><span className="text-muted-foreground">· {when(r.created_at)}</span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("original", { locale: localeName(r.locale, locale) })}</p>
            <p className="text-sm"><LangText value={r.body} locale={r.locale} /></p>
          </div>
          {r.translations.map((x) => (
            <div key={x.locale} className="border-s-2 ps-2">
              <p className="text-muted-foreground text-xs">{x.isMachine ? t("machineTranslation", { locale: localeName(x.locale, locale) }) : t("translation", { locale: localeName(x.locale, locale) })}</p>
              <p className="text-sm"><LangText value={x.body} locale={x.locale} /></p>
            </div>
          ))}
          {r.reports.length > 0 ? <p className="text-xs text-amber-700">{t("reports")}: {r.reports.map((x) => `${x.reason} (${x.status})`).join("; ")}</p> : null}
          <div className="flex flex-wrap gap-2">
            {r.status !== "published" ? <Button type="button" size="sm" disabled={pending} onClick={() => run(() => moderateReviewAction(r.id, "published"))}>{t("publish")}</Button> : null}
            {r.status !== "hidden" ? <ReasonAction label={t("hide")} onConfirm={(note) => run(() => moderateReviewAction(r.id, "hidden", note))} /> : null}
            {r.status !== "rejected" ? <ReasonAction label={t("reject")} variant="destructive" onConfirm={(note) => run(() => moderateReviewAction(r.id, "rejected", note))} /> : null}
          </div>
          {r.provider_reply ? (
            <div className="rounded bg-muted/40 p-2 text-sm">
              <p className="text-muted-foreground text-xs">{t("reply")} · {r.reply_status && t.has(`status.${r.reply_status}`) ? t(`status.${r.reply_status}`) : r.reply_status}</p>
              <p className="whitespace-pre-wrap">{r.provider_reply}</p>
              {r.reply_status !== "published" ? <Button type="button" size="sm" className="mt-1" disabled={pending} onClick={() => run(() => moderateReplyAction(r.id, "published"))}>{t("publishReply")}</Button> : null}
              {r.reply_status !== "rejected" ? <Button type="button" size="sm" variant="ghost" className="mt-1" disabled={pending} onClick={() => run(() => moderateReplyAction(r.id, "rejected"))}>{t("rejectReply")}</Button> : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Compliance (M-023)
// ----------------------------------------------------------------------------

type Compliance = {
  qualifications: { id: string; kind: string; issuer: string | null; expires_on: string | null; verification_status: string; display_name: string; expired: boolean }[];
  unverifiedProviders: { id: string; name: string; published_tours: number; tours: number }[];
  flags: { id: string; service_provider_id: string; flag: string; note: string | null; provider_name: string; created_at: string | null }[];
  unverifiedAttributes: { id: string; slug: string; wheelchair_accessible: boolean; low_mobility_friendly: boolean; recovery_friendly: boolean }[];
};

export function CompliancePanel({ data, providers }: { data: Compliance; providers: Provider[] }) {
  const t = useTranslations("TourAdmin.compliance");
  const when = useWhen();
  const dates = useAdminDates();
  const providerOptions = useProviderOptions(providers);
  const { run, pending } = useAdminAction();
  const [f, setF] = useState({ serviceProviderId: "", flag: "watch", note: "" });
  return (
    <div className="space-y-4">
      <Section id="qualifications" title={t("qualifications")} description={t("qualificationsHint")}>
        {data.qualifications.length === 0 ? <EmptyState>{t("none")}</EmptyState> : (
          <ul className="space-y-1 text-sm">
            {data.qualifications.map((q) => (
              <li key={q.id} className={q.expired ? "text-destructive" : ""}>{q.display_name} · {q.kind}{q.issuer ? ` (${q.issuer})` : ""} · <span data-iso={q.expires_on ?? ""}>{dates.date(q.expires_on)}</span> · {q.verification_status}{q.expired ? ` · ${t("expired")}` : ""}</li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="unverified" title={t("unverifiedProviders")}>
        {data.unverifiedProviders.length === 0 ? <EmptyState>{t("none")}</EmptyState> : (
          <ul className="space-y-1 text-sm">
            {data.unverifiedProviders.map((p) => <li key={p.id}><Link href={`/admin/service-providers`} className="underline">{p.name}</Link> · {t("toursCount", { published: p.published_tours, total: p.tours })}</li>)}
          </ul>
        )}
      </Section>
      <Section id="attributes" title={t("attributes")}>
        {data.unverifiedAttributes.length === 0 ? <EmptyState>{t("none")}</EmptyState> : (
          <ul className="space-y-1 text-sm">
            {data.unverifiedAttributes.map((x) => <li key={x.id}><Link href={`${TOURS_PLATFORM_BASE}/tours/${x.id}`} className="font-mono underline" dir="ltr">{x.slug}</Link></li>)}
          </ul>
        )}
      </Section>
      <Section id="flags" title={t("flags")}>
        <ul className="space-y-1 text-sm">
          {data.flags.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-2">{x.provider_name} · <StatusBadge status={x.flag === "trusted" ? "approved" : "outdated"} label={t(`flag.${x.flag}`)} /> {x.note} · {when(x.created_at)}
              <ReasonAction label={t("clear")} onConfirm={(note) => run(() => clearProviderFlagAction(x.id, note))} />
            </li>
          ))}
        </ul>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(() => setProviderFlagAction(f), { onSuccess: () => setF({ ...f, note: "" }) }); }}>
          <OptionSelect id="cf-provider" testId="cf-provider" value={f.serviceProviderId} onChange={(serviceProviderId) => setF({ ...f, serviceProviderId })}
            options={providerOptions} placeholder={t("provider")} />
          <NativeSelect aria-label={t("flagLabel")} value={f.flag} onChange={(e) => setF({ ...f, flag: e.target.value })}>
            {["trusted", "watch", "quality_review", "documents_missing", "listing_suspended"].map((x) => <option key={x} value={x}>{t(`flag.${x}`)}</option>)}
          </NativeSelect>
          <Input aria-label={t("note")} placeholder={t("note")} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <Button type="submit" size="sm" disabled={pending || !f.serviceProviderId || f.note.trim().length < 5}>{t("setFlag")}</Button>
        </form>
      </Section>
    </div>
  );
}
