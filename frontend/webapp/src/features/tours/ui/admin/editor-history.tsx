"use client";

import { useTranslations } from "next-intl";

import type { TourBundle } from "../../server/admin/queries";

import { useAdminDates } from "./inputs";
import { EmptyState, Section } from "./primitives";

/** Revisions and the audit trail of one tour (M-005). */
export function HistoryTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.history");
  const dates = useAdminDates();
  // Jalali, in the tour's own timezone.
  const when = (iso: string | null) => dates.instant(iso, bundle.core.timezone || "Asia/Tehran");
  return (
    <div className="space-y-4">
      <Section id="revisions" title={t("revisions")}>
        {bundle.revisions.length === 0 ? <EmptyState>{t("noRevisions")}</EmptyState> : (
          <ul className="space-y-1 text-sm">
            {bundle.revisions.map((r) => (
              <li key={r.revision} className="rounded border px-3 py-2">
                {t("revision", { n: r.revision })} · {when(r.created_at)}{r.material_change ? ` · ${t("material")}` : ""}{r.change_summary ? ` · ${r.change_summary}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="audit" title={t("audit")}>
        {bundle.audit.length === 0 ? <EmptyState>{t("noAudit")}</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="audit-table">
              <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("when")}</th><th className="p-1.5 text-start">{t("who")}</th><th className="p-1.5 text-start">{t("action")}</th><th className="p-1.5 text-start">{t("detail")}</th></tr></thead>
              <tbody>
                {bundle.audit.map((a) => (
                  <tr key={a.id} className="border-t align-top" data-action={a.action}>
                    <td className="p-1.5 whitespace-nowrap">{when(a.created_at)}</td>
                    <td className="p-1.5 font-mono text-xs" dir="ltr">{a.actor_scope}{a.actor_user_id ? ` · ${a.actor_user_id.slice(0, 8)}` : ""}</td>
                    <td className="p-1.5">{a.entity_type}.{a.action}</td>
                    <td className="max-w-md truncate p-1.5 font-mono text-xs" dir="ltr" title={JSON.stringify(a.detail)}>{JSON.stringify(a.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
