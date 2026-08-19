import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { getPortalLocale } from "@core/i18n/server";
import { reviewContentDraftAction } from "../actions";
import { listContentDrafts } from "../repository";
import { providerPortalCopy, providerPortalStatusLabel } from "../i18n/copy";

function statusVariant(status: string) {
  if (["approved", "published"].includes(status)) return "success" as const;
  if (["rejected", "rolled_back"].includes(status)) return "danger" as const;
  return "warning" as const;
}

function prettyPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload, null, 2);
}

export async function ModerationPage() {
  const [drafts, locale] = await Promise.all([listContentDrafts({ limit: 100 }), getPortalLocale()]);
  const copy = providerPortalCopy(locale.header);
  const pending = drafts.filter((draft) => draft.status === "submitted");
  return (
    <div className="space-y-6">
      <PageHeader title={copy.contentModerationQueue} description={copy.contentModerationDescription} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.pending}</div><p className="mt-1 text-2xl font-bold">{pending.length}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.totalDrafts}</div><p className="mt-1 text-2xl font-bold">{drafts.length}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.frontSafety}</div><p className="mt-1 text-xs text-muted-foreground">{copy.frontSafetyDescription}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{copy.beforeAfterReview}</CardTitle></CardHeader>
        <CardContent>
          {drafts.length ? (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-950">{draft.entityType} · {draft.sectionKey} · {draft.locale}</div>
                      <div className="font-mono text-xs text-muted-foreground">{draft.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{copy.provider} {draft.serviceProviderId} · {copy.submitted} {formatDateTime(draft.submittedAt || draft.createdAt)}</div>
                    </div>
                    <Badge variant={statusVariant(draft.status)}>{providerPortalStatusLabel(locale.header, draft.status)}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <pre className="max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-50">{prettyPayload(draft.previousSnapshot)}</pre>
                    <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs text-slate-800">{prettyPayload(draft.draftPayload)}</pre>
                  </div>
                  {draft.status === "submitted" ? (
                    <form action={reviewContentDraftAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                      <input type="hidden" name="draftId" value={draft.id} />
                      <input type="hidden" name="providerId" value={draft.serviceProviderId} />
                      <Field label={copy.decision}><Select name="decision" defaultValue="approved"><option value="approved">{copy.approvePublish}</option><option value="rejected">{copy.reject}</option></Select></Field>
                      <Field label={copy.reason}><Input name="reason" placeholder={copy.rejectionReasonRequired} /></Field>
                      <Field label={copy.reviewerNote}><Textarea name="note" /></Field>
                      <div className="flex items-end"><Button type="submit" className="w-full">{copy.apply}</Button></div>
                    </form>
                  ) : draft.decisionReason ? <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{copy.decisionReasonLabel}: {draft.decisionReason}</p> : null}
                </div>
              ))}
            </div>
          ) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{copy.noContentDrafts}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
