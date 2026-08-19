import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { LocaleSelect } from "@core/ui/LocaleSelect";
import { LocalizedField } from "@core/ui/LocalizedField";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { reviewProfileClaimAction, submitContentDraftAction } from "../actions";
import { getModuleSummary, listContentDrafts, listProfileClaims, listPublishedSnapshots } from "../repository";

function statusVariant(status: string) {
  if (["approved", "paid", "waived", "published", "not_required"].includes(status)) return "success" as const;
  if (["rejected", "revoked", "disabled", "rolled_back"].includes(status)) return "danger" as const;
  return "warning" as const;
}

function payloadText(payload: Record<string, unknown>) {
  const value = payload.text ?? payload.title ?? payload.summary;
  return typeof value === "string" && value ? value : JSON.stringify(payload).slice(0, 180);
}

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, claims, drafts, snapshots] = await Promise.all([
    getModuleSummary(providerId),
    listProfileClaims(providerId),
    listContentDrafts({ providerId, limit: 20 }),
    listPublishedSnapshots(providerId, 20),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Provider Portal Command Center" description="Customer-facing profile ownership, clinic confirmation, draft/preview/publish content workflow, and payment-aware access in one provider workspace." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Claims</div><p className="mt-1 text-2xl font-bold">{summary.claimsCount}</p><p className="text-xs text-muted-foreground">{summary.pendingClaimsCount} waiting</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Content drafts</div><p className="mt-1 text-2xl font-bold">{drafts.length}</p><p className="text-xs text-muted-foreground">{summary.pendingDraftsCount} pending moderation</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Published snapshots</div><p className="mt-1 text-2xl font-bold">{summary.publishedSnapshotsCount}</p><p className="text-xs text-muted-foreground">Public front reads approved data only</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Ownership rule</div><p className="mt-1 text-xs text-muted-foreground">Active after clinic + LSevin approval and payment paid/waived/not required.</p></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader><CardTitle>Clinic confirmation queue</CardTitle></CardHeader>
          <CardContent>
            {claims.length ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Target</th><th className="p-3">Reviews</th><th className="p-3">Payment</th><th className="p-3">Action</th></tr></thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-t border-border align-top">
                        <td className="p-3"><div className="font-semibold">{claim.targetType}</div><div className="font-mono text-xs text-muted-foreground">{claim.targetId}</div><div className="mt-1 text-xs text-muted-foreground">{formatDateTime(claim.createdAt)}</div></td>
                        <td className="p-3"><div>Clinic: <Badge variant={statusVariant(claim.clinicReviewStatus)}>{claim.clinicReviewStatus}</Badge></div><div className="mt-1">LSevin: <Badge variant={statusVariant(claim.lsevinReviewStatus)}>{claim.lsevinReviewStatus}</Badge></div><div className="mt-1">Overall: <Badge variant={statusVariant(claim.status)}>{claim.status}</Badge></div></td>
                        <td className="p-3"><Badge variant={statusVariant(claim.paymentStatus)}>{claim.paymentStatus}</Badge></td>
                        <td className="p-3">
                          <form action={reviewProfileClaimAction} className="space-y-2">
                            <input type="hidden" name="claimId" value={claim.id} />
                            <input type="hidden" name="providerId" value={providerId} />
                            <input type="hidden" name="scope" value="clinic" />
                            <Select name="decision" defaultValue="approved"><option value="approved">Approve clinic relation</option><option value="rejected">Reject</option></Select>
                            <Input name="reason" placeholder="Reason / note" />
                            <Button type="submit" variant="secondary" className="w-full">Save clinic decision</Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No profile ownership claims have been created for this provider yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Submit content change</CardTitle></CardHeader>
          <CardContent>
            <form action={submitContentDraftAction} className="space-y-3">
              <input type="hidden" name="providerId" value={providerId} />
              <Field label="Entity type"><Select name="entityType" defaultValue="provider"><option value="provider">Provider page</option><option value="service">Service page</option><option value="staff">Staff page</option></Select></Field>
              <Field label="Entity ID"><Input name="entityId" defaultValue={providerId} required /></Field>
              <Field label="Locale"><LocaleSelect name="locale" value="fa-IR" /></Field>
              <Field label="Section"><Select name="sectionKey" defaultValue="profile_summary"><option value="profile_summary">Profile summary</option><option value="hero">Hero</option><option value="about">About</option><option value="service_description">Service description</option><option value="staff_bio">Staff bio</option></Select></Field>
              <LocalizedField name="title" label="Title" requiredLocale={null} />
              <LocalizedField name="text" label="Main text" mode="textarea" requiredLocale={null} help="Public text remains private until LSevin approval." />
              <Field label="Public page path"><Input name="publicPagePath" placeholder="/providers/..." /></Field>
              <Button type="submit" className="w-full">Submit for LSevin approval</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Drafts and moderation state</CardTitle></CardHeader>
          <CardContent>
            {drafts.length ? <div className="space-y-3">{drafts.map((draft) => <div key={draft.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-center justify-between gap-3"><div className="font-semibold">{draft.entityType} · {draft.sectionKey} · {draft.locale}</div><Badge variant={statusVariant(draft.status)}>{draft.status}</Badge></div><p className="mt-2 text-muted-foreground" data-user-content>{payloadText(draft.draftPayload)}</p><div className="mt-2 text-xs text-muted-foreground">Submitted {formatDateTime(draft.submittedAt || draft.createdAt)}</div></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No drafts submitted yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Published public snapshots</CardTitle></CardHeader>
          <CardContent>
            {snapshots.length ? <div className="space-y-3">{snapshots.map((snapshot) => <div key={snapshot.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-center justify-between gap-3"><div className="font-semibold">v{snapshot.versionNo} · {snapshot.entityType} · {snapshot.sectionKey}</div><Badge variant="success">published</Badge></div><p className="mt-2 text-muted-foreground" data-user-content>{payloadText(snapshot.snapshotPayload)}</p><div className="mt-2 text-xs text-muted-foreground">{snapshot.locale} · {formatDateTime(snapshot.publishedAt)}</div></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Nothing published yet. Public front should keep using existing production content until approval.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
