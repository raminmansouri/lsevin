import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { CountryCitySelect } from "@core/ui/CountryCitySelect";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import {
  approveApplicationAction,
  markApplicationInReviewAction,
  rejectApplicationAction,
  requestApplicationChangesAction,
} from "../actions";
import { getAdminApplication, listApplicationReviewEvents, listExistingProviders } from "../repository";

function statusVariant(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected" || status === "disabled") return "danger" as const;
  return "warning" as const;
}

function payloadValue(payload: Record<string, unknown> | undefined, key: string) {
  const value = payload?.[key];
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export async function AdminApplicationPage({ params, searchParams }: ModulePageProps) {
  const applicationId = params.applicationId;
  const [application, providers, events] = await Promise.all([
    getAdminApplication(applicationId),
    listExistingProviders(),
    listApplicationReviewEvents(applicationId),
  ]);
  if (!application) notFound();

  const payload = application.submissionPayload;
  const audience = payloadValue(payload, "applicationAudience");
  const isStaffApplication = audience === "staff";
  const approved = searchParams.approved === "1";
  const approvalError = typeof searchParams.approvalError === "string" ? searchParams.approvalError : "";
  const approvalErrorCode = typeof searchParams.approvalErrorCode === "string" ? searchParams.approvalErrorCode : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={application.displayName || application.legalName || "Application review"}
        description={`${application.applicationNumber || application.id} · submitted ${formatDateTime(application.submittedAt || application.createdAt)}`}
        action={<LinkButton variant="secondary" href="/admin/applications">Back to queue</LinkButton>}
      />

      {approved ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Application approved. The provider owner workspace is ready.</div> : null}
      {approvalError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950">
          <div className="font-black">Approval was not completed</div>
          <p className="mt-1 leading-6">{approvalError}</p>
          {approvalErrorCode === "migration_required" ? <code className="mt-3 block rounded-lg bg-white px-3 py-2 text-xs">docker compose up --build migrate</code> : null}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Application and applicant</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="Status"><Badge variant={statusVariant(application.status)}>{application.status}</Badge></Info>
              <Info label="Audience">{audience}</Info>
              <Info label="Applicant">{application.applicantName || "—"}</Info>
              <Info label="Applicant email">{application.applicantEmail || "—"}</Info>
              <Info label="Legal name">{application.legalName || "—"}</Info>
              <Info label="Display name">{application.displayName || "—"}</Info>
              <Info label="Provider type">{application.providerTypeName} {!application.providerTypeExists ? <Badge variant="danger">Missing</Badge> : null}</Info>
              <Info label="Contact">{application.email || "—"} · {application.phone || "—"}</Info>
              <Info label="Country">{payloadValue(payload, "country")}</Info>
              <Info label="City">{payloadValue(payload, "city")}</Info>
              <Info label="Contact person">{payloadValue(payload, "contactPerson")}</Info>
              <Info label="Existing profile reference">{payloadValue(payload, "existingProfileReference")}</Info>
              <Info label="Staff title">{payloadValue(payload, "staffTitle")}</Info>
              <Info label="Staff specialty">{payloadValue(payload, "staffSpecialty")}</Info>
              <div className="md:col-span-2"><Info label="Notes">{payloadValue(payload, "notes")}</Info></div>
              {application.reviewReason ? <div className="md:col-span-2"><Info label="Customer-visible review reason"><span className="text-red-700">{application.reviewReason}</span></Info></div> : null}
              {application.internalNote ? <div className="md:col-span-2"><Info label="Internal note">{application.internalNote}</Info></div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Review history</CardTitle></CardHeader>
            <CardContent>
              {events.length ? <div className="space-y-3">{events.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold">{event.action.replaceAll("_", " ")}</div><div className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</div></div>
                  <div className="mt-1 text-xs text-muted-foreground">{event.reviewerName || "System/admin"} · {event.previousStatus || "—"} → {event.newStatus || "—"}</div>
                  {event.reason ? <p className="mt-2 text-red-700">{event.reason}</p> : null}
                  {event.note ? <p className="mt-2 text-muted-foreground">{event.note}</p> : null}
                </div>
              ))}</div> : <p className="text-sm text-muted-foreground">No review events yet. Apply the onboarding migration to enable audit history.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {isStaffApplication ? (
            <Card>
              <CardHeader><CardTitle>Staff ownership request</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Staff applications use the profile-claim workflow because clinic confirmation, LSevin review and payment or waiver may be required.</p>
                <LinkButton href="/admin/provider-claims">Open provider and staff claims</LinkButton>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Create a new provider and approve</CardTitle></CardHeader>
                <CardContent>
                  <form action={approveApplicationAction} className="space-y-4">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="mode" value="create" />
                    <p className="text-sm leading-6 text-muted-foreground">The provider is created inactive so the new owner can complete profile, services, staff, availability and payout readiness before publication.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CountryCitySelect
                        countryValue={payloadValue(payload, "country") === "—" ? "" : payloadValue(payload, "country")}
                        cityValue={payloadValue(payload, "city") === "—" ? "" : payloadValue(payload, "city")}
                      />
                    </div>
                    <Field label="Timezone"><Input name="timezoneId" defaultValue="Asia/Tehran" required /></Field>
                    <Field label="Internal approval note"><Textarea name="reviewNote" /></Field>
                    <Button type="submit" disabled={application.status === "approved" || !application.providerTypeExists}>Create provider and approve</Button>
                    {!application.providerTypeExists ? <p className="text-xs font-semibold text-red-700">Approval is blocked until the missing provider type reference is repaired.</p> : null}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Attach an existing provider and approve</CardTitle></CardHeader>
                <CardContent>
                  <form action={approveApplicationAction} className="space-y-4">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="mode" value="attach" />
                    <Field label="Existing provider" help="Only a provider with the same provider type can be attached.">
                      <Select name="existingProviderId" defaultValue="" required>
                        <option value="">Select provider</option>
                        {providers.filter((provider) => provider.providerTypeId === application.providerTypeId).map((provider) => <option key={provider.id} value={provider.id}>{provider.label} · {provider.isActive ? "active" : "inactive"}</option>)}
                      </Select>
                    </Field>
                    <Field label="Internal approval note"><Textarea name="reviewNote" /></Field>
                    <Button type="submit" variant="secondary" disabled={application.status === "approved" || !application.providerTypeExists}>Attach provider and approve</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Review decisions</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <form action={markApplicationInReviewAction} className="space-y-3">
                <input type="hidden" name="applicationId" value={application.id} />
                <Field label="Internal review note"><Textarea name="note" /></Field>
                <Button type="submit" variant="secondary" disabled={application.status === "approved"}>Mark in review</Button>
              </form>
              <form action={requestApplicationChangesAction} className="space-y-3 border-t border-border pt-5">
                <input type="hidden" name="applicationId" value={application.id} />
                <Field label="Requested changes shown to applicant"><Textarea name="reason" required /></Field>
                <Field label="Internal note"><Textarea name="note" /></Field>
                <Button type="submit" variant="secondary" disabled={application.status === "approved"}>Request changes</Button>
              </form>
              <form action={rejectApplicationAction} className="space-y-3 border-t border-border pt-5">
                <input type="hidden" name="applicationId" value={application.id} />
                <Field label="Rejection reason shown to applicant"><Textarea name="reason" required /></Field>
                <Field label="Internal note"><Textarea name="note" /></Field>
                <Button type="submit" variant="danger" disabled={application.status === "approved"}>Reject application</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return <div className="rounded-lg bg-muted p-3"><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm text-slate-950">{children}</div></div>;
}
