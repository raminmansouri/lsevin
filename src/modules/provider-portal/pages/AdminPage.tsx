import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { getPortalLocale } from "@core/i18n/server";
import { issueProfileClaimInvoiceAction, reviewProfileClaimAction, waiveProfileClaimPaymentAction } from "../actions";
import { getModuleSummary, listContentDrafts, listProfileClaims } from "../repository";
import { providerPortalCopy, providerPortalStatusLabel } from "../i18n/copy";

function statusVariant(status: string) {
  if (["approved", "paid", "waived", "published", "not_required"].includes(status)) return "success" as const;
  if (["rejected", "revoked", "disabled"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function AdminPage() {
  const [summary, claims, pendingDrafts, locale] = await Promise.all([getModuleSummary(), listProfileClaims(), listContentDrafts({ status: "submitted", limit: 20 }), getPortalLocale()]);
  const copy = providerPortalCopy(locale.header);
  const firstInvoiceableClaim = claims.find((claim) => claim.paymentStatus === "required" || claim.paymentStatus === "not_required" || claim.status === "payment_required") ?? claims[0];
  return (
    <div className="space-y-6">
      <PageHeader title={copy.providerClaimsOwnership} description={copy.providerClaimsDescription} action={<LinkButton href="/admin/moderation" variant="secondary">{copy.openContentModeration}</LinkButton>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.claims}</div><p className="mt-1 text-2xl font-bold">{summary.claimsCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.waitingClaims}</div><p className="mt-1 text-2xl font-bold">{summary.pendingClaimsCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.contentQueue}</div><p className="mt-1 text-2xl font-bold">{pendingDrafts.length}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">{copy.ownershipBilling}</div><p className="mt-1 text-xs text-muted-foreground">{copy.ownershipBillingDescription}</p></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle>{copy.claimQueueApproval}</CardTitle></CardHeader>
          <CardContent>
            {claims.length ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">{copy.claim}</th><th className="p-3">{copy.target}</th><th className="p-3">{copy.state}</th><th className="p-3">{copy.lsevin} {copy.decision}</th></tr></thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-t border-border align-top">
                        <td className="p-3"><div className="font-mono text-xs">{claim.id}</div><div className="mt-1 text-xs text-muted-foreground">{copy.claimant} {claim.claimantUserId}</div><div className="text-xs text-muted-foreground">{formatDateTime(claim.createdAt)}</div></td>
                        <td className="p-3"><div className="font-semibold">{claim.targetType}</div><div className="font-mono text-xs text-muted-foreground">{claim.targetId}</div><div className="mt-1 text-xs text-muted-foreground">{copy.provider} {claim.serviceProviderId || "—"}</div></td>
                        <td className="p-3"><div>{copy.clinic}: <Badge variant={statusVariant(claim.clinicReviewStatus)}>{providerPortalStatusLabel(locale.header, claim.clinicReviewStatus)}</Badge></div><div className="mt-1">{copy.lsevin}: <Badge variant={statusVariant(claim.lsevinReviewStatus)}>{providerPortalStatusLabel(locale.header, claim.lsevinReviewStatus)}</Badge></div><div className="mt-1">{copy.payment}: <Badge variant={statusVariant(claim.paymentStatus)}>{providerPortalStatusLabel(locale.header, claim.paymentStatus)}</Badge></div><div className="mt-1">{copy.status}: <Badge variant={statusVariant(claim.status)}>{providerPortalStatusLabel(locale.header, claim.status)}</Badge></div></td>
                        <td className="p-3">
                          <form action={reviewProfileClaimAction} className="space-y-2">
                            <input type="hidden" name="claimId" value={claim.id} />
                            <input type="hidden" name="scope" value="lsevin" />
                            <Select name="decision" defaultValue="approved"><option value="approved">{copy.approveByLsevin}</option><option value="rejected">{copy.reject}</option></Select>
                            <Input name="reason" placeholder={copy.decisionReason} />
                            <Button type="submit" variant="secondary" className="w-full">{copy.saveLsevinDecision}</Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{copy.noProfileClaims}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{copy.issueOwnershipInvoice}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form action={issueProfileClaimInvoiceAction} className="space-y-3">
              <Field label={copy.claimId}><Input name="claimId" defaultValue={firstInvoiceableClaim?.id ?? ""} required /></Field>
              <Field label={copy.plan}><Select name="planCode" defaultValue="verified-provider"><option value="free-claim">{copy.freeClaim}</option><option value="verified-provider">{copy.verifiedProvider}</option><option value="staff-verified">{copy.verifiedStaff}</option></Select></Field>
              <Field label={copy.manualAmountOverride} help={copy.manualAmountHelp}><Input name="amount" type="number" step="0.01" defaultValue="-1" /></Field>
              <Field label={copy.currency}><CurrencySelect name="currencyCode" value="IRR" locale={locale.header} /></Field>
              <Field label={copy.taxPercent}><Input name="taxPercent" type="number" step="0.01" defaultValue="0" /></Field>
              <Field label={copy.dueDate}><LocalizedDateInput name="dueDate" locale={locale.header} /></Field>
              <Button type="submit" className="w-full">{copy.issueInvoice}</Button>
            </form>
            <form action={waiveProfileClaimPaymentAction} className="space-y-3 border-t border-border pt-5">
              <Field label={copy.claimId}><Input name="claimId" defaultValue={firstInvoiceableClaim?.id ?? ""} /></Field>
              <Field label={copy.waiverNote}><Textarea name="note" /></Field>
              <Button type="submit" variant="secondary" className="w-full">{copy.waivePayment}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
